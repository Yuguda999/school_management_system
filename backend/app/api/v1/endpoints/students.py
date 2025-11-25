from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_school_admin,
    require_school_admin_user,
    get_current_school,
    get_current_school_context,
    SchoolContext,
    check_teacher_can_access_student,
    check_teacher_can_access_subject
)
from app.models.user import User, UserRole
from app.models.school import School
from app.models.student import Student, StudentStatus
from app.schemas.student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    StudentListResponse,
    StudentStatusUpdate,
    StudentClassUpdate,
    StudentImportResult
)
from app.services.csv_import_service import CSVImportService
from app.services.student_service import StudentService
import math

router = APIRouter()


async def enhance_student_response(
    student: Student,
    db: AsyncSession
) -> StudentResponse:
    """Helper function to enhance student response with related data"""
    response = StudentResponse.from_orm(student)

    # Compute full_name manually
    if student.middle_name:
        response.full_name = f"{student.first_name} {student.middle_name} {student.last_name}"
    else:
        response.full_name = f"{student.first_name} {student.last_name}"

    # Compute age manually
    from datetime import date, datetime
    today = date.today()

    # Handle date_of_birth conversion if it's a string
    if isinstance(student.date_of_birth, str):
        try:
            # Try parsing different date formats
            if 'T' in student.date_of_birth:
                # ISO format with time
                birth_date = datetime.fromisoformat(student.date_of_birth.replace('Z', '+00:00')).date()
            else:
                # Try common date formats
                for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y']:
                    try:
                        birth_date = datetime.strptime(student.date_of_birth, fmt).date()
                        break
                    except ValueError:
                        continue
                else:
                    # If no format works, set age to None
                    response.age = None
                    birth_date = None
        except (ValueError, AttributeError):
            response.age = None
            birth_date = None
    else:
        birth_date = student.date_of_birth

    # Calculate age if we have a valid birth date
    if birth_date:
        response.age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    else:
        response.age = None

    # Load parent name if exists
    if student.parent_id:
        parent_result = await db.execute(
            select(User).where(User.id == student.parent_id)
        )
        parent = parent_result.scalar_one_or_none()
        if parent:
            response.parent_name = parent.full_name

    # Load class name if exists
    if student.current_class_id:
        from app.models.academic import Class
        class_result = await db.execute(
            select(Class).where(Class.id == student.current_class_id)
        )
        current_class = class_result.scalar_one_or_none()
        if current_class:
            response.current_class_name = current_class.name

    return response


