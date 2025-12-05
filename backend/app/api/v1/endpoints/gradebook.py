"""
Gradebook API Endpoints for Unified Assessment & Gradebook Automation (P2.2)
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_teacher_or_admin_user, get_current_school
from app.models.user import User
from app.models.school import School
from app.services.gradebook_service import GradebookService

router = APIRouter()


@router.get("/view")
async def get_gradebook_view(
    class_id: str = Query(..., description="Class ID"),
    subject_id: str = Query(..., description="Subject ID"),
    term_id: str = Query(..., description="Term ID"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get unified gradebook view with all assessments and CBT scores"""
    return await GradebookService.get_gradebook_view(
        db, current_school.id, class_id, subject_id, term_id, current_user.id
    )


@router.post("/auto-calculate")
async def auto_calculate_grades(
    class_id: str = Query(..., description="Class ID"),
    subject_id: str = Query(..., description="Subject ID"),
    term_id: str = Query(..., description="Term ID"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Auto-calculate and save consolidated grades for all students"""
    return await GradebookService.auto_calculate_grades(
        db, current_school.id, class_id, subject_id, term_id, current_user.id
    )


@router.get("/summary")
async def get_assessment_summary(
    class_id: str = Query(..., description="Class ID"),
    subject_id: str = Query(..., description="Subject ID"),
    term_id: str = Query(..., description="Term ID"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get summary of all assessments for a class/subject/term"""
    return await GradebookService.get_assessment_summary(
        db, current_school.id, class_id, subject_id, term_id
    )

