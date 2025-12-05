"""
Curriculum Service for Curriculum Coverage & Lesson Plan Tracker (P2.3)
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.models.curriculum import CurriculumUnit, LessonPlanItem, CoverageStatus
from app.models.academic import Subject, Class, Term
from app.schemas.curriculum import (
    CurriculumUnitCreate, CurriculumUnitUpdate, CurriculumUnitResponse,
    LessonPlanItemCreate, LessonPlanItemUpdate, LessonPlanItemResponse,
    CoverageStats, SubjectCoverage, CurriculumCoverageResponse
)
import logging
import uuid

logger = logging.getLogger(__name__)


class CurriculumService:
    """Service for curriculum and lesson plan management"""

    # ============== Curriculum Units ==============

    @staticmethod
    async def create_unit(
        db: AsyncSession,
        school_id: str,
        user_id: str,
        unit_data: CurriculumUnitCreate
    ) -> CurriculumUnitResponse:
        """Create a new curriculum unit"""
        unit = CurriculumUnit(
            id=str(uuid.uuid4()),
            school_id=school_id,
            created_by=user_id,
            name=unit_data.name,
            description=unit_data.description,
            order=unit_data.order,
            subject_id=unit_data.subject_id,
            class_id=unit_data.class_id,
            term_id=unit_data.term_id,
            estimated_hours=unit_data.estimated_hours,
            planned_start_date=unit_data.planned_start_date,
            planned_end_date=unit_data.planned_end_date,
            learning_objectives=unit_data.learning_objectives,
            resources=unit_data.resources,
            notes=unit_data.notes
        )
        db.add(unit)
        await db.commit()
        await db.refresh(unit)
        return CurriculumUnitResponse.model_validate(unit)

    @staticmethod
    async def list_units(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        subject_id: Optional[str] = None,
        term_id: Optional[str] = None,
        status: Optional[CoverageStatus] = None
    ) -> List[CurriculumUnitResponse]:
        """List curriculum units with filters"""
        conditions = [
            CurriculumUnit.school_id == school_id,
            CurriculumUnit.class_id == class_id,
            CurriculumUnit.is_deleted == False
        ]
        if subject_id:
            conditions.append(CurriculumUnit.subject_id == subject_id)
        if term_id:
            conditions.append(CurriculumUnit.term_id == term_id)
        if status:
            conditions.append(CurriculumUnit.coverage_status == status)
        
        result = await db.execute(
            select(CurriculumUnit).where(
                and_(*conditions)
            ).order_by(CurriculumUnit.order, CurriculumUnit.name)
        )
        units = result.scalars().all()
        return [CurriculumUnitResponse.model_validate(u) for u in units]

    @staticmethod
    async def get_unit(
        db: AsyncSession,
        school_id: str,
        unit_id: str
    ) -> Optional[CurriculumUnitResponse]:
        """Get a specific curriculum unit"""
        result = await db.execute(
            select(CurriculumUnit).where(
                CurriculumUnit.id == unit_id,
                CurriculumUnit.school_id == school_id,
                CurriculumUnit.is_deleted == False
            )
        )
        unit = result.scalar_one_or_none()
        return CurriculumUnitResponse.model_validate(unit) if unit else None

    @staticmethod
    async def update_unit(
        db: AsyncSession,
        school_id: str,
        unit_id: str,
        unit_data: CurriculumUnitUpdate
    ) -> Optional[CurriculumUnitResponse]:
        """Update a curriculum unit"""
        result = await db.execute(
            select(CurriculumUnit).where(
                CurriculumUnit.id == unit_id,
                CurriculumUnit.school_id == school_id,
                CurriculumUnit.is_deleted == False
            )
        )
        unit = result.scalar_one_or_none()
        if not unit:
            return None
        
        update_data = unit_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(unit, field, value)
        
        await db.commit()
        await db.refresh(unit)
        return CurriculumUnitResponse.model_validate(unit)

    @staticmethod
    async def mark_unit_status(
        db: AsyncSession,
        school_id: str,
        unit_id: str,
        status: CoverageStatus
    ) -> Optional[CurriculumUnitResponse]:
        """Mark a curriculum unit with a specific status"""
        result = await db.execute(
            select(CurriculumUnit).where(
                CurriculumUnit.id == unit_id,
                CurriculumUnit.school_id == school_id,
                CurriculumUnit.is_deleted == False
            )
        )
        unit = result.scalar_one_or_none()
        if not unit:
            return None
        
        unit.coverage_status = status
        if status == CoverageStatus.IN_PROGRESS and not unit.actual_start_date:
            unit.actual_start_date = date.today()
        elif status == CoverageStatus.COMPLETED:
            unit.actual_end_date = date.today()
        
        await db.commit()
        await db.refresh(unit)
        return CurriculumUnitResponse.model_validate(unit)

    @staticmethod
    async def delete_unit(
        db: AsyncSession,
        school_id: str,
        unit_id: str
    ) -> bool:
        """Soft delete a curriculum unit"""
        result = await db.execute(
            select(CurriculumUnit).where(
                CurriculumUnit.id == unit_id,
                CurriculumUnit.school_id == school_id,
                CurriculumUnit.is_deleted == False
            )
        )
        unit = result.scalar_one_or_none()
        if not unit:
            return False

        unit.is_deleted = True
        await db.commit()
        return True

    # ============== Lesson Plan Items ==============

    @staticmethod
    async def create_lesson_plan(
        db: AsyncSession,
        school_id: str,
        teacher_id: str,
        plan_data: LessonPlanItemCreate
    ) -> LessonPlanItemResponse:
        """Create a new lesson plan item"""
        plan = LessonPlanItem(
            id=str(uuid.uuid4()),
            school_id=school_id,
            teacher_id=teacher_id,
            title=plan_data.title,
            description=plan_data.description,
            curriculum_unit_id=plan_data.curriculum_unit_id,
            subject_id=plan_data.subject_id,
            class_id=plan_data.class_id,
            term_id=plan_data.term_id,
            scheduled_date=plan_data.scheduled_date,
            duration_minutes=plan_data.duration_minutes,
            learning_objectives=plan_data.learning_objectives,
            activities=plan_data.activities,
            materials=plan_data.materials,
            assessment_methods=plan_data.assessment_methods,
            ai_generated_content=plan_data.ai_generated_content
        )
        db.add(plan)
        await db.commit()
        await db.refresh(plan)
        return LessonPlanItemResponse.model_validate(plan)

    @staticmethod
    async def list_lesson_plans(
        db: AsyncSession,
        school_id: str,
        teacher_id: Optional[str] = None,
        class_id: Optional[str] = None,
        subject_id: Optional[str] = None,
        term_id: Optional[str] = None,
        is_delivered: Optional[bool] = None
    ) -> List[LessonPlanItemResponse]:
        """List lesson plans with filters"""
        conditions = [
            LessonPlanItem.school_id == school_id,
            LessonPlanItem.is_deleted == False
        ]
        if teacher_id:
            conditions.append(LessonPlanItem.teacher_id == teacher_id)
        if class_id:
            conditions.append(LessonPlanItem.class_id == class_id)
        if subject_id:
            conditions.append(LessonPlanItem.subject_id == subject_id)
        if term_id:
            conditions.append(LessonPlanItem.term_id == term_id)
        if is_delivered is not None:
            conditions.append(LessonPlanItem.is_delivered == is_delivered)

        result = await db.execute(
            select(LessonPlanItem).where(
                and_(*conditions)
            ).order_by(LessonPlanItem.scheduled_date.desc().nullslast(), LessonPlanItem.created_at.desc())
        )
        plans = result.scalars().all()
        return [LessonPlanItemResponse.model_validate(p) for p in plans]

    @staticmethod
    async def get_lesson_plan(
        db: AsyncSession,
        school_id: str,
        plan_id: str
    ) -> Optional[LessonPlanItemResponse]:
        """Get a specific lesson plan"""
        result = await db.execute(
            select(LessonPlanItem).where(
                LessonPlanItem.id == plan_id,
                LessonPlanItem.school_id == school_id,
                LessonPlanItem.is_deleted == False
            )
        )
        plan = result.scalar_one_or_none()
        return LessonPlanItemResponse.model_validate(plan) if plan else None

    @staticmethod
    async def update_lesson_plan(
        db: AsyncSession,
        school_id: str,
        plan_id: str,
        plan_data: LessonPlanItemUpdate
    ) -> Optional[LessonPlanItemResponse]:
        """Update a lesson plan"""
        result = await db.execute(
            select(LessonPlanItem).where(
                LessonPlanItem.id == plan_id,
                LessonPlanItem.school_id == school_id,
                LessonPlanItem.is_deleted == False
            )
        )
        plan = result.scalar_one_or_none()
        if not plan:
            return None

        update_data = plan_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(plan, field, value)

        await db.commit()
        await db.refresh(plan)
        return LessonPlanItemResponse.model_validate(plan)

    @staticmethod
    async def mark_lesson_delivered(
        db: AsyncSession,
        school_id: str,
        plan_id: str,
        reflection_notes: Optional[str] = None,
        engagement_rating: Optional[int] = None
    ) -> Optional[LessonPlanItemResponse]:
        """Mark a lesson as delivered and update curriculum coverage"""
        result = await db.execute(
            select(LessonPlanItem).where(
                LessonPlanItem.id == plan_id,
                LessonPlanItem.school_id == school_id,
                LessonPlanItem.is_deleted == False
            )
        )
        plan = result.scalar_one_or_none()
        if not plan:
            return None

        plan.is_delivered = True
        plan.delivered_date = date.today()
        if reflection_notes:
            plan.reflection_notes = reflection_notes
        if engagement_rating:
            plan.student_engagement_rating = engagement_rating

        # Update curriculum unit if linked
        if plan.curriculum_unit_id:
            unit_result = await db.execute(
                select(CurriculumUnit).where(
                    CurriculumUnit.id == plan.curriculum_unit_id,
                    CurriculumUnit.is_deleted == False
                )
            )
            unit = unit_result.scalar_one_or_none()
            if unit:
                # Check if all lessons for this unit are delivered
                lessons_result = await db.execute(
                    select(func.count(LessonPlanItem.id)).where(
                        LessonPlanItem.curriculum_unit_id == unit.id,
                        LessonPlanItem.is_deleted == False,
                        LessonPlanItem.is_delivered == False
                    )
                )
                pending_lessons = lessons_result.scalar() or 0

                if pending_lessons == 0:
                    unit.coverage_status = CoverageStatus.COMPLETED
                    unit.actual_end_date = date.today()
                elif unit.coverage_status == CoverageStatus.PLANNED:
                    unit.coverage_status = CoverageStatus.IN_PROGRESS
                    if not unit.actual_start_date:
                        unit.actual_start_date = date.today()

        await db.commit()
        await db.refresh(plan)
        return LessonPlanItemResponse.model_validate(plan)

    @staticmethod
    async def delete_lesson_plan(
        db: AsyncSession,
        school_id: str,
        plan_id: str
    ) -> bool:
        """Soft delete a lesson plan"""
        result = await db.execute(
            select(LessonPlanItem).where(
                LessonPlanItem.id == plan_id,
                LessonPlanItem.school_id == school_id,
                LessonPlanItem.is_deleted == False
            )
        )
        plan = result.scalar_one_or_none()
        if not plan:
            return False

        plan.is_deleted = True
        await db.commit()
        return True

    # ============== Coverage Analytics ==============

    @staticmethod
    async def get_coverage_analytics(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        term_id: str
    ) -> CurriculumCoverageResponse:
        """Get curriculum coverage analytics for a class/term"""

        # Get all subjects for this class
        subjects_result = await db.execute(
            select(Subject).where(
                Subject.school_id == school_id,
                Subject.is_deleted == False,
                Subject.is_active == True
            )
        )
        subjects = subjects_result.scalars().all()

        overall_stats = CoverageStats(
            total_units=0, planned=0, in_progress=0, completed=0, skipped=0,
            coverage_percentage=0.0, total_estimated_hours=0, total_actual_hours=0
        )

        by_subject = []

        for subject in subjects:
            # Get units for this subject
            units_result = await db.execute(
                select(CurriculumUnit).where(
                    CurriculumUnit.school_id == school_id,
                    CurriculumUnit.class_id == class_id,
                    CurriculumUnit.term_id == term_id,
                    CurriculumUnit.subject_id == subject.id,
                    CurriculumUnit.is_deleted == False
                )
            )
            units = units_result.scalars().all()

            if not units:
                continue

            stats = CoverageStats(
                total_units=len(units),
                planned=sum(1 for u in units if u.coverage_status == CoverageStatus.PLANNED),
                in_progress=sum(1 for u in units if u.coverage_status == CoverageStatus.IN_PROGRESS),
                completed=sum(1 for u in units if u.coverage_status == CoverageStatus.COMPLETED),
                skipped=sum(1 for u in units if u.coverage_status == CoverageStatus.SKIPPED),
                coverage_percentage=0.0,
                total_estimated_hours=sum(u.estimated_hours or 0 for u in units),
                total_actual_hours=sum(u.actual_hours or 0 for u in units)
            )
            stats.coverage_percentage = round(stats.completed / stats.total_units * 100, 1) if stats.total_units > 0 else 0.0

            by_subject.append(SubjectCoverage(
                subject_id=subject.id,
                subject_name=subject.name,
                stats=stats
            ))

            # Aggregate to overall
            overall_stats.total_units += stats.total_units
            overall_stats.planned += stats.planned
            overall_stats.in_progress += stats.in_progress
            overall_stats.completed += stats.completed
            overall_stats.skipped += stats.skipped
            overall_stats.total_estimated_hours += stats.total_estimated_hours
            overall_stats.total_actual_hours += stats.total_actual_hours

        overall_stats.coverage_percentage = round(
            overall_stats.completed / overall_stats.total_units * 100, 1
        ) if overall_stats.total_units > 0 else 0.0

        # Get overdue units
        today = date.today()
        overdue_result = await db.execute(
            select(CurriculumUnit).where(
                CurriculumUnit.school_id == school_id,
                CurriculumUnit.class_id == class_id,
                CurriculumUnit.term_id == term_id,
                CurriculumUnit.is_deleted == False,
                CurriculumUnit.coverage_status.in_([CoverageStatus.PLANNED, CoverageStatus.IN_PROGRESS]),
                CurriculumUnit.planned_end_date < today
            ).order_by(CurriculumUnit.planned_end_date)
        )
        overdue_units = [CurriculumUnitResponse.model_validate(u) for u in overdue_result.scalars().all()]

        # Get upcoming units
        upcoming_result = await db.execute(
            select(CurriculumUnit).where(
                CurriculumUnit.school_id == school_id,
                CurriculumUnit.class_id == class_id,
                CurriculumUnit.term_id == term_id,
                CurriculumUnit.is_deleted == False,
                CurriculumUnit.coverage_status == CoverageStatus.PLANNED,
                CurriculumUnit.planned_start_date >= today,
                CurriculumUnit.planned_start_date <= today + timedelta(days=14)
            ).order_by(CurriculumUnit.planned_start_date).limit(5)
        )
        upcoming_units = [CurriculumUnitResponse.model_validate(u) for u in upcoming_result.scalars().all()]

        return CurriculumCoverageResponse(
            class_id=class_id,
            term_id=term_id,
            overall_stats=overall_stats,
            by_subject=by_subject,
            overdue_units=overdue_units,
            upcoming_units=upcoming_units
        )

