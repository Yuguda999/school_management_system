from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.academic import Class, Subject, Term, Enrollment, TimetableEntry, Attendance
from app.models.user import User, UserRole
from app.models.student import Student
from app.schemas.academic import (
    ClassCreate, ClassUpdate, SubjectCreate, SubjectUpdate,
    TermCreate, TermUpdate, EnrollmentCreate, TimetableEntryCreate,
    TimetableEntryUpdate, AttendanceCreate, AttendanceUpdate
)
from datetime import date
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from app.models.notification import NotificationType


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
        
        # Verify teacher exists if provided (and not empty string)
        if class_data.teacher_id and class_data.teacher_id.strip():
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

        # Convert empty string teacher_id to None for proper foreign key handling
        if class_dict.get('teacher_id') == '':
            class_dict['teacher_id'] = None

        new_class = Class(**class_dict)
        db.add(new_class)
        await db.commit()
        await db.refresh(new_class)
        
        # Notify Teacher
        if new_class.teacher_id:
            await NotificationService.create_notification(
                db=db,
                school_id=school_id,
                notification_data=NotificationCreate(
                    user_id=new_class.teacher_id,
                    title="Class Assignment",
                    message=f"You have been assigned as the class teacher for {new_class.name}.",
                    type=NotificationType.INFO,
                    link="/academics/classes"
                )
            )

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
        
        # Verify teacher exists if being updated (and not empty string)
        if class_data.teacher_id and class_data.teacher_id.strip():
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

        # Convert empty string teacher_id to None for proper foreign key handling
        if 'teacher_id' in update_data and update_data['teacher_id'] == '':
            update_data['teacher_id'] = None

        for field, value in update_data.items():
            setattr(class_obj, field, value)
        
        await db.commit()
        await db.refresh(class_obj)
        
        # Notify New Teacher if changed
        if 'teacher_id' in update_data and update_data['teacher_id'] and update_data['teacher_id'] != class_obj.teacher_id:
             await NotificationService.create_notification(
                db=db,
                school_id=school_id,
                notification_data=NotificationCreate(
                    user_id=update_data['teacher_id'],
                    title="Class Assignment",
                    message=f"You have been assigned as the class teacher for {class_obj.name}.",
                    type=NotificationType.INFO,
                    link="/academics/classes"
                )
            )

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

    @staticmethod
    async def get_teacher_classes(
        db: AsyncSession,
        teacher_id: str,
        school_id: str,
        academic_session: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Class]:
        """Get classes that a teacher can access (classes they teach or are class teacher for)"""
        from sqlalchemy import text

        base_query = """
            SELECT DISTINCT c.id, c.name, c.level, c.section, c.academic_session,
                   c.teacher_id, c.capacity, c.is_active, c.created_at, c.updated_at,
                   c.school_id, c.is_deleted
            FROM classes c
            LEFT JOIN class_subjects cs ON c.id = cs.class_id
            LEFT JOIN teacher_subjects ts ON cs.subject_id = ts.subject_id
            WHERE c.school_id = :school_id
            AND c.is_deleted = false
            AND (
                c.teacher_id = :teacher_id OR
                (ts.teacher_id = :teacher_id AND ts.is_deleted = false)
            )
        """

        params = {
            "teacher_id": teacher_id,
            "school_id": school_id
        }

        if academic_session:
            base_query += " AND c.academic_session = :academic_session"
            params["academic_session"] = academic_session

        if is_active is not None:
            base_query += " AND c.is_active = :is_active"
            params["is_active"] = is_active

        base_query += " ORDER BY c.name LIMIT :limit OFFSET :skip"
        params["limit"] = limit
        params["skip"] = skip

        result = await db.execute(text(base_query), params)
        rows = result.fetchall()

        # Convert rows to Class objects
        classes = []
        for row in rows:
            class_obj = Class(
                id=row.id,
                name=row.name,
                level=row.level,
                section=row.section,
                academic_session=row.academic_session,
                teacher_id=row.teacher_id,
                capacity=row.capacity,
                is_active=row.is_active,
                created_at=row.created_at,
                updated_at=row.updated_at,
                school_id=row.school_id,
                is_deleted=row.is_deleted
            )
            classes.append(class_obj)

        return classes

    @staticmethod
    async def get_teacher_subjects(
        db: AsyncSession,
        teacher_id: str,
        school_id: str,
        is_active: Optional[bool] = None,
        is_core: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
        include_class_subjects: bool = True
    ) -> List[Subject]:
        """Get subjects that a teacher is assigned to teach (including class subjects if they are a class teacher)"""
        from sqlalchemy import text

        # Base query for directly assigned subjects
        direct_subjects_condition = """
            s.id IN (
                SELECT ts.subject_id
                FROM teacher_subjects ts
                WHERE ts.teacher_id = :teacher_id
                AND ts.school_id = :school_id
                AND ts.is_deleted = false
            )
        """

        # Condition for class subjects
        class_subjects_condition = """
            s.id IN (
                SELECT cs.subject_id
                FROM class_subjects cs
                JOIN classes c ON cs.class_id = c.id
                WHERE c.teacher_id = :teacher_id
                AND cs.school_id = :school_id
                AND cs.is_deleted = false
                AND c.is_deleted = false
            )
        """

        # Construct the WHERE clause based on include_class_subjects
        if include_class_subjects:
            where_clause = f"({direct_subjects_condition} OR {class_subjects_condition})"
        else:
            where_clause = direct_subjects_condition

        base_query = f"""
            SELECT DISTINCT s.id, s.name, s.code, s.description, s.is_core,
                   s.credit_units, s.is_active, s.created_at, s.updated_at, s.school_id, s.is_deleted
            FROM subjects s
            WHERE s.school_id = :school_id
            AND s.is_deleted = false
            AND {where_clause}
        """

        params = {
            "teacher_id": teacher_id,
            "school_id": school_id
        }

        if is_active is not None:
            base_query += " AND s.is_active = :is_active"
            params["is_active"] = is_active

        if is_core is not None:
            base_query += " AND s.is_core = :is_core"
            params["is_core"] = is_core

        base_query += " ORDER BY s.name LIMIT :limit OFFSET :skip"
        params["limit"] = limit
        params["skip"] = skip

        result = await db.execute(text(base_query), params)
        rows = result.fetchall()

        # Convert rows to Subject objects
        subjects = []
        for row in rows:
            subject = Subject(
                id=row.id,
                name=row.name,
                code=row.code,
                description=row.description,
                is_core=row.is_core,
                credit_units=row.credit_units,
                is_active=row.is_active,
                created_at=row.created_at,
                updated_at=row.updated_at,
                school_id=row.school_id,
                is_deleted=row.is_deleted
            )
            subjects.append(subject)

        return subjects
    
    # Term Management
    @staticmethod
    async def create_term(
        db: AsyncSession,
        term_data: TermCreate,
        school_id: str
    ) -> Term:
        """Create a new term with comprehensive validation"""
        # Check if term already exists for the session
        existing_term_result = await db.execute(
            select(Term).where(
                Term.type == term_data.type,
                Term.academic_session == term_data.academic_session,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        if existing_term_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{term_data.type.value.replace('_', ' ').title()} already exists for academic session {term_data.academic_session}"
            )

        # Check for overlapping terms in the same academic session
        overlapping_terms_result = await db.execute(
            select(Term).where(
                Term.academic_session == term_data.academic_session,
                Term.school_id == school_id,
                Term.is_deleted == False,
                # Check for date overlaps
                Term.start_date <= term_data.end_date,
                Term.end_date >= term_data.start_date
            )
        )
        overlapping_terms = overlapping_terms_result.scalars().all()

        if overlapping_terms:
            overlapping_names = [term.name for term in overlapping_terms]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Term dates overlap with existing terms: {', '.join(overlapping_names)}"
            )

        # Validate term sequence within academic session
        await AcademicService._validate_term_sequence(db, term_data, school_id)

        # Create term
        term_dict = term_data.dict()
        term_dict['school_id'] = school_id

        term = Term(**term_dict)
        db.add(term)
        await db.commit()
        await db.refresh(term)
        
        # Notify Admins
        # Get all admins
        admins_res = await db.execute(select(User).where(User.school_id == school_id, User.role == UserRole.SCHOOL_ADMIN, User.is_active == True))
        admins = admins_res.scalars().all()
        
        for admin in admins:
             await NotificationService.create_notification(
                db=db,
                school_id=school_id,
                notification_data=NotificationCreate(
                    user_id=admin.id,
                    title="New Term Created",
                    message=f"A new term '{term.name}' has been created for the academic session {term.academic_session}.",
                    type=NotificationType.INFO,
                    link="/academics/terms"
                )
            )

        return term

    @staticmethod
    async def _validate_term_sequence(
        db: AsyncSession,
        term_data: TermCreate,
        school_id: str
    ) -> None:
        """Validate that terms are created in logical sequence"""
        from app.models.academic import TermType

        # Get existing terms for the academic session
        existing_terms_result = await db.execute(
            select(Term).where(
                Term.academic_session == term_data.academic_session,
                Term.school_id == school_id,
                Term.is_deleted == False
            ).order_by(Term.start_date)
        )
        existing_terms = existing_terms_result.scalars().all()

        if not existing_terms:
            return  # First term, no validation needed

        # Define term order
        term_order = {
            TermType.FIRST_TERM: 1,
            TermType.SECOND_TERM: 2,
            TermType.THIRD_TERM: 3
        }

        new_term_order = term_order[term_data.type]

        # Check if we're creating terms in logical order
        for existing_term in existing_terms:
            existing_order = term_order[existing_term.type]

            if new_term_order < existing_order and term_data.start_date > existing_term.start_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot create {term_data.type.value.replace('_', ' ').title()} after {existing_term.type.value.replace('_', ' ').title()} in the same academic session"
                )

            if new_term_order > existing_order and term_data.start_date < existing_term.end_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot create {term_data.type.value.replace('_', ' ').title()} before {existing_term.type.value.replace('_', ' ').title()} ends"
                )
    
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

    @staticmethod
    async def create_bulk_terms(
        db: AsyncSession,
        bulk_data: 'BulkTermCreate',
        school_id: str
    ) -> List[Term]:
        """Create all terms for an academic session at once"""
        from app.models.academic import TermType
        from app.schemas.academic import TermCreate

        # Check if any terms already exist for this academic session
        existing_terms_result = await db.execute(
            select(Term).where(
                Term.academic_session == bulk_data.academic_session,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        existing_terms = existing_terms_result.scalars().all()

        if existing_terms:
            existing_types = [term.type.value for term in existing_terms]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Terms already exist for academic session {bulk_data.academic_session}: {', '.join(existing_types)}"
            )

        created_terms = []

        try:
            # Create first term
            first_term_data = TermCreate(
                name="First Term",
                type=TermType.FIRST_TERM,
                academic_session=bulk_data.academic_session,
                start_date=bulk_data.first_term_start,
                end_date=bulk_data.first_term_end
            )
            first_term = Term(**first_term_data.dict(), school_id=school_id)
            db.add(first_term)
            created_terms.append(first_term)

            # Create second term
            second_term_data = TermCreate(
                name="Second Term",
                type=TermType.SECOND_TERM,
                academic_session=bulk_data.academic_session,
                start_date=bulk_data.second_term_start,
                end_date=bulk_data.second_term_end
            )
            second_term = Term(**second_term_data.dict(), school_id=school_id)
            db.add(second_term)
            created_terms.append(second_term)

            # Create third term if provided
            if bulk_data.third_term_start and bulk_data.third_term_end:
                third_term_data = TermCreate(
                    name="Third Term",
                    type=TermType.THIRD_TERM,
                    academic_session=bulk_data.academic_session,
                    start_date=bulk_data.third_term_start,
                    end_date=bulk_data.third_term_end
                )
                third_term = Term(**third_term_data.dict(), school_id=school_id)
                db.add(third_term)
                created_terms.append(third_term)

            await db.commit()

            # Refresh all created terms
            for term in created_terms:
                await db.refresh(term)

            return created_terms

        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create terms: {str(e)}"
            )

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
