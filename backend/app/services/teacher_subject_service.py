from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, text
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.models.academic import Subject, teacher_subject_association, class_subject_association, Class
from app.schemas.academic import (
    TeacherSubjectAssignmentCreate,
    TeacherSubjectAssignmentUpdate,
    TeacherSubjectAssignmentResponse,
    ClassSubjectAssignmentCreate,
    ClassSubjectAssignmentUpdate,
    ClassSubjectAssignmentResponse,
    BulkTeacherSubjectAssignment,
    BulkClassSubjectAssignment
)


class TeacherSubjectService:
    """Service for managing teacher-subject assignments"""
    
    @staticmethod
    async def assign_subject_to_teacher(
        db: AsyncSession,
        assignment_data: TeacherSubjectAssignmentCreate,
        school_id: str
    ) -> TeacherSubjectAssignmentResponse:
        """Assign a subject to a teacher"""
        # Verify teacher exists and is a teacher
        teacher_result = await db.execute(
            select(User).where(
                User.id == assignment_data.teacher_id,
                User.school_id == school_id,
                User.role == UserRole.TEACHER,
                User.is_deleted == False
            )
        )
        teacher = teacher_result.scalar_one_or_none()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )
        
        # Verify subject exists
        subject_result = await db.execute(
            select(Subject).where(
                Subject.id == assignment_data.subject_id,
                Subject.school_id == school_id,
                Subject.is_deleted == False
            )
        )
        subject = subject_result.scalar_one_or_none()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )
        
        # Check if assignment already exists
        existing_result = await db.execute(
            select(teacher_subject_association).where(
                and_(
                    teacher_subject_association.c.teacher_id == assignment_data.teacher_id,
                    teacher_subject_association.c.subject_id == assignment_data.subject_id,
                    teacher_subject_association.c.school_id == school_id,
                    teacher_subject_association.c.is_deleted == False
                )
            )
        )
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher is already assigned to this subject"
            )
        
        # If this is head of subject, remove head status from other teachers for this subject
        if assignment_data.is_head_of_subject:
            await db.execute(
                text("""
                    UPDATE teacher_subjects 
                    SET is_head_of_subject = false, updated_at = :updated_at
                    WHERE subject_id = :subject_id 
                    AND school_id = :school_id 
                    AND is_deleted = false
                """),
                {
                    "subject_id": assignment_data.subject_id,
                    "school_id": school_id,
                    "updated_at": __import__('datetime').datetime.utcnow().isoformat()
                }
            )
        
        # Create assignment
        import uuid
        import datetime
        assignment_id = str(uuid.uuid4())
        now = datetime.datetime.utcnow().isoformat()
        
        await db.execute(
            teacher_subject_association.insert().values(
                id=assignment_id,
                teacher_id=assignment_data.teacher_id,
                subject_id=assignment_data.subject_id,
                school_id=school_id,
                is_head_of_subject=assignment_data.is_head_of_subject,
                created_at=now,
                updated_at=now,
                is_deleted=False
            )
        )
        
        await db.commit()
        
        # Return response
        return TeacherSubjectAssignmentResponse(
            id=assignment_id,
            teacher_id=assignment_data.teacher_id,
            subject_id=assignment_data.subject_id,
            is_head_of_subject=assignment_data.is_head_of_subject,
            teacher_name=teacher.full_name,
            subject_name=subject.name,
            subject_code=subject.code,
            created_at=datetime.datetime.fromisoformat(now),
            updated_at=datetime.datetime.fromisoformat(now)
        )
    
    @staticmethod
    async def bulk_assign_subjects_to_teacher(
        db: AsyncSession,
        assignment_data: BulkTeacherSubjectAssignment,
        school_id: str
    ) -> List[TeacherSubjectAssignmentResponse]:
        """Assign multiple subjects to a teacher"""
        # Verify teacher exists
        teacher_result = await db.execute(
            select(User).where(
                User.id == assignment_data.teacher_id,
                User.school_id == school_id,
                User.role == UserRole.TEACHER,
                User.is_deleted == False
            )
        )
        teacher = teacher_result.scalar_one_or_none()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )
        
        # Verify all subjects exist
        subjects_result = await db.execute(
            select(Subject).where(
                Subject.id.in_(assignment_data.subject_ids),
                Subject.school_id == school_id,
                Subject.is_deleted == False
            )
        )
        subjects = subjects_result.scalars().all()
        
        if len(subjects) != len(assignment_data.subject_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more subjects not found"
            )
        
        # Validate head of subject
        if assignment_data.head_of_subject_id and assignment_data.head_of_subject_id not in assignment_data.subject_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Head of subject must be one of the assigned subjects"
            )
        
        # Remove existing assignments for this teacher
        await db.execute(
            text("""
                UPDATE teacher_subjects 
                SET is_deleted = true, updated_at = :updated_at
                WHERE teacher_id = :teacher_id 
                AND school_id = :school_id 
                AND is_deleted = false
            """),
            {
                "teacher_id": assignment_data.teacher_id,
                "school_id": school_id,
                "updated_at": __import__('datetime').datetime.utcnow().isoformat()
            }
        )
        
        # If head of subject is specified, remove head status from other teachers for that subject
        if assignment_data.head_of_subject_id:
            await db.execute(
                text("""
                    UPDATE teacher_subjects 
                    SET is_head_of_subject = false, updated_at = :updated_at
                    WHERE subject_id = :subject_id 
                    AND school_id = :school_id 
                    AND is_deleted = false
                """),
                {
                    "subject_id": assignment_data.head_of_subject_id,
                    "school_id": school_id,
                    "updated_at": __import__('datetime').datetime.utcnow().isoformat()
                }
            )
        
        # Create new assignments
        import uuid
        import datetime
        now = datetime.datetime.utcnow().isoformat()
        
        assignments = []
        for subject in subjects:
            assignment_id = str(uuid.uuid4())
            is_head = assignment_data.head_of_subject_id == subject.id
            
            await db.execute(
                teacher_subject_association.insert().values(
                    id=assignment_id,
                    teacher_id=assignment_data.teacher_id,
                    subject_id=subject.id,
                    school_id=school_id,
                    is_head_of_subject=is_head,
                    created_at=now,
                    updated_at=now,
                    is_deleted=False
                )
            )
            
            assignments.append(TeacherSubjectAssignmentResponse(
                id=assignment_id,
                teacher_id=assignment_data.teacher_id,
                subject_id=subject.id,
                is_head_of_subject=is_head,
                teacher_name=teacher.full_name,
                subject_name=subject.name,
                subject_code=subject.code,
                created_at=datetime.datetime.fromisoformat(now),
                updated_at=datetime.datetime.fromisoformat(now)
            ))
        
        await db.commit()
        return assignments

    @staticmethod
    async def get_teacher_subjects(
        db: AsyncSession,
        teacher_id: str,
        school_id: str
    ) -> List[TeacherSubjectAssignmentResponse]:
        """Get all subjects assigned to a teacher"""
        query = text("""
            SELECT
                ts.id,
                ts.teacher_id,
                ts.subject_id,
                ts.is_head_of_subject,
                ts.created_at,
                ts.updated_at,
                u.first_name || ' ' || u.last_name as teacher_name,
                s.name as subject_name,
                s.code as subject_code
            FROM teacher_subjects ts
            JOIN users u ON ts.teacher_id = u.id
            JOIN subjects s ON ts.subject_id = s.id
            WHERE ts.teacher_id = :teacher_id
            AND ts.school_id = :school_id
            AND ts.is_deleted = false
            ORDER BY s.name
        """)

        result = await db.execute(query, {"teacher_id": teacher_id, "school_id": school_id})
        rows = result.fetchall()

        assignments = []
        for row in rows:
            assignments.append(TeacherSubjectAssignmentResponse(
                id=row.id,
                teacher_id=row.teacher_id,
                subject_id=row.subject_id,
                is_head_of_subject=row.is_head_of_subject,
                teacher_name=row.teacher_name,
                subject_name=row.subject_name,
                subject_code=row.subject_code,
                created_at=__import__('datetime').datetime.fromisoformat(row.created_at),
                updated_at=__import__('datetime').datetime.fromisoformat(row.updated_at)
            ))

        return assignments

    @staticmethod
    async def get_subject_teachers(
        db: AsyncSession,
        subject_id: str,
        school_id: str
    ) -> List[TeacherSubjectAssignmentResponse]:
        """Get all teachers assigned to a subject"""
        query = text("""
            SELECT
                ts.id,
                ts.teacher_id,
                ts.subject_id,
                ts.is_head_of_subject,
                ts.created_at,
                ts.updated_at,
                u.first_name || ' ' || u.last_name as teacher_name,
                s.name as subject_name,
                s.code as subject_code
            FROM teacher_subjects ts
            JOIN users u ON ts.teacher_id = u.id
            JOIN subjects s ON ts.subject_id = s.id
            WHERE ts.subject_id = :subject_id
            AND ts.school_id = :school_id
            AND ts.is_deleted = false
            ORDER BY ts.is_head_of_subject DESC, u.first_name
        """)

        result = await db.execute(query, {"subject_id": subject_id, "school_id": school_id})
        rows = result.fetchall()

        assignments = []
        for row in rows:
            assignments.append(TeacherSubjectAssignmentResponse(
                id=row.id,
                teacher_id=row.teacher_id,
                subject_id=row.subject_id,
                is_head_of_subject=row.is_head_of_subject,
                teacher_name=row.teacher_name,
                subject_name=row.subject_name,
                subject_code=row.subject_code,
                created_at=__import__('datetime').datetime.fromisoformat(row.created_at),
                updated_at=__import__('datetime').datetime.fromisoformat(row.updated_at)
            ))

        return assignments

    @staticmethod
    async def remove_teacher_subject_assignment(
        db: AsyncSession,
        assignment_id: str,
        school_id: str
    ) -> bool:
        """Remove a teacher-subject assignment"""
        result = await db.execute(
            text("""
                UPDATE teacher_subjects
                SET is_deleted = true, updated_at = :updated_at
                WHERE id = :assignment_id
                AND school_id = :school_id
                AND is_deleted = false
            """),
            {
                "assignment_id": assignment_id,
                "school_id": school_id,
                "updated_at": __import__('datetime').datetime.utcnow().isoformat()
            }
        )

        await db.commit()
        return result.rowcount > 0


