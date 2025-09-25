"""
Public endpoints for school-specific information (no authentication required)
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.school import School
from pydantic import BaseModel

router = APIRouter()


class SchoolPublicInfo(BaseModel):
    """Public school information for login page"""
    id: str
    name: str
    code: str
    logo_url: str | None
    motto: str | None
    website: str | None
    primary_color: str | None
    secondary_color: str | None
    accent_color: str | None
    
    class Config:
        from_attributes = True


@router.get("/{school_code}/info", response_model=SchoolPublicInfo)
async def get_school_public_info(
    school_code: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get public school information by school code for branded login page"""
    
    # Get school by code
    result = await db.execute(
        select(School).where(
            and_(
                School.code == school_code.upper(),
                School.is_deleted == False,
                School.is_active == True
            )
        )
    )
    school = result.scalar_one_or_none()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found or inactive"
        )
    
    # Extract theme colors from settings
    settings = school.settings or {}
    theme_settings = settings.get('theme_settings', {})
    
    # Fallback to root level settings for backward compatibility
    primary_color = theme_settings.get('primary_color') or settings.get('primary_color', '#3B82F6')
    secondary_color = theme_settings.get('secondary_color') or settings.get('secondary_color', '#1E40AF')
    accent_color = theme_settings.get('accent_color') or settings.get('accent_color', '#60A5FA')
    
    return SchoolPublicInfo(
        id=school.id,
        name=school.name,
        code=school.code,
        logo_url=school.logo_url,
        motto=school.motto,
        website=school.website,
        primary_color=primary_color,
        secondary_color=secondary_color,
        accent_color=accent_color
    )


@router.get("/{school_code}/validate")
async def validate_school_code(
    school_code: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Validate if a school code exists and is active"""
    
    result = await db.execute(
        select(School.id).where(
            and_(
                School.code == school_code.upper(),
                School.is_deleted == False,
                School.is_active == True
            )
        )
    )
    school_exists = result.scalar_one_or_none() is not None
    
    return {
        "valid": school_exists,
        "school_code": school_code.upper()
    }
