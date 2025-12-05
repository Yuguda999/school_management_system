"""
Goals API Endpoints for Student Goal Setting & Progress Tracker (P2.5)
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_teacher_or_admin_user,
    get_current_school,
    get_school_context,
    SchoolContext
)
from app.models.user import User, UserRole
from app.models.school import School
from app.services.goal_service import GoalService
from app.schemas.student_goal import (
    GoalCreate, GoalUpdate, GoalResponse, GoalListResponse,
    GoalProgressUpdate, GoalSummary, MilestoneCreate, MilestoneResponse,
    GoalCategory, GoalStatus
)

router = APIRouter()


# ============== Student's Own Goals ==============

@router.get("/me", response_model=GoalListResponse)
async def get_my_goals(
    category: Optional[GoalCategory] = Query(None, description="Filter by category"),
    status: Optional[GoalStatus] = Query(None, description="Filter by status"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get goals for the logged-in student"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    return await GoalService.list_goals(
        db, school_context.school_id, school_context.user.id,
        category, status, term_id
    )


@router.post("/me", response_model=GoalResponse)
async def create_my_goal(
    goal_data: GoalCreate,
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new goal for the logged-in student"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    try:
        return await GoalService.create_goal(
            db, school_context.school_id, school_context.user.id, goal_data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me/summary", response_model=GoalSummary)
async def get_my_goal_summary(
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get goal summary for the logged-in student"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    return await GoalService.get_goal_summary(
        db, school_context.school_id, school_context.user.id
    )


@router.get("/me/{goal_id}", response_model=GoalResponse)
async def get_my_goal(
    goal_id: str,
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific goal for the logged-in student"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    goal = await GoalService.get_goal(db, school_context.school_id, goal_id)
    if not goal or goal.student_id != school_context.user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/me/{goal_id}", response_model=GoalResponse)
async def update_my_goal(
    goal_id: str,
    goal_data: GoalUpdate,
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a goal for the logged-in student"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    # Verify ownership
    existing = await GoalService.get_goal(db, school_context.school_id, goal_id)
    if not existing or existing.student_id != school_context.user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    result = await GoalService.update_goal(db, school_context.school_id, goal_id, goal_data)
    if not result:
        raise HTTPException(status_code=404, detail="Goal not found")
    return result


@router.post("/me/{goal_id}/progress", response_model=GoalResponse)
async def update_my_goal_progress(
    goal_id: str,
    progress_data: GoalProgressUpdate,
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update progress on a goal"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    existing = await GoalService.get_goal(db, school_context.school_id, goal_id)
    if not existing or existing.student_id != school_context.user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    result = await GoalService.update_progress(db, school_context.school_id, goal_id, progress_data)
    if not result:
        raise HTTPException(status_code=404, detail="Goal not found")
    return result


@router.delete("/me/{goal_id}")
async def delete_my_goal(
    goal_id: str,
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete a goal"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")

    existing = await GoalService.get_goal(db, school_context.school_id, goal_id)
    if not existing or existing.student_id != school_context.user.id:
        raise HTTPException(status_code=404, detail="Goal not found")

    await GoalService.delete_goal(db, school_context.school_id, goal_id)
    return {"message": "Goal deleted successfully"}


# ============== Milestone Endpoints ==============

@router.post("/me/{goal_id}/milestones", response_model=MilestoneResponse)
async def add_milestone(
    goal_id: str,
    milestone_data: MilestoneCreate,
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Add a milestone to a goal"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")

    existing = await GoalService.get_goal(db, school_context.school_id, goal_id)
    if not existing or existing.student_id != school_context.user.id:
        raise HTTPException(status_code=404, detail="Goal not found")

    result = await GoalService.add_milestone(db, school_context.school_id, goal_id, milestone_data)
    if not result:
        raise HTTPException(status_code=404, detail="Goal not found")
    return result


@router.post("/me/milestones/{milestone_id}/complete", response_model=MilestoneResponse)
async def complete_milestone(
    milestone_id: str,
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mark a milestone as completed"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")

    result = await GoalService.complete_milestone(db, school_context.school_id, milestone_id)
    if not result:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return result


# ============== Teacher/Admin Access to Student Goals ==============

@router.get("/student/{student_id}", response_model=GoalListResponse)
async def get_student_goals(
    student_id: str,
    category: Optional[GoalCategory] = Query(None, description="Filter by category"),
    status: Optional[GoalStatus] = Query(None, description="Filter by status"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get goals for a specific student (for teachers/admins)"""
    return await GoalService.list_goals(
        db, current_school.id, student_id, category, status, term_id
    )


@router.get("/student/{student_id}/summary", response_model=GoalSummary)
async def get_student_goal_summary(
    student_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get goal summary for a specific student (for teachers/admins)"""
    return await GoalService.get_goal_summary(db, current_school.id, student_id)

