"""
Attendance API Endpoints
"""
from typing import Any, List, Optional, Dict
from datetime import date, datetime as dt
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, get_current_school, SchoolContext, require_teacher
from app.models.user import User
from app.models.school import School
from app.models.academic import AttendanceStatus
from app.schemas.academic import (
    AttendanceResponse,
    AttendanceUpdate,
    BulkClassAttendanceCreate,
    BulkSubjectAttendanceCreate,
    StudentAttendanceSummary,
)
from app.services.attendance_service import AttendanceService
from app.services.attendance_service_extensions import AttendanceServiceExtensions
from app.services.school_service import SchoolService

router = APIRouter()


@router.post("/class", response_model=List[AttendanceResponse])
async def mark_class_attendance(
    attendance_data: BulkClassAttendanceCreate,
    school_context: SchoolContext = Depends(require_teacher()),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Mark class attendance for all students in a class.
    Only class teachers or school admins can mark class attendance.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    records = await AttendanceService.mark_class_attendance(
        db, attendance_data, current_user.id, current_school.id
    )
    
    return records


@router.post("/subject", response_model=List[AttendanceResponse])
async def mark_subject_attendance(
    attendance_data: BulkSubjectAttendanceCreate,
    school_context: SchoolContext = Depends(require_teacher()),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Mark subject attendance for students in a class.
    Teachers must be assigned to the subject to mark attendance.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    records = await AttendanceService.mark_subject_attendance(
        db, attendance_data, current_user.id, current_school.id
    )
    
    return records


@router.get("", response_model=List[AttendanceResponse])
async def get_attendance_records(
    class_id: Optional[str] = Query(None),
    subject_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[AttendanceStatus] = Query(None),
    term_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get attendance records with flexible filtering.
    Accessible to all authenticated teachers and admins.
    """
    records = await AttendanceService.get_attendance_records(
        db=db,
        school_id=current_school.id,
        class_id=class_id,
        subject_id=subject_id,
        student_id=student_id,
        start_date=start_date,
        end_date=end_date,
        status_filter=status,
        term_id=term_id,
        skip=skip,
        limit=limit
    )
    
    return records


@router.put("/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance_record(
    attendance_id: str,
    update_data: AttendanceUpdate,
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update an existing attendance record.
    Only teachers and admins can update attendance.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    updated_record = await AttendanceService.update_attendance_record(
        db, attendance_id, update_data, current_school.id
    )
    
    if not updated_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    return updated_record


@router.get("/summary/{student_id}", response_model=StudentAttendanceSummary)
async def get_student_attendance_summary(
    student_id: str,
    term_id: Optional[str] = Query(None),
    subject_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get attendance summary for a specific student.
    Returns statistics like total days, present days, attendance rate, etc.
    """
    summary = await AttendanceService.get_student_attendance_summary(
        db=db,
        student_id=student_id,
        school_id=current_school.id,
        term_id=term_id,
        subject_id=subject_id
    )
    
    return summary


@router.get("/check-duplicate", response_model=Dict[str, Any])
async def check_duplicate_attendance(
    class_id: str = Query(..., description="Class ID"),
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    subject_id: Optional[str] = Query(None, description="Subject ID for subject attendance"),
    term_id: Optional[str] = Query(None, description="Term ID"),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
):
    """Check if attendance already exists for the given date/class/subject"""
    date_obj = dt.strptime(date, "%Y-%m-%d").date()
    
    exists, records = await AttendanceServiceExtensions.check_duplicate_attendance(
        db, current_school.id, class_id, date_obj, subject_id, term_id
    )
    
    return {
        "exists": exists,
        "count": len(records) if records else 0,
        "marked_at": records[0].created_at.isoformat() if records and len(records) > 0 else None,
        "marked_by": records[0].marker.full_name if records and len(records) > 0 and records[0].marker else None
    }


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance_record(
    attendance_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
):
    """Delete an attendance record (soft delete)"""
    await AttendanceServiceExtensions.delete_attendance_record(
        db, attendance_id, current_user.id, current_school.id
    )
    return None


@router.delete("/bulk", status_code=status.HTTP_200_OK, response_model=Dict[str, int])
async def delete_bulk_attendance(
    class_id: str = Query(..., description="Class ID"),
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    subject_id: Optional[str] = Query(None, description="Subject ID for subject attendance"),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
):
    """Delete all attendance records for a specific date/class/subject"""
    date_obj = dt.strptime(date, "%Y-%m-%d").date()
    
    count = await AttendanceServiceExtensions.delete_bulk_attendance(
        db, current_school.id, class_id, date_obj, subject_id, current_user.id
    )
    
    return {"deleted_count": count}

