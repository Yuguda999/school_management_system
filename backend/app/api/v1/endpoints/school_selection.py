from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.models.school import School
from app.models.school_ownership import SchoolOwnership
from app.schemas.school_selection import (
    OwnedSchoolsResponse,
    SchoolSummary,
    SchoolSelectionRequest,
    SchoolSelectionResponse,
    SchoolOwnershipDetails,
    AddSchoolOwnershipRequest,
    TransferOwnershipRequest
)
from app.services.school_ownership_service import SchoolOwnershipService
from datetime import timedelta

router = APIRouter()


@router.get("/owned-schools", response_model=OwnedSchoolsResponse)
async def get_owned_schools(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all schools owned by the current user"""
    
    if current_user.role != UserRole.SCHOOL_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school owners can access this endpoint"
        )
    
    # Get owned schools with ownership details
    result = await db.execute(
        select(School, SchoolOwnership)
        .join(SchoolOwnership)
        .where(
            and_(
                SchoolOwnership.user_id == current_user.id,
                SchoolOwnership.is_active == True,
                School.is_deleted == False,
                School.is_active == True
            )
        )
        .order_by(SchoolOwnership.is_primary_owner.desc(), School.name)
    )
    
    schools_data = result.all()
    
    schools = []
    for school, ownership in schools_data:
        school_summary = SchoolSummary(
            id=school.id,
            name=school.name,
            code=school.code,
            logo_url=school.logo_url,
            is_primary=ownership.is_primary_owner,
            subscription_plan=school.subscription_plan,
            subscription_status=school.subscription_status,
            is_trial=school.is_trial,
            trial_expires_at=school.trial_expires_at
        )
        schools.append(school_summary)
    
    return OwnedSchoolsResponse(
        schools=schools,
        total_count=len(schools),
        has_multiple_schools=len(schools) > 1
    )


@router.post("/select-school", response_model=SchoolSelectionResponse)
async def select_school(
    selection_data: SchoolSelectionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Select a school context for the current session"""
    
    if current_user.role != UserRole.SCHOOL_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school owners can select schools"
        )
    
    # Verify user owns the school
    ownership = await SchoolOwnershipService.get_ownership_details(
        db, current_user.id, selection_data.school_id
    )
    if not ownership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this school"
        )
    
    # Get school details
    result = await db.execute(
        select(School).where(
            and_(
                School.id == selection_data.school_id,
                School.is_deleted == False,
                School.is_active == True
            )
        )
    )
    school = result.scalar_one_or_none()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Create new access token with selected school context
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={
            "sub": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
            "school_id": school.id
        },
        expires_delta=access_token_expires
    )
    
    school_summary = SchoolSummary(
        id=school.id,
        name=school.name,
        code=school.code,
        logo_url=school.logo_url,
        is_primary=ownership.is_primary_owner,
        subscription_plan=school.subscription_plan,
        subscription_status=school.subscription_status,
        is_trial=school.is_trial,
        trial_expires_at=school.trial_expires_at
    )
    
    return SchoolSelectionResponse(
        access_token=access_token,
        school=school_summary
    )


@router.get("/ownership-details/{school_id}", response_model=SchoolOwnershipDetails)
async def get_ownership_details(
    school_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get ownership details for a specific school"""
    
    if current_user.role != UserRole.SCHOOL_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school owners can access ownership details"
        )
    
    ownership = await SchoolOwnershipService.get_ownership_details(
        db, current_user.id, school_id
    )
    if not ownership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ownership details not found"
        )
    
    return SchoolOwnershipDetails.from_orm(ownership)


@router.post("/add-ownership")
async def add_school_ownership(
    ownership_data: AddSchoolOwnershipRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Add ownership for another user to a school (primary owners only)"""
    
    if current_user.role != UserRole.SCHOOL_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school owners can manage ownership"
        )
    
    # Verify current user is primary owner of the school
    ownership = await SchoolOwnershipService.get_ownership_details(
        db, current_user.id, ownership_data.school_id
    )
    if not ownership or not ownership.is_primary_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only primary owners can add other owners"
        )
    
    # Find the user to add
    result = await db.execute(
        select(User).where(
            and_(
                User.email == ownership_data.user_email,
                User.role == UserRole.SCHOOL_OWNER,
                User.is_deleted == False
            )
        )
    )
    user_to_add = result.scalar_one_or_none()
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School owner with this email not found"
        )
    
    # Add ownership
    await SchoolOwnershipService.add_school_ownership(
        db=db,
        user_id=user_to_add.id,
        school_id=ownership_data.school_id,
        is_primary_owner=False,
        granted_by=current_user.id
    )
    
    return {"message": "Ownership added successfully"}


@router.post("/transfer-ownership")
async def transfer_primary_ownership(
    transfer_data: TransferOwnershipRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Transfer primary ownership to another owner"""
    
    if current_user.role != UserRole.SCHOOL_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school owners can transfer ownership"
        )
    
    # Find the new owner
    result = await db.execute(
        select(User).where(
            and_(
                User.email == transfer_data.new_owner_email,
                User.role == UserRole.SCHOOL_OWNER,
                User.is_deleted == False
            )
        )
    )
    new_owner = result.scalar_one_or_none()
    if not new_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School owner with this email not found"
        )
    
    # Transfer ownership
    await SchoolOwnershipService.transfer_primary_ownership(
        db=db,
        school_id=transfer_data.school_id,
        current_owner_id=current_user.id,
        new_owner_id=new_owner.id
    )
    
    return {"message": "Primary ownership transferred successfully"}


@router.delete("/remove-ownership/{school_id}")
async def remove_school_ownership(
    school_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Remove ownership from a school"""

    if current_user.role != UserRole.SCHOOL_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school owners can remove ownership"
        )

    # Remove ownership
    success = await SchoolOwnershipService.remove_school_ownership(
        db=db,
        user_id=current_user.id,
        school_id=school_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ownership not found"
        )

    return {"message": "Ownership removed successfully"}
