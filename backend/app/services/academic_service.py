from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.academic import Class, Subject, Term, Enrollment, TimetableEntry, Attendance
from app.models.user import User
from app.models.student import Student
from app.schemas.academic import (
    ClassCreate, ClassUpdate, SubjectCreate, SubjectUpdate,
    TermCreate, TermUpdate, EnrollmentCreate, TimetableEntryCreate,
    TimetableEntryUpdate, AttendanceCreate, AttendanceUpdate
)
from datetime import date


class AcademicService:
    """Service class for academic operations"""
    
    # Class Management
    @staticmethod
    async def create_class(
        db: AsyncSession,
        class_data: ClassCreate,
        school_id: str
    ) -> Class:
        """Create a new class"""
        # Check if class name already exists for the session
        result = await db.execute(
            select(Class).where(
                Class.name == class_data.name,
                Class.academic_session == class_data.academic_session,
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class name already exists for this academic session"
            )
        
        # Verify teacher exists if provided
        if class_data.teacher_id:
            teacher_result = await db.execute(
                select(User).where(
                    User.id == class_data.teacher_id,
                    User.school_id == school_id,
                    User.is_deleted == False
                )
            )
            if not teacher_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher not found"
                )
        
        # Create class
        class_dict = class_data.dict()
        class_dict['school_id'] = school_id
        
        new_class = Class(**class_dict)
        db.add(new_class)
        await db.commit()
        await db.refresh(new_class)
        
        return new_class
    
    @staticmethod
    async def get_classes(
        db: AsyncSession,
        school_id: str,
        academic_session: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Class]:
        """Get classes with filtering"""
        query = select(Class).where(
            Class.school_id == school_id,
            Class.is_deleted == False
        )

        if academic_session:
            query = query.where(Class.academic_session == academic_session)

        if is_active is not None:
            query = query.where(Class.is_active == is_active)

        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_class_by_id(
        db: AsyncSession,
        class_id: str,
        school_id: str
    ) -> Optional[Class]:
        """Get class by ID"""
        result = await db.execute(
            select(Class).where(
                Class.id == class_id,
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_class(
        db: AsyncSession,
        class_id: str,
        school_id: str,
        class_data: ClassUpdate
    ) -> Optional[Class]:
        """Update class information"""
        class_obj = await AcademicService.get_class_by_id(db, class_id, school_id)
        if not class_obj:
            return None
        
        # Verify teacher exists if being updated
        if class_data.teacher_id:
            teacher_result = await db.execute(
                select(User).where(
                    User.id == class_data.teacher_id,
                    User.school_id == school_id,
                    User.is_deleted == False
                )
            )
            if not teacher_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher not found"
                )
        
        # Update fields
        update_data = class_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(class_obj, field, value)
        
        await db.commit()
        await db.refresh(class_obj)
        
        return class_obj
    
    # Subject Management
    @staticmethod
    async def create_subject(
        db: AsyncSession,
        subject_data: SubjectCreate,
        school_id: str
    ) -> Subject:
        """Create a new subject"""
        # Check if subject code already exists
        result = await db.execute(
            select(Subject).where(
                Subject.code == subject_data.code,
                Subject.school_id == school_id,
                Subject.is_deleted == False
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject code already exists"
            )
        
        # Create subject
        subject_dict = subject_data.dict()
        subject_dict['school_id'] = school_id
        
        subject = Subject(**subject_dict)
        db.add(subject)
        await db.commit()
        await db.refresh(subject)
        
        return subject
    
    @staticmethod
    async def get_subjects(
        db: AsyncSession,
        school_id: str,
        is_active: Optional[bool] = None,
        is_core: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Subject]:
        """Get subjects with filtering"""
        query = select(Subject).where(
            Subject.school_id == school_id,
            Subject.is_deleted == False
        )
        
        if is_active is not None:
            query = query.where(Subject.is_active == is_active)
        
        if is_core is not None:
            query = query.where(Subject.is_core == is_core)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    # Term Management
    @staticmethod
    async def create_term(
        db: AsyncSession,
        term_data: TermCreate,
        school_id: str
    ) -> Term:
        """Create a new term"""
        # Check if term already exists for the session
        result = await db.execute(
            select(Term).where(
                Term.type == term_data.type,
                Term.academic_session == term_data.academic_session,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Term already exists for this academic session"
            )
        
        # Create term
        term_dict = term_data.dict()
        term_dict['school_id'] = school_id
        
        term = Term(**term_dict)
        db.add(term)
        await db.commit()
        await db.refresh(term)
        
        return term
    
    @staticmethod
    async def set_current_term(
        db: AsyncSession,
        term_id: str,
        school_id: str
    ) -> bool:
        """Set a term as current (and unset others)"""
        # First, unset all current terms
        await db.execute(
            select(Term).where(
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        
        # Update all terms to not current
        result = await db.execute(
            select(Term).where(
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        terms = result.scalars().all()
        
        for term in terms:
            term.is_current = False
        
        # Set the specified term as current
        term_result = await db.execute(
            select(Term).where(
                Term.id == term_id,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        current_term = term_result.scalar_one_or_none()
        
        if not current_term:
            return False
        
        current_term.is_current = True
        await db.commit()
        
        return True
    
    # Enrollment Management
    @staticmethod
    async def create_enrollment(
        db: AsyncSession,
        enrollment_data: EnrollmentCreate,
        school_id: str
    ) -> Enrollment:
        """Create a new enrollment"""
        # Check if enrollment already exists
        result = await db.execute(
            select(Enrollment).where(
                Enrollment.student_id == enrollment_data.student_id,
                Enrollment.subject_id == enrollment_data.subject_id,
                Enrollment.term_id == enrollment_data.term_id,
                Enrollment.school_id == school_id,
                Enrollment.is_deleted == False
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student already enrolled in this subject for this term"
            )
        
        # Verify student, class, subject, and term exist
        # (Add validation logic here)
        
        # Create enrollment
        enrollment_dict = enrollment_data.dict()
        enrollment_dict['school_id'] = school_id
        
        enrollment = Enrollment(**enrollment_dict)
        db.add(enrollment)
        await db.commit()
        await db.refresh(enrollment)
        
        return enrollment
    
    # Timetable Management
    @staticmethod
    async def create_timetable_entry(
        db: AsyncSession,
        entry_data: TimetableEntryCreate,
        school_id: str
    ) -> TimetableEntry:
        """Create a new timetable entry"""
        # Check for conflicts (same class, day, and overlapping time)
        result = await db.execute(
            select(TimetableEntry).where(
                TimetableEntry.class_id == entry_data.class_id,
                TimetableEntry.day_of_week == entry_data.day_of_week,
                TimetableEntry.term_id == entry_data.term_id,
                TimetableEntry.school_id == school_id,
                TimetableEntry.is_deleted == False,
                or_(
                    and_(
                        TimetableEntry.start_time <= entry_data.start_time,
                        TimetableEntry.end_time > entry_data.start_time
                    ),
                    and_(
                        TimetableEntry.start_time < entry_data.end_time,
                        TimetableEntry.end_time >= entry_data.end_time
                    )
                )
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Time slot conflict with existing timetable entry"
            )
        
        # Create timetable entry
        entry_dict = entry_data.dict()
        entry_dict['school_id'] = school_id
        
        entry = TimetableEntry(**entry_dict)
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        
        return entry
    
    @staticmethod
    async def get_class_timetable(
        db: AsyncSession,
        class_id: str,
        term_id: str,
        school_id: str
    ) -> List[TimetableEntry]:
        """Get timetable for a specific class"""
        result = await db.execute(
            select(TimetableEntry).where(
                TimetableEntry.class_id == class_id,
                TimetableEntry.term_id == term_id,
                TimetableEntry.school_id == school_id,
                TimetableEntry.is_deleted == False
            ).order_by(TimetableEntry.day_of_week, TimetableEntry.start_time)
        )
        return list(result.scalars().all())
    
    # Attendance Management
    @staticmethod
    async def mark_attendance(
        db: AsyncSession,
        attendance_data: AttendanceCreate,
        marked_by: str,
        school_id: str
    ) -> Attendance:
        """Mark student attendance"""
        # Check if attendance already exists for this date
        result = await db.execute(
            select(Attendance).where(
                Attendance.student_id == attendance_data.student_id,
                Attendance.class_id == attendance_data.class_id,
                Attendance.date == attendance_data.date,
                Attendance.school_id == school_id,
                Attendance.is_deleted == False
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update existing attendance
            existing.status = attendance_data.status
            existing.notes = attendance_data.notes
            existing.marked_by = marked_by
            await db.commit()
            await db.refresh(existing)
            return existing
        
        # Create new attendance record
        attendance_dict = attendance_data.dict()
        attendance_dict['school_id'] = school_id
        attendance_dict['marked_by'] = marked_by
        
        attendance = Attendance(**attendance_dict)
        db.add(attendance)
        await db.commit()
        await db.refresh(attendance)
        
        return attendance
