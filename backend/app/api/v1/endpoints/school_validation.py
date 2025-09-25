"""
School validation endpoints for checking uniqueness and availability
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.school import School
from pydantic import BaseModel

router = APIRouter()


class SchoolCodeValidationResponse(BaseModel):
    """Response for school code validation"""
    available: bool
    message: str
    school_code: str
    
    class Config:
        from_attributes = True


class SchoolEmailValidationResponse(BaseModel):
    """Response for school email validation"""
    available: bool
    message: str
    email: str
    
    class Config:
        from_attributes = True


@router.get("/school-code/{school_code}", response_model=SchoolCodeValidationResponse)
async def validate_school_code_availability(
    school_code: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Check if a school code is available (not taken)"""
    
    if len(school_code) < 3:
        return SchoolCodeValidationResponse(
            available=False,
            message="School code must be at least 3 characters long",
            school_code=school_code.upper()
        )
    
    if len(school_code) > 20:
        return SchoolCodeValidationResponse(
            available=False,
            message="School code must be no more than 20 characters long",
            school_code=school_code.upper()
        )
    
    # Check if code contains only valid characters (alphanumeric and some special chars)
    if not school_code.replace('_', '').replace('-', '').isalnum():
        return SchoolCodeValidationResponse(
            available=False,
            message="School code can only contain letters, numbers, hyphens, and underscores",
            school_code=school_code.upper()
        )
    
    # Check if school code already exists
    result = await db.execute(
        select(School.id).where(
            and_(
                School.code == school_code.upper(),
                School.is_deleted == False
            )
        )
    )
    existing_school = result.scalar_one_or_none()
    
    if existing_school:
        return SchoolCodeValidationResponse(
            available=False,
            message="This school code is already taken",
            school_code=school_code.upper()
        )
    
    return SchoolCodeValidationResponse(
        available=True,
        message="School code is available",
        school_code=school_code.upper()
    )


@router.get("/school-email/{email}", response_model=SchoolEmailValidationResponse)
async def validate_school_email_availability(
    email: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Check if a school email is available (not taken)"""
    
    # Check if school email already exists
    result = await db.execute(
        select(School.id).where(
            and_(
                School.email == email.lower(),
                School.is_deleted == False
            )
        )
    )
    existing_school = result.scalar_one_or_none()
    
    if existing_school:
        return SchoolEmailValidationResponse(
            available=False,
            message="This email is already registered with another school",
            email=email.lower()
        )
    
    return SchoolEmailValidationResponse(
        available=True,
        message="Email is available",
        email=email.lower()
    )