@router.post("/", response_model=StudentResponse)
async def create_student(
    student_data: StudentCreate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new student (Admin/Super Admin only)"""
    # Check if admission number already exists
    result = await db.execute(
        select(Student).where(
            Student.admission_number == student_data.admission_number,
            Student.school_id == school_context.school_id,
            Student.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admission number already exists"
        )

    # Create student
    student_dict = student_data.dict()
    student_dict['school_id'] = school_context.school_id
    
    student = Student(**student_dict)
    db.add(student)
    await db.commit()
    await db.refresh(student)
    
    # Enhance response with related data
    return await enhance_student_response(student, db)


@router.get("/", response_model=StudentListResponse)
async def get_students(
    class_id: Optional[str] = Query(None, description="Filter by class"),
    status: Optional[StudentStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name or admission number"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=1000),
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get students with filtering and pagination"""
    current_user = school_context.user
    current_school = school_context.school

    # Build query
    query = select(Student).options(
        selectinload(Student.current_class)
    ).where(
        Student.school_id == school_context.school_id,
        Student.is_deleted == False
    )
    
    # Apply filters
    if class_id:
        query = query.where(Student.current_class_id == class_id)
    
    if status:
        query = query.where(Student.status == status)
    
    if search:
        search_filter = or_(
            Student.first_name.ilike(f"%{search}%"),
            Student.last_name.ilike(f"%{search}%"),
            Student.admission_number.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    # Role-based filtering
    if current_user.role == UserRole.PARENT:
        # Parents can only see their children
        query = query.where(Student.parent_id == current_user.id)
    elif current_user.role == UserRole.TEACHER:
        # Teachers can only see students in their classes/subjects
        from app.services.student_service import StudentService

        skip = (page - 1) * size
        students = await StudentService.get_teacher_students(
            db, current_user.id, school_context.school_id, class_id, search, skip, size
        )
        total = await StudentService.get_teacher_students_count(
            db, current_user.id, school_context.school_id, class_id
        )

        # Enhance response
        response_students = []
        for student in students:
            student_response = await enhance_student_response(student, db)
            response_students.append(student_response)

        pages = math.ceil(total / size) if total > 0 else 1

        return StudentListResponse(
            items=response_students,
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    # For admins, continue with normal query
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    skip = (page - 1) * size
    query = query.offset(skip).limit(size)
    result = await db.execute(query)
    students = result.scalars().all()

    # Enhance response
    response_students = []
    for student in students:
        student_response = await enhance_student_response(student, db)
        response_students.append(student_response)

    pages = math.ceil(total / size) if total > 0 else 1

    return StudentListResponse(
        items=response_students,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get student by ID"""
    result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.school_id == current_school.id,
            Student.is_deleted == False
        )
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    # Check permissions based on role
    if current_user.role == UserRole.PARENT:
        # Parents can only view their children
        if student.parent_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role == UserRole.TEACHER:
        # Teachers can only view students in their classes/subjects
        can_access = await check_teacher_can_access_student(
            db, current_user.id, student_id, current_school.id
        )
        if not can_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

    # Enhance response
    return await enhance_student_response(student, db)


@router.get("/by-subject/{subject_id}", response_model=List[StudentResponse])
async def get_students_by_subject(
    subject_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get students enrolled in a specific subject (Teacher only for their subjects, Admins can view all)"""
    # Teachers can only access their own subjects, admins can access all
    if current_user.role == UserRole.TEACHER:
        # Check if teacher teaches this subject
        can_access_subject = await check_teacher_can_access_subject(
            db, current_user.id, subject_id, current_school.id
        )
        if not can_access_subject:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view students for subjects you teach"
            )
    elif current_user.role not in [UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PLATFORM_SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can access students by subject"
        )

    skip = (page - 1) * size

    # For teachers, get students by teacher-subject relationship
    # For admins, get all students enrolled in the subject
    if current_user.role == UserRole.TEACHER:
        students = await StudentService.get_students_by_teacher_subject(
            db, current_user.id, subject_id, current_school.id, skip, size
        )
    else:
        # Admin access - get all students enrolled in the subject
        students = await StudentService.get_students_by_subject(
            db, subject_id, current_school.id, skip, size
        )

    # Enhance response with related data
    enhanced_students = []
    for student in students:
        enhanced_student = await enhance_student_response(student, db)
        enhanced_students.append(enhanced_student)

    return enhanced_students


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    student_data: StudentUpdate,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update student information (Admin/Super Admin only)"""
    result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.school_id == current_school.id,
            Student.is_deleted == False
        )
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Update fields
    update_data = student_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)
    
    await db.commit()
    await db.refresh(student)
    
    # Enhance response
    return await enhance_student_response(student, db)


@router.put("/{student_id}/status", response_model=StudentResponse)
async def update_student_status(
    student_id: str,
    status_data: StudentStatusUpdate,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update student status (Admin/Super Admin only)"""
    result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.school_id == current_school.id,
            Student.is_deleted == False
        )
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    student.status = status_data.status
    await db.commit()
    await db.refresh(student)
    
    # Enhance response
    response = StudentResponse.from_orm(student)
    response.full_name = student.full_name
    response.age = student.age
    
    return response


@router.put("/{student_id}/class", response_model=StudentResponse)
async def update_student_class(
    student_id: str,
    class_data: StudentClassUpdate,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update student class (Admin/Super Admin only)"""
    result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.school_id == current_school.id,
            Student.is_deleted == False
        )
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    student.current_class_id = class_data.current_class_id
    await db.commit()
    await db.refresh(student)
    
    # Enhance response
    return await enhance_student_response(student, db)


@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete student (Admin/Super Admin only)"""
    result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.school_id == current_school.id,
            Student.is_deleted == False
        )
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Soft delete
    student.is_deleted = True
    await db.commit()
    
    return {"message": "Student deleted successfully"}


@router.get("/import/template")
async def download_csv_template(
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school)
) -> Response:
    """Download CSV template for student import (Super Admin only)"""
    csv_content = CSVImportService.generate_csv_template()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=student_import_template_{current_school.name.replace(' ', '_')}.csv"
        }
    )


@router.post("/import", response_model=StudentImportResult)
async def import_students_from_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Import students from CSV file (Super Admin only)"""
    # Validate file size (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size too large. Maximum size is 10MB"
        )

    # Process the CSV import
    try:
        result = await CSVImportService.process_csv_import(file, current_school.id, db)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV file: {str(e)}"
        )
