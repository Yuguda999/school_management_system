from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
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

router = APIRouter()


@router.post("/register", response_model=SchoolRegistrationResponse)
async def register_school(
    registration_data: FreemiumRegistration,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Register a new school with freemium trial access"""
    try:
        # Direct freemium registration - no tokens needed
        school, admin_user = await SchoolService.register_school_with_freemium_trial(
            db, registration_data
        )

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
    current_user: User = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Register an additional school for an existing school owner"""
    try:
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
    school_context: SchoolContext = Depends(get_current_school_context)
) -> Any:
    """Get current user's school information from JWT context"""
    return SchoolResponse.from_orm(school_context.school)


@router.put("/me", response_model=SchoolResponse)
async def update_my_school(
    school_data: SchoolUpdate,
    current_user: User = Depends(require_school_owner()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update current school information (School Owner only)"""
    # Verify user owns this school
    ownership = await SchoolOwnershipService.get_user_school_ownership(
        db, current_user.id, current_school.id
    )
    if not ownership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this school"
        )

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
    current_user: User = Depends(require_school_owner()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update school settings (School Owner only)"""
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
    
    return {"message": "Settings updated successfully", "settings": updated_school.settings}


@router.post("/me/logo")
async def upload_school_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_school_owner()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Upload school logo (School Owner only)"""
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
    current_user: User = Depends(require_school_owner()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete school logo (School Owner only)"""
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
    current_user: User = Depends(require_school_owner()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update school theme settings (School Owner only)"""
    # Verify user owns this school
    ownership = await SchoolOwnershipService.get_user_school_ownership(
        db, current_user.id, current_school.id
    )
    if not ownership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this school"
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

    return {
        "message": "Theme settings updated successfully",
        "theme_settings": updated_school.settings.get("theme_settings", {})
    }


@router.get("/me/settings")
async def get_school_settings(
    current_school: School = Depends(get_current_school)
) -> Any:
    """Get current school settings"""
    return {"settings": current_school.settings or {}}


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
