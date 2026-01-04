from typing import Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_teacher_or_admin,
    get_current_school
)
from app.models.user import User
from app.models.school import School
from app.schemas.dashboard import (
    DashboardStats,
    DashboardData,
    DashboardFilters
)
from app.services.dashboard_service import DashboardService
from app.core.cache_manager import cache_response

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
@cache_response(expire=300)
async def get_dashboard_stats(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get dashboard statistics"""
    stats = await DashboardService.get_dashboard_stats(
        db, current_school.id, term_id, current_user
    )
    return stats


@router.get("/", response_model=DashboardData)
@cache_response(expire=300)
async def get_dashboard_data(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get complete dashboard data"""
    filters = DashboardFilters(
        term_id=term_id,
        class_id=class_id
    )
    
    dashboard_data = await DashboardService.get_dashboard_data(
        db, current_school.id, filters, current_user
    )
    return dashboard_data
