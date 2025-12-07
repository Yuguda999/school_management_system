"""
Promotions API Endpoints

This module provides endpoints for managing student promotions.
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_school_admin, SchoolContext, get_current_school_context, get_current_active_user
from app.models.user import User
from app.schemas.academic_session import (
    PromotionPreviewResponse,
    BulkPromotionRequest,
    BulkPromotionResult,
)
from app.services.promotion_service import PromotionService


router = APIRouter()


@router.get("/candidates")
async def get_promotion_candidates(
    session_id: str = Query(..., description="Academic session ID"),
    class_id: Optional[str] = Query(None, description="Filter by class ID"),
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get students who are candidates for promotion in a session.
    
    Returns a list of students with their current class, session average,
    and suggested promotion action.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    candidates = await PromotionService.get_promotion_candidates(
        db, current_school.id, session_id, class_id
    )
    
    return {
        "session_id": session_id,
        "total_candidates": len(candidates),
        "candidates": candidates
    }


@router.get("/preview", response_model=PromotionPreviewResponse)
async def preview_promotions(
    session_id: str = Query(..., description="Academic session ID"),
    class_id: Optional[str] = Query(None, description="Filter by class ID"),
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Preview what promotions would look like before executing.
    
    This shows all candidates with their suggested actions and counts
    of how many would be promoted, repeated, or graduated.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    preview = await PromotionService.preview_promotions(
        db, current_school.id, session_id, class_id
    )
    
    return preview


@router.post("/execute", response_model=BulkPromotionResult)
async def execute_promotions(
    promotion_data: BulkPromotionRequest,
    current_user: User = Depends(get_current_active_user),
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Execute bulk promotions.
    
    This processes a list of promotion decisions and updates student
    records accordingly. Each decision specifies whether to promote,
    repeat, graduate, or transfer a student.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    result = await PromotionService.promote_students(
        db,
        current_school.id,
        promotion_data.session_id,
        promotion_data.decisions,
        current_user.id
    )
    
    return result


@router.post("/auto-promote", response_model=BulkPromotionResult)
async def auto_promote(
    session_id: str = Query(..., description="Academic session ID"),
    current_user: User = Depends(get_current_active_user),
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Automatically promote students based on school's configured rules.
    
    The promotion behavior depends on the school's promotion_mode setting:
    - automatic: Promote all students (except those graduating)
    - performance_based: Promote students meeting minimum score threshold
    - manual: Does nothing (requires explicit decisions)
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    result = await PromotionService.auto_promote_by_rules(
        db, current_school.id, session_id, current_user.id
    )
    
    return result


@router.get("/class-progression")
async def get_class_progression_map(
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get the class progression map for the school.
    
    This shows how students would progress from each class to the next
    based on the ClassLevel hierarchy.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    progression_map = await PromotionService.get_class_progression_map(
        db, current_school.id
    )
    
    # Convert to a more readable format
    progression_list = []
    for class_id, (next_class_id, next_class_name) in progression_map.items():
        progression_list.append({
            "class_id": class_id,
            "next_class_id": next_class_id,
            "next_class_name": next_class_name
        })
    
    return {
        "progression_map": progression_list
    }
