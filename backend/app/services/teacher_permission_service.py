from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from app.models.teacher_permission import TeacherPermission, PermissionType
from app.models.user import User, UserRole
from app.schemas.teacher_permission import (
    TeacherPermissionCreate,
    TeacherPermissionUpdate,
    TeacherPermissionBulkCreate
)


class TeacherPermissionService:
    """Service for managing teacher permission delegations"""

    @staticmethod
    async def grant_permission(
        db: AsyncSession,
        permission_data: TeacherPermissionCreate,
        school_id: str,
        granted_by: str
    ) -> TeacherPermission:
        """Grant a single permission to a teacher"""
        # Check if permission already exists
        existing = await db.execute(
            select(TeacherPermission).where(
                and_(
                    TeacherPermission.school_id == school_id,
                    TeacherPermission.teacher_id == permission_data.teacher_id,
                    TeacherPermission.permission_type == permission_data.permission_type,
                    TeacherPermission.is_deleted == False
                )
            )
        )
        existing_permission = existing.scalar_one_or_none()
        
        if existing_permission:
            # Reactivate if inactive
            existing_permission.is_active = True
            existing_permission.expires_at = permission_data.expires_at
            existing_permission.granted_by = granted_by
            await db.commit()
            # Re-fetch with relationships loaded
            result = await db.execute(
                select(TeacherPermission).options(
                    selectinload(TeacherPermission.teacher),
                    selectinload(TeacherPermission.granter)
                ).where(TeacherPermission.id == existing_permission.id)
            )
            return result.scalar_one()
        
        # Create new permission
        permission = TeacherPermission(
            school_id=school_id,
            teacher_id=permission_data.teacher_id,
            permission_type=permission_data.permission_type,
            granted_by=granted_by,
            expires_at=permission_data.expires_at,
            is_active=True
        )
        db.add(permission)
        await db.commit()
        
        # Re-fetch with relationships loaded
        result = await db.execute(
            select(TeacherPermission).options(
                selectinload(TeacherPermission.teacher),
                selectinload(TeacherPermission.granter)
            ).where(TeacherPermission.id == permission.id)
        )
        return result.scalar_one()

    @staticmethod
    async def grant_bulk_permissions(
        db: AsyncSession,
        bulk_data: TeacherPermissionBulkCreate,
        school_id: str,
        granted_by: str
    ) -> List[TeacherPermission]:
        """Grant multiple permissions to a teacher at once"""
        permissions = []
        for perm_type in bulk_data.permissions:
            perm_data = TeacherPermissionCreate(
                teacher_id=bulk_data.teacher_id,
                permission_type=perm_type,
                expires_at=bulk_data.expires_at
            )
            permission = await TeacherPermissionService.grant_permission(
                db, perm_data, school_id, granted_by
            )
            permissions.append(permission)
        return permissions

    @staticmethod
    async def revoke_permission(
        db: AsyncSession,
        permission_id: str,
        school_id: str
    ) -> bool:
        """Revoke (soft delete) a permission"""
        result = await db.execute(
            select(TeacherPermission).where(
                and_(
                    TeacherPermission.id == permission_id,
                    TeacherPermission.school_id == school_id,
                    TeacherPermission.is_deleted == False
                )
            )
        )
        permission = result.scalar_one_or_none()
        
        if not permission:
            return False
        
        permission.is_deleted = True
        permission.deleted_at = datetime.now(timezone.utc)
        await db.commit()
        return True

    @staticmethod
    async def update_permission(
        db: AsyncSession,
        permission_id: str,
        update_data: TeacherPermissionUpdate,
        school_id: str
    ) -> Optional[TeacherPermission]:
        """Update a permission's active status or expiration"""
        result = await db.execute(
            select(TeacherPermission).where(
                and_(
                    TeacherPermission.id == permission_id,
                    TeacherPermission.school_id == school_id,
                    TeacherPermission.is_deleted == False
                )
            )
        )
        permission = result.scalar_one_or_none()
        
        if not permission:
            return None
        
        if update_data.is_active is not None:
            permission.is_active = update_data.is_active
        if update_data.expires_at is not None:
            permission.expires_at = update_data.expires_at
        
        await db.commit()
        
        # Re-fetch with relationships loaded
        result = await db.execute(
            select(TeacherPermission).options(
                selectinload(TeacherPermission.teacher),
                selectinload(TeacherPermission.granter)
            ).where(TeacherPermission.id == permission_id)
        )
        return result.scalar_one()

    @staticmethod
    async def get_teacher_permissions(
        db: AsyncSession,
        teacher_id: str,
        school_id: str,
        include_inactive: bool = False
    ) -> List[TeacherPermission]:
        """Get all permissions for a specific teacher"""
        query = select(TeacherPermission).options(
            selectinload(TeacherPermission.granter)
        ).where(
            and_(
                TeacherPermission.teacher_id == teacher_id,
                TeacherPermission.school_id == school_id,
                TeacherPermission.is_deleted == False
            )
        )
        
        if not include_inactive:
            query = query.where(TeacherPermission.is_active == True)
            # Also filter out expired permissions
            query = query.where(
                or_(
                    TeacherPermission.expires_at == None,
                    TeacherPermission.expires_at > datetime.now(timezone.utc)
                )
            )
        
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_all_permissions(
        db: AsyncSession,
        school_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[TeacherPermission], int]:
        """Get all permission assignments for a school"""
        query = select(TeacherPermission).options(
            selectinload(TeacherPermission.teacher),
            selectinload(TeacherPermission.granter)
        ).where(
            and_(
                TeacherPermission.school_id == school_id,
                TeacherPermission.is_deleted == False
            )
        )
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar()
        
        # Get paginated results
        query = query.order_by(TeacherPermission.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        
        return list(result.scalars().all()), total

    @staticmethod
    async def check_teacher_has_permission(
        db: AsyncSession,
        teacher_id: str,
        school_id: str,
        permission_type: PermissionType
    ) -> Optional[TeacherPermission]:
        """Check if a teacher has a specific active permission. Returns the permission or None."""
        result = await db.execute(
            select(TeacherPermission).where(
                and_(
                    TeacherPermission.teacher_id == teacher_id,
                    TeacherPermission.school_id == school_id,
                    TeacherPermission.permission_type == permission_type,
                    TeacherPermission.is_active == True,
                    TeacherPermission.is_deleted == False,
                    or_(
                        TeacherPermission.expires_at == None,
                        TeacherPermission.expires_at > datetime.now(timezone.utc)
                    )
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_teachers_with_permissions(
        db: AsyncSession,
        school_id: str
    ) -> List[User]:
        """Get all teachers who have at least one permission in this school"""
        # Subquery to get distinct teacher_ids with active permissions
        subquery = select(TeacherPermission.teacher_id).where(
            and_(
                TeacherPermission.school_id == school_id,
                TeacherPermission.is_deleted == False,
                TeacherPermission.is_active == True
            )
        ).distinct()
        
        result = await db.execute(
            select(User).where(User.id.in_(subquery))
        )
        return list(result.scalars().all())
