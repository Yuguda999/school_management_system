"""
Goal Service for Student Goal Setting & Progress Tracker (P2.5)
"""

from typing import Optional, List
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.models.student_goal import StudentGoal, GoalMilestone, GoalCategory, GoalStatus
from app.models.student import Student
from app.models.academic import Subject, Term
from app.schemas.student_goal import (
    GoalCreate, GoalUpdate, GoalResponse, GoalListResponse,
    GoalProgressUpdate, GoalSummary, MilestoneCreate, MilestoneUpdate, MilestoneResponse
)


class GoalService:
    """Service for managing student goals"""

    @staticmethod
    async def create_goal(
        db: AsyncSession,
        school_id: str,
        student_id: str,
        goal_data: GoalCreate
    ) -> GoalResponse:
        """Create a new goal for a student"""
        
        # Verify student exists
        student = await db.execute(
            select(Student).where(
                Student.id == student_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        if not student.scalar_one_or_none():
            raise ValueError(f"Student not found: {student_id}")
        
        # Create goal
        goal = StudentGoal(
            school_id=school_id,
            student_id=student_id,
            title=goal_data.title,
            description=goal_data.description,
            category=goal_data.category,
            target_value=goal_data.target_value,
            target_unit=goal_data.target_unit,
            start_date=goal_data.start_date or date.today(),
            target_date=goal_data.target_date,
            subject_id=goal_data.subject_id,
            term_id=goal_data.term_id,
            notes=goal_data.notes,
            status=GoalStatus.NOT_STARTED,
            progress_percentage=0.0
        )
        db.add(goal)
        await db.flush()
        
        # Create milestones if provided
        if goal_data.milestones:
            for i, m in enumerate(goal_data.milestones):
                milestone = GoalMilestone(
                    school_id=school_id,
                    goal_id=goal.id,
                    title=m.title,
                    description=m.description,
                    target_date=m.target_date,
                    order=m.order or i
                )
                db.add(milestone)
        
        await db.commit()
        await db.refresh(goal)
        
        return await GoalService.get_goal(db, school_id, goal.id)

    @staticmethod
    async def get_goal(
        db: AsyncSession,
        school_id: str,
        goal_id: str
    ) -> Optional[GoalResponse]:
        """Get a goal by ID"""
        result = await db.execute(
            select(StudentGoal).options(
                selectinload(StudentGoal.milestones),
                selectinload(StudentGoal.subject),
                selectinload(StudentGoal.term)
            ).where(
                StudentGoal.id == goal_id,
                StudentGoal.school_id == school_id,
                StudentGoal.is_deleted == False
            )
        )
        goal = result.scalar_one_or_none()
        if not goal:
            return None
        
        return GoalResponse(
            id=goal.id,
            student_id=goal.student_id,
            title=goal.title,
            description=goal.description,
            category=goal.category,
            target_value=goal.target_value,
            current_value=goal.current_value,
            target_unit=goal.target_unit,
            start_date=goal.start_date,
            target_date=goal.target_date,
            status=goal.status,
            progress_percentage=goal.progress_percentage,
            completed_date=goal.completed_date,
            subject_id=goal.subject_id,
            term_id=goal.term_id,
            notes=goal.notes,
            subject_name=goal.subject.name if goal.subject else None,
            term_name=goal.term.name if goal.term else None,
            milestones=[
                MilestoneResponse(
                    id=m.id,
                    goal_id=m.goal_id,
                    title=m.title,
                    description=m.description,
                    target_date=m.target_date,
                    is_completed=m.is_completed,
                    completed_date=m.completed_date,
                    order=m.order
                ) for m in sorted(goal.milestones, key=lambda x: x.order)
                if not m.is_deleted
            ]
        )

    @staticmethod
    async def list_goals(
        db: AsyncSession,
        school_id: str,
        student_id: str,
        category: Optional[GoalCategory] = None,
        status: Optional[GoalStatus] = None,
        term_id: Optional[str] = None
    ) -> GoalListResponse:
        """List goals for a student with optional filters"""
        conditions = [
            StudentGoal.student_id == student_id,
            StudentGoal.school_id == school_id,
            StudentGoal.is_deleted == False
        ]
        if category:
            conditions.append(StudentGoal.category == category)
        if status:
            conditions.append(StudentGoal.status == status)
        if term_id:
            conditions.append(StudentGoal.term_id == term_id)
        
        result = await db.execute(
            select(StudentGoal).options(
                selectinload(StudentGoal.milestones),
                selectinload(StudentGoal.subject),
                selectinload(StudentGoal.term)
            ).where(and_(*conditions)).order_by(StudentGoal.created_at.desc())
        )
        goals = result.scalars().all()

        items = []
        active_count = 0
        completed_count = 0

        for goal in goals:
            if goal.status in [GoalStatus.NOT_STARTED, GoalStatus.IN_PROGRESS]:
                active_count += 1
            elif goal.status == GoalStatus.COMPLETED:
                completed_count += 1

            items.append(GoalResponse(
                id=goal.id,
                student_id=goal.student_id,
                title=goal.title,
                description=goal.description,
                category=goal.category,
                target_value=goal.target_value,
                current_value=goal.current_value,
                target_unit=goal.target_unit,
                start_date=goal.start_date,
                target_date=goal.target_date,
                status=goal.status,
                progress_percentage=goal.progress_percentage,
                completed_date=goal.completed_date,
                subject_id=goal.subject_id,
                term_id=goal.term_id,
                notes=goal.notes,
                subject_name=goal.subject.name if goal.subject else None,
                term_name=goal.term.name if goal.term else None,
                milestones=[
                    MilestoneResponse(
                        id=m.id,
                        goal_id=m.goal_id,
                        title=m.title,
                        description=m.description,
                        target_date=m.target_date,
                        is_completed=m.is_completed,
                        completed_date=m.completed_date,
                        order=m.order
                    ) for m in sorted(goal.milestones, key=lambda x: x.order)
                    if not m.is_deleted
                ]
            ))

        return GoalListResponse(
            items=items,
            total=len(items),
            active_count=active_count,
            completed_count=completed_count
        )

    @staticmethod
    async def update_goal(
        db: AsyncSession,
        school_id: str,
        goal_id: str,
        goal_data: GoalUpdate
    ) -> Optional[GoalResponse]:
        """Update a goal"""
        result = await db.execute(
            select(StudentGoal).where(
                StudentGoal.id == goal_id,
                StudentGoal.school_id == school_id,
                StudentGoal.is_deleted == False
            )
        )
        goal = result.scalar_one_or_none()
        if not goal:
            return None

        update_data = goal_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(goal, field, value)

        # Recalculate progress if values changed
        if goal.target_value and goal.current_value:
            goal.calculate_progress()

        # Auto-complete if progress is 100%
        if goal.progress_percentage >= 100 and goal.status != GoalStatus.COMPLETED:
            goal.status = GoalStatus.COMPLETED
            goal.completed_date = date.today()

        await db.commit()
        return await GoalService.get_goal(db, school_id, goal_id)

    @staticmethod
    async def update_progress(
        db: AsyncSession,
        school_id: str,
        goal_id: str,
        progress_data: GoalProgressUpdate
    ) -> Optional[GoalResponse]:
        """Update goal progress"""
        result = await db.execute(
            select(StudentGoal).where(
                StudentGoal.id == goal_id,
                StudentGoal.school_id == school_id,
                StudentGoal.is_deleted == False
            )
        )
        goal = result.scalar_one_or_none()
        if not goal:
            return None

        goal.current_value = progress_data.current_value
        if progress_data.notes:
            goal.notes = progress_data.notes

        # Update status to in_progress if not started
        if goal.status == GoalStatus.NOT_STARTED:
            goal.status = GoalStatus.IN_PROGRESS

        # Calculate progress
        goal.calculate_progress()

        # Auto-complete if target reached
        if goal.progress_percentage >= 100:
            goal.status = GoalStatus.COMPLETED
            goal.completed_date = date.today()

        await db.commit()
        return await GoalService.get_goal(db, school_id, goal_id)

    @staticmethod
    async def delete_goal(
        db: AsyncSession,
        school_id: str,
        goal_id: str
    ) -> bool:
        """Soft delete a goal"""
        result = await db.execute(
            select(StudentGoal).where(
                StudentGoal.id == goal_id,
                StudentGoal.school_id == school_id,
                StudentGoal.is_deleted == False
            )
        )
        goal = result.scalar_one_or_none()
        if not goal:
            return False

        goal.is_deleted = True
        await db.commit()
        return True

    @staticmethod
    async def get_goal_summary(
        db: AsyncSession,
        school_id: str,
        student_id: str
    ) -> GoalSummary:
        """Get summary of student goals"""
        result = await db.execute(
            select(StudentGoal).where(
                StudentGoal.student_id == student_id,
                StudentGoal.school_id == school_id,
                StudentGoal.is_deleted == False
            )
        )
        goals = result.scalars().all()

        total = len(goals)
        active = sum(1 for g in goals if g.status in [GoalStatus.NOT_STARTED, GoalStatus.IN_PROGRESS])
        completed = sum(1 for g in goals if g.status == GoalStatus.COMPLETED)
        abandoned = sum(1 for g in goals if g.status == GoalStatus.ABANDONED)

        by_category = {}
        for g in goals:
            cat = g.category.value
            if cat not in by_category:
                by_category[cat] = {"total": 0, "completed": 0}
            by_category[cat]["total"] += 1
            if g.status == GoalStatus.COMPLETED:
                by_category[cat]["completed"] += 1

        return GoalSummary(
            total_goals=total,
            active_goals=active,
            completed_goals=completed,
            abandoned_goals=abandoned,
            completion_rate=round((completed / total * 100) if total > 0 else 0, 1),
            goals_by_category=by_category
        )

    # Milestone methods
    @staticmethod
    async def add_milestone(
        db: AsyncSession,
        school_id: str,
        goal_id: str,
        milestone_data: MilestoneCreate
    ) -> Optional[MilestoneResponse]:
        """Add a milestone to a goal"""
        result = await db.execute(
            select(StudentGoal).where(
                StudentGoal.id == goal_id,
                StudentGoal.school_id == school_id,
                StudentGoal.is_deleted == False
            )
        )
        goal = result.scalar_one_or_none()
        if not goal:
            return None

        milestone = GoalMilestone(
            school_id=school_id,
            goal_id=goal_id,
            title=milestone_data.title,
            description=milestone_data.description,
            target_date=milestone_data.target_date,
            order=milestone_data.order
        )
        db.add(milestone)
        await db.commit()
        await db.refresh(milestone)

        return MilestoneResponse(
            id=milestone.id,
            goal_id=milestone.goal_id,
            title=milestone.title,
            description=milestone.description,
            target_date=milestone.target_date,
            is_completed=milestone.is_completed,
            completed_date=milestone.completed_date,
            order=milestone.order
        )

    @staticmethod
    async def complete_milestone(
        db: AsyncSession,
        school_id: str,
        milestone_id: str
    ) -> Optional[MilestoneResponse]:
        """Mark a milestone as completed"""
        result = await db.execute(
            select(GoalMilestone).where(
                GoalMilestone.id == milestone_id,
                GoalMilestone.school_id == school_id,
                GoalMilestone.is_deleted == False
            )
        )
        milestone = result.scalar_one_or_none()
        if not milestone:
            return None

        milestone.is_completed = True
        milestone.completed_date = date.today()
        await db.commit()

        return MilestoneResponse(
            id=milestone.id,
            goal_id=milestone.goal_id,
            title=milestone.title,
            description=milestone.description,
            target_date=milestone.target_date,
            is_completed=milestone.is_completed,
            completed_date=milestone.completed_date,
            order=milestone.order
        )

