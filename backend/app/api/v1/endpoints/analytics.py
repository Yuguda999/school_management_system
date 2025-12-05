"""
Analytics API Endpoints
Implements advanced analytics features for the School Management System
"""

from typing import Any, Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_teacher_or_admin_user,
    require_school_admin,
    require_teacher,
    require_student,
    get_current_school,
    get_school_context,
    SchoolContext
)
from app.models.user import User, UserRole
from app.models.school import School
from app.services.analytics_service import AnalyticsService
from app.schemas.dashboard import (
    ClassStats, AttendanceByClass, PerformanceByClass, FeesByClass,
    DrillDownFilters, ExtendedDashboardStats, EnrollmentAnalytics,
    FinancialAnalytics, TeacherAnalytics, ClassInsights,
    StudentAnalytics, StudentTaskList, GradeBenchmark
)

router = APIRouter()


# ============== P1.1 - Executive Dashboard 2.0 ==============

@router.get("/dashboard/class-stats", response_model=List[ClassStats])
async def get_class_level_stats(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get per-class statistics for admin drill-down"""
    return await AnalyticsService.get_class_level_stats(
        db, current_school.id, term_id
    )


@router.get("/dashboard/attendance-by-class", response_model=List[AttendanceByClass])
async def get_attendance_by_class(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    start_date: Optional[date] = Query(None, description="Start date"),
    end_date: Optional[date] = Query(None, description="End date"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get attendance breakdown per class"""
    return await AnalyticsService.get_attendance_by_class(
        db, current_school.id, term_id, start_date, end_date
    )


@router.get("/dashboard/performance-by-class", response_model=List[PerformanceByClass])
async def get_performance_by_class(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    threshold: float = Query(50.0, description="Pass threshold percentage"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get academic performance breakdown per class"""
    return await AnalyticsService.get_performance_by_class(
        db, current_school.id, term_id, threshold
    )


@router.get("/dashboard/fees-by-class", response_model=List[FeesByClass])
async def get_fees_by_class(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get fee collection status per class"""
    return await AnalyticsService.get_fees_by_class(
        db, current_school.id, term_id
    )


# ============== P1.2 - Financial Analytics ==============

@router.get("/financial", response_model=FinancialAnalytics)
async def get_financial_analytics(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get comprehensive financial analytics with aging buckets"""
    return await AnalyticsService.get_financial_analytics(
        db, current_school.id, term_id
    )


# ============== P1.3 - Class Performance Insights ==============

@router.get("/class/{class_id}/insights", response_model=ClassInsights)
async def get_class_insights(
    class_id: str,
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get detailed insights for a specific class (for teachers)"""
    try:
        return await AnalyticsService.get_class_insights(
            db, current_school.id, class_id, term_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============== P2.1 - Enrollment Analytics ==============

@router.get("/enrollment", response_model=EnrollmentAnalytics)
async def get_enrollment_analytics(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get enrollment trends and cohort retention analytics"""
    return await AnalyticsService.get_enrollment_analytics(
        db, current_school.id, term_id
    )


# ============== P2.4 - Teacher Analytics ==============

@router.get("/teachers", response_model=TeacherAnalytics)
async def get_teacher_analytics(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get teacher performance and workload analytics"""
    return await AnalyticsService.get_teacher_analytics(
        db, current_school.id, term_id
    )


# ============== P1.4 - Student Personal Analytics ==============

@router.get("/student/me", response_model=StudentAnalytics)
async def get_my_analytics(
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get personal analytics for the logged-in student"""
    # Check if user is a student
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")

    try:
        return await AnalyticsService.get_student_analytics(
            db, school_context.school_id, school_context.user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/student/{student_id}", response_model=StudentAnalytics)
async def get_student_analytics(
    student_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get analytics for a specific student (for teachers/admins)"""
    try:
        return await AnalyticsService.get_student_analytics(
            db, current_school.id, student_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============== P1.5 - Student Tasks & Deadlines ==============

@router.get("/student/me/tasks", response_model=StudentTaskList)
async def get_my_tasks(
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get tasks and deadlines for the logged-in student"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")

    try:
        return await AnalyticsService.get_student_tasks(
            db, school_context.school_id, school_context.user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/student/{student_id}/tasks", response_model=StudentTaskList)
async def get_student_tasks(
    student_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get tasks and deadlines for a specific student (for teachers/admins)"""
    try:
        return await AnalyticsService.get_student_tasks(
            db, current_school.id, student_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============== P3.3 - Grade Benchmarks ==============

@router.get("/student/me/benchmarks", response_model=List[GradeBenchmark])
async def get_my_benchmarks(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get grade benchmarks for the logged-in student"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")

    return await AnalyticsService.get_grade_benchmarks(
        db, school_context.school_id, school_context.user.id, term_id
    )


@router.get("/student/{student_id}/benchmarks", response_model=List[GradeBenchmark])
async def get_student_benchmarks(
    student_id: str,
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get grade benchmarks for a specific student (for teachers/admins)"""
    return await AnalyticsService.get_grade_benchmarks(
        db, current_school.id, student_id, term_id
    )


# ============== P2.6 - Communication & Engagement Analytics ==============

@router.get("/engagement")
async def get_engagement_analytics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get communication and engagement analytics"""
    return await AnalyticsService.get_engagement_analytics(
        db, current_school.id, days
    )


# ============== P2.7 - Smart Study Recommendations ==============

@router.get("/student/me/recommendations")
async def get_my_recommendations(
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get AI-powered study recommendations for the logged-in student"""
    if school_context.user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")

    return await AnalyticsService.get_study_recommendations(
        db, school_context.school_id, school_context.user.id
    )


@router.get("/student/{student_id}/recommendations")
async def get_student_recommendations(
    student_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get AI-powered study recommendations for a specific student"""
    return await AnalyticsService.get_study_recommendations(
        db, current_school.id, student_id
    )

