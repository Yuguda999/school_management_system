from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status
from app.models.school_ownership import SchoolOwnership
from app.models.school import School
from app.models.user import User, UserRole


class SchoolOwnershipService:
    """Service for managing school ownership relationships"""
    
    @staticmethod
    async def get_owned_schools(db: AsyncSession, user_id: str) -> List[School]:
        """Get all schools owned by a user"""
        result = await db.execute(
            select(School)
            .join(SchoolOwnership)
            .where(
                and_(
                    SchoolOwnership.user_id == user_id,
                    SchoolOwnership.is_active == True,
                    School.is_deleted == False,
                    School.is_active == True
                )
            )
            .order_by(SchoolOwnership.is_primary_owner.desc(), School.name)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_ownership_details(db: AsyncSession, user_id: str, school_id: str) -> Optional[SchoolOwnership]:
        """Get ownership details for a specific user-school relationship"""
        result = await db.execute(
            select(SchoolOwnership)
            .where(
                and_(
                    SchoolOwnership.user_id == user_id,
                    SchoolOwnership.school_id == school_id,
                    SchoolOwnership.is_active == True,
                    SchoolOwnership.is_deleted == False
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_ownerships(db: AsyncSession, user_id: str) -> List[SchoolOwnership]:
        """Get all ownership records for a user"""
        result = await db.execute(
            select(SchoolOwnership)
            .where(
                and_(
                    SchoolOwnership.user_id == user_id,
                    SchoolOwnership.is_active == True,
                    SchoolOwnership.is_deleted == False
                )
            )
        )
        return result.scalars().all()
    
    @staticmethod
    async def add_school_ownership(
        db: AsyncSession, 
        user_id: str, 
        school_id: str, 
        is_primary_owner: bool = False,
        granted_by: Optional[str] = None
    ) -> SchoolOwnership:
        """Add ownership relationship between user and school"""
        
        # Check if user exists and is a school owner
        result = await db.execute(
            select(User).where(
                and_(
                    User.id == user_id,
                    User.role == UserRole.SCHOOL_OWNER,
                    User.is_deleted == False
                )
            )
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School owner not found"
            )
        
        # Check if school exists
        result = await db.execute(
            select(School).where(
                and_(
                    School.id == school_id,
                    School.is_deleted == False
                )
            )
        )
        school = result.scalar_one_or_none()
        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found"
            )
        
        # Check if ownership already exists
        existing_ownership = await SchoolOwnershipService.get_ownership_details(
            db, user_id, school_id
        )
        if existing_ownership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already owns this school"
            )
        
        # Create ownership record
        ownership = SchoolOwnership(
            user_id=user_id,
            school_id=school_id,
            is_primary_owner=is_primary_owner,
            granted_by=granted_by
        )
        
        db.add(ownership)
        await db.commit()
        await db.refresh(ownership)
        
        return ownership
    
    @staticmethod
    async def remove_school_ownership(
        db: AsyncSession, 
        user_id: str, 
        school_id: str
    ) -> bool:
        """Remove ownership relationship (soft delete)"""
        
        ownership = await SchoolOwnershipService.get_ownership_details(
            db, user_id, school_id
        )
        if not ownership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ownership relationship not found"
            )
        
        # Don't allow removing primary ownership if there are other owners
        if ownership.is_primary_owner:
            result = await db.execute(
                select(SchoolOwnership)
                .where(
                    and_(
                        SchoolOwnership.school_id == school_id,
                        SchoolOwnership.user_id != user_id,
                        SchoolOwnership.is_active == True,
                        SchoolOwnership.is_deleted == False
                    )
                )
            )
            other_owners = result.scalars().all()
            if other_owners:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove primary ownership while other owners exist. Transfer primary ownership first."
                )
        
        # Soft delete the ownership
        ownership.is_active = False
        ownership.is_deleted = True
        
        await db.commit()
        return True
    
    @staticmethod
    async def transfer_primary_ownership(
        db: AsyncSession,
        school_id: str,
        current_owner_id: str,
        new_owner_id: str
    ) -> bool:
        """Transfer primary ownership from one user to another"""
        
        # Get current primary ownership
        current_ownership = await SchoolOwnershipService.get_ownership_details(
            db, current_owner_id, school_id
        )
        if not current_ownership or not current_ownership.is_primary_owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current user is not the primary owner"
            )
        
        # Get new owner's ownership
        new_ownership = await SchoolOwnershipService.get_ownership_details(
            db, new_owner_id, school_id
        )
        if not new_ownership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New owner does not have ownership of this school"
            )
        
        # Transfer primary ownership
        current_ownership.is_primary_owner = False
        new_ownership.is_primary_owner = True
        
        await db.commit()
        return True
    
    @staticmethod
    async def can_access_school(db: AsyncSession, user_id: str, school_id: str) -> bool:
        """Check if a user can access a specific school"""
        ownership = await SchoolOwnershipService.get_ownership_details(
            db, user_id, school_id
        )
        return ownership is not None

    @staticmethod
    async def get_user_school_ownership(db: AsyncSession, user_id: str, school_id: str) -> Optional[SchoolOwnership]:
        """Get ownership record for a specific user-school relationship (alias for get_ownership_details)"""
        return await SchoolOwnershipService.get_ownership_details(db, user_id, school_id)
