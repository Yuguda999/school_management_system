from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user, 
    require_admin, 
    require_teacher_or_admin,
    get_current_school
)
from app.models.user import User, UserRole
from app.models.school import School
from app.models.grade import ExamType
from app.schemas.grade import (
    ExamCreate,
    ExamUpdate,
    ExamResponse,
    GradeCreate,
    GradeUpdate,
    GradeResponse,
    BulkGradeCreate,
    StudentGradesSummary,
    ClassGradesSummary,
    ReportCardCreate,
    ReportCardUpdate,
    ReportCardResponse,
    GradeStatistics
)
from app.services.grade_service import GradeService

router = APIRouter()


# Exam Management Endpoints
@router.post("/exams", response_model=ExamResponse)
async def create_exam(
    exam_data: ExamCreate,
    current_user: User = Depends(require_teacher_or_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new exam (Teacher/Admin only)"""
    exam = await GradeService.create_exam(
        db, exam_data, current_school.id, current_user.id
    )
    
    # Prepare response with additional data
    response = ExamResponse.from_orm(exam)
    if exam.creator:
        response.creator_name = exam.creator.full_name
    if exam.subject:
        response.subject_name = exam.subject.name
    if exam.class_:
        response.class_name = exam.class_.name
    if exam.term:
        response.term_name = exam.term.name
    
    return response


@router.get("/exams", response_model=List[ExamResponse])
async def get_exams(
    subject_id: Optional[str] = Query(None, description="Filter by subject"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    exam_type: Optional[ExamType] = Query(None, description="Filter by exam type"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all exams with filtering"""
    skip = (page - 1) * size
    exams = await GradeService.get_exams(
        db, current_school.id, subject_id, class_id, term_id, 
        exam_type, is_published, is_active, skip, size
    )
    
    response_exams = []
    for exam in exams:
        exam_response = ExamResponse.from_orm(exam)
        if exam.creator:
            exam_response.creator_name = exam.creator.full_name
        if exam.subject:
            exam_response.subject_name = exam.subject.name
        if exam.class_:
            exam_response.class_name = exam.class_.name
        if exam.term:
            exam_response.term_name = exam.term.name
        
        # Add grade statistics
        exam_response.total_students = len(exam.grades) if exam.grades else 0
        exam_response.graded_students = len([g for g in exam.grades if g.is_published]) if exam.grades else 0
        
        response_exams.append(exam_response)
    
    return response_exams


@router.get("/exams/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get exam by ID"""
    exam = await GradeService.get_exam_by_id(db, exam_id, current_school.id)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    response = ExamResponse.from_orm(exam)
    if exam.creator:
        response.creator_name = exam.creator.full_name
    if exam.subject:
        response.subject_name = exam.subject.name
    if exam.class_:
        response.class_name = exam.class_.name
    if exam.term:
        response.term_name = exam.term.name
    
    # Add grade statistics
    response.total_students = len(exam.grades) if exam.grades else 0
    response.graded_students = len([g for g in exam.grades if g.is_published]) if exam.grades else 0
    
    return response


@router.put("/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: str,
    exam_data: ExamUpdate,
    current_user: User = Depends(require_teacher_or_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update exam (Teacher/Admin only)"""
    exam = await GradeService.update_exam(db, exam_id, exam_data, current_school.id)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    response = ExamResponse.from_orm(exam)
    if exam.creator:
        response.creator_name = exam.creator.full_name
    if exam.subject:
        response.subject_name = exam.subject.name
    if exam.class_:
        response.class_name = exam.class_.name
    if exam.term:
        response.term_name = exam.term.name
    
    return response


@router.delete("/exams/{exam_id}")
async def delete_exam(
    exam_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete exam (Admin only)"""
    success = await GradeService.delete_exam(db, exam_id, current_school.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    return {"message": "Exam deleted successfully"}


# Grade Management Endpoints
@router.post("/grades", response_model=GradeResponse)
async def create_grade(
    grade_data: GradeCreate,
    current_user: User = Depends(require_teacher_or_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new grade (Teacher/Admin only)"""
    grade = await GradeService.create_grade(
        db, grade_data, current_school.id, current_user.id
    )
    
    # Prepare response with additional data
    response = GradeResponse.from_orm(grade)
    if grade.grader:
        response.grader_name = grade.grader.full_name
    if grade.student:
        response.student_name = grade.student.full_name
    if grade.subject:
        response.subject_name = grade.subject.name
    if grade.exam:
        response.exam_name = grade.exam.name
    
    return response


@router.post("/grades/bulk", response_model=List[GradeResponse])
async def create_bulk_grades(
    bulk_data: BulkGradeCreate,
    current_user: User = Depends(require_teacher_or_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create multiple grades for an exam (Teacher/Admin only)"""
    grades = await GradeService.create_bulk_grades(
        db, bulk_data, current_school.id, current_user.id
    )
    
    response_grades = []
    for grade in grades:
        grade_response = GradeResponse.from_orm(grade)
        if grade.grader:
            grade_response.grader_name = grade.grader.full_name
        if grade.student:
            grade_response.student_name = grade.student.full_name
        if grade.subject:
            grade_response.subject_name = grade.subject.name
        if grade.exam:
            grade_response.exam_name = grade.exam.name
        
        response_grades.append(grade_response)
    
    return response_grades


@router.get("/grades", response_model=List[GradeResponse])
async def get_grades(
    student_id: Optional[str] = Query(None, description="Filter by student"),
    subject_id: Optional[str] = Query(None, description="Filter by subject"),
    exam_id: Optional[str] = Query(None, description="Filter by exam"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all grades with filtering"""
    # Students can only see their own published grades
    if current_user.role == UserRole.STUDENT:
        student_id = current_user.student.id if current_user.student else None
        is_published = True
    
    skip = (page - 1) * size
    grades = await GradeService.get_grades(
        db, current_school.id, student_id, subject_id, exam_id, 
        term_id, class_id, is_published, skip, size
    )
    
    response_grades = []
    for grade in grades:
        grade_response = GradeResponse.from_orm(grade)
        if grade.grader:
            grade_response.grader_name = grade.grader.full_name
        if grade.student:
            grade_response.student_name = grade.student.full_name
        if grade.subject:
            grade_response.subject_name = grade.subject.name
        if grade.exam:
            grade_response.exam_name = grade.exam.name
        
        response_grades.append(grade_response)
    
    return response_grades


@router.get("/grades/{grade_id}", response_model=GradeResponse)
async def get_grade(
    grade_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get grade by ID"""
    grade = await GradeService.get_grade_by_id(db, grade_id, current_school.id)
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )

    # Students can only see their own published grades
    if current_user.role == UserRole.STUDENT:
        if grade.student_id != current_user.student.id or not grade.is_published:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

    response = GradeResponse.from_orm(grade)
    if grade.grader:
        response.grader_name = grade.grader.full_name
    if grade.student:
        response.student_name = grade.student.full_name
    if grade.subject:
        response.subject_name = grade.subject.name
    if grade.exam:
        response.exam_name = grade.exam.name

    return response


@router.put("/grades/{grade_id}", response_model=GradeResponse)
async def update_grade(
    grade_id: str,
    grade_data: GradeUpdate,
    current_user: User = Depends(require_teacher_or_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update grade (Teacher/Admin only)"""
    grade = await GradeService.update_grade(db, grade_id, grade_data, current_school.id)
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )

    response = GradeResponse.from_orm(grade)
    if grade.grader:
        response.grader_name = grade.grader.full_name
    if grade.student:
        response.student_name = grade.student.full_name
    if grade.subject:
        response.subject_name = grade.subject.name
    if grade.exam:
        response.exam_name = grade.exam.name

    return response


@router.delete("/grades/{grade_id}")
async def delete_grade(
    grade_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete grade (Admin only)"""
    success = await GradeService.delete_grade(db, grade_id, current_school.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )

    return {"message": "Grade deleted successfully"}


# Report and Analytics Endpoints
@router.get("/students/{student_id}/summary", response_model=StudentGradesSummary)
async def get_student_grades_summary(
    student_id: str,
    term_id: str = Query(..., description="Term ID for the summary"),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get comprehensive grade summary for a student"""
    # Students can only see their own summary
    if current_user.role == UserRole.STUDENT:
        if student_id != current_user.student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

    summary = await GradeService.get_student_grades_summary(
        db, student_id, term_id, current_school.id
    )
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student or term not found"
        )

    return summary


@router.get("/classes/{class_id}/exams/{exam_id}/summary", response_model=ClassGradesSummary)
async def get_class_grades_summary(
    class_id: str,
    exam_id: str,
    current_user: User = Depends(require_teacher_or_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get grade summary for a class in a specific exam (Teacher/Admin only)"""
    summary = await GradeService.get_class_grades_summary(
        db, class_id, exam_id, current_school.id
    )
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class or exam not found"
        )

    return summary


@router.post("/report-cards", response_model=ReportCardResponse)
async def create_report_card(
    report_data: ReportCardCreate,
    current_user: User = Depends(require_teacher_or_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a report card for a student (Teacher/Admin only)"""
    report_card = await GradeService.create_report_card(
        db, report_data, current_school.id, current_user.id
    )

    # Prepare response with additional data
    response = ReportCardResponse.from_orm(report_card)
    # Add related data if needed

    return response


@router.get("/statistics", response_model=GradeStatistics)
async def get_grade_statistics(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    current_user: User = Depends(require_teacher_or_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get comprehensive grade statistics (Teacher/Admin only)"""
    statistics = await GradeService.get_grade_statistics(
        db, current_school.id, term_id, class_id
    )

    return statistics
