from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_active_user, require_platform_admin, get_current_school, get_current_school_context, SchoolContext, require_school_owner
from app.models.user import User
from app.models.school import School
from app.schemas.school import (
    SchoolCreate,
    SchoolUpdate,
    SchoolResponse,
    SchoolRegistration,
    SchoolRegistrationResponse,
    FreemiumRegistration,
    SchoolSettings,
    SchoolThemeSettings,
    SchoolStats
)
from app.services.school_service import SchoolService
from app.services.school_ownership_service import SchoolOwnershipService
from app.services.file_upload_service import FileUploadService
from app.services.redis_service import redis_service

router = APIRouter()


@router.post("/register", response_model=SchoolRegistrationResponse)
async def register_school(
    registration_data: FreemiumRegistration,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Register a new school with freemium trial access"""
    try:
        # Direct freemium registration - no tokens needed
        school, admin_user = await SchoolService.register_school_with_freemium_trial(
            db, registration_data
        )
        
        # Send welcome email to new school owner
        try:
            from app.services.email_service import EmailService
            from app.services.background_email_service import send_email_background
            from app.core.config import settings
            
            login_url = f"{settings.frontend_url}/{school.code.lower()}/login"
            
            html_content, text_content = EmailService.generate_welcome_email(
                user_name=admin_user.full_name,
                school_name=school.name,
                user_role="School Owner",
                login_url=login_url,
                school_logo=school.logo_url
            )
            
            background_tasks.add_task(
                send_email_background,
                to_emails=[admin_user.email],
                subject=f"Welcome to {school.name} - Your School is Ready!",
                html_content=html_content,
                text_content=text_content,
                sender_name=school.name
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send welcome email: {str(e)}")
            # Don't fail registration if email fails

        return SchoolRegistrationResponse(
            school=SchoolResponse.from_orm(school),
            admin_user_id=admin_user.id,
            message="School registered successfully! Your 30-day free trial has started.",
            trial_expires_at=school.trial_expires_at,
            trial_days_remaining=school.trial_days_remaining
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register school: {str(e)}"
        )


@router.post("/register-additional", response_model=SchoolRegistrationResponse)
async def register_additional_school(
    school_data: SchoolCreate,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Register an additional school for an existing school owner"""
    try:
        current_user = school_context.user
        
        # Create the school
        school = await SchoolService.create_school_for_existing_owner(
            db, school_data, current_user.id
        )

        # Add ownership for the current user
        await SchoolOwnershipService.add_school_ownership(
            db=db,
            user_id=current_user.id,
            school_id=school.id,
            is_primary_owner=True,
            granted_by=current_user.id
        )

        return SchoolRegistrationResponse(
            school=SchoolResponse.from_orm(school),
            admin_user_id=current_user.id,
            message="Additional school registered successfully!",
            trial_expires_at=school.trial_expires_at,
            trial_days_remaining=school.trial_days_remaining
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register additional school: {str(e)}"
        )


@router.get("/me", response_model=SchoolResponse)
async def get_my_school(
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get current user's school information from JWT context"""
    # Expunge any cached school objects to ensure fresh data
    if school_context.school:
        db.expunge(school_context.school)

    # Always fetch fresh data from database to ensure we have the latest settings
    result = await db.execute(
        select(School).where(
            School.id == school_context.school_id,
            School.is_deleted == False
        )
    )
    fresh_school = result.scalar_one_or_none()

    if fresh_school is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )

    return SchoolResponse.from_orm(fresh_school)


@router.put("/me", response_model=SchoolResponse)
async def update_my_school(
    school_data: SchoolUpdate,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update current school information (School Owner only)"""
    current_user = school_context.user
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Verify user owns this school
    ownership = await SchoolOwnershipService.get_user_school_ownership(
        db, current_user.id, current_school.id
    )
    if not ownership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this school"
        )

    # Handle settings merge if settings are provided
    if school_data.settings:
        current_settings = current_school.settings or {}
        new_settings = school_data.settings
        
        # Deep merge logic could be complex, but for now we'll do a shallow merge of top-level keys
        # If specific sub-dictionaries need merging (like general_settings), we might need a recursive merge
        # For now, let's assume we want to preserve keys not present in the update
        
        merged_settings = current_settings.copy()
        for key, value in new_settings.items():
            if isinstance(value, dict) and isinstance(merged_settings.get(key), dict):
                # Recursive merge for one level deep (e.g. general_settings)
                merged_settings[key].update(value)
            else:
                merged_settings[key] = value
                
        school_data.settings = merged_settings

    updated_school = await SchoolService.update_school(
        db, current_school.id, school_data
    )

    if not updated_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )

    return SchoolResponse.from_orm(updated_school)


@router.get("/me/stats", response_model=SchoolStats)
async def get_my_school_stats(
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get current school statistics"""
    stats = await SchoolService.get_school_stats(db, current_school.id)
    return SchoolStats(**stats)


@router.put("/me/settings")
async def update_school_settings(
    settings: SchoolSettings,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update school settings (School Owner only)"""
    current_user = school_context.user
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Verify user owns this school
    ownership = await SchoolOwnershipService.get_user_school_ownership(
        db, current_user.id, current_school.id
    )
    if not ownership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this school"
        )

    # Merge with existing settings
    current_settings = current_school.settings or {}

    settings_dict = settings.dict(exclude_unset=True)
    for key, value in settings_dict.items():
        if value is not None:
            current_settings[key] = value

    # Update school
    updated_school = await SchoolService.update_school(
        db, current_school.id, SchoolUpdate(settings=current_settings)
    )

    if not updated_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Invalidate cache
    await redis_service.delete(f"school_settings:{current_school.id}")

    return {"message": "Settings updated successfully", "settings": updated_school.settings}


@router.get("/me/report-card-templates")
async def get_school_report_card_templates(
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get report card templates for school owner (School Owner only)"""
    from app.services.report_card_template_service import ReportCardTemplateService
    
    current_user = school_context.user
    
    # Get templates for this school owner
    templates = await ReportCardTemplateService.get_templates(
        db, current_user.id, is_active=True
    )
    
    return {
        "templates": [
            {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "is_default": template.is_default,
                "is_published": template.is_published,
                "created_at": template.created_at,
                "updated_at": template.updated_at
            }
            for template in templates
        ]
    }


@router.post("/me/report-card-templates")
async def create_school_report_card_template(
    template_data: dict,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new report card template for school owner (School Owner only)"""
    from app.services.report_card_template_service import ReportCardTemplateService
    from app.schemas.report_card_template import ReportCardTemplateCreate
    
    current_user = school_context.user
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Convert dict to schema
    template_create = ReportCardTemplateCreate(**template_data)
    
    # Create template
    template = await ReportCardTemplateService.create_template(
        db, template_create, current_school.id, current_user.id
    )
    
    return {
        "message": "Template created successfully",
        "template": {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "is_default": template.is_default,
            "is_published": template.is_published,
            "created_at": template.created_at
        }
    }


@router.put("/me/report-card-templates/{template_id}")
async def update_school_report_card_template(
    template_id: str,
    template_data: dict,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a report card template for school owner (School Owner only)"""
    from app.services.report_card_template_service import ReportCardTemplateService
    from app.schemas.report_card_template import ReportCardTemplateUpdate
    
    current_user = school_context.user
    
    # Convert dict to schema
    template_update = ReportCardTemplateUpdate(**template_data)
    
    # Update template
    template = await ReportCardTemplateService.update_template(
        db, template_id, template_update, current_user.id
    )
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {
        "message": "Template updated successfully",
        "template": {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "is_default": template.is_default,
            "is_published": template.is_published,
            "updated_at": template.updated_at
        }
    }


@router.delete("/me/report-card-templates/{template_id}")
async def delete_school_report_card_template(
    template_id: str,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete a report card template for school owner (School Owner only)"""
    from app.services.report_card_template_service import ReportCardTemplateService
    
    current_user = school_context.user
    
    # Delete template
    success = await ReportCardTemplateService.delete_template(
        db, template_id, current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"message": "Template deleted successfully"}


@router.post("/me/logo")
async def upload_school_logo(
    file: UploadFile = File(...),
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Upload school logo (School Owner only)"""
    current_user = school_context.user
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Verify user owns this school
    ownership = await SchoolOwnershipService.get_user_school_ownership(
        db, current_user.id, current_school.id
    )
    if not ownership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this school"
        )

    # Delete old logo if exists
    if current_school.logo_url:
        await FileUploadService.delete_school_logo(current_school.logo_url)

    # Upload new logo
    logo_url = await FileUploadService.upload_school_logo(file, current_school.id)

    # Update school with new logo URL
    updated_school = await SchoolService.update_school(
        db, current_school.id, SchoolUpdate(logo_url=logo_url)
    )

    if not updated_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )

    return {
        "message": "Logo uploaded successfully",
        "logo_url": logo_url
    }


@router.delete("/me/logo")
async def delete_school_logo(
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete school logo (School Owner only)"""
    current_user = school_context.user
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Verify user owns this school
    ownership = await SchoolOwnershipService.get_user_school_ownership(
        db, current_user.id, current_school.id
    )
    if not ownership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this school"
        )

    # Delete logo file if exists
    if current_school.logo_url:
        await FileUploadService.delete_school_logo(current_school.logo_url)

    # Update school to remove logo URL
    updated_school = await SchoolService.update_school(
        db, current_school.id, SchoolUpdate(logo_url=None)
    )

    if not updated_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )

    return {"message": "Logo deleted successfully"}


@router.put("/me/theme")
async def update_school_theme(
    theme_settings: SchoolThemeSettings,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update school theme settings (School Owner only)"""
    current_school = school_context.school

    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )

    # Get current settings
    current_settings = current_school.settings or {}

    # Update theme settings
    theme_dict = theme_settings.dict(exclude_unset=True)
    if theme_dict:
        current_settings["theme_settings"] = {
            **(current_settings.get("theme_settings", {})),
            **theme_dict
        }

    # Update school
    updated_school = await SchoolService.update_school(
        db, current_school.id, SchoolUpdate(settings=current_settings)
    )

    if not updated_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )

    # Update the cached school object in the context to reflect the changes
    school_context.school = updated_school

    # Invalidate cache
    await redis_service.delete(f"school_settings:{current_school.id}")

    return {
        "message": "Theme settings updated successfully",
        "theme_settings": updated_school.settings.get("theme_settings", {})
    }


@router.get("/me/settings")
async def get_school_settings(
    school_context: SchoolContext = Depends(get_current_school_context)
) -> Any:
    """Get current school settings"""
    cache_key = f"school_settings:{school_context.school.id}"
    
    # Try to get from cache
    cached_settings = await redis_service.get(cache_key)
    if cached_settings:
        return {"settings": cached_settings}
    
    # If not in cache, get from DB
    settings = school_context.school.settings or {}
    
    # Set in cache for 5 minutes
    await redis_service.set(cache_key, settings, expire=300)
    
    return {"settings": settings}


@router.post("/me/deactivate")
async def deactivate_my_school(
    current_user: User = Depends(require_platform_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Deactivate current school (Platform Admin only)"""
    success = await SchoolService.deactivate_school(db, current_school.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    return {"message": "School deactivated successfully"}


@router.post("/me/activate")
async def activate_my_school(
    current_user: User = Depends(require_platform_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Activate current school (Platform Admin only)"""
    success = await SchoolService.activate_school(db, current_school.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    return {"message": "School activated successfully"}
