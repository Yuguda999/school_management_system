from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_active_user, require_super_admin, get_current_school
from app.models.user import User
from app.models.school import School
from app.schemas.school import (
    SchoolCreate,
    SchoolUpdate,
    SchoolResponse,
    SchoolRegistration,
    SchoolRegistrationResponse,
    SchoolSettings,
    SchoolStats
)
from app.services.school_service import SchoolService

router = APIRouter()


@router.post("/register", response_model=SchoolRegistrationResponse)
async def register_school(
    registration_data: SchoolRegistration,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Register a new school with admin user"""
    try:
        school, admin_user = await SchoolService.register_school_with_admin(
            db, registration_data
        )
        
        return SchoolRegistrationResponse(
            school=SchoolResponse.from_orm(school),
            admin_user_id=admin_user.id,
            message="School registered successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register school: {str(e)}"
        )


@router.get("/me", response_model=SchoolResponse)
async def get_my_school(
    current_school: School = Depends(get_current_school)
) -> Any:
    """Get current user's school information"""
    return SchoolResponse.from_orm(current_school)


@router.put("/me", response_model=SchoolResponse)
async def update_my_school(
    school_data: SchoolUpdate,
    current_user: User = Depends(require_super_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update current school information (Super Admin only)"""
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
    current_user: User = Depends(require_super_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update school settings (Super Admin only)"""
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


@router.get("/me/settings")
async def get_school_settings(
    current_school: School = Depends(get_current_school)
) -> Any:
    """Get current school settings"""
    return {"settings": current_school.settings or {}}


@router.post("/me/deactivate")
async def deactivate_my_school(
    current_user: User = Depends(require_super_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Deactivate current school (Super Admin only)"""
    success = await SchoolService.deactivate_school(db, current_school.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    return {"message": "School deactivated successfully"}


@router.post("/me/activate")
async def activate_my_school(
    current_user: User = Depends(require_super_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Activate current school (Super Admin only)"""
    success = await SchoolService.activate_school(db, current_school.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    return {"message": "School activated successfully"}
