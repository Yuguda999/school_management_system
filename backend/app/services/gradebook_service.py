"""
Gradebook Service for Unified Assessment & Gradebook Automation (P2.2)
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.models.grade import Grade, Exam, ExamType
from app.models.grade_template import GradeTemplate, AssessmentComponent, GradeScale
from app.models.component_mapping import ComponentMapping
from app.models.student import Student, StudentStatus
from app.models.academic import Subject, Class, Term
from app.models.cbt import CBTTest, CBTSubmission
import logging
import uuid

logger = logging.getLogger(__name__)


class GradebookService:
    """Service for unified gradebook management and automation"""

    @staticmethod
    async def get_gradebook_view(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        subject_id: str,
        term_id: str,
        teacher_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get unified gradebook view with all assessments and CBT scores"""
        
        # Get students in the class
        students_result = await db.execute(
            select(Student).where(
                Student.school_id == school_id,
                Student.current_class_id == class_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            ).order_by(Student.last_name, Student.first_name)
        )
        students = students_result.scalars().all()
        
        # Get grade template for the school
        template_result = await db.execute(
            select(GradeTemplate).where(
                GradeTemplate.school_id == school_id,
                GradeTemplate.is_default == True,
                GradeTemplate.is_deleted == False
            ).options(
                selectinload(GradeTemplate.assessment_components),
                selectinload(GradeTemplate.grade_scales)
            )
        )
        template = template_result.scalar_one_or_none()
        
        # Get component mappings for this teacher/subject/term
        mappings = []
        if teacher_id:
            mappings_result = await db.execute(
                select(ComponentMapping).where(
                    ComponentMapping.school_id == school_id,
                    ComponentMapping.teacher_id == teacher_id,
                    ComponentMapping.subject_id == subject_id,
                    ComponentMapping.term_id == term_id,
                    ComponentMapping.is_deleted == False
                ).options(selectinload(ComponentMapping.component))
            )
            mappings = mappings_result.scalars().all()
        
        # Get all exams for this class/subject/term
        exams_result = await db.execute(
            select(Exam).where(
                Exam.school_id == school_id,
                Exam.class_id == class_id,
                Exam.subject_id == subject_id,
                Exam.term_id == term_id,
                Exam.is_deleted == False
            ).order_by(Exam.exam_date)
        )
        exams = exams_result.scalars().all()
        
        # Get CBT tests for this class/subject/term
        cbt_result = await db.execute(
            select(CBTTest).where(
                CBTTest.school_id == school_id,
                CBTTest.class_id == class_id,
                CBTTest.subject_id == subject_id,
                CBTTest.term_id == term_id,
                CBTTest.is_deleted == False
            ).order_by(CBTTest.created_at)
        )
        cbt_tests = cbt_result.scalars().all()
        
        # Build gradebook data
        gradebook = []
        for student in students:
            student_data = {
                "student_id": student.id,
                "student_name": student.full_name,
                "admission_number": student.admission_number,
                "assessments": [],
                "cbt_scores": [],
                "component_totals": {},
                "final_score": None,
                "final_grade": None
            }
            
            # Get grades for each exam
            for exam in exams:
                grade_result = await db.execute(
                    select(Grade).where(
                        Grade.student_id == student.id,
                        Grade.exam_id == exam.id,
                        Grade.is_deleted == False
                    )
                )
                grade = grade_result.scalar_one_or_none()
                
                student_data["assessments"].append({
                    "exam_id": exam.id,
                    "exam_name": exam.name,
                    "exam_type": exam.exam_type.value,
                    "exam_date": exam.exam_date.isoformat() if exam.exam_date else None,
                    "total_marks": float(exam.total_marks),
                    "score": float(grade.score) if grade else None,
                    "percentage": float(grade.percentage) if grade else None
                })
            
            # Get CBT submissions
            for cbt in cbt_tests:
                submission_result = await db.execute(
                    select(CBTSubmission).where(
                        CBTSubmission.student_id == student.id,
                        CBTSubmission.test_id == cbt.id,
                        CBTSubmission.is_deleted == False
                    )
                )
                submission = submission_result.scalar_one_or_none()
                
                student_data["cbt_scores"].append({
                    "test_id": cbt.id,
                    "test_title": cbt.title,
                    "total_marks": cbt.total_marks,
                    "score": submission.score if submission else None,
                    "percentage": (submission.score / cbt.total_marks * 100) if submission and cbt.total_marks else None
                })
            
            # Calculate component totals based on mappings
            if template and mappings:
                student_data["component_totals"] = await GradebookService._calculate_component_totals(
                    db, school_id, student.id, subject_id, term_id, template, mappings
                )
                
                # Calculate final score
                total_score = sum(student_data["component_totals"].values())
                student_data["final_score"] = round(total_score, 2)
                
                # Determine grade
                for scale in sorted(template.grade_scales, key=lambda x: x.min_score, reverse=True):
                    if total_score >= float(scale.min_score):
                        student_data["final_grade"] = scale.grade
                        break
            
            gradebook.append(student_data)

        return {
            "class_id": class_id,
            "subject_id": subject_id,
            "term_id": term_id,
            "template": {
                "id": template.id if template else None,
                "name": template.name if template else None,
                "components": [
                    {"id": c.id, "name": c.name, "weight": float(c.weight)}
                    for c in (template.assessment_components if template else [])
                ]
            } if template else None,
            "exams": [
                {"id": e.id, "name": e.name, "type": e.exam_type.value, "date": e.exam_date.isoformat()}
                for e in exams
            ],
            "cbt_tests": [
                {"id": t.id, "title": t.title, "total_marks": t.total_marks}
                for t in cbt_tests
            ],
            "students": gradebook
        }

    @staticmethod
    async def _calculate_component_totals(
        db: AsyncSession,
        school_id: str,
        student_id: str,
        subject_id: str,
        term_id: str,
        template: GradeTemplate,
        mappings: List[ComponentMapping]
    ) -> Dict[str, float]:
        """Calculate weighted component totals for a student"""
        component_totals = {}

        # Group mappings by component
        component_mappings = {}
        for mapping in mappings:
            if mapping.component_id not in component_mappings:
                component_mappings[mapping.component_id] = []
            component_mappings[mapping.component_id].append(mapping)

        for component in template.assessment_components:
            if component.id not in component_mappings:
                component_totals[component.name] = 0.0
                continue

            # Get all exam types mapped to this component
            exam_types = [m.exam_type_name for m in component_mappings[component.id] if m.include_in_calculation]

            if not exam_types:
                component_totals[component.name] = 0.0
                continue

            # Get grades for these exam types
            grades_result = await db.execute(
                select(Grade, Exam).join(
                    Exam, Grade.exam_id == Exam.id
                ).where(
                    Grade.student_id == student_id,
                    Grade.subject_id == subject_id,
                    Grade.term_id == term_id,
                    Grade.school_id == school_id,
                    Grade.is_deleted == False,
                    Exam.exam_type.in_([ExamType(et) for et in exam_types if et in [e.value for e in ExamType]])
                )
            )
            grades = grades_result.all()

            if grades:
                # Calculate average percentage for this component
                avg_percentage = sum(float(g.percentage) for g, _ in grades) / len(grades)
                # Apply component weight
                weighted_score = avg_percentage * float(component.weight) / 100
                component_totals[component.name] = round(weighted_score, 2)
            else:
                component_totals[component.name] = 0.0

        return component_totals

    @staticmethod
    async def auto_calculate_grades(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        subject_id: str,
        term_id: str,
        teacher_id: str
    ) -> Dict[str, Any]:
        """Auto-calculate and save consolidated grades for all students"""

        # Get gradebook view
        gradebook = await GradebookService.get_gradebook_view(
            db, school_id, class_id, subject_id, term_id, teacher_id
        )

        if not gradebook.get("template"):
            return {"error": "No grade template configured", "processed": 0}

        processed = 0
        errors = []

        for student_data in gradebook["students"]:
            if student_data["final_score"] is None:
                continue

            try:
                # Check if consolidated grade already exists
                existing = await db.execute(
                    select(Grade).where(
                        Grade.student_id == student_data["student_id"],
                        Grade.subject_id == subject_id,
                        Grade.term_id == term_id,
                        Grade.school_id == school_id,
                        Grade.is_deleted == False,
                        Grade.component_scores.isnot(None)  # Consolidated grades have component_scores
                    )
                )
                existing_grade = existing.scalar_one_or_none()

                if existing_grade:
                    # Update existing
                    existing_grade.score = Decimal(str(student_data["final_score"]))
                    existing_grade.percentage = Decimal(str(student_data["final_score"]))
                    existing_grade.component_scores = student_data["component_totals"]
                    existing_grade.graded_date = date.today()
                else:
                    # Create new consolidated grade
                    # First, get or create a "Consolidated" exam
                    exam_result = await db.execute(
                        select(Exam).where(
                            Exam.school_id == school_id,
                            Exam.class_id == class_id,
                            Exam.subject_id == subject_id,
                            Exam.term_id == term_id,
                            Exam.exam_type == ExamType.FINAL_EXAM,
                            Exam.name == "Consolidated Grade",
                            Exam.is_deleted == False
                        )
                    )
                    exam = exam_result.scalar_one_or_none()

                    if not exam:
                        exam = Exam(
                            id=str(uuid.uuid4()),
                            school_id=school_id,
                            class_id=class_id,
                            subject_id=subject_id,
                            term_id=term_id,
                            name="Consolidated Grade",
                            exam_type=ExamType.FINAL_EXAM,
                            exam_date=date.today(),
                            total_marks=Decimal("100"),
                            pass_marks=Decimal("40"),
                            created_by=teacher_id,
                            is_published=True
                        )
                        db.add(exam)
                        await db.flush()

                    new_grade = Grade(
                        id=str(uuid.uuid4()),
                        school_id=school_id,
                        student_id=student_data["student_id"],
                        subject_id=subject_id,
                        exam_id=exam.id,
                        term_id=term_id,
                        score=Decimal(str(student_data["final_score"])),
                        total_marks=Decimal("100"),
                        percentage=Decimal(str(student_data["final_score"])),
                        component_scores=student_data["component_totals"],
                        graded_by=teacher_id,
                        graded_date=date.today()
                    )
                    db.add(new_grade)

                processed += 1
            except Exception as e:
                errors.append({
                    "student_id": student_data["student_id"],
                    "error": str(e)
                })

        await db.commit()

        return {
            "processed": processed,
            "errors": errors,
            "total_students": len(gradebook["students"])
        }

    @staticmethod
    async def get_assessment_summary(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        subject_id: str,
        term_id: str
    ) -> Dict[str, Any]:
        """Get summary of all assessments for a class/subject/term"""

        # Count exams by type
        exam_counts = await db.execute(
            select(
                Exam.exam_type,
                func.count(Exam.id).label('count')
            ).where(
                Exam.school_id == school_id,
                Exam.class_id == class_id,
                Exam.subject_id == subject_id,
                Exam.term_id == term_id,
                Exam.is_deleted == False
            ).group_by(Exam.exam_type)
        )

        # Count CBT tests
        cbt_count = await db.execute(
            select(func.count(CBTTest.id)).where(
                CBTTest.school_id == school_id,
                CBTTest.class_id == class_id,
                CBTTest.subject_id == subject_id,
                CBTTest.term_id == term_id,
                CBTTest.is_deleted == False
            )
        )

        # Get grade statistics
        grade_stats = await db.execute(
            select(
                func.count(Grade.id).label('total_grades'),
                func.avg(Grade.percentage).label('avg_score'),
                func.min(Grade.percentage).label('min_score'),
                func.max(Grade.percentage).label('max_score')
            ).join(
                Exam, Grade.exam_id == Exam.id
            ).where(
                Grade.school_id == school_id,
                Exam.class_id == class_id,
                Grade.subject_id == subject_id,
                Grade.term_id == term_id,
                Grade.is_deleted == False
            )
        )
        stats = grade_stats.one()

        return {
            "exam_counts": {
                row.exam_type.value: row.count
                for row in exam_counts.all()
            },
            "cbt_count": cbt_count.scalar() or 0,
            "grade_statistics": {
                "total_grades": stats.total_grades or 0,
                "average_score": round(float(stats.avg_score), 2) if stats.avg_score else None,
                "min_score": round(float(stats.min_score), 2) if stats.min_score else None,
                "max_score": round(float(stats.max_score), 2) if stats.max_score else None
            }
        }

