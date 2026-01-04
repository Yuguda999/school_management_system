from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, case
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from decimal import Decimal
from datetime import date, datetime

from app.models.grade import Exam, Grade, ReportCard, ExamType, GradeScale
from app.models.academic import Class, Subject, Term, Enrollment
from app.models.student import Student
from app.models.user import User
from app.schemas.grade import (
    ExamCreate, ExamUpdate, GradeCreate, GradeUpdate, BulkGradeCreate,
    ReportCardCreate, StudentGradesSummary, ClassGradesSummary,
    GradeStatistics, GradeResponse
)
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from app.models.notification import NotificationType


class GradeService:
    """Service class for grade and exam operations"""
    
    @staticmethod
    def calculate_grade(percentage: Decimal) -> GradeScale:
        """Calculate letter grade based on percentage"""
        if percentage >= 90:
            return GradeScale.A_PLUS
        elif percentage >= 80:
            return GradeScale.A
        elif percentage >= 75:
            return GradeScale.B_PLUS
        elif percentage >= 70:
            return GradeScale.B
        elif percentage >= 65:
            return GradeScale.C_PLUS
        elif percentage >= 60:
            return GradeScale.C
        elif percentage >= 55:
            return GradeScale.D_PLUS
        elif percentage >= 50:
            return GradeScale.D
        elif percentage >= 45:
            return GradeScale.E
        else:
            return GradeScale.F
    
    # Exam Management
    @staticmethod
    async def create_exam(
        db: AsyncSession,
        exam_data: ExamCreate,
        school_id: str,
        created_by: str
    ) -> Exam:
        """Create a new exam"""
        # Verify subject, class, and term exist and belong to school
        subject_result = await db.execute(
            select(Subject).where(
                Subject.id == exam_data.subject_id,
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
        
        class_result = await db.execute(
            select(Class).where(
                Class.id == exam_data.class_id,
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
        
        term_result = await db.execute(
            select(Term).where(
                Term.id == exam_data.term_id,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        term = term_result.scalar_one_or_none()
        if not term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Term not found"
            )
        
        # Check for duplicate exam
        existing_exam = await db.execute(
            select(Exam).where(
                Exam.name == exam_data.name,
                Exam.subject_id == exam_data.subject_id,
                Exam.class_id == exam_data.class_id,
                Exam.term_id == exam_data.term_id,
                Exam.school_id == school_id,
                Exam.is_deleted == False
            )
        )
        if existing_exam.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Exam with this name already exists for this subject, class, and term"
            )
        
        # Create exam
        exam_dict = exam_data.dict()
        exam_dict.update({
            'school_id': school_id,
            'created_by': created_by
        })
        
        exam = Exam(**exam_dict)
        db.add(exam)
        await db.commit()
        
        # Reload exam with relationships to avoid greenlet errors
        result = await db.execute(
            select(Exam)
            .options(
                selectinload(Exam.creator),
                selectinload(Exam.subject),
                selectinload(Exam.class_),
                selectinload(Exam.term)
            )
            .where(Exam.id == exam.id)
        )
        exam = result.scalar_one()
        
        # Notify Teacher (if assigned to class/subject)
        # We can find the teacher from the class or subject
        teacher_id_to_notify = None
        if exam.class_ and exam.class_.teacher_id:
             teacher_id_to_notify = exam.class_.teacher_id
        
        if teacher_id_to_notify:
             # Get user_id for teacher
             teacher_user_res = await db.execute(select(User.id).where(User.id == teacher_id_to_notify)) # Assuming teacher_id is user_id
             # Wait, teacher_id in Class model usually refers to the teacher profile, which is linked to User.
             # Let's check Class model or just assume we need to find the User.
             # In this system, it seems teacher_id in Class refers to User ID (based on other services).
             
             if teacher_id_to_notify != created_by: # Don't notify if they created it
                await NotificationService.create_notification(
                    db=db,
                    school_id=school_id,
                    notification_data=NotificationCreate(
                        user_id=teacher_id_to_notify,
                        title="New Exam Created",
                        message=f"A new exam '{exam.name}' has been created for your class {exam.class_.name}.",
                        type=NotificationType.INFO,
                        link=f"/grades/exams/{exam.id}"
                    )
                )

        return exam
    
    @staticmethod
    async def get_exams(
        db: AsyncSession,
        school_id: str,
        subject_id: Optional[str] = None,
        class_id: Optional[str] = None,
        term_id: Optional[str] = None,
        exam_type: Optional[ExamType] = None,
        is_published: Optional[bool] = None,
        is_active: Optional[bool] = None,
        allowed_subject_ids: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Exam]:
        """Get exams with filtering"""
        query = select(Exam).options(
            selectinload(Exam.subject),
            selectinload(Exam.class_),
            selectinload(Exam.term),
            selectinload(Exam.creator),
            selectinload(Exam.grades)
        ).where(
            Exam.school_id == school_id,
            Exam.is_deleted == False
        )
        
        if allowed_subject_ids is not None:
            query = query.where(Exam.subject_id.in_(allowed_subject_ids))
        
        if subject_id:
            query = query.where(Exam.subject_id == subject_id)
        if class_id:
            query = query.where(Exam.class_id == class_id)
        if term_id:
            query = query.where(Exam.term_id == term_id)
        if exam_type:
            query = query.where(Exam.exam_type == exam_type)
        if is_published is not None:
            query = query.where(Exam.is_published == is_published)
        if is_active is not None:
            query = query.where(Exam.is_active == is_active)
        
        query = query.order_by(desc(Exam.exam_date)).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_exam_by_id(
        db: AsyncSession,
        exam_id: str,
        school_id: str
    ) -> Optional[Exam]:
        """Get exam by ID"""
        result = await db.execute(
            select(Exam).options(
                selectinload(Exam.subject),
                selectinload(Exam.class_),
                selectinload(Exam.term),
                selectinload(Exam.creator),
                selectinload(Exam.grades)
            ).where(
                Exam.id == exam_id,
                Exam.school_id == school_id,
                Exam.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_exam(
        db: AsyncSession,
        exam_id: str,
        exam_data: ExamUpdate,
        school_id: str
    ) -> Optional[Exam]:
        """Update exam"""
        exam = await GradeService.get_exam_by_id(db, exam_id, school_id)
        if not exam:
            return None
        
        # Update fields
        update_data = exam_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(exam, field, value)
        
        await db.commit()
        await db.refresh(exam)
        
        return exam
    
    @staticmethod
    async def delete_exam(
        db: AsyncSession,
        exam_id: str,
        school_id: str
    ) -> bool:
        """Soft delete exam"""
        exam = await GradeService.get_exam_by_id(db, exam_id, school_id)
        if not exam:
            return False
        
        # Check if exam has grades
        grades_result = await db.execute(
            select(func.count(Grade.id)).where(
                Grade.exam_id == exam_id,
                Grade.is_deleted == False
            )
        )
        grades_count = grades_result.scalar()
        
        if grades_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete exam with existing grades"
            )
        
        exam.is_deleted = True
        await db.commit()

        return True

    # Grade Management
    @staticmethod
    async def create_grade(
        db: AsyncSession,
        grade_data: GradeCreate,
        school_id: str,
        graded_by: str
    ) -> Grade:
        """Create a new grade"""
        # Verify student, subject, exam, and term exist and belong to school
        student_result = await db.execute(
            select(Student).where(
                Student.id == grade_data.student_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        student = student_result.scalar_one_or_none()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )

        subject_result = await db.execute(
            select(Subject).where(
                Subject.id == grade_data.subject_id,
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

        exam_result = await db.execute(
            select(Exam).where(
                Exam.id == grade_data.exam_id,
                Exam.school_id == school_id,
                Exam.is_deleted == False
            )
        )
        exam = exam_result.scalar_one_or_none()
        if not exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exam not found"
            )

        term_result = await db.execute(
            select(Term).where(
                Term.id == grade_data.term_id,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        term = term_result.scalar_one_or_none()
        if not term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Term not found"
            )

        # Check if student is enrolled in the subject
        enrollment_result = await db.execute(
            select(Enrollment).where(
                Enrollment.student_id == grade_data.student_id,
                Enrollment.subject_id == grade_data.subject_id,
                Enrollment.term_id == grade_data.term_id,
                Enrollment.school_id == school_id,
                Enrollment.is_deleted == False
            )
        )
        if not enrollment_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student is not enrolled in this subject for this term"
            )

        # Check for existing grade
        existing_grade = await db.execute(
            select(Grade).where(
                Grade.student_id == grade_data.student_id,
                Grade.exam_id == grade_data.exam_id,
                Grade.is_deleted == False
            )
        )
        if existing_grade.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grade already exists for this student and exam"
            )

        # Calculate percentage and grade
        percentage = (grade_data.score / grade_data.total_marks) * 100
        letter_grade = GradeService.calculate_grade(percentage)

        # Create grade
        grade_dict = grade_data.dict()
        grade_dict.update({
            'school_id': school_id,
            'graded_by': graded_by,
            'graded_date': date.today(),
            'percentage': percentage,
            'grade': letter_grade
        })
        
        # Include component_scores if provided (for consolidated grades)
        if grade_data.component_scores:
            grade_dict['component_scores'] = grade_data.component_scores

        grade = Grade(**grade_dict)
        db.add(grade)
        await db.commit()
        await db.refresh(grade)

        # Reload grade with relationships to avoid greenlet errors
        result = await db.execute(
            select(Grade)
            .options(
                selectinload(Grade.student),
                selectinload(Grade.subject),
                selectinload(Grade.exam)
            )
            .where(Grade.id == grade.id)
        )
        grade = result.scalar_one()

        # Send Notification to Student
        if grade.student and grade.student.user_id:
            await NotificationService.create_notification(
                db=db,
                school_id=school_id,
                notification_data=NotificationCreate(
                    user_id=grade.student.user_id,
                    title="New Grade Posted",
                    message=f"A new grade has been posted for {grade.subject.name} ({grade.exam.name}). Score: {grade.score}/{grade.total_marks}",
                    type=NotificationType.INFO,
                    link=f"/grades"
                )
            )

        return grade

    @staticmethod
    async def create_bulk_grades(
        db: AsyncSession,
        bulk_data: BulkGradeCreate,
        school_id: str,
        graded_by: str
    ) -> List[Grade]:
        """Create multiple grades for an exam"""
        # Verify exam exists
        exam_result = await db.execute(
            select(Exam).where(
                Exam.id == bulk_data.exam_id,
                Exam.school_id == school_id,
                Exam.is_deleted == False
            )
        )
        exam = exam_result.scalar_one_or_none()
        if not exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exam not found"
            )

        created_grades = []
        errors = []

        for grade_data in bulk_data.grades:
            try:
                # Validate score
                score = grade_data['score']
                if not isinstance(score, (int, float, Decimal)):
                    try:
                        score = float(score)
                    except (ValueError, TypeError):
                        errors.append({
                            'student_id': grade_data['student_id'],
                            'error': f"Invalid score: {score}"
                        })
                        continue
                
                # Check if grade already exists
                existing_grade_result = await db.execute(
                    select(Grade)
                    .options(selectinload(Grade.student))
                    .where(
                        Grade.student_id == grade_data['student_id'],
                        Grade.exam_id == exam.id,
                        Grade.is_deleted == False
                    )
                )
                existing_grade = existing_grade_result.scalar_one_or_none()
                
                if existing_grade:
                    # Update existing grade
                    existing_grade.score = score
                    existing_grade.total_marks = exam.total_marks
                    existing_grade.remarks = grade_data.get('remarks')
                    
                    # Recalculate percentage and grade
                    if exam.total_marks > 0:
                        percentage = (score / exam.total_marks) * 100
                        existing_grade.percentage = percentage
                        existing_grade.grade = GradeService.calculate_grade(percentage)
                    else:
                        existing_grade.percentage = 0
                        existing_grade.grade = GradeScale.F
                    existing_grade.graded_by = graded_by
                    existing_grade.graded_date = datetime.utcnow().date()
                    existing_grade.updated_at = datetime.utcnow()
                    
                    # Commit the changes to the database
                    await db.commit()
                    await db.refresh(existing_grade)
                    
                    # Reload existing grade with relationships
                    result = await db.execute(
                        select(Grade)
                        .options(
                            selectinload(Grade.student),
                            selectinload(Grade.subject),
                            selectinload(Grade.exam)
                        )
                        .where(Grade.id == existing_grade.id)
                    )
                    existing_grade = result.scalar_one()
                    
                    created_grades.append(existing_grade)
                else:
                    # Create new grade
                    grade_create = GradeCreate(
                        score=score,
                        total_marks=exam.total_marks,
                        student_id=grade_data['student_id'],
                        subject_id=exam.subject_id,
                        exam_id=exam.id,
                        term_id=exam.term_id,
                        remarks=grade_data.get('remarks')
                    )

                    grade = await GradeService.create_grade(
                        db, grade_create, school_id, graded_by
                    )
                    created_grades.append(grade)

            except HTTPException as e:
                errors.append({
                    'student_id': grade_data['student_id'],
                    'error': str(e.detail)
                })
                continue

        if errors and not created_grades:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create any grades. Errors: {errors}"
            )

        # Reload all grades with relationships to avoid greenlet errors
        if created_grades:
            grade_ids = [grade.id for grade in created_grades]
            result = await db.execute(
                select(Grade)
                .options(
                    selectinload(Grade.student),
                    selectinload(Grade.subject),
                    selectinload(Grade.exam),
                    selectinload(Grade.grader)
                )
                .where(Grade.id.in_(grade_ids))
            )
            created_grades = result.scalars().all()

            # Send Notifications for bulk grades
            for grade in created_grades:
                if grade.student and grade.student.user_id:
                    await NotificationService.create_notification(
                        db=db,
                        school_id=school_id,
                        notification_data=NotificationCreate(
                            user_id=grade.student.user_id,
                            title="New Grade Posted",
                            message=f"A new grade has been posted for {grade.subject.name} ({grade.exam.name}). Score: {grade.score}/{grade.total_marks}",
                            type=NotificationType.INFO,
                            link=f"/grades"
                        )
                    )

        return created_grades

    @staticmethod
    async def get_grades(
        db: AsyncSession,
        school_id: str,
        student_id: Optional[str] = None,
        subject_id: Optional[str] = None,
        exam_id: Optional[str] = None,
        term_id: Optional[str] = None,
        class_id: Optional[str] = None,
        is_published: Optional[bool] = None,
        allowed_subject_ids: Optional[List[str]] = None,
        allowed_student_ids: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Grade]:
        """Get grades with filtering"""
        query = select(Grade).options(
            selectinload(Grade.student),
            selectinload(Grade.subject),
            selectinload(Grade.exam),
            selectinload(Grade.term),
            selectinload(Grade.grader)
        ).where(
            Grade.school_id == school_id,
            Grade.is_deleted == False
        )

        if allowed_subject_ids is not None:
            query = query.where(Grade.subject_id.in_(allowed_subject_ids))
        if allowed_student_ids is not None:
            query = query.where(Grade.student_id.in_(allowed_student_ids))

        if student_id:
            query = query.where(Grade.student_id == student_id)
        if subject_id:
            query = query.where(Grade.subject_id == subject_id)
        if exam_id:
            query = query.where(Grade.exam_id == exam_id)
        if term_id:
            query = query.where(Grade.term_id == term_id)
        if is_published is not None:
            query = query.where(Grade.is_published == is_published)

        # Filter by class if provided
        if class_id:
            query = query.join(Student).where(Student.current_class_id == class_id)

        query = query.order_by(desc(Grade.graded_date)).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_grade_by_id(
        db: AsyncSession,
        grade_id: str,
        school_id: str
    ) -> Optional[Grade]:
        """Get grade by ID"""
        result = await db.execute(
            select(Grade).options(
                selectinload(Grade.student),
                selectinload(Grade.subject),
                selectinload(Grade.exam),
                selectinload(Grade.term),
                selectinload(Grade.grader)
            ).where(
                Grade.id == grade_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_grade(
        db: AsyncSession,
        grade_id: str,
        grade_data: GradeUpdate,
        school_id: str
    ) -> Optional[Grade]:
        """Update grade"""
        grade = await GradeService.get_grade_by_id(db, grade_id, school_id)
        if not grade:
            return None

        # Update fields
        update_data = grade_data.dict(exclude_unset=True)

        # Recalculate percentage and letter grade if score is updated
        if 'score' in update_data:
            percentage = (update_data['score'] / grade.total_marks) * 100
            update_data['percentage'] = percentage
            update_data['grade'] = GradeService.calculate_grade(percentage)

        for field, value in update_data.items():
            setattr(grade, field, value)

        await db.commit()
        await db.refresh(grade)

        return grade

    @staticmethod
    async def delete_grade(
        db: AsyncSession,
        grade_id: str,
        school_id: str
    ) -> bool:
        """Soft delete grade"""
        grade = await GradeService.get_grade_by_id(db, grade_id, school_id)
        if not grade:
            return False

        grade.is_deleted = True
        await db.commit()

        return True

    @staticmethod
    async def consolidate_grades_by_subject(
        db: AsyncSession,
        grades: List[Grade],
        term_id: str,
        school_id: str,
        grade_template_id: Optional[str] = None
    ) -> List[dict]:
        """
        Consolidate multiple exam grades for the same subject using component mappings.
        Only includes subjects where exams map to grade template components.
        
        Args:
            db: Database session
            grades: List of Grade objects to consolidate
            term_id: Term ID for looking up component mappings
            school_id: School ID
            grade_template_id: Optional grade template ID to get components
            
        Returns:
            List of dictionaries with consolidated grade data, one per subject
        """
        from app.models.component_mapping import ComponentMapping
        from app.models.grade_template import AssessmentComponent
        
        # Get grade template components if template is specified
        component_name_map = {}  # Maps component_id -> component_name (e.g., "First C.A")
        if grade_template_id:
            components_result = await db.execute(
                select(AssessmentComponent).where(
                    AssessmentComponent.template_id == grade_template_id,
                    AssessmentComponent.school_id == school_id,
                    AssessmentComponent.is_deleted == False
                )
            )
            components = list(components_result.scalars().all())
            component_name_map = {c.id: c.name for c in components}
        
        # Group grades by subject
        subject_grades_map = {}
        for grade in grades:
            subject_id = grade.subject_id
            if subject_id not in subject_grades_map:
                subject_grades_map[subject_id] = []
            subject_grades_map[subject_id].append(grade)
        
        # Consolidate each subject's grades
        # Optimization: Fetch all component mappings for all subjects at once
        subject_ids = list(subject_grades_map.keys())
        
        all_mappings_result = await db.execute(
            select(ComponentMapping).options(
                selectinload(ComponentMapping.component).selectinload(AssessmentComponent.template)
            ).where(
                ComponentMapping.subject_id.in_(subject_ids),
                ComponentMapping.term_id == term_id,
                ComponentMapping.school_id == school_id,
                ComponentMapping.is_deleted == False,
                ComponentMapping.include_in_calculation == True
            )
        )
        all_mappings = list(all_mappings_result.scalars().all())
        
        # Group mappings by subject_id
        mappings_by_subject = {}
        for mapping in all_mappings:
            if mapping.subject_id not in mappings_by_subject:
                mappings_by_subject[mapping.subject_id] = []
            mappings_by_subject[mapping.subject_id].append(mapping)

        consolidated_grades = []
        for subject_id, subject_grades in subject_grades_map.items():
            if not subject_grades:
                continue
            
            # Get mappings from memory
            mappings = mappings_by_subject.get(subject_id, [])
            
            # Build a map: exam_type -> component_name
            exam_type_to_component = {}
            for mapping in mappings:
                if mapping.component:
                    exam_type_to_component[mapping.exam_type_name] = mapping.component.name
                
            # Build a map: component_name -> component object (for weights)
            component_map = {}
            for mapping in mappings:
                if mapping.component:
                    component_map[mapping.component.name] = mapping.component
            
            # Group exams by component and sum their scores
            component_raw_scores = {}  # component_name -> {score: X, total: Y}
            component_raw_totals = {}
            has_mapped_components = False
            
            for grade in subject_grades:
                if grade.exam:
                    # Get the enum value (e.g., "continuous_assessment")
                    exam_type = grade.exam.exam_type.value if hasattr(grade.exam.exam_type, 'value') else str(grade.exam.exam_type)
                    # Look up the component name for this exam type
                    component_name = exam_type_to_component.get(exam_type)
                    if component_name:
                        # Add this exam's score to the component's total
                        if component_name not in component_raw_scores:
                            component_raw_scores[component_name] = 0.0
                            component_raw_totals[component_name] = 0.0
                        component_raw_scores[component_name] += float(grade.score)
                        component_raw_totals[component_name] += float(grade.total_marks)
                        has_mapped_components = True
            
            # Only include this subject if it has mapped components
            if not has_mapped_components:
                continue
            
            # Scale each component to its weight
            # Get the total marks from grade template (e.g., 100)
            template_total_marks = 100.0  # Default
            if mappings and mappings[0].component and mappings[0].component.template:
                template_total_marks = float(mappings[0].component.template.total_marks)
            
            component_scores = {}
            total_score = 0.0
            total_marks = 0.0
            
            for component_name, raw_score in component_raw_scores.items():
                component = component_map.get(component_name)
                if component:
                    # Component weight is a percentage (e.g., 20.00 for 20%)
                    component_weight = float(component.weight)
                    # Calculate the maximum marks for this component
                    component_max_marks = (component_weight / 100.0) * template_total_marks
                    
                    # Get the raw total marks for this component
                    raw_total = component_raw_totals[component_name]
                    
                    # Scale the raw score to fit the component max
                    if raw_total > 0:
                        scaled_score = (raw_score / raw_total) * component_max_marks
                    else:
                        scaled_score = 0.0
                    
                    component_scores[component_name] = round(scaled_score, 2)
                    total_score += scaled_score
                    total_marks += component_max_marks
            
            # Calculate consolidated percentage and grade
            if total_marks > 0:
                percentage = (total_score / total_marks) * 100
                letter_grade = GradeService.calculate_grade(float(percentage))
            else:
                percentage = 0
                letter_grade = GradeScale.F
            
            # Use the first grade as reference for other fields
            reference_grade = subject_grades[0]
            
            # Create consolidated data dictionary
            consolidated = {
                'id': reference_grade.id,
                'score': total_score,
                'total_marks': total_marks,
                'percentage': percentage,
                'grade': letter_grade,
                'student_id': reference_grade.student_id,
                'subject_id': reference_grade.subject_id,
                'exam_id': reference_grade.exam_id,
                'term_id': reference_grade.term_id,
                'graded_by': reference_grade.graded_by,
                'graded_date': reference_grade.graded_date,
                'remarks': reference_grade.remarks,
                'is_published': reference_grade.is_published,
                'component_scores': component_scores,
                'created_at': reference_grade.created_at,
                'updated_at': reference_grade.updated_at,
                # Store references to relationship objects
                'grader': reference_grade.grader,
                'student': reference_grade.student,
                'subject': reference_grade.subject,
                'exam': reference_grade.exam
            }
            
            consolidated_grades.append(consolidated)
        
        return consolidated_grades

    @staticmethod
    async def get_student_grades_summary(
        db: AsyncSession,
        student_id: str,
        term_id: str,
        school_id: str,
        allowed_subject_ids: Optional[List[str]] = None
    ) -> Optional[StudentGradesSummary]:
        """Get comprehensive grade summary for a student in a term"""
        # Verify student exists
        student_result = await db.execute(
            select(Student).options(
                selectinload(Student.current_class)
            ).where(
                Student.id == student_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        student = student_result.scalar_one_or_none()
        if not student:
            return None

        # Get term
        term_result = await db.execute(
            select(Term).where(
                Term.id == term_id,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        term = term_result.scalar_one_or_none()
        if not term:
            return None

        # Get all grades for the student in this term (including unpublished for summary)
        # Filter by allowed_subject_ids for teachers
        grade_conditions = [
            Grade.student_id == student_id,
            Grade.term_id == term_id,
            Grade.school_id == school_id,
            Grade.is_deleted == False
        ]
        
        if allowed_subject_ids is not None:
            grade_conditions.append(Grade.subject_id.in_(allowed_subject_ids))
        
        grades_result = await db.execute(
            select(Grade).options(
                selectinload(Grade.subject),
                selectinload(Grade.exam),
                selectinload(Grade.grader),
                selectinload(Grade.student)
            ).where(and_(*grade_conditions))
        )
        grades = list(grades_result.scalars().all())

        # Repair grades with missing percentages
        grades_to_repair = []
        for grade in grades:
            if grade.percentage is None or grade.percentage == 0:
                if grade.total_marks and grade.total_marks > 0:
                    grade.percentage = (grade.score / grade.total_marks) * 100
                    grade.grade = GradeService.calculate_grade(grade.percentage)
                    grades_to_repair.append(grade)
        
        # Commit repairs if any
        if grades_to_repair:
            await db.commit()
        
        # **CONSOLIDATE GRADES BY SUBJECT** - Uses component mappings to map exam types
        # to grade template components (First C.A, Second C.A, Exam)
        # Only includes subjects with proper component mappings
        consolidated_grades = await GradeService.consolidate_grades_by_subject(
            db=db,
            grades=grades,
            term_id=term_id,
            school_id=school_id,
            grade_template_id=None  # TODO: Pass actual grade template ID if available
        )

        # Get enrolled subjects count (filter by allowed_subject_ids for teachers)
        enrollment_conditions = [
            Enrollment.student_id == student_id,
            Enrollment.term_id == term_id,
            Enrollment.school_id == school_id,
            Enrollment.is_deleted == False
        ]
        
        if allowed_subject_ids is not None:
            enrollment_conditions.append(Enrollment.subject_id.in_(allowed_subject_ids))
        
        enrolled_subjects_result = await db.execute(
            select(func.count(Enrollment.id.distinct())).where(and_(*enrollment_conditions))
        )
        total_subjects = enrolled_subjects_result.scalar() or 0

        # Calculate totals using CONSOLIDATED grades (which are dictionaries)
        total_score = sum(grade['score'] for grade in consolidated_grades)
        total_possible = sum(grade['total_marks'] for grade in consolidated_grades)

        overall_percentage = (total_score / total_possible * 100) if total_possible > 0 else 0
        overall_grade = GradeService.calculate_grade(overall_percentage)

        # Calculate position - get all students in the same class and term
        position = 1
        if student.current_class_id and grades:
            # Get all students in the same class
            class_students_result = await db.execute(
                select(Student.id).where(
                    Student.current_class_id == student.current_class_id,
                    Student.school_id == school_id,
                    Student.is_deleted == False
                )
            )
            class_student_ids = [row[0] for row in class_students_result.fetchall()]
            
            # Calculate average percentage for each student in this term
            # Filter by allowed_subject_ids for fair comparison
            student_averages = []
            for class_student_id in class_student_ids:
                position_grade_conditions = [
                    Grade.student_id == class_student_id,
                    Grade.term_id == term_id,
                    Grade.school_id == school_id,
                    Grade.is_deleted == False
                ]
                
                if allowed_subject_ids is not None:
                    position_grade_conditions.append(Grade.subject_id.in_(allowed_subject_ids))
                
                student_grades_result = await db.execute(
                    select(
                        func.sum(Grade.score).label('total_score'),
                        func.sum(Grade.total_marks).label('total_possible')
                    ).where(and_(*position_grade_conditions))
                )
                result = student_grades_result.first()
                if result and result.total_possible and result.total_possible > 0:
                    avg_percentage = (result.total_score / result.total_possible) * 100
                    student_averages.append((class_student_id, avg_percentage))
            
            # Sort by percentage (descending) and find position
            student_averages.sort(key=lambda x: x[1], reverse=True)
            for i, (sid, _) in enumerate(student_averages):
                if sid == student_id:
                    position = i + 1
                    break

        # Convert CONSOLIDATED grade dictionaries to GradeResponse objects
        # Consolidated grades are dictionaries, not ORM objects
        grade_responses = []
        for grade_data in consolidated_grades:
            # Construct GradeResponse from dictionary data
            grade_response = GradeResponse(
                id=grade_data['id'],
                score=float(grade_data['score']),
                total_marks=float(grade_data['total_marks']),
                percentage=float(grade_data['percentage']),
                grade=grade_data['grade'],
                student_id=grade_data['student_id'],
                subject_id=grade_data['subject_id'],
                exam_id=grade_data['exam_id'],
                term_id=grade_data['term_id'],
                graded_by=grade_data['graded_by'],
                graded_date=grade_data['graded_date'],
                remarks=grade_data['remarks'],
                is_published=grade_data['is_published'],
                component_scores=grade_data['component_scores'],
                created_at=grade_data['created_at'],
                updated_at=grade_data['updated_at'],
                # Populate relationship fields from stored references
                grader_name=grade_data['grader'].full_name if grade_data.get('grader') else None,
                student_name=grade_data['student'].full_name if grade_data.get('student') else None,
                subject_name=grade_data['subject'].name if grade_data.get('subject') else None,
                exam_name=grade_data['exam'].name if grade_data.get('exam') else None,
                exam_type=grade_data['exam'].exam_type if grade_data.get('exam') else None
            )
            grade_responses.append(grade_response)

        # Group grades by subject and calculate subject-level summaries
        from app.schemas.grade import SubjectGradeSummary
        subject_map = {}
        for grade in grades:
            subject_id = grade.subject_id
            if subject_id not in subject_map:
                subject_map[subject_id] = {
                    'subject_id': subject_id,
                    'subject_name': grade.subject.name if grade.subject else 'Unknown',
                    'grades': []
                }
            subject_map[subject_id]['grades'].append(grade)

        # Calculate subject summaries with positions
        subject_summaries = []
        for subject_id, subject_data in subject_map.items():
            subject_grades = subject_data['grades']
            subject_total_score = sum(g.score for g in subject_grades)
            subject_total_marks = sum(g.total_marks for g in subject_grades)
            subject_avg_percentage = (subject_total_score / subject_total_marks * 100) if subject_total_marks > 0 else 0
            subject_grade = GradeService.calculate_grade(subject_avg_percentage)

            # Calculate position for this subject among classmates
            subject_position = None
            subject_total_students = None
            if student.current_class_id:
                # Get all students in the same class
                class_students_result = await db.execute(
                    select(Student.id).where(
                        Student.current_class_id == student.current_class_id,
                        Student.school_id == school_id,
                        Student.is_deleted == False
                    )
                )
                class_student_ids = [row[0] for row in class_students_result.fetchall()]
                subject_total_students = len(class_student_ids)

                # Calculate average for each student in this subject
                # Only calculate if this subject is in allowed subjects (or no filter)
                student_subject_averages = []
                for class_student_id in class_student_ids:
                    subject_position_conditions = [
                        Grade.student_id == class_student_id,
                        Grade.subject_id == subject_id,
                        Grade.term_id == term_id,
                        Grade.school_id == school_id,
                        Grade.is_deleted == False
                    ]
                    
                    # Note: No need to filter by allowed_subject_ids here since we're already
                    # looking at a specific subject_id that came from the filtered grades
                    
                    student_subject_grades_result = await db.execute(
                        select(
                            func.sum(Grade.score).label('total_score'),
                            func.sum(Grade.total_marks).label('total_possible')
                        ).where(and_(*subject_position_conditions))
                    )
                    result = student_subject_grades_result.first()
                    if result and result.total_possible and result.total_possible > 0:
                        avg_percentage = (result.total_score / result.total_possible) * 100
                        student_subject_averages.append((class_student_id, avg_percentage))

                # Sort by percentage (descending) and find position
                student_subject_averages.sort(key=lambda x: x[1], reverse=True)
                for i, (sid, _) in enumerate(student_subject_averages):
                    if sid == student_id:
                        subject_position = i + 1
                        break

            # Convert subject grades to GradeResponse
            subject_grade_responses = []
            for grade in subject_grades:
                grade_response = GradeResponse.from_orm(grade)
                grade_response.score = float(grade.score)
                grade_response.total_marks = float(grade.total_marks)
                grade_response.percentage = float(grade.percentage) if grade.percentage else 0.0
                if grade.subject:
                    grade_response.subject_name = grade.subject.name
                if grade.exam:
                    grade_response.exam_name = grade.exam.name
                    grade_response.exam_type = grade.exam.exam_type
                subject_grade_responses.append(grade_response)

            subject_summaries.append(SubjectGradeSummary(
                subject_id=subject_id,
                subject_name=subject_data['subject_name'],
                grades=subject_grade_responses,
                average_score=float(subject_total_score),
                average_percentage=float(subject_avg_percentage),
                grade=subject_grade, position=subject_position,
                total_students=subject_total_students
            ))

        # Get total students in class for overall position context
        total_students_in_class = None
        if student.current_class_id:
            total_students_result = await db.execute(
                select(func.count(Student.id)).where(
                    Student.current_class_id == student.current_class_id,
                    Student.school_id == school_id,
                    Student.is_deleted == False
                )
            )
            total_students_in_class = total_students_result.scalar() or 0

        return StudentGradesSummary(
            student_id=student_id,
            student_name=student.full_name,
            class_id=student.current_class_id,
            class_name=student.current_class.name if student.current_class else "",
            term_id=term_id,
            term_name=term.name,
            total_subjects=total_subjects,
            graded_subjects=len(consolidated_grades),  # Number of subjects with grades
            total_score=float(total_score),
            total_possible=float(total_possible),
            overall_percentage=float(overall_percentage),
            overall_grade=overall_grade,
            position=position,
            total_students=total_students_in_class,
            grades=grade_responses,
            subject_summaries=subject_summaries
        )

    @staticmethod
    async def get_class_grades_summary(
        db: AsyncSession,
        class_id: str,
        exam_id: str,
        school_id: str
    ) -> Optional[ClassGradesSummary]:
        """Get grade summary for a class in a specific exam"""
        # Verify class and exam exist
        class_result = await db.execute(
            select(Class).where(
                Class.id == class_id,
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        class_obj = class_result.scalar_one_or_none()
        if not class_obj:
            return None

        exam_result = await db.execute(
            select(Exam).options(
                selectinload(Exam.subject),
                selectinload(Exam.term)
            ).where(
                Exam.id == exam_id,
                Exam.school_id == school_id,
                Exam.is_deleted == False
            )
        )
        exam = exam_result.scalar_one_or_none()
        if not exam:
            return None

        # Get all grades for this exam and class
        grades_result = await db.execute(
            select(Grade).options(
                selectinload(Grade.student)
            ).join(Student).where(
                Grade.exam_id == exam_id,
                Student.current_class_id == class_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            )
        )
        grades = list(grades_result.scalars().all())

        # Get total students in class
        total_students_result = await db.execute(
            select(func.count(Student.id)).where(
                Student.current_class_id == class_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        total_students = total_students_result.scalar() or 0

        # Calculate statistics
        scores = [grade.score for grade in grades]
        highest_score = max(scores) if scores else None
        lowest_score = min(scores) if scores else None
        average_score = sum(scores) / len(scores) if scores else None

        # Calculate pass rate
        pass_rate = None
        if grades:
            passed = sum(1 for grade in grades if grade.score >= exam.pass_marks)
            pass_rate = (passed / len(grades)) * 100

        return ClassGradesSummary(
            class_id=class_id,
            class_name=class_obj.name,
            term_id=exam.term_id,
            term_name=exam.term.name,
            exam_id=exam_id,
            exam_name=exam.name,
            subject_id=exam.subject_id,
            subject_name=exam.subject.name,
            total_students=total_students,
            graded_students=len(grades),
            highest_score=highest_score,
            lowest_score=lowest_score,
            average_score=average_score,
            pass_rate=pass_rate,
            grades=grades
        )

    # Report Card Management
    @staticmethod
    async def create_report_card(
        db: AsyncSession,
        report_data: ReportCardCreate,
        school_id: str,
        generated_by: str
    ) -> ReportCard:
        """Create a report card for a student"""
        # Get student grades summary first
        summary = await GradeService.get_student_grades_summary(
            db, report_data.student_id, report_data.term_id, school_id
        )
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student or term not found"
            )

        # Check if report card already exists
        existing_report = await db.execute(
            select(ReportCard).where(
                ReportCard.student_id == report_data.student_id,
                ReportCard.term_id == report_data.term_id,
                ReportCard.school_id == school_id,
                ReportCard.is_deleted == False
            )
        )
        if existing_report.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report card already exists for this student and term"
            )

        # Calculate position among classmates
        class_students_result = await db.execute(
            select(Student.id).where(
                Student.current_class_id == report_data.class_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        class_student_ids = [row[0] for row in class_students_result.fetchall()]

        # This is a simplified position calculation
        # In a real system, you'd calculate based on overall performance
        position = 1
        total_students = len(class_student_ids)

        # Check if template is specified and get template assignment
        template_id = getattr(report_data, 'template_id', None)
        if not template_id:
            # Try to get assigned template for the class
            from app.services.report_card_template_service import ReportCardTemplateAssignmentService
            assignments = await ReportCardTemplateAssignmentService.get_assignments(
                db, school_id, class_id=report_data.class_id, is_active=True
            )
            if assignments:
                template_id = assignments[0].template_id

        # Create report card
        report_dict = report_data.dict(exclude={'template_id'})
        report_dict.update({
            'school_id': school_id,
            'generated_by': generated_by,
            'generated_date': date.today(),
            'total_score': summary.total_score,
            'average_score': summary.overall_percentage,
            'total_subjects': summary.total_subjects,
            'position': position,
            'total_students': total_students,
            'term_name': summary.term_name,  # Use the term name from summary
            'academic_session': '2024/2025',  # This should be dynamic
            'total_school_days': 180,  # This should be calculated from attendance
            'days_present': 160,  # This should be calculated from attendance
            'days_absent': 20   # This should be calculated from attendance
        })
        
        # Add template reference if available
        if template_id:
            report_dict['additional_data'] = {
                'template_id': template_id,
                'generated_with_template': True
            }

        report_card = ReportCard(**report_dict)
        db.add(report_card)
        await db.commit()
        await db.refresh(report_card)

        # Notify Student
        if summary.student_id:
             # Get user_id for the student
            student_res = await db.execute(select(Student.user_id).where(Student.id == summary.student_id))
            user_id = student_res.scalar_one_or_none()
            
            if user_id:
                await NotificationService.create_notification(
                    db=db,
                    school_id=school_id,
                    notification_data=NotificationCreate(
                        user_id=user_id,
                        title="Report Card Generated",
                        message=f"Your report card for {summary.term_name} has been generated.",
                        type=NotificationType.INFO,
                        link=f"/academics/reports/{report_card.id}"
                    )
                )

        return report_card

    @staticmethod
    async def get_grade_statistics(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None,
        class_id: Optional[str] = None,
        allowed_subject_ids: Optional[List[str]] = None
    ) -> GradeStatistics:
        """Get comprehensive grade statistics"""
        # Base query conditions
        exam_conditions = [Exam.school_id == school_id, Exam.is_deleted == False]
        grade_conditions = [Grade.school_id == school_id, Grade.is_deleted == False]

        if term_id:
            exam_conditions.append(Exam.term_id == term_id)
            grade_conditions.append(Grade.term_id == term_id)

        if class_id:
            exam_conditions.append(Exam.class_id == class_id)
            grade_conditions.append(Grade.student_id.in_(
                select(Student.id).where(
                    Student.current_class_id == class_id,  # Changed from class_id to current_class_id
                    Student.school_id == school_id,
                    Student.is_deleted == False
                )
            ))
        
        # Filter by allowed subjects for teachers
        if allowed_subject_ids is not None:
            exam_conditions.append(Exam.subject_id.in_(allowed_subject_ids))
            grade_conditions.append(Grade.subject_id.in_(allowed_subject_ids))

        # Get exam counts
        total_exams_result = await db.execute(
            select(func.count(Exam.id)).where(and_(*exam_conditions))
        )
        total_exams = total_exams_result.scalar() or 0

        published_exams_result = await db.execute(
            select(func.count(Exam.id)).where(
                and_(*exam_conditions, Exam.is_published == True)
            )
        )
        published_exams = published_exams_result.scalar() or 0

        # Get grade counts
        total_grades_result = await db.execute(
            select(func.count(Grade.id)).where(and_(*grade_conditions))
        )
        total_grades = total_grades_result.scalar() or 0

        published_grades_result = await db.execute(
            select(func.count(Grade.id)).where(
                and_(*grade_conditions, Grade.is_published == True)
            )
        )
        published_grades = published_grades_result.scalar() or 0

        # Calculate average performance - include ALL grades for statistics, not just published ones
        # First try with published grades
        published_grade_conditions = grade_conditions + [Grade.is_published == True, Grade.percentage.isnot(None)]
        avg_performance_result = await db.execute(
            select(func.avg(Grade.percentage)).where(and_(*published_grade_conditions))
        )
        average_class_performance = avg_performance_result.scalar()
        
        # If no published grades with percentage, try with ALL grades (for statistics purposes)
        if average_class_performance is None:
            all_grade_conditions = grade_conditions + [Grade.percentage.isnot(None)]
            avg_performance_result = await db.execute(
                select(func.avg(Grade.percentage)).where(and_(*all_grade_conditions))
            )
            average_class_performance = avg_performance_result.scalar()
        
        # If still None, try calculating from score and total_marks (all grades)
        if average_class_performance is None:
            # Try to calculate average from score/total_marks for all grades
            score_avg_result = await db.execute(
                select(func.avg((Grade.score / Grade.total_marks) * 100)).where(
                    and_(*grade_conditions, Grade.total_marks > 0)
                )
            )
            calculated_avg = score_avg_result.scalar()
            average_class_performance = calculated_avg
            
            # If still None, check if there are any grades at all and try to repair them
            if average_class_performance is None:
                # Debug query to check for any grades
                debug_result = await db.execute(
                    select(func.count(Grade.id), func.count(Grade.percentage)).where(
                        and_(*grade_conditions)
                    )
                )
                debug_count, debug_percentage_count = debug_result.first() or (0, 0)
                
                # If there are grades but no percentage, try to update them
                if debug_count > 0 and debug_percentage_count == 0:
                    # Get grades without percentage and update them
                    grades_to_update = await db.execute(
                        select(Grade).where(
                            and_(*grade_conditions, Grade.percentage.is_(None))
                        )
                    )
                    grades_list = grades_to_update.scalars().all()
                    
                    for grade in grades_list:
                        if grade.total_marks > 0:
                            grade.percentage = (grade.score / grade.total_marks) * 100
                            grade.grade = GradeService.calculate_grade(grade.percentage)
                    
                    if grades_list:
                        await db.commit()
                        # Retry the average calculation with all grades
                        avg_performance_result = await db.execute(
                            select(func.avg(Grade.percentage)).where(and_(*all_grade_conditions))
                        )
                        average_class_performance = avg_performance_result.scalar()

        # Get grade distribution - include ALL grades for statistics, not just published ones
        grade_dist_result = await db.execute(
            select(Grade.grade, func.count(Grade.id)).where(
                and_(*grade_conditions, Grade.grade.isnot(None))
            ).group_by(Grade.grade)
        )
        grade_distribution = {}
        for grade_enum, count in grade_dist_result.fetchall():
            # Extract the grade letter from the enum (e.g., "GradeScale.B" -> "B")
            if grade_enum:
                grade_value = str(grade_enum).split('.')[-1] if '.' in str(grade_enum) else str(grade_enum)
                grade_distribution[grade_value] = count

        # Get subject performance data
        subjects_performance = []
        
        # Get distinct subjects that have grades
        subject_performance_result = await db.execute(
            select(
                Grade.subject_id,
                func.count(Grade.id).label('total_grades'),
                func.avg(Grade.percentage).label('average_score'),
                func.sum(case((Grade.percentage >= 50, 1), else_=0)).label('passed_grades')
            ).where(
                and_(*grade_conditions, Grade.percentage.isnot(None))
            ).group_by(Grade.subject_id)
        )
        
        # Get subject names
        subject_data = subject_performance_result.fetchall()
        for subject_id, total_grades, avg_score, passed_grades in subject_data:
            # Get subject name
            subject_name_result = await db.execute(
                select(Subject.name).where(
                    Subject.id == subject_id,
                    Subject.school_id == school_id,
                    Subject.is_deleted == False
                )
            )
            subject_name = subject_name_result.scalar()
            
            if subject_name:
                pass_rate = (passed_grades / total_grades * 100) if total_grades > 0 else 0
                subjects_performance.append({
                    'subject_id': subject_id,
                    'subject_name': subject_name,
                    'average_score': float(avg_score) if avg_score else 0,
                    'total_students': total_grades,  # This represents total grades, not unique students
                    'pass_rate': float(pass_rate)
                })

        # Convert Decimal to float for JSON serialization
        avg_performance_float = None
        if average_class_performance is not None:
            avg_performance_float = float(average_class_performance)

        return GradeStatistics(
            total_exams=total_exams,
            published_exams=published_exams,
            total_grades=total_grades,
            published_grades=published_grades,
            average_class_performance=avg_performance_float,
            subjects_assessed=len(subjects_performance),
            subjects_performance=subjects_performance,
            grade_distribution=grade_distribution
        )

    @staticmethod
    async def get_class_summary_sheet(
        db: AsyncSession,
        class_id: str,
        term_id: str,
        school_id: str
    ) -> dict:
        """
        Generate comprehensive grades summary sheet for a class.
        Shows all students with their consolidated scores per subject, total, and position.
        
        Args:
            db: Database session
            class_id: Class ID
            term_id: Term ID
            school_id: School ID
            
        Returns:
            Dictionary with class info, subjects, students with scores, totals, and positions
        """
        from app.models.student import Student, StudentStatus
        
        # Get class info
        class_result = await db.execute(
            select(Class).where(
                Class.id == class_id,
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
        
        # Get term info
        term_result = await db.execute(
            select(Term).where(
                Term.id == term_id,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        term = term_result.scalar_one_or_none()
        if not term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Term not found"
            )
        
        # Get students in the class
        students_result = await db.execute(
            select(Student).where(
                Student.current_class_id == class_id,
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            ).order_by(Student.last_name, Student.first_name)
        )
        students = list(students_result.scalars().all())
        
        if not students:
            return {
                "class_id": class_id,
                "class_name": class_obj.name,
                "term_id": term_id,
                "term_name": term.name,
                "academic_session": term.academic_session,
                "subjects": [],
                "students": [],
                "total_students": 0,
                "generated_at": datetime.utcnow()
            }
        
        # Get all grades for these students in this term
        student_ids = [s.id for s in students]
        grades_result = await db.execute(
            select(Grade).options(
                selectinload(Grade.exam),
                selectinload(Grade.subject)
            ).where(
                Grade.student_id.in_(student_ids),
                Grade.term_id == term_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            )
        )
        all_grades = list(grades_result.scalars().all())
        
        # Get unique subjects from the grades (subjects that actually have grades)
        subject_map = {}  # subject_id (str) -> subject info
        for grade in all_grades:
            if grade.subject_id and grade.subject:
                sid = str(grade.subject_id)
                if sid not in subject_map:
                    subject_map[sid] = {
                        "id": sid,
                        "name": grade.subject.name,
                        "code": grade.subject.code or ""
                    }
        
        # Sort subjects by name
        subjects = sorted(subject_map.values(), key=lambda x: x["name"])
        subject_ids = [s["id"] for s in subjects]
        
        # Group grades by student and subject, consolidate to get total score per subject
        # Sum all grade scores for each subject (across multiple exams)
        student_subject_scores = {}  # {student_id (str): {subject_id (str): consolidated_score}}
        
        for grade in all_grades:
            student_id = str(grade.student_id)
            subject_id = str(grade.subject_id)
            
            if student_id not in student_subject_scores:
                student_subject_scores[student_id] = {}
            
            # Sum scores from different exams for the same subject
            current_score = student_subject_scores[student_id].get(subject_id, 0.0)
            student_subject_scores[student_id][subject_id] = current_score + float(grade.score)
        
        # Build student rows with scores and calculate totals
        student_rows = []
        for student in students:
            subject_scores = {}
            total_score = 0.0
            student_id_str = str(student.id)
            
            for subject_id in subject_ids:
                score = student_subject_scores.get(student_id_str, {}).get(subject_id)
                subject_scores[subject_id] = score
                if score is not None:
                    total_score += score
            
            student_name = f"{student.last_name} {student.first_name}"
            if student.middle_name:
                student_name = f"{student.last_name} {student.first_name} {student.middle_name}"
            
            student_rows.append({
                "student_id": student.id,
                "student_name": student_name.upper(),
                "admission_number": student.admission_number,
                "subject_scores": subject_scores,
                "total_score": round(total_score, 2),
                "position": 0  # Will be calculated below
            })
        
        # Sort by total score descending and assign positions (with ties sharing positions)
        student_rows.sort(key=lambda x: x["total_score"], reverse=True)
        
        current_position = 1
        for i, row in enumerate(student_rows):
            if i > 0 and row["total_score"] < student_rows[i-1]["total_score"]:
                current_position = i + 1
            row["position"] = current_position
        
        return {
            "class_id": class_id,
            "class_name": class_obj.name,
            "term_id": term_id,
            "term_name": term.name,
            "academic_session": term.academic_session,
            "subjects": subjects,
            "students": student_rows,
            "total_students": len(student_rows),
            "generated_at": datetime.utcnow()
        }

