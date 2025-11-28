"""
Additional methods for Attendance Service - DELETE and duplicate check
"""
from typing import List, Optional, Dict, Any, Tuple
from datetime import date, datetime
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.models.academic import Attendance, AttendanceStatus
from app.models.user import UserRole


class AttendanceServiceExtensions:
    """Extension methods for AttendanceService"""

    @staticmethod
    async def check_duplicate_attendance(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        date_value: date,
        subject_id: Optional[str] = None,
        term_id: Optional[str] = None
    ) -> Tuple[bool, Optional[List[Attendance]]]:
        """
        Check if attendance already exists for the given parameters
        Returns: (exists: bool, existing_records: List[Attendance] | None)
        """
        conditions = [
            Attendance.school_id == school_id,
            Attendance.class_id == class_id,
            Attendance.date == date_value,
            Attendance.is_deleted == False
        ]

        if subject_id:
            conditions.append(Attendance.subject_id == subject_id)
        else:
            conditions.append(Attendance.subject_id == None)

        if term_id:
            conditions.append(Attendance.term_id == term_id)

        stmt = select(Attendance).options(
            joinedload(Attendance.student),
            joinedload(Attendance.marker)
        ).where(and_(*conditions))

        result = await db.execute(stmt)
        records = result.scalars().all()

        return (len(records) > 0, list(records) if records else None)

    @staticmethod
    async def delete_attendance_record(
        db: AsyncSession,
        attendance_id: str,
        user_id: str,
        school_id: str
    ) -> bool:
        """
        Delete an attendance record (soft delete)
        Only the marker or school admin/owner can delete
        """
        # Fetch the attendance record
        stmt = select(Attendance).where(
            and_(
                Attendance.id == attendance_id,
                Attendance.school_id == school_id,
                Attendance.is_deleted == False
            )
        )
        result = await db.execute(stmt)
        attendance = result.scalar_one_or_none()

        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found"
            )

        # Check permissions - only marker or admin can delete
        from app.models.user import User
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Allow if user is the marker or is school admin/owner
        is_marker = attendance.marked_by == user_id
        is_admin = user.role in [UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PLATFORM_SUPER_ADMIN]

        if not (is_marker or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this attendance record"
            )

        # Soft delete
        attendance.is_deleted = True
        attendance.deleted_at = datetime.utcnow()
        await db.commit()

        return True

    @staticmethod
    async def delete_bulk_attendance(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        date_value: date,
        subject_id: Optional[str],
        user_id: str
    ) -> int:
        """
        Delete all attendance records for a specific date/class/subject
        Returns count of deleted records
        """
        # Check if user has permission
        from app.models.user import User
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        is_admin = user.role in [UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PLATFORM_SUPER_ADMIN]

        # Build conditions
        conditions = [
            Attendance.school_id == school_id,
            Attendance.class_id == class_id,
            Attendance.date == date_value,
            Attendance.is_deleted == False
        ]

        if subject_id:
            conditions.append(Attendance.subject_id == subject_id)
        else:
            conditions.append(Attendance.subject_id == None)

        # Only allow if admin or if all records were marked by this user
        if not is_admin:
            conditions.append(Attendance.marked_by == user_id)

        stmt = select(Attendance).where(and_(*conditions))
        result = await db.execute(stmt)
        records = result.scalars().all()

        if not records:
            return 0

        # Soft delete all records
        count = 0
        for record in records:
            record.is_deleted = True
            record.deleted_at = datetime.utcnow()
            count += 1

        await db.commit()
        return count
