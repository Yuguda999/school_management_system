"""
Curriculum API Endpoints for Curriculum Coverage & Lesson Plan Tracker (P2.3)
"""

from typing import Any, Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_teacher_or_admin_user, get_current_school
from app.models.user import User
from app.models.school import School
from app.models.curriculum import CoverageStatus
from app.services.curriculum_service import CurriculumService
from app.schemas.curriculum import (
    CurriculumUnitCreate, CurriculumUnitUpdate, CurriculumUnitResponse,
    LessonPlanItemCreate, LessonPlanItemUpdate, LessonPlanItemResponse,
    CurriculumCoverageResponse
)

router = APIRouter()


# ============== Curriculum Units ==============

@router.get("/units", response_model=List[CurriculumUnitResponse])
async def list_curriculum_units(
    class_id: str = Query(..., description="Class ID"),
    subject_id: Optional[str] = Query(None, description="Filter by subject"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    status: Optional[CoverageStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """List curriculum units"""
    return await CurriculumService.list_units(
        db, current_school.id, class_id, subject_id, term_id, status
    )


@router.post("/units", response_model=CurriculumUnitResponse)
async def create_curriculum_unit(
    unit_data: CurriculumUnitCreate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new curriculum unit"""
    return await CurriculumService.create_unit(
        db, current_school.id, current_user.id, unit_data
    )


@router.get("/units/{unit_id}", response_model=CurriculumUnitResponse)
async def get_curriculum_unit(
    unit_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific curriculum unit"""
    unit = await CurriculumService.get_unit(db, current_school.id, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Curriculum unit not found")
    return unit


@router.put("/units/{unit_id}", response_model=CurriculumUnitResponse)
async def update_curriculum_unit(
    unit_id: str,
    unit_data: CurriculumUnitUpdate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a curriculum unit"""
    unit = await CurriculumService.update_unit(db, current_school.id, unit_id, unit_data)
    if not unit:
        raise HTTPException(status_code=404, detail="Curriculum unit not found")
    return unit


@router.post("/units/{unit_id}/status/{status}", response_model=CurriculumUnitResponse)
async def mark_unit_status(
    unit_id: str,
    status: CoverageStatus,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mark a curriculum unit with a specific status"""
    unit = await CurriculumService.mark_unit_status(db, current_school.id, unit_id, status)
    if not unit:
        raise HTTPException(status_code=404, detail="Curriculum unit not found")
    return unit


@router.delete("/units/{unit_id}")
async def delete_curriculum_unit(
    unit_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete a curriculum unit"""
    success = await CurriculumService.delete_unit(db, current_school.id, unit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Curriculum unit not found")
    return {"message": "Curriculum unit deleted successfully"}


# ============== Lesson Plans ==============

@router.get("/lessons", response_model=List[LessonPlanItemResponse])
async def list_lesson_plans(
    class_id: Optional[str] = Query(None, description="Filter by class"),
    subject_id: Optional[str] = Query(None, description="Filter by subject"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    is_delivered: Optional[bool] = Query(None, description="Filter by delivery status"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """List lesson plans"""
    return await CurriculumService.list_lesson_plans(
        db, current_school.id, current_user.id, class_id, subject_id, term_id, is_delivered
    )


@router.post("/lessons", response_model=LessonPlanItemResponse)
async def create_lesson_plan(
    plan_data: LessonPlanItemCreate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new lesson plan"""
    return await CurriculumService.create_lesson_plan(
        db, current_school.id, current_user.id, plan_data
    )


@router.get("/lessons/{plan_id}", response_model=LessonPlanItemResponse)
async def get_lesson_plan(
    plan_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific lesson plan"""
    plan = await CurriculumService.get_lesson_plan(db, current_school.id, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return plan


@router.put("/lessons/{plan_id}", response_model=LessonPlanItemResponse)
async def update_lesson_plan(
    plan_id: str,
    plan_data: LessonPlanItemUpdate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a lesson plan"""
    plan = await CurriculumService.update_lesson_plan(db, current_school.id, plan_id, plan_data)
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return plan


from pydantic import BaseModel, Field


class MarkDeliveredRequest(BaseModel):
    reflection_notes: Optional[str] = None
    engagement_rating: Optional[int] = Field(None, ge=1, le=5)


@router.post("/lessons/{plan_id}/deliver", response_model=LessonPlanItemResponse)
async def mark_lesson_delivered(
    plan_id: str,
    data: MarkDeliveredRequest,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mark a lesson as delivered"""
    plan = await CurriculumService.mark_lesson_delivered(
        db, current_school.id, plan_id, data.reflection_notes, data.engagement_rating
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return plan


@router.delete("/lessons/{plan_id}")
async def delete_lesson_plan(
    plan_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete a lesson plan"""
    success = await CurriculumService.delete_lesson_plan(db, current_school.id, plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return {"message": "Lesson plan deleted successfully"}


# ============== Coverage Analytics ==============

@router.get("/coverage", response_model=CurriculumCoverageResponse)
async def get_coverage_analytics(
    class_id: str = Query(..., description="Class ID"),
    term_id: str = Query(..., description="Term ID"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get curriculum coverage analytics"""
    return await CurriculumService.get_coverage_analytics(
        db, current_school.id, class_id, term_id
    )

