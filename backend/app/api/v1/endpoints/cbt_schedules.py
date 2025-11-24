"""CBT Test Scheduling and Student Test-Taking endpoints"""
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from decimal import Decimal
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_teacher_or_admin,
    get_current_school_context,
    SchoolContext
)
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import Class
from app.models.cbt import (
    CBTTest, CBTQuestion, CBTQuestionOption, CBTTestSchedule,
    CBTSubmission, CBTAnswer, TestStatus, SubmissionStatus
)
from app.schemas.cbt import (
    CBTTestScheduleCreate, CBTTestScheduleUpdate, CBTTestScheduleResponse, CBTScheduleListResponse,
    CBTSubmissionResponse, CBTSubmissionListResponse, CBTSubmissionStart, CBTSubmissionSubmit,
    CBTTestForStudent, CBTQuestionForStudent, CBTQuestionOptionForStudent
)

router = APIRouter()


# ==================== TEST SCHEDULING ENDPOINTS (Teachers/Admins) ====================

@router.post("/schedules", response_model=CBTTestScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_data: CBTTestScheduleCreate,
    school_context: SchoolContext = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Schedule a test for classes or specific students"""
    current_user = school_context.user
    
    # Verify test exists and belongs to school
    result = await db.execute(
        select(CBTTest).where(
            CBTTest.id == schedule_data.test_id,
            CBTTest.school_id == school_context.school_id,
            CBTTest.is_deleted == False
        )
    )
    test = result.scalar_one_or_none()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found"
        )
    
    # Teachers can only schedule their own tests
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to schedule this test"
            )
    
    # Verify class if provided
    if schedule_data.class_id:
        result = await db.execute(
            select(Class).where(
                Class.id == schedule_data.class_id,
                Class.school_id == school_context.school_id,
                Class.is_deleted == False
            )
        )
        class_ = result.scalar_one_or_none()
        if not class_:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )
    
    # Verify students if provided
    if schedule_data.student_ids:
        result = await db.execute(
            select(func.count(Student.id)).where(
                Student.id.in_(schedule_data.student_ids),
                Student.school_id == school_context.school_id,
                Student.is_deleted == False
            )
        )
        student_count = result.scalar()
        if student_count != len(schedule_data.student_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more students not found"
            )
    
    # Create schedule
    schedule = CBTTestSchedule(
        **schedule_data.model_dump(),
        school_id=school_context.school_id,
        created_by=current_user.id
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    
    # Create submissions for assigned students
    student_ids_to_assign = []
    
    if schedule_data.class_id:
        # Get all students in the class
        result = await db.execute(
            select(Student.id).where(
                Student.current_class_id == schedule_data.class_id,
                Student.school_id == school_context.school_id,
                Student.is_deleted == False
            )
        )
        student_ids_to_assign = [row[0] for row in result.all()]
    
    if schedule_data.student_ids:
        student_ids_to_assign.extend(schedule_data.student_ids)
    
    # Remove duplicates
    student_ids_to_assign = list(set(student_ids_to_assign))
    
    # Create submissions
    for student_id in student_ids_to_assign:
        submission = CBTSubmission(
            test_id=schedule_data.test_id,
            schedule_id=schedule.id,
            student_id=student_id,
            school_id=school_context.school_id,
            status=SubmissionStatus.NOT_STARTED,
            attempt_number=1
        )
        db.add(submission)
    
    await db.commit()
    
    return CBTTestScheduleResponse.model_validate(schedule)


@router.get("/schedules", response_model=CBTScheduleListResponse)
async def get_schedules(
    test_id: Optional[str] = Query(None, description="Filter by test"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all test schedules with filtering"""
    current_user = school_context.user

    # Build query
    query = select(CBTTestSchedule).where(
        CBTTestSchedule.school_id == school_context.school_id,
        CBTTestSchedule.is_deleted == False
    )

    # Teachers can only see schedules for their tests
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        query = query.join(CBTTest).where(CBTTest.created_by == current_user.id)

    # Apply filters
    if test_id:
        query = query.where(CBTTestSchedule.test_id == test_id)
    if class_id:
        query = query.where(CBTTestSchedule.class_id == class_id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    query = query.order_by(desc(CBTTestSchedule.start_datetime))
    query = query.offset((page - 1) * size).limit(size)

    result = await db.execute(query)
    schedules = result.scalars().all()

    schedule_responses = [CBTTestScheduleResponse.model_validate(s) for s in schedules]

    return CBTScheduleListResponse(
        schedules=schedule_responses,
        total=total,
        page=page,
        size=size
    )


@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: str,
    school_context: SchoolContext = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Delete a test schedule"""
    current_user = school_context.user

    # Get schedule with test
    result = await db.execute(
        select(CBTTestSchedule)
        .options(selectinload(CBTTestSchedule.test))
        .where(
            CBTTestSchedule.id == schedule_id,
            CBTTestSchedule.school_id == school_context.school_id,
            CBTTestSchedule.is_deleted == False
        )
    )
    schedule = result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )

    # Check authorization
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if schedule.test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this schedule"
            )

    # Soft delete
    schedule.is_deleted = True
    schedule.deleted_at = datetime.now(timezone.utc)

    await db.commit()


# ==================== STUDENT TEST-TAKING ENDPOINTS ====================

@router.get("/student/available-tests", response_model=List[dict])
async def get_available_tests_for_student(
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all available tests for the current student"""
    # This endpoint is for students only
    if not isinstance(school_context.user, Student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for students only"
        )

    student = school_context.user
    current_time = datetime.now(timezone.utc)

    # Get all submissions for this student
    result = await db.execute(
        select(CBTSubmission)
        .options(
            selectinload(CBTSubmission.test).selectinload(CBTTest.subject),
            selectinload(CBTSubmission.schedule)
        )
        .where(
            CBTSubmission.student_id == student.id,
            CBTSubmission.school_id == school_context.school_id,
            CBTSubmission.is_deleted == False
        )
    )
    submissions = result.scalars().all()

    # Build response with test availability info
    available_tests = []
    for submission in submissions:
        schedule = submission.schedule
        test = submission.test

        # Check if test is currently available
        is_available = (
            schedule.start_datetime <= current_time <= schedule.end_datetime
            and test.status == TestStatus.PUBLISHED
        )

        # Check if student can still attempt
        can_attempt = (
            submission.status in [SubmissionStatus.NOT_STARTED, SubmissionStatus.IN_PROGRESS]
            or (test.allow_multiple_attempts and submission.attempt_number < test.max_attempts)
        )

        available_tests.append({
            "submission_id": submission.id,
            "test_id": test.id,
            "test_title": test.title,
            "test_description": test.description,
            "subject_name": test.subject.name if test.subject else None,
            "duration_minutes": test.duration_minutes,
            "total_points": float(test.total_points),
            "start_datetime": schedule.start_datetime,
            "end_datetime": schedule.end_datetime,
            "is_available": is_available,
            "can_attempt": can_attempt,
            "status": submission.status,
            "attempt_number": submission.attempt_number,
            "max_attempts": test.max_attempts,
            "score": float(submission.total_score) if submission.total_score else None,
            "percentage": float(submission.percentage) if submission.percentage else None,
            "passed": submission.passed
        })

    return available_tests

