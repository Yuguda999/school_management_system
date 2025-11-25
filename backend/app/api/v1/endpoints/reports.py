from typing import Any, Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_teacher_or_admin_user,
    require_school_admin,
    get_current_school
)
from app.models.user import User
from app.models.school import School
from app.schemas.dashboard import DashboardStats
from app.services.dashboard_service import DashboardService
from app.services.report_service import ReportService
from app.schemas.report import FinancialReport
from datetime import date

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_report(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get dashboard statistics report"""
    stats = await DashboardService.get_dashboard_stats(
        db, current_school.id, term_id
    )
    return stats


@router.get("/students")
async def get_student_reports(
    class_id: Optional[str] = Query(None, description="Filter by class"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get student reports"""
    # This would be implemented with actual student report logic
    # For now, return a mock response structure
    return {
        "items": [],
        "total": 0,
        "page": page,
        "size": size,
        "pages": 0
    }


@router.get("/classes/{class_id}")
async def get_class_report(
    class_id: str,
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get class report"""
    # This would be implemented with actual class report logic
    return {
        "class_id": class_id,
        "class_name": "Mock Class",
        "total_students": 0,
        "average_attendance": 0.0,
        "average_grade": 0.0,
        "fee_collection_rate": 0.0,
        "total_fees_collected": 0.0,
        "pending_fees": 0.0
    }


@router.get("/financial", response_model=FinancialReport)
async def get_financial_report(
    start_date: Optional[date] = Query(None, description="Start date"),
    end_date: Optional[date] = Query(None, description="End date"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    fee_type: Optional[str] = Query(None, description="Filter by fee type"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status (paid, pending, overdue)"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get financial report (Admin/Super Admin only)"""
    return await ReportService.get_financial_report(
        db=db,
        school_id=current_school.id,
        start_date=start_date,
        end_date=end_date,
        term_id=term_id,
        class_id=class_id,
        fee_type=fee_type,
        payment_status=payment_status
    )

# ... (other endpoints)

@router.post("/export/{report_type}")
async def export_report(
    report_type: str,
    export_options: dict,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Export report in specified format"""
    if report_type == 'financial':
        # Check permissions - allow school_admin, platform_super_admin, and school_owner
        if current_user.role not in ['school_admin', 'platform_super_admin', 'school_owner']:
             raise HTTPException(status_code=403, detail="Not authorized to export financial reports")
             
        start_date = export_options.get('date_range', {}).get('start_date')
        end_date = export_options.get('date_range', {}).get('end_date')
        filters = export_options.get('filters', {})
        term_id = filters.get('term_id')
        class_id = filters.get('class_id')
        fee_type = filters.get('fee_type')
        payment_status = filters.get('payment_status')
        
        # Convert strings to date objects if present
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        csv_content = await ReportService.export_financial_report_csv(
            db, current_school.id, start_date, end_date, term_id, class_id, fee_type, payment_status
        )
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=financial_report_{datetime.now().strftime('%Y%m%d')}.csv"
            }
        )
        
    return {"message": f"Export for {report_type} not implemented yet"}
