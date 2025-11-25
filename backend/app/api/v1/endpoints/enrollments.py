from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_active_user, require_school_admin, get_current_school, SchoolContext
from app.models.user import User, UserRole
from app.models.school import School
from app.schemas.academic import EnrollmentCreate, EnrollmentResponse
from app.services.enrollment_service import EnrollmentService

router = APIRouter()


@router.post("/", response_model=EnrollmentResponse)
async def create_enrollment(
    enrollment_data: EnrollmentCreate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new enrollment (Admin only)"""
    enrollment = await EnrollmentService.create_enrollment(
        db, enrollment_data, current_school.id
    )
    
    # Get enrollment with related data
    enrollments = await EnrollmentService.get_enrollments(
        db, current_school.id, enrollment_id=enrollment.id, limit=1
    )
    
    if not enrollments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found after creation"
        )
    
    return enrollments[0]


@router.get("/", response_model=List[EnrollmentResponse])
async def get_enrollments(
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    class_id: Optional[str] = Query(None, description="Filter by class ID"),
    subject_id: Optional[str] = Query(None, description="Filter by subject ID"),
    term_id: Optional[str] = Query(None, description="Filter by term ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get enrollments with filtering"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    skip = (page - 1) * size
    
    enrollments = await EnrollmentService.get_enrollments(
        db=db,
        school_id=current_school.id,
        student_id=student_id,
        class_id=class_id,
        subject_id=subject_id,
        term_id=term_id,
        is_active=is_active,
        skip=skip,
        limit=size
    )
    
    return enrollments


@router.post("/auto-enroll/class/{class_id}")
async def auto_enroll_class_students(
    class_id: str,
    subject_ids: Optional[List[str]] = Query(None, description="Specific subject IDs to enroll in"),
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Automatically enroll all students in a class to class subjects (Admin only)"""
    enrollments = await EnrollmentService.auto_enroll_students_in_class_subjects(
        db, class_id, current_school.id, subject_ids
    )
    
    return {
        "message": f"Successfully enrolled {len(enrollments)} students",
        "enrollments_created": len(enrollments),
        "class_id": class_id,
        "subject_ids": subject_ids or "all class subjects"
    }


@router.post("/auto-enroll/student/{student_id}")
async def auto_enroll_student_in_class(
    student_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Automatically enroll a student in all subjects of their class (Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # First get the student's class
    from app.services.student_service import StudentService
    student = await StudentService.get_student_by_id(db, student_id, current_school.id)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if not student.current_class_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is not assigned to any class"
        )
    
    enrollments = await EnrollmentService.auto_enroll_student_in_class_subjects(
        db, student_id, student.current_class_id, current_school.id
    )
    
    return {
        "message": f"Successfully enrolled student in {len(enrollments)} subjects",
        "enrollments_created": len(enrollments),
        "student_id": student_id,
        "class_id": student.current_class_id
    }


@router.delete("/{enrollment_id}")
async def delete_enrollment(
    enrollment_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete an enrollment (Admin only)"""
    success = await EnrollmentService.delete_enrollment(
        db, enrollment_id, current_school.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    return {"message": "Enrollment deleted successfully"}


@router.get("/student/{student_id}", response_model=List[EnrollmentResponse])
async def get_student_enrollments(
    student_id: str,
    term_id: Optional[str] = Query(None, description="Filter by term ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all enrollments for a specific student"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    enrollments = await EnrollmentService.get_enrollments(
        db=db,
        school_id=current_school.id,
        student_id=student_id,
        term_id=term_id,
        is_active=is_active,
        skip=0,
        limit=1000  # Get all enrollments for the student
    )
    
    return enrollments


@router.get("/class/{class_id}", response_model=List[EnrollmentResponse])
async def get_class_enrollments(
    class_id: str,
    subject_id: Optional[str] = Query(None, description="Filter by subject ID"),
    term_id: Optional[str] = Query(None, description="Filter by term ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all enrollments for a specific class"""
    skip = (page - 1) * size
    
    enrollments = await EnrollmentService.get_enrollments(
        db=db,
        school_id=current_school.id,
        class_id=class_id,
        subject_id=subject_id,
        term_id=term_id,
        is_active=is_active,
        skip=skip,
        limit=size
    )
    
    return enrollments


@router.get("/subject/{subject_id}", response_model=List[EnrollmentResponse])
async def get_subject_enrollments(
    subject_id: str,
    class_id: Optional[str] = Query(None, description="Filter by class ID"),
    term_id: Optional[str] = Query(None, description="Filter by term ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all enrollments for a specific subject"""
    skip = (page - 1) * size
    
    enrollments = await EnrollmentService.get_enrollments(
        db=db,
        school_id=current_school.id,
        subject_id=subject_id,
        class_id=class_id,
        term_id=term_id,
        is_active=is_active,
        skip=skip,
        limit=size
    )
    
    return enrollments