class ClassSubjectService:
    """Service for managing class-subject assignments"""

    @staticmethod
    async def assign_subject_to_class(
        db: AsyncSession,
        assignment_data: ClassSubjectAssignmentCreate,
        school_id: str
    ) -> ClassSubjectAssignmentResponse:
        """Assign a subject to a class"""
        # Verify class exists
        class_result = await db.execute(
            select(Class).where(
                Class.id == assignment_data.class_id,
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        class_obj = class_result.scalar_one_or_none()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Verify subject exists
        subject_result = await db.execute(
            select(Subject).where(
                Subject.id == assignment_data.subject_id,
                Subject.school_id == school_id,
                Subject.is_deleted == False
            )
        )
        subject = subject_result.scalar_one_or_none()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )

        # Check if assignment already exists
        existing_result = await db.execute(
            select(class_subject_association).where(
                and_(
                    class_subject_association.c.class_id == assignment_data.class_id,
                    class_subject_association.c.subject_id == assignment_data.subject_id,
                    class_subject_association.c.school_id == school_id,
                    class_subject_association.c.is_deleted == False
                )
            )
        )
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject is already assigned to this class"
            )

        # Create assignment
        import uuid
        import datetime
        assignment_id = str(uuid.uuid4())
        now = datetime.datetime.utcnow().isoformat()

        # Use subject's is_core if not specified in assignment
        is_core = assignment_data.is_core if assignment_data.is_core is not None else subject.is_core

        await db.execute(
            class_subject_association.insert().values(
                id=assignment_id,
                class_id=assignment_data.class_id,
                subject_id=assignment_data.subject_id,
                school_id=school_id,
                is_core=is_core,
                created_at=now,
                updated_at=now,
                is_deleted=False
            )
        )

        await db.commit()

        # Return response
        return ClassSubjectAssignmentResponse(
            id=assignment_id,
            class_id=assignment_data.class_id,
            subject_id=assignment_data.subject_id,
            is_core=is_core,
            class_name=class_obj.name,
            subject_name=subject.name,
            subject_code=subject.code,
            created_at=datetime.datetime.fromisoformat(now),
            updated_at=datetime.datetime.fromisoformat(now)
        )

    @staticmethod
    async def bulk_assign_subjects_to_class(
        db: AsyncSession,
        assignment_data: BulkClassSubjectAssignment,
        school_id: str
    ) -> List[ClassSubjectAssignmentResponse]:
        """Assign multiple subjects to a class"""
        # Verify class exists
        class_result = await db.execute(
            select(Class).where(
                Class.id == assignment_data.class_id,
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        class_obj = class_result.scalar_one_or_none()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Remove existing assignments for this class
        await db.execute(
            text("""
                UPDATE class_subjects
                SET is_deleted = true, updated_at = :updated_at
                WHERE class_id = :class_id
                AND school_id = :school_id
                AND is_deleted = false
            """),
            {
                "class_id": assignment_data.class_id,
                "school_id": school_id,
                "updated_at": __import__('datetime').datetime.utcnow().isoformat()
            }
        )

        # Create new assignments
        assignments = []
        for subject_assignment in assignment_data.subject_assignments:
            try:
                assignment = await ClassSubjectService.assign_subject_to_class(
                    db, subject_assignment, school_id
                )
                assignments.append(assignment)
            except HTTPException:
                # Skip if subject doesn't exist or other error
                continue

        return assignments

    @staticmethod
    async def get_class_subjects(
        db: AsyncSession,
        class_id: str,
        school_id: str
    ) -> List[ClassSubjectAssignmentResponse]:
        """Get all subjects assigned to a class"""
        query = text("""
            SELECT
                cs.id,
                cs.class_id,
                cs.subject_id,
                cs.is_core,
                cs.created_at,
                cs.updated_at,
                c.name as class_name,
                s.name as subject_name,
                s.code as subject_code
            FROM class_subjects cs
            JOIN classes c ON cs.class_id = c.id
            JOIN subjects s ON cs.subject_id = s.id
            WHERE cs.class_id = :class_id
            AND cs.school_id = :school_id
            AND cs.is_deleted = false
            ORDER BY cs.is_core DESC, s.name
        """)

        result = await db.execute(query, {"class_id": class_id, "school_id": school_id})
        rows = result.fetchall()

        assignments = []
        for row in rows:
            assignments.append(ClassSubjectAssignmentResponse(
                id=row.id,
                class_id=row.class_id,
                subject_id=row.subject_id,
                is_core=row.is_core,
                class_name=row.class_name,
                subject_name=row.subject_name,
                subject_code=row.subject_code,
                created_at=__import__('datetime').datetime.fromisoformat(row.created_at),
                updated_at=__import__('datetime').datetime.fromisoformat(row.updated_at)
            ))

        return assignments

    @staticmethod
    async def get_subject_classes(
        db: AsyncSession,
        subject_id: str,
        school_id: str
    ) -> List[ClassSubjectAssignmentResponse]:
        """Get all classes assigned to a subject"""
        query = text("""
            SELECT
                cs.id,
                cs.class_id,
                cs.subject_id,
                cs.is_core,
                cs.created_at,
                cs.updated_at,
                c.name as class_name,
                s.name as subject_name,
                s.code as subject_code
            FROM class_subjects cs
            JOIN classes c ON cs.class_id = c.id
            JOIN subjects s ON cs.subject_id = s.id
            WHERE cs.subject_id = :subject_id
            AND cs.school_id = :school_id
            AND cs.is_deleted = false
            ORDER BY c.name
        """)

        result = await db.execute(query, {"subject_id": subject_id, "school_id": school_id})
        rows = result.fetchall()

        assignments = []
        for row in rows:
            assignments.append(ClassSubjectAssignmentResponse(
                id=row.id,
                class_id=row.class_id,
                subject_id=row.subject_id,
                is_core=row.is_core,
                class_name=row.class_name,
                subject_name=row.subject_name,
                subject_code=row.subject_code,
                created_at=__import__('datetime').datetime.fromisoformat(row.created_at),
                updated_at=__import__('datetime').datetime.fromisoformat(row.updated_at)
            ))

        return assignments

    @staticmethod
    async def remove_class_subject_assignment(
        db: AsyncSession,
        assignment_id: str,
        school_id: str
    ) -> bool:
        """Remove a class-subject assignment"""
        result = await db.execute(
            text("""
                UPDATE class_subjects
                SET is_deleted = true, updated_at = :updated_at
                WHERE id = :assignment_id
                AND school_id = :school_id
                AND is_deleted = false
            """),
            {
                "assignment_id": assignment_id,
                "school_id": school_id,
                "updated_at": __import__('datetime').datetime.utcnow().isoformat()
            }
        )

        await db.commit()
        return result.rowcount > 0
