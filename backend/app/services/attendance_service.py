"""
Attendance Service - Handles both class and subject attendance operations
"""
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from sqlalchemy import select, and_, or_, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.models.academic import Attendance, Class, Subject, Term, AttendanceStatus
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.academic import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse,
    BulkClassAttendanceCreate,
    BulkSubjectAttendanceCreate,
    StudentAttendanceSummary,
)


class AttendanceService:
    """Service for managing attendance operations"""

    @staticmethod
    async def validate_teacher_permission(
        db: AsyncSession,
        teacher_id: str,
        class_id: str,
        subject_id: Optional[str],
        school_id: str
    ) -> bool:
        """
        Validate if a teacher has permission to mark attendance
        - For class attendance: Teacher must be the class teacher
        - For subject attendance: Teacher must be assigned to the subject
        """
        # Get teacher user
        teacher_stmt = select(User).where(
            and_(
                User.id == teacher_id,
                User.school_id == school_id,
                User.is_deleted == False
            )
        )
        teacher_result = await db.execute(teacher_stmt)
        teacher = teacher_result.scalar_one_or_none()

        if not teacher:
            return False

        # School admins can mark any attendance
        if teacher.role in [UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_OWNER]:
            return True

        # For class attendance, check if teacher is the class teacher
        if subject_id is None:
            class_stmt = select(Class).where(
                and_(
                    Class.id == class_id,
                    Class.school_id == school_id,
                    Class.teacher_id == teacher_id,
                    Class.is_deleted == False
                )
            )
            class_result = await db.execute(class_stmt)
            class_obj = class_result.scalar_one_or_none()
            return class_obj is not None

        # For subject attendance, check if teacher is assigned to the subject
        from app.models.academic import teacher_subject_association
        subject_stmt = select(teacher_subject_association).where(
            and_(
                teacher_subject_association.c.teacher_id == teacher_id,
                teacher_subject_association.c.subject_id == subject_id,
                teacher_subject_association.c.school_id == school_id,
                teacher_subject_association.c.is_deleted == False
            )
        )
        subject_result = await db.execute(subject_stmt)
        assignment = subject_result.first()
        return assignment is not None

    @staticmethod
    async def mark_class_attendance(
        db: AsyncSession,
        attendance_data: BulkClassAttendanceCreate,
        teacher_id: str,
        school_id: str
    ) -> List[AttendanceResponse]:
        """Mark class attendance for all students in a class"""
        # Validate permission
        has_permission = await AttendanceService.validate_teacher_permission(
            db, teacher_id, attendance_data.class_id, None, school_id
        )
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to mark attendance for this class"
            )

        # Verify class exists
        class_stmt = select(Class).where(
            and_(
                Class.id == attendance_data.class_id,
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        class_result = await db.execute(class_stmt)
        class_obj = class_result.scalar_one_or_none()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Verify term exists
        term_stmt = select(Term).where(
            and_(
                Term.id == attendance_data.term_id,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        term_result = await db.execute(term_stmt)
        term = term_result.scalar_one_or_none()
        if not term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Term not found"
            )

        # Delete existing attendance for this date/class to avoid duplicates
        delete_stmt = select(Attendance).where(
            and_(
                Attendance.date == attendance_data.date,
                Attendance.class_id == attendance_data.class_id,
                Attendance.subject_id == None,  # Only class attendance
                Attendance.term_id == attendance_data.term_id,
                Attendance.school_id == school_id,
                Attendance.is_deleted == False
            )
        )
        existing_result = await db.execute(delete_stmt)
        existing_records = existing_result.scalars().all()
        for record in existing_records:
            record.is_deleted = True

        # Create new attendance records
        attendance_records = []
        for record in attendance_data.records:
            attendance = Attendance(
                date=attendance_data.date,
                status=record.status,
                student_id=record.student_id,
                class_id=attendance_data.class_id,
                subject_id=None,  # Class attendance has no subject
                term_id=attendance_data.term_id,
                marked_by=teacher_id,
                notes=record.notes,
                school_id=school_id
            )
            db.add(attendance)
            attendance_records.append(attendance)

        await db.commit()

        # Fetch with joined data
        response_records = []
        for attendance in attendance_records:
            await db.refresh(attendance)
            stmt = select(Attendance).options(
                joinedload(Attendance.student),
                joinedload(Attendance.class_),
                joinedload(Attendance.term),
                joinedload(Attendance.marker)
            ).where(Attendance.id == attendance.id)
            result = await db.execute(stmt)
            full_attendance = result.scalar_one()

            response_records.append(AttendanceResponse(
                id=full_attendance.id,
                date=full_attendance.date,
                status=full_attendance.status,
                student_id=full_attendance.student_id,
                student_name=full_attendance.student.full_name if full_attendance.student else None,
                class_id=full_attendance.class_id,
                class_name=full_attendance.class_.name if full_attendance.class_ else None,
                subject_id=None,
                subject_name=None,
                subject_code=None,
                term_id=full_attendance.term_id,
                term_name=full_attendance.term.name if full_attendance.term else None,
                marked_by=full_attendance.marked_by,
                marker_name=full_attendance.marker.full_name if full_attendance.marker else None,
                notes=full_attendance.notes,
                created_at=full_attendance.created_at,
                updated_at=full_attendance.updated_at
            ))

        return response_records

    @staticmethod
    async def mark_subject_attendance(
        db: AsyncSession,
        attendance_data: BulkSubjectAttendanceCreate,
        teacher_id: str,
        school_id: str
    ) -> List[AttendanceResponse]:
        """Mark subject attendance for students in a class"""
        # Validate permission
        has_permission = await AttendanceService.validate_teacher_permission(
            db, teacher_id, attendance_data.class_id, attendance_data.subject_id, school_id
        )
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to mark attendance for this subject"
            )

        # Verify class exists
        class_stmt = select(Class).where(
            and_(
                Class.id == attendance_data.class_id,
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        class_result = await db.execute(class_stmt)
        class_obj = class_result.scalar_one_or_none()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Verify subject exists
        subject_stmt = select(Subject).where(
            and_(
                Subject.id == attendance_data.subject_id,
                Subject.school_id == school_id,
                Subject.is_deleted == False
            )
        )
        subject_result = await db.execute(subject_stmt)
        subject = subject_result.scalar_one_or_none()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )

        # Verify term exists
        term_stmt = select(Term).where(
            and_(
                Term.id == attendance_data.term_id,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        term_result = await db.execute(term_stmt)
        term = term_result.scalar_one_or_none()
        if not term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Term not found"
            )

        # Delete existing attendance for this date/class/subject to avoid duplicates
        delete_stmt = select(Attendance).where(
            and_(
                Attendance.date == attendance_data.date,
                Attendance.class_id == attendance_data.class_id,
                Attendance.subject_id == attendance_data.subject_id,
                Attendance.term_id == attendance_data.term_id,
                Attendance.school_id == school_id,
                Attendance.is_deleted == False
            )
        )
        existing_result = await db.execute(delete_stmt)
        existing_records = existing_result.scalars().all()
        for record in existing_records:
            record.is_deleted = True

        # Create new attendance records
        attendance_records = []
        for record in attendance_data.records:
            attendance = Attendance(
                date=attendance_data.date,
                status=record.status,
                student_id=record.student_id,
                class_id=attendance_data.class_id,
                subject_id=attendance_data.subject_id,
                term_id=attendance_data.term_id,
                marked_by=teacher_id,
                notes=record.notes,
                school_id=school_id
            )
            db.add(attendance)
            attendance_records.append(attendance)

        await db.commit()

        # Fetch with joined data
        response_records = []
        for attendance in attendance_records:
            await db.refresh(attendance)
            stmt = select(Attendance).options(
                joinedload(Attendance.student),
                joinedload(Attendance.class_),
                joinedload(Attendance.subject),
                joinedload(Attendance.term),
                joinedload(Attendance.marker)
            ).where(Attendance.id == attendance.id)
            result = await db.execute(stmt)
            full_attendance = result.scalar_one()

            response_records.append(AttendanceResponse(
                id=full_attendance.id,
                date=full_attendance.date,
                status=full_attendance.status,
                student_id=full_attendance.student_id,
                student_name=full_attendance.student.full_name if full_attendance.student else None,
                class_id=full_attendance.class_id,
                class_name=full_attendance.class_.name if full_attendance.class_ else None,
                subject_id=full_attendance.subject_id,
                subject_name=full_attendance.subject.name if full_attendance.subject else None,
                subject_code=full_attendance.subject.code if full_attendance.subject else None,
                term_id=full_attendance.term_id,
                term_name=full_attendance.term.name if full_attendance.term else None,
                marked_by=full_attendance.marked_by,
                marker_name=full_attendance.marker.full_name if full_attendance.marker else None,
                notes=full_attendance.notes,
                created_at=full_attendance.created_at,
                updated_at=full_attendance.updated_at
            ))

        return response_records

    @staticmethod
    async def get_attendance_records(
        db: AsyncSession,
        school_id: str,
        class_id: Optional[str] = None,
        subject_id: Optional[str] = None,
        student_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status_filter: Optional[AttendanceStatus] = None,
        term_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[AttendanceResponse]:
        """Get attendance records with flexible filtering"""
        conditions = [
            Attendance.school_id == school_id,
            Attendance.is_deleted == False
        ]

        if class_id:
            conditions.append(Attendance.class_id == class_id)
        if subject_id:
            if subject_id.lower() == 'null':
                conditions.append(Attendance.subject_id == None)
            else:
                conditions.append(Attendance.subject_id == subject_id)
        if student_id:
            conditions.append(Attendance.student_id == student_id)
        if start_date:
            conditions.append(Attendance.date >= start_date)
        if end_date:
            conditions.append(Attendance.date <= end_date)
        if status_filter:
            conditions.append(Attendance.status == status_filter)
        if term_id:
            conditions.append(Attendance.term_id == term_id)

        stmt = select(Attendance).options(
            joinedload(Attendance.student),
            joinedload(Attendance.class_),
            joinedload(Attendance.subject),
            joinedload(Attendance.term),
            joinedload(Attendance.marker)
        ).where(and_(*conditions)).order_by(Attendance.date.desc()).offset(skip).limit(limit)

        result = await db.execute(stmt)
        attendances = result.scalars().all()

        return [
            AttendanceResponse(
                id=att.id,
                date=att.date,
                status=att.status,
                student_id=att.student_id,
                student_name=att.student.full_name if att.student else None,
                class_id=att.class_id,
                class_name=att.class_.name if att.class_ else None,
                subject_id=att.subject_id,
                subject_name=att.subject.name if att.subject else None,
                subject_code=att.subject.code if att.subject else None,
                term_id=att.term_id,
                term_name=att.term.name if att.term else None,
                marked_by=att.marked_by,
                marker_name=att.marker.full_name if att.marker else None,
                notes=att.notes,
                created_at=att.created_at,
                updated_at=att.updated_at
            )
            for att in attendances
        ]

    @staticmethod
    async def update_attendance_record(
        db: AsyncSession,
        attendance_id: str,
        update_data: AttendanceUpdate,
        school_id: str
    ) -> Optional[AttendanceResponse]:
        """Update an existing attendance record"""
        stmt = select(Attendance).options(
            joinedload(Attendance.student),
            joinedload(Attendance.class_),
            joinedload(Attendance.subject),
            joinedload(Attendance.term),
            joinedload(Attendance.marker)
        ).where(
            and_(
                Attendance.id == attendance_id,
                Attendance.school_id == school_id,
                Attendance.is_deleted == False
            )
        )
        result = await db.execute(stmt)
        attendance = result.scalar_one_or_none()

        if not attendance:
            return None

        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(attendance, field, value)

        attendance.updated_at = datetime.utcnow().isoformat()
        await db.commit()
        await db.refresh(attendance)

        return AttendanceResponse(
            id=attendance.id,
            date=attendance.date,
            status=attendance.status,
            student_id=attendance.student_id,
            student_name=attendance.student.full_name if attendance.student else None,
            class_id=attendance.class_id,
            class_name=attendance.class_.name if attendance.class_ else None,
            subject_id=attendance.subject_id,
            subject_name=attendance.subject.name if attendance.subject else None,
            subject_code=attendance.subject.code if attendance.subject else None,
            term_id=attendance.term_id,
            term_name=attendance.term.name if attendance.term else None,
            marked_by=attendance.marked_by,
            marker_name=attendance.marker.full_name if attendance.marker else None,
            notes=attendance.notes,
            created_at=attendance.created_at,
            updated_at=attendance.updated_at
        )

    @staticmethod
    async def get_student_attendance_summary(
        db: AsyncSession,
        student_id: str,
        school_id: str,
        term_id: Optional[str] = None,
        subject_id: Optional[str] = None
    ) -> StudentAttendanceSummary:
        """Get attendance summary for a student"""
        # Verify student exists
        student_stmt = select(Student).where(
            and_(
                Student.id == student_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        student_result = await db.execute(student_stmt)
        student = student_result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )

        # Build query conditions
        conditions = [
            Attendance.student_id == student_id,
            Attendance.school_id == school_id,
            Attendance.is_deleted == False
        ]

        if term_id:
            conditions.append(Attendance.term_id == term_id)
        if subject_id:
            conditions.append(Attendance.subject_id == subject_id)

        # Count attendance by status
        stmt = select(
            func.count(Attendance.id).label('total'),
            func.sum(case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)).label('present'),
            func.sum(case((Attendance.status == AttendanceStatus.ABSENT, 1), else_=0)).label('absent'),
            func.sum(case((Attendance.status == AttendanceStatus.LATE, 1), else_=0)).label('late'),
            func.sum(case((Attendance.status == AttendanceStatus.EXCUSED, 1), else_=0)).label('excused')
        ).where(and_(*conditions))

        result = await db.execute(stmt)
        summary = result.first()

        total_days = summary.total or 0
        present_days = summary.present or 0
        absent_days = summary.absent or 0
        late_days = summary.late or 0
        excused_days = summary.excused or 0

        # Calculate attendance rate (present + late as attended)
        attendance_rate = ((present_days + late_days) / total_days * 100) if total_days > 0 else 0.0

        return StudentAttendanceSummary(
            student_id=student_id,
            student_name=student.full_name,
            total_days=total_days,
            present_days=present_days,
            absent_days=absent_days,
            late_days=late_days,
            excused_days=excused_days,
            attendance_rate=round(attendance_rate, 2)
        )
