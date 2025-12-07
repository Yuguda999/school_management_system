from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_school_context, get_current_school
from app.models.user import User, UserRole
from app.models.school import School
from app.models.student import Student
from app.models.academic import Term
from app.schemas.student import (
    StudentProfileResponse,
    StudentClassHistoryResponse,
    PerformanceTrendsResponse
)
from app.schemas.grade import GradeResponse
from app.schemas.academic import TermResponse
from app.schemas.fee import FeeAssignmentResponse, FeePaymentResponse
from app.services.student_service import StudentService
from app.services.fee_service import FeeService

router = APIRouter()


async def get_current_student(
    school_context: Any = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Student:
    """Dependency to get the current authenticated student"""
    # Import here to avoid circular imports
    from app.models.student import Student as StudentModel

    # Check if the authenticated user is a student
    if isinstance(school_context.user, StudentModel):
        # User is already a Student object
        return school_context.user

    # If user is a User object with STUDENT role, look up the student record
    if hasattr(school_context.user, 'role') and school_context.user.role == UserRole.STUDENT:
        student = await StudentService.get_student_by_user_id(
            db, school_context.user.id, school_context.school_id
        )

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found for this user"
            )

        return student

    # Not a student
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only students can access this endpoint"
    )


@router.get("/profile", response_model=StudentProfileResponse)
async def get_my_profile(
    student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get authenticated student's profile"""
    # Load current class if exists
    if student.current_class_id:
        result = await db.execute(
            select(Student).options(
                selectinload(Student.current_class)
            ).where(Student.id == student.id)
        )
        student = result.scalar_one()
    
    response = StudentProfileResponse(
        id=student.id,
        admission_number=student.admission_number,
        first_name=student.first_name,
        last_name=student.last_name,
        middle_name=student.middle_name,
        full_name=student.full_name,
        date_of_birth=student.date_of_birth,
        age=student.age,
        gender=student.gender,
        email=student.email,
        phone=student.phone,
        profile_picture_url=student.profile_picture_url,
        current_class_id=student.current_class_id,
        current_class_name=student.current_class.name if student.current_class else None,
        status=student.status,
        admission_date=student.admission_date,
        guardian_name=student.guardian_name,
        guardian_phone=student.guardian_phone
    )
    
    return response


@router.get("/class-history", response_model=List[StudentClassHistoryResponse])
async def get_my_class_history(
    student: Student = Depends(get_current_student),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get authenticated student's class history"""
    history = await StudentService.get_student_class_history(
        db, student.id, current_school.id
    )
    
    response = []
    for record in history:
        response.append(StudentClassHistoryResponse(
            id=record.id,
            student_id=record.student_id,
            class_id=record.class_id,
            term_id=record.term_id,
            academic_session=record.academic_session,
            enrollment_date=record.enrollment_date,
            completion_date=record.completion_date,
            is_current=record.is_current,
            status=record.status,
            promoted_to_class_id=record.promoted_to_class_id,
            promotion_date=record.promotion_date,
            remarks=record.remarks,
            student_name=student.full_name,
            class_name=record.class_.name if record.class_ else None,
            term_name=record.term.name if record.term else None,
            promoted_to_class_name=record.promoted_to_class.name if record.promoted_to_class else None,
            created_at=record.created_at,
            updated_at=record.updated_at
        ))
    
    return response


@router.get("/grades", response_model=List[GradeResponse])
async def get_my_grades(
    term_id: Optional[str] = Query(None, description="Filter by term ID"),
    student: Student = Depends(get_current_student),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get authenticated student's grades"""
    if not term_id:
        # Get current term if not specified
        result = await db.execute(
            select(Term).where(
                Term.school_id == current_school.id,
                Term.is_current == True,
                Term.is_deleted == False
            )
        )
        current_term = result.scalar_one_or_none()
        if not current_term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No current term set. Please specify a term_id"
            )
        term_id = current_term.id
    
    grades = await StudentService.get_student_grades_for_term(
        db, student.id, term_id, current_school.id
    )
    
    response = []
    for grade in grades:
        grade_response = GradeResponse.from_orm(grade)
        if grade.subject:
            grade_response.subject_name = grade.subject.name
        if grade.exam:
            grade_response.exam_name = grade.exam.name
            grade_response.exam_type = grade.exam.exam_type
        response.append(grade_response)
    
    return response


@router.get("/grades/summary")
async def get_my_grades_summary(
    term_id: str = Query(..., description="Term ID for summary"),
    student: Student = Depends(get_current_student),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get authenticated student's grade summary for a term"""
    from app.services.grade_service import GradeService
    
    summary = await GradeService.get_student_grades_summary(
        db, student.id, term_id, current_school.id
    )
    
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No grades found for this term"
        )
    
    return summary


@router.get("/performance/trends", response_model=PerformanceTrendsResponse)
async def get_my_performance_trends(
    student: Student = Depends(get_current_student),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get authenticated student's performance trends across terms"""
    trends = await StudentService.get_student_performance_trends(
        db, student.id, current_school.id
    )
    
    return PerformanceTrendsResponse(
        student_id=trends["student_id"],
        student_name=student.full_name,
        terms=trends["terms"],
        overall_average=trends["overall_average"],
        best_term=trends["best_term"],
        improvement_trend=trends["improvement_trend"],
        subject_performance=trends["subject_performance"]
    )


@router.get("/terms", response_model=List[TermResponse])
async def get_my_terms(
    student: Student = Depends(get_current_student),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all terms the student has been enrolled in"""
    # Get unique term IDs from student's class history
    from app.models.student import StudentClassHistory
    
    result = await db.execute(
        select(StudentClassHistory.term_id).distinct().where(
            StudentClassHistory.student_id == student.id,
            StudentClassHistory.school_id == current_school.id,
            StudentClassHistory.is_deleted == False
        )
    )
    term_ids = [row[0] for row in result.all()]
    
    if not term_ids:
        # If no class history, return all active terms
        result = await db.execute(
            select(Term).where(
                Term.school_id == current_school.id,
                Term.is_active == True,
                Term.is_deleted == False
            ).order_by(Term.start_date.desc())
        )
        terms = result.scalars().all()
    else:
        # Get terms from class history
        result = await db.execute(
            select(Term).where(
                Term.id.in_(term_ids),
                Term.is_deleted == False
            ).order_by(Term.start_date.desc())
        )
        terms = result.scalars().all()
    
    return [TermResponse.from_orm(term) for term in terms]


@router.get("/fees", response_model=List[FeeAssignmentResponse])
async def get_my_fees(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    status: Optional[str] = Query(None, description="Filter by status"),
    student: Student = Depends(get_current_student),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get authenticated student's fee assignments"""
    assignments = await FeeService.get_student_fee_assignments(
        db, student.id, current_school.id, term_id, status
    )
    
    # Enhance response with related data
    response_assignments = []
    for assignment in assignments:
        assignment_response = FeeAssignmentResponse.from_orm(assignment)
        
        # Add related names
        if hasattr(assignment, 'student') and assignment.student:
            assignment_response.student_name = assignment.student.full_name
        if hasattr(assignment, 'fee_structure') and assignment.fee_structure:
            assignment_response.fee_structure_name = assignment.fee_structure.name
        if hasattr(assignment, 'term') and assignment.term:
            assignment_response.term_name = assignment.term.name
        
        response_assignments.append(assignment_response)
    
    return response_assignments


@router.get("/payments", response_model=List[FeePaymentResponse])
async def get_my_payments(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    student: Student = Depends(get_current_student),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get authenticated student's payments"""
    skip = (page - 1) * size
    payments = await FeeService.get_student_payments(
        db, student.id, current_school.id, term_id, skip, size
    )
    
    # Enhance response with related data
    response_payments = []
    for payment in payments:
        payment_response = FeePaymentResponse.from_orm(payment)
        
        # Add related names
        if hasattr(payment, 'student') and payment.student:
            payment_response.student_name = payment.student.full_name
        if hasattr(payment, 'collector') and payment.collector:
            payment_response.collector_name = payment.collector.full_name
        
        response_payments.append(payment_response)
    
    return response_payments

