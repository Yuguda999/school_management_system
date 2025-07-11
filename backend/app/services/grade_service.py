from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.orm import selectinload, joinedload
from fastapi import HTTPException, status
from decimal import Decimal
from datetime import date, datetime

from app.models.grade import Exam, Grade, ReportCard, ExamType, GradeScale
from app.models.academic import Class, Subject, Term, Enrollment
from app.models.student import Student
from app.models.user import User
from app.schemas.grade import (
    ExamCreate, ExamUpdate, GradeCreate, GradeUpdate, BulkGradeCreate,
    ReportCardCreate, ReportCardUpdate, StudentGradesSummary, ClassGradesSummary,
    GradeStatistics
)


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
        await db.refresh(exam)
        
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
        skip: int = 0,
        limit: int = 100
    ) -> List[Exam]:
        """Get exams with filtering"""
        query = select(Exam).options(
            selectinload(Exam.subject),
            selectinload(Exam.class_),
            selectinload(Exam.term),
            selectinload(Exam.creator)
        ).where(
            Exam.school_id == school_id,
            Exam.is_deleted == False
        )
        
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

        grade = Grade(**grade_dict)
        db.add(grade)
        await db.commit()
        await db.refresh(grade)

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
                # Create individual grade
                grade_create = GradeCreate(
                    score=grade_data['score'],
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
            query = query.join(Student).where(Student.class_id == class_id)

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
    async def get_student_grades_summary(
        db: AsyncSession,
        student_id: str,
        term_id: str,
        school_id: str
    ) -> Optional[StudentGradesSummary]:
        """Get comprehensive grade summary for a student in a term"""
        # Verify student exists
        student_result = await db.execute(
            select(Student).options(
                selectinload(Student.class_)
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

        # Get all grades for the student in this term
        grades_result = await db.execute(
            select(Grade).options(
                selectinload(Grade.subject),
                selectinload(Grade.exam)
            ).where(
                Grade.student_id == student_id,
                Grade.term_id == term_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False,
                Grade.is_published == True
            )
        )
        grades = list(grades_result.scalars().all())

        # Get enrolled subjects count
        enrolled_subjects_result = await db.execute(
            select(func.count(Enrollment.id.distinct())).where(
                Enrollment.student_id == student_id,
                Enrollment.term_id == term_id,
                Enrollment.school_id == school_id,
                Enrollment.is_deleted == False
            )
        )
        total_subjects = enrolled_subjects_result.scalar() or 0

        # Calculate totals
        total_score = sum(grade.score for grade in grades)
        total_possible = sum(grade.total_marks for grade in grades)
        overall_percentage = (total_score / total_possible * 100) if total_possible > 0 else 0
        overall_grade = GradeService.calculate_grade(overall_percentage)

        # Calculate position (simplified - could be enhanced)
        position = 1  # This would need more complex calculation

        return StudentGradesSummary(
            student_id=student_id,
            student_name=student.full_name,
            class_id=student.class_id,
            class_name=student.class_.name if student.class_ else "",
            term_id=term_id,
            term_name=term.name,
            total_subjects=total_subjects,
            graded_subjects=len(grades),
            total_score=total_score,
            total_possible=total_possible,
            overall_percentage=overall_percentage,
            overall_grade=overall_grade,
            position=position,
            grades=grades
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
                Student.class_id == class_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            )
        )
        grades = list(grades_result.scalars().all())

        # Get total students in class
        total_students_result = await db.execute(
            select(func.count(Student.id)).where(
                Student.class_id == class_id,
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
                Student.class_id == report_data.class_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        class_student_ids = [row[0] for row in class_students_result.fetchall()]

        # This is a simplified position calculation
        # In a real system, you'd calculate based on overall performance
        position = 1
        total_students = len(class_student_ids)

        # Create report card
        report_dict = report_data.dict()
        report_dict.update({
            'school_id': school_id,
            'generated_by': generated_by,
            'generated_date': date.today(),
            'overall_score': summary.total_score,
            'overall_percentage': summary.overall_percentage,
            'overall_grade': summary.overall_grade,
            'position': position,
            'total_students': total_students
        })

        report_card = ReportCard(**report_dict)
        db.add(report_card)
        await db.commit()
        await db.refresh(report_card)

        return report_card

    @staticmethod
    async def get_grade_statistics(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None,
        class_id: Optional[str] = None
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
                    Student.class_id == class_id,
                    Student.school_id == school_id,
                    Student.is_deleted == False
                )
            ))

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

        # Calculate average performance
        avg_performance_result = await db.execute(
            select(func.avg(Grade.percentage)).where(
                and_(*grade_conditions, Grade.is_published == True)
            )
        )
        average_class_performance = avg_performance_result.scalar()

        # Get grade distribution
        grade_dist_result = await db.execute(
            select(Grade.grade, func.count(Grade.id)).where(
                and_(*grade_conditions, Grade.is_published == True)
            ).group_by(Grade.grade)
        )
        grade_distribution = {
            str(grade): count for grade, count in grade_dist_result.fetchall()
        }

        # Get subject performance (simplified)
        subjects_performance = []  # This would need more complex calculation

        return GradeStatistics(
            total_exams=total_exams,
            published_exams=published_exams,
            total_grades=total_grades,
            published_grades=published_grades,
            average_class_performance=average_class_performance,
            subjects_performance=subjects_performance,
            grade_distribution=grade_distribution
        )
