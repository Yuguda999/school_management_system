"""CBT Student Test-Taking endpoints"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from decimal import Decimal
import random
from app.core.database import get_db
from app.core.deps import get_current_school_context, SchoolContext
from app.models.student import Student
from app.models.cbt import (
    CBTTest, CBTQuestion, CBTQuestionOption, CBTTestSchedule,
    CBTSubmission, CBTAnswer, TestStatus, SubmissionStatus
)
from app.schemas.cbt import (
    CBTSubmissionResponse, CBTSubmissionStart, CBTSubmissionSubmit,
    CBTTestForStudent, CBTQuestionForStudent, CBTQuestionOptionForStudent
)

router = APIRouter()


@router.post("/submissions/{submission_id}/start", response_model=CBTTestForStudent)
async def start_test(
    submission_id: str,
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Start a test (for students)"""
    # Verify user is a student
    if not isinstance(school_context.user, Student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for students only"
        )
    
    student = school_context.user
    
    # Get submission with relationships
    result = await db.execute(
        select(CBTSubmission)
        .options(
            selectinload(CBTSubmission.test).selectinload(CBTTest.questions).selectinload(CBTQuestion.options),
            selectinload(CBTSubmission.schedule)
        )
        .where(
            CBTSubmission.id == submission_id,
            CBTSubmission.student_id == student.id,
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
    
    # Check if test is available
    current_time = datetime.now(timezone.utc)
    schedule = submission.schedule
    
    if current_time < schedule.start_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test has not started yet"
        )
    
    if current_time > schedule.end_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test has ended"
        )
    
    # Check if test is published
    test = submission.test
    if test.status != TestStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test is not published"
        )
    
    # Check if student can attempt
    if submission.status == SubmissionStatus.SUBMITTED:
        if not test.allow_multiple_attempts or submission.attempt_number >= test.max_attempts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No more attempts allowed"
            )
        
        # Create new submission for next attempt
        new_submission = CBTSubmission(
            test_id=test.id,
            schedule_id=schedule.id,
            student_id=student.id,
            school_id=school_context.school_id,
            status=SubmissionStatus.IN_PROGRESS,
            attempt_number=submission.attempt_number + 1,
            started_at=current_time
        )
        db.add(new_submission)
        await db.commit()
        submission = new_submission
    elif submission.status == SubmissionStatus.NOT_STARTED:
        # Start the test
        submission.status = SubmissionStatus.IN_PROGRESS
        submission.started_at = current_time
        await db.commit()
    
    # Prepare questions for student (without correct answers)
    questions = list(test.questions)
    
    # Randomize questions if configured
    if test.randomize_questions:
        random.shuffle(questions)
    
    student_questions = []
    for question in questions:
        options = list(question.options)
        
        # Randomize options if configured
        if test.randomize_options:
            random.shuffle(options)
        
        # Convert to student schema (no correct answer info)
        student_options = [
            CBTQuestionOptionForStudent(
                id=opt.id,
                option_label=opt.option_label,
                option_text=opt.option_text,
                order_number=opt.order_number
            )
            for opt in options
        ]
        
        student_questions.append(
            CBTQuestionForStudent(
                id=question.id,
                question_text=question.question_text,
                points=question.points,
                order_number=question.order_number,
                image_url=question.image_url,
                media_url=question.media_url,
                options=student_options
            )
        )
    
    return CBTTestForStudent(
        id=test.id,
        title=test.title,
        description=test.description,
        instructions=test.instructions,
        duration_minutes=test.duration_minutes,
        total_points=test.total_points,
        question_count=len(questions),
        questions=student_questions
    )


@router.post("/submissions/{submission_id}/submit", response_model=CBTSubmissionResponse)
async def submit_test(
    submission_id: str,
    submission_data: CBTSubmissionSubmit,
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Submit a test with answers (for students)"""
    # Verify user is a student
    if not isinstance(school_context.user, Student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for students only"
        )

    student = school_context.user

    # Get submission with relationships
    result = await db.execute(
        select(CBTSubmission)
        .options(
            selectinload(CBTSubmission.test).selectinload(CBTTest.questions).selectinload(CBTQuestion.options),
            selectinload(CBTSubmission.schedule)
        )
        .where(
            CBTSubmission.id == submission_id,
            CBTSubmission.student_id == student.id,
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

    # Check if submission is in progress
    if submission.status != SubmissionStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission is not in progress"
        )

    test = submission.test
    current_time = datetime.now(timezone.utc)

    # Calculate time spent
    if submission.started_at:
        time_spent = int((current_time - submission.started_at).total_seconds())
    else:
        time_spent = 0

    # Process answers and calculate score
    total_score = Decimal('0')
    total_possible = Decimal(str(test.total_points))

    # Create a map of questions for quick lookup
    question_map = {q.id: q for q in test.questions}

    for answer_data in submission_data.answers:
        question = question_map.get(answer_data.question_id)
        if not question:
            continue

        # Find the selected option
        selected_option = None
        if answer_data.selected_option_id:
            for opt in question.options:
                if opt.id == answer_data.selected_option_id:
                    selected_option = opt
                    break

        # Determine if answer is correct
        is_correct = selected_option.is_correct if selected_option else False
        points_earned = Decimal(str(question.points)) if is_correct else Decimal('0')
        total_score += points_earned

        # Create answer record
        answer = CBTAnswer(
            submission_id=submission.id,
            question_id=question.id,
            selected_option_id=answer_data.selected_option_id,
            is_correct=is_correct,
            points_earned=points_earned,
            answered_at=current_time,
            school_id=school_context.school_id
        )
        db.add(answer)

    # Calculate percentage and pass/fail
    percentage = (total_score / total_possible * 100) if total_possible > 0 else Decimal('0')
    passed = percentage >= Decimal(str(test.pass_percentage))

    # Update submission
    submission.status = SubmissionStatus.SUBMITTED
    submission.submitted_at = current_time
    submission.time_spent_seconds = time_spent
    submission.total_score = total_score
    submission.total_possible = total_possible
    submission.percentage = percentage
    submission.passed = passed

    await db.commit()
    await db.refresh(submission)

    # Load answers for response
    result = await db.execute(
        select(CBTSubmission)
        .options(selectinload(CBTSubmission.answers))
        .where(CBTSubmission.id == submission.id)
    )
    submission = result.scalar_one()

    return CBTSubmissionResponse.model_validate(submission)


@router.get("/submissions/{submission_id}/results", response_model=CBTSubmissionResponse)
async def get_test_results(
    submission_id: str,
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get test results (for students)"""
    # Verify user is a student
    if not isinstance(school_context.user, Student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for students only"
        )

    student = school_context.user

    # Get submission with relationships
    result = await db.execute(
        select(CBTSubmission)
        .options(
            selectinload(CBTSubmission.test),
            selectinload(CBTSubmission.answers).selectinload(CBTAnswer.question).selectinload(CBTQuestion.options),
            selectinload(CBTSubmission.answers).selectinload(CBTAnswer.selected_option)
        )
        .where(
            CBTSubmission.id == submission_id,
            CBTSubmission.student_id == student.id,
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

    # Check if results should be shown
    if submission.status != SubmissionStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test not yet submitted"
        )

    test = submission.test
    if not test.show_results_immediately:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Results are not available yet"
        )

    return CBTSubmissionResponse.model_validate(submission)

