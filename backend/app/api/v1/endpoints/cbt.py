"""CBT (Computer-Based Testing) API endpoints"""
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
import csv
import io
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_school_admin,
    require_teacher_or_admin,
    get_current_school_context,
    SchoolContext
)
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.cbt import (
    CBTTest, CBTQuestion, CBTQuestionOption, CBTTestSchedule,
    CBTSubmission, CBTAnswer, TestStatus, SubmissionStatus
)
from app.schemas.cbt import (
    CBTTestCreate, CBTTestUpdate, CBTTestResponse, CBTTestListResponse,
    CBTQuestionCreate, CBTQuestionUpdate, CBTQuestionResponse,
    CBTTestScheduleCreate, CBTTestScheduleUpdate, CBTTestScheduleResponse, CBTScheduleListResponse,
    CBTSubmissionResponse, CBTSubmissionListResponse, CBTSubmissionStart, CBTSubmissionSubmit,
    CBTTestForStudent, CBTQuestionForStudent, CBTQuestionOptionForStudent
)

router = APIRouter()


# ==================== TEST MANAGEMENT ENDPOINTS (Teachers/Admins) ====================

@router.post("/tests", response_model=CBTTestResponse, status_code=status.HTTP_201_CREATED)
async def create_test(
    test_data: CBTTestCreate,
    school_context: SchoolContext = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new CBT test (Teachers/Admins only)"""
    current_user = school_context.user
    
    # Verify subject exists and belongs to school
    from app.models.academic import Subject
    result = await db.execute(
        select(Subject).where(
            Subject.id == test_data.subject_id,
            Subject.school_id == school_context.school_id,
            Subject.is_deleted == False
        )
    )
    subject = result.scalar_one_or_none()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Create test
    test = CBTTest(
        **test_data.model_dump(exclude={'questions'}),
        school_id=school_context.school_id,
        created_by=current_user.id,
        status=TestStatus.DRAFT,
        total_points=0
    )
    db.add(test)
    await db.flush()
    
    # Add questions if provided
    total_points = 0
    if test_data.questions:
        for question_data in test_data.questions:
            question = CBTQuestion(
                **question_data.model_dump(exclude={'options'}),
                test_id=test.id,
                school_id=school_context.school_id
            )
            db.add(question)
            await db.flush()
            
            total_points += float(question_data.points)
            
            # Add options
            for option_data in question_data.options:
                option = CBTQuestionOption(
                    **option_data.model_dump(),
                    question_id=question.id,
                    school_id=school_context.school_id
                )
                db.add(option)
    
    # Update total points
    test.total_points = total_points
    
    await db.commit()
    await db.refresh(test)
    
    # Load relationships
    result = await db.execute(
        select(CBTTest)
        .options(
            selectinload(CBTTest.questions).selectinload(CBTQuestion.options),
            selectinload(CBTTest.subject),
            selectinload(CBTTest.creator)
        )
        .where(CBTTest.id == test.id)
    )
    test = result.scalar_one()
    
    response = CBTTestResponse.model_validate(test)
    response.question_count = len(test.questions)
    return response


@router.get("/tests", response_model=CBTTestListResponse)
async def get_tests(
    subject_id: Optional[str] = Query(None, description="Filter by subject"),
    status: Optional[TestStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by title"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all CBT tests with filtering and pagination"""
    current_user = school_context.user
    
    # Build query
    query = select(CBTTest).where(
        CBTTest.school_id == school_context.school_id,
        CBTTest.is_deleted == False
    )
    
    # Teachers can only see their own tests
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        query = query.where(CBTTest.created_by == current_user.id)
    
    # Apply filters
    if subject_id:
        query = query.where(CBTTest.subject_id == subject_id)
    if status:
        query = query.where(CBTTest.status == status)
    if search:
        query = query.where(CBTTest.title.ilike(f"%{search}%"))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination and ordering
    query = query.order_by(desc(CBTTest.created_at))
    query = query.offset((page - 1) * size).limit(size)

    # Load relationships
    query = query.options(
        selectinload(CBTTest.questions).selectinload(CBTQuestion.options),
        selectinload(CBTTest.subject),
        selectinload(CBTTest.creator)
    )

    result = await db.execute(query)
    tests = result.scalars().all()

    # Build response
    test_responses = []
    for test in tests:
        test_response = CBTTestResponse.model_validate(test)
        test_response.question_count = len(test.questions)
        test_responses.append(test_response)

    return CBTTestListResponse(
        tests=test_responses,
        total=total,
        page=page,
        size=size
    )


@router.get("/tests/{test_id}", response_model=CBTTestResponse)
async def get_test(
    test_id: str,
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific CBT test by ID"""
    current_user = school_context.user

    # Load test with relationships
    result = await db.execute(
        select(CBTTest)
        .options(
            selectinload(CBTTest.questions).selectinload(CBTQuestion.options),
            selectinload(CBTTest.subject),
            selectinload(CBTTest.creator)
        )
        .where(
            CBTTest.id == test_id,
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

    # Teachers can only view their own tests
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this test"
            )

    response = CBTTestResponse.model_validate(test)
    response.question_count = len(test.questions)
    return response


@router.put("/tests/{test_id}", response_model=CBTTestResponse)
async def update_test(
    test_id: str,
    test_data: CBTTestUpdate,
    school_context: SchoolContext = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a CBT test (Teachers/Admins only)"""
    current_user = school_context.user

    # Get test
    result = await db.execute(
        select(CBTTest).where(
            CBTTest.id == test_id,
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

    # Teachers can only update their own tests
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this test"
            )

    # Update test fields
    update_data = test_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(test, field, value)

    await db.commit()
    await db.refresh(test)

    # Load relationships
    result = await db.execute(
        select(CBTTest)
        .options(
            selectinload(CBTTest.questions).selectinload(CBTQuestion.options),
            selectinload(CBTTest.subject),
            selectinload(CBTTest.creator)
        )
        .where(CBTTest.id == test.id)
    )
    test = result.scalar_one()

    response = CBTTestResponse.model_validate(test)
    response.question_count = len(test.questions)
    return response


@router.delete("/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test(
    test_id: str,
    school_context: SchoolContext = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Delete a CBT test (soft delete)"""
    current_user = school_context.user

    # Get test
    result = await db.execute(
        select(CBTTest).where(
            CBTTest.id == test_id,
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

    # Teachers can only delete their own tests
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this test"
            )

    # Soft delete
    test.is_deleted = True
    test.deleted_at = datetime.now(timezone.utc)

    await db.commit()


# ==================== QUESTION MANAGEMENT ENDPOINTS ====================

@router.post("/tests/{test_id}/questions", response_model=CBTQuestionResponse, status_code=status.HTTP_201_CREATED)
async def add_question(
    test_id: str,
    question_data: CBTQuestionCreate,
    school_context: SchoolContext = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Add a question to a test"""
    current_user = school_context.user

    # Get test
    result = await db.execute(
        select(CBTTest).where(
            CBTTest.id == test_id,
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

    # Check authorization
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this test"
            )

    # Create question
    question = CBTQuestion(
        **question_data.model_dump(exclude={'options'}),
        test_id=test_id,
        school_id=school_context.school_id
    )
    db.add(question)
    await db.flush()

    # Add options
    for option_data in question_data.options:
        option = CBTQuestionOption(
            **option_data.model_dump(),
            question_id=question.id,
            school_id=school_context.school_id
        )
        db.add(option)

    # Update test total points
    test.total_points = float(test.total_points) + float(question_data.points)

    await db.commit()
    await db.refresh(question)

    # Load with options
    result = await db.execute(
        select(CBTQuestion)
        .options(selectinload(CBTQuestion.options))
        .where(CBTQuestion.id == question.id)
    )
    question = result.scalar_one()

    return CBTQuestionResponse.model_validate(question)


@router.put("/questions/{question_id}", response_model=CBTQuestionResponse)
async def update_question(
    question_id: str,
    question_data: CBTQuestionUpdate,
    school_context: SchoolContext = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a question"""
    current_user = school_context.user

    # Get question with test
    result = await db.execute(
        select(CBTQuestion)
        .options(selectinload(CBTQuestion.test), selectinload(CBTQuestion.options))
        .where(
            CBTQuestion.id == question_id,
            CBTQuestion.school_id == school_context.school_id,
            CBTQuestion.is_deleted == False
        )
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    # Check authorization
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if question.test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this question"
            )

    # Store old points for total update
    old_points = float(question.points)

    # Update question fields
    update_data = question_data.model_dump(exclude_unset=True, exclude={'options'})
    for field, value in update_data.items():
        setattr(question, field, value)

    # Update options if provided
    if question_data.options is not None:
        # Delete old options
        await db.execute(
            select(CBTQuestionOption).where(CBTQuestionOption.question_id == question_id)
        )
        for option in question.options:
            await db.delete(option)

        # Add new options
        for option_data in question_data.options:
            option = CBTQuestionOption(
                **option_data.model_dump(),
                question_id=question.id,
                school_id=school_context.school_id
            )
            db.add(option)

    # Update test total points if points changed
    if 'points' in update_data:
        new_points = float(update_data['points'])
        question.test.total_points = float(question.test.total_points) - old_points + new_points

    await db.commit()
    await db.refresh(question)

    # Load with options
    result = await db.execute(
        select(CBTQuestion)
        .options(selectinload(CBTQuestion.options))
        .where(CBTQuestion.id == question.id)
    )
    question = result.scalar_one()

    return CBTQuestionResponse.model_validate(question)


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: str,
    school_context: SchoolContext = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Delete a question"""
    current_user = school_context.user

    # Get question with test
    result = await db.execute(
        select(CBTQuestion)
        .options(selectinload(CBTQuestion.test))
        .where(
            CBTQuestion.id == question_id,
            CBTQuestion.school_id == school_context.school_id,
            CBTQuestion.is_deleted == False
        )
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    # Check authorization
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if question.test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this question"
            )

    # Update test total points
    question.test.total_points = float(question.test.total_points) - float(question.points)

    # Soft delete
    question.is_deleted = True
    question.deleted_at = datetime.now(timezone.utc)

    await db.commit()


# ==================== SUBMISSION VIEWING ENDPOINTS (Teachers/Admins) ====================

@router.get("/tests/{test_id}/submissions", response_model=List[CBTSubmissionResponse])
async def get_test_submissions(
    test_id: str,
    schedule_id: Optional[str] = Query(None, description="Filter by schedule"),
    status: Optional[SubmissionStatus] = Query(None, description="Filter by status"),
    school_context: SchoolContext = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all submissions for a test (Teachers/Admins only)"""
    current_user = school_context.user

    # Verify test exists and check authorization
    result = await db.execute(
        select(CBTTest).where(
            CBTTest.id == test_id,
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

    # Teachers can only view submissions for their own tests
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view these submissions"
            )

    # Build query
    query = select(CBTSubmission).where(
        CBTSubmission.test_id == test_id,
        CBTSubmission.school_id == school_context.school_id,
        CBTSubmission.is_deleted == False
    )

    # Apply filters
    if schedule_id:
        query = query.where(CBTSubmission.schedule_id == schedule_id)
    if status:
        query = query.where(CBTSubmission.status == status)

    # Load relationships
    query = query.options(
        selectinload(CBTSubmission.student),
        selectinload(CBTSubmission.answers)
    )
    query = query.order_by(desc(CBTSubmission.submitted_at))

    result = await db.execute(query)
    submissions = result.scalars().all()

    return [CBTSubmissionResponse.model_validate(s) for s in submissions]


@router.get("/submissions/{submission_id}", response_model=CBTSubmissionResponse)
async def get_submission_details(
    submission_id: str,
    school_context: SchoolContext = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get detailed submission with answers (Teachers/Admins only)"""
    current_user = school_context.user

    # Get submission with all relationships
    result = await db.execute(
        select(CBTSubmission)
        .options(
            selectinload(CBTSubmission.test),
            selectinload(CBTSubmission.student),
            selectinload(CBTSubmission.answers).selectinload(CBTAnswer.question).selectinload(CBTQuestion.options),
            selectinload(CBTSubmission.answers).selectinload(CBTAnswer.selected_option)
        )
        .where(
            CBTSubmission.id == submission_id,
            CBTSubmission.school_id == school_context.school_id,
            CBTSubmission.is_deleted == False
        )
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    # Teachers can only view submissions for their own tests
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if submission.test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this submission"
            )

    return CBTSubmissionResponse.model_validate(submission)


@router.get("/tests/{test_id}/export")
async def export_test_results(
    test_id: str,
    school_context: SchoolContext = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Export test results to CSV (Teachers/Admins only)"""
    current_user = school_context.user

    # Verify test exists and check authorization
    result = await db.execute(
        select(CBTTest).where(
            CBTTest.id == test_id,
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

    # Teachers can only export results for their own tests
    if isinstance(current_user, User) and current_user.role == UserRole.TEACHER:
        if test.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to export results for this test"
            )

    # Get all submissions for this test
    query = select(CBTSubmission).where(
        CBTSubmission.test_id == test_id,
        CBTSubmission.school_id == school_context.school_id,
        CBTSubmission.is_deleted == False,
        CBTSubmission.status == SubmissionStatus.SUBMITTED
    )

    # Load relationships
    query = query.options(
        selectinload(CBTSubmission.student),
        selectinload(CBTSubmission.answers)
    )
    query = query.order_by(CBTSubmission.submitted_at)

    result = await db.execute(query)
    submissions = result.scalars().all()

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        'Student Name',
        'Admission Number',
        'Submitted At',
        'Time Spent (minutes)',
        'Score',
        'Total Possible',
        'Percentage',
        'Passed',
        'Correct Answers',
        'Incorrect Answers',
        'Attempt Number'
    ])

    # Write data rows
    for submission in submissions:
        student = submission.student
        time_spent_minutes = submission.time_spent_seconds / 60 if submission.time_spent_seconds else 0
        correct_count = len([a for a in submission.answers if a.is_correct]) if submission.answers else 0
        incorrect_count = len([a for a in submission.answers if not a.is_correct]) if submission.answers else 0

        writer.writerow([
            f"{student.first_name} {student.last_name}" if student else "Unknown",
            student.admission_number if student else "N/A",
            submission.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if submission.submitted_at else "N/A",
            f"{time_spent_minutes:.2f}",
            str(submission.total_score),
            str(submission.total_possible),
            f"{float(submission.percentage):.2f}" if submission.percentage else "0.00",
            "Yes" if submission.passed else "No",
            str(correct_count),
            str(incorrect_count),
            str(submission.attempt_number)
        ])

    # Prepare response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=test_results_{test_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )

