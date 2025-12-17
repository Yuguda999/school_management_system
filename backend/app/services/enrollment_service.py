from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, text
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import date, datetime
import uuid

from app.models.academic import Enrollment, Subject, Class, Term
from app.models.student import Student, StudentClassHistory, ClassHistoryStatus
from app.schemas.academic import EnrollmentCreate, EnrollmentResponse
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from app.models.notification import NotificationType


class EnrollmentService:
    """Service for managing student enrollments in subjects"""

    @staticmethod
    async def get_current_term(db: AsyncSession, school_id: str) -> Optional[Term]:
        """Get the current active term for the school"""
        result = await db.execute(
            select(Term).where(
                Term.school_id == school_id,
                Term.is_current == True,
                Term.is_active == True,
                Term.is_deleted == False
            )
        )
        return result.scalar_one_or_none()

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
        
        # Create enrollment
        enrollment_dict = enrollment_data.dict()
        enrollment_dict['school_id'] = school_id
        
        enrollment = Enrollment(**enrollment_dict)
        db.add(enrollment)
        await db.commit()
        await db.refresh(enrollment)
        
        # Notify Student
        # Fetch student and subject details for notification
        stmt = select(Enrollment).options(
            selectinload(Enrollment.student),
            selectinload(Enrollment.subject)
        ).where(Enrollment.id == enrollment.id)
        result = await db.execute(stmt)
        enrollment_details = result.scalar_one_or_none()
        
        if enrollment_details and enrollment_details.student and enrollment_details.student.user_id:
            await NotificationService.create_notification(
                db=db,
                school_id=school_id,
                notification_data=NotificationCreate(
                    user_id=enrollment_details.student.user_id,
                    title="Subject Enrollment",
                    message=f"You have been enrolled in {enrollment_details.subject.name}.",
                    type=NotificationType.INFO,
                    link="/academics/subjects"
                )
            )

        return enrollment

    @staticmethod
    async def auto_enroll_students_in_class_subjects(
        db: AsyncSession,
        class_id: str,
        school_id: str,
        subject_ids: Optional[List[str]] = None
    ) -> List[Enrollment]:
        """
        Automatically enroll all students in a class to the class's subjects
        If subject_ids is provided, only enroll in those specific subjects
        """
        # Get current term
        current_term = await EnrollmentService.get_current_term(db, school_id)
        if not current_term:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No current term found. Please set a current term first."
            )

        # Get all active students in the class
        from app.models.student import StudentStatus
        students_result = await db.execute(
            select(Student).where(
                Student.current_class_id == class_id,
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            )
        )
        students = students_result.scalars().all()

        if not students:
            return []

        # Get class subjects (either specific subjects or all class subjects)
        if subject_ids:
            # Get specific subjects assigned to this class
            # Use IN clause instead of ANY for SQLite compatibility
            placeholders = ','.join(['?' for _ in subject_ids])
            query = text(f"""
                SELECT DISTINCT s.id
                FROM subjects s
                JOIN class_subjects cs ON s.id = cs.subject_id
                WHERE cs.class_id = :class_id
                AND cs.school_id = :school_id
                AND s.id IN ({placeholders})
                AND cs.is_deleted = false
                AND s.is_deleted = false
                AND s.is_active = true
            """)
            params = {
                "class_id": class_id,
                "school_id": school_id,
            }
            # Add subject_ids as individual parameters
            for i, subject_id in enumerate(subject_ids):
                params[f"subject_id_{i}"] = subject_id

            # Update placeholders to use named parameters
            placeholders = ','.join([f':subject_id_{i}' for i in range(len(subject_ids))])
            query = text(f"""
                SELECT DISTINCT s.id
                FROM subjects s
                JOIN class_subjects cs ON s.id = cs.subject_id
                WHERE cs.class_id = :class_id
                AND cs.school_id = :school_id
                AND s.id IN ({placeholders})
                AND cs.is_deleted = false
                AND s.is_deleted = false
                AND s.is_active = true
            """)
            result = await db.execute(query, params)
        else:
            # Get all subjects assigned to this class
            query = text("""
                SELECT DISTINCT s.id
                FROM subjects s
                JOIN class_subjects cs ON s.id = cs.subject_id
                WHERE cs.class_id = :class_id
                AND cs.school_id = :school_id
                AND cs.is_deleted = false
                AND s.is_deleted = false
                AND s.is_active = true
            """)
            result = await db.execute(query, {
                "class_id": class_id,
                "school_id": school_id
            })

        subject_ids_to_enroll = [row[0] for row in result.fetchall()]

        if not subject_ids_to_enroll:
            return []

        # Fetch subject names for notifications
        subject_names = {}
        if subject_ids_to_enroll:
            subjects_query = select(Subject.id, Subject.name).where(Subject.id.in_(subject_ids_to_enroll))
            subjects_res = await db.execute(subjects_query)
            subject_names = {row.id: row.name for row in subjects_res.fetchall()}

        # Create enrollments for each student-subject combination
        enrollments = []
        enrollment_date = date.today()
        
        for student in students:
            for subject_id in subject_ids_to_enroll:
                # Check if enrollment already exists
                existing_result = await db.execute(
                    select(Enrollment).where(
                        Enrollment.student_id == student.id,
                        Enrollment.subject_id == subject_id,
                        Enrollment.term_id == current_term.id,
                        Enrollment.school_id == school_id,
                        Enrollment.is_deleted == False
                    )
                )
                
                if not existing_result.scalar_one_or_none():
                    # Create new enrollment
                    enrollment = Enrollment(
                        student_id=student.id,
                        class_id=class_id,
                        subject_id=subject_id,
                        term_id=current_term.id,
                        school_id=school_id,
                        enrollment_date=enrollment_date,
                        is_active=True
                    )
                    db.add(enrollment)
                    enrollments.append(enrollment)
                    
                    # Notify Student
                    if student.user_id:
                        subject_name = subject_names.get(subject_id, "a subject")
                        await NotificationService.create_notification(
                            db=db,
                            school_id=school_id,
                            notification_data=NotificationCreate(
                                user_id=student.user_id,
                                title="Subject Enrollment",
                                message=f"You have been enrolled in {subject_name}.",
                                type=NotificationType.INFO,
                                link="/academics/subjects"
                            )
                        )

        if enrollments:
            await db.commit()
            # Refresh all enrollments
            for enrollment in enrollments:
                await db.refresh(enrollment)

            # Create class history records for students
            await EnrollmentService._create_class_history_for_enrollments(
                db, students, class_id, current_term, school_id
            )

        return enrollments

    @staticmethod
    async def auto_enroll_student_in_class_subjects(
        db: AsyncSession,
        student_id: str,
        class_id: str,
        school_id: str
    ) -> List[Enrollment]:
        """
        Automatically enroll a specific student in all subjects of their class
        """
        # Get current term
        current_term = await EnrollmentService.get_current_term(db, school_id)
        if not current_term:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No current term found. Please set a current term first."
            )

        # Get all subjects assigned to the class
        query = text("""
            SELECT DISTINCT s.id
            FROM subjects s
            JOIN class_subjects cs ON s.id = cs.subject_id
            WHERE cs.class_id = :class_id
            AND cs.school_id = :school_id
            AND cs.is_deleted = false
            AND s.is_deleted = false
            AND s.is_active = true
        """)
        result = await db.execute(query, {
            "class_id": class_id,
            "school_id": school_id
        })

        subject_ids = [row[0] for row in result.fetchall()]

        if not subject_ids:
            return []

        # Create enrollments for each subject
        enrollments = []
        enrollment_date = date.today()
        
        for subject_id in subject_ids:
            # Check if enrollment already exists
            existing_result = await db.execute(
                select(Enrollment).where(
                    Enrollment.student_id == student_id,
                    Enrollment.subject_id == subject_id,
                    Enrollment.term_id == current_term.id,
                    Enrollment.school_id == school_id,
                    Enrollment.is_deleted == False
                )
            )
            
            if not existing_result.scalar_one_or_none():
                # Create new enrollment
                enrollment = Enrollment(
                    student_id=student_id,
                    class_id=class_id,
                    subject_id=subject_id,
                    term_id=current_term.id,
                    school_id=school_id,
                    enrollment_date=enrollment_date,
                    is_active=True
                )
                db.add(enrollment)
                enrollments.append(enrollment)

        if enrollments:
            await db.commit()
            # Refresh all enrollments
            for enrollment in enrollments:
                await db.refresh(enrollment)

        return enrollments

    @staticmethod
    async def get_enrollments(
        db: AsyncSession,
        school_id: str,
        student_id: Optional[str] = None,
        class_id: Optional[str] = None,
        subject_id: Optional[str] = None,
        term_id: Optional[str] = None,
        enrollment_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[EnrollmentResponse]:
        """Get enrollments with filtering"""
        query = text("""
            SELECT 
                e.id,
                e.student_id,
                e.class_id,
                e.subject_id,
                e.term_id,
                e.enrollment_date,
                e.is_active,
                e.created_at,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                c.name as class_name,
                sub.name as subject_name,
                t.name as term_name
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN classes c ON e.class_id = c.id
            JOIN subjects sub ON e.subject_id = sub.id
            JOIN terms t ON e.term_id = t.id
            WHERE e.school_id = :school_id
            AND e.is_deleted = false
            AND (:student_id IS NULL OR e.student_id = :student_id)
            AND (:class_id IS NULL OR e.class_id = :class_id)
            AND (:subject_id IS NULL OR e.subject_id = :subject_id)
            AND (:term_id IS NULL OR e.term_id = :term_id)
            AND (:enrollment_id IS NULL OR e.id = :enrollment_id)
            AND (:is_active IS NULL OR e.is_active = :is_active)
            ORDER BY s.first_name, s.last_name, sub.name
            LIMIT :limit OFFSET :skip
        """)

        result = await db.execute(query, {
            "school_id": school_id,
            "student_id": student_id,
            "class_id": class_id,
            "subject_id": subject_id,
            "term_id": term_id,
            "enrollment_id": enrollment_id,
            "is_active": is_active,
            "limit": limit,
            "skip": skip
        })

        enrollments = []
        for row in result.fetchall():
            enrollment = EnrollmentResponse(
                id=row.id,
                student_id=row.student_id,
                class_id=row.class_id,
                subject_id=row.subject_id,
                term_id=row.term_id,
                enrollment_date=row.enrollment_date,
                is_active=row.is_active,
                created_at=datetime.fromisoformat(row.created_at) if isinstance(row.created_at, str) else row.created_at,
                student_name=row.student_name,
                class_name=row.class_name,
                subject_name=row.subject_name,
                term_name=row.term_name
            )
            enrollments.append(enrollment)

        return enrollments

    @staticmethod
    async def delete_enrollment(
        db: AsyncSession,
        enrollment_id: str,
        school_id: str
    ) -> bool:
        """Soft delete an enrollment"""
        result = await db.execute(
            select(Enrollment).where(
                Enrollment.id == enrollment_id,
                Enrollment.school_id == school_id,
                Enrollment.is_deleted == False
            )
        )
        enrollment = result.scalar_one_or_none()
        
        if not enrollment:
            return False
        
        enrollment.is_deleted = True
        await db.commit()
        
        # Notify Student
        # Fetch student and subject details for notification
        stmt = select(Enrollment).options(
            selectinload(Enrollment.student),
            selectinload(Enrollment.subject)
        ).where(Enrollment.id == enrollment_id)
        result = await db.execute(stmt)
        enrollment_details = result.scalar_one_or_none()
        
        if enrollment_details and enrollment_details.student and enrollment_details.student.user_id:
            await NotificationService.create_notification(
                db=db,
                school_id=school_id,
                notification_data=NotificationCreate(
                    user_id=enrollment_details.student.user_id,
                    title="Subject Withdrawal",
                    message=f"You have been withdrawn from {enrollment_details.subject.name}.",
                    type=NotificationType.WARNING,
                    link="/academics/subjects"
                )
            )
            
        return True

    @staticmethod
    async def _create_class_history_for_enrollments(
        db: AsyncSession,
        students: List[Student],
        class_id: str,
        term: Term,
        school_id: str
    ) -> None:
        """Helper method to create class history records for enrolled students"""
        for student in students:
            # Check if class history already exists for this student-term combination
            existing_result = await db.execute(
                select(StudentClassHistory).where(
                    StudentClassHistory.student_id == student.id,
                    StudentClassHistory.term_id == term.id,
                    StudentClassHistory.school_id == school_id,
                    StudentClassHistory.is_deleted == False
                )
            )
            existing = existing_result.scalar_one_or_none()

            if not existing:
                # Create new class history record
                history = StudentClassHistory(
                    student_id=student.id,
                    class_id=class_id,
                    term_id=term.id,
                    academic_session=term.academic_session,
                    academic_session_id=term.academic_session_id,  # Set FK for proper querying
                    school_id=school_id,
                    enrollment_date=date.today(),
                    status=ClassHistoryStatus.ACTIVE,
                    is_current=term.is_current
                )
                db.add(history)

        await db.commit()
