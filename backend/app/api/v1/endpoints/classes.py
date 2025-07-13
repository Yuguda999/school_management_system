from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import get_current_active_user, require_admin, get_current_school, check_teacher_can_access_class
from app.models.user import User, UserRole
from app.models.school import School
from app.models.student import Student
from app.schemas.academic import (
    ClassCreate,
    ClassUpdate,
    ClassResponse,
    TimetableEntryResponse,
    ClassTimetableResponse
)
from app.services.academic_service import AcademicService

router = APIRouter()


@router.post("/", response_model=ClassResponse)
async def create_class(
    class_data: ClassCreate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new class (Admin/Super Admin only)"""
    new_class = await AcademicService.create_class(db, class_data, current_school.id)

    # Get teacher name if assigned - use eager loading to avoid lazy loading issues
    teacher_name = None
    if new_class.teacher_id:
        result = await db.execute(
            select(User).where(User.id == new_class.teacher_id)
        )
        teacher = result.scalar_one_or_none()
        if teacher:
            teacher_name = teacher.full_name

    response = ClassResponse.from_orm(new_class)
    response.teacher_name = teacher_name

    return response


@router.get("/", response_model=List[ClassResponse])
async def get_classes(
    academic_session: Optional[str] = Query(None, description="Filter by academic session"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all classes"""
    skip = (page - 1) * size

    # Teachers can only see classes they teach or are class teachers for
    if current_user.role == UserRole.TEACHER:
        classes = await AcademicService.get_teacher_classes(
            db, current_user.id, current_school.id, academic_session, is_active, skip, size
        )
    else:
        # Admins can see all classes
        classes = await AcademicService.get_classes(
            db, current_school.id, academic_session, is_active, skip, size
        )
    
    # Enhance response with teacher names and student counts
    response_classes = []
    for class_obj in classes:
        class_response = ClassResponse.from_orm(class_obj)

        # Add teacher name - use eager loading to avoid lazy loading issues
        if class_obj.teacher_id:
            result = await db.execute(
                select(User).where(User.id == class_obj.teacher_id)
            )
            teacher = result.scalar_one_or_none()
            if teacher:
                class_response.teacher_name = teacher.full_name

        # Add student count - use a separate query to avoid lazy loading
        student_count_result = await db.execute(
            select(func.count(Student.id)).where(
                Student.current_class_id == class_obj.id,
                Student.is_deleted == False
            )
        )
        class_response.student_count = student_count_result.scalar() or 0

        response_classes.append(class_response)

    return response_classes


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get class by ID"""
    class_obj = await AcademicService.get_class_by_id(db, class_id, current_school.id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    # Check permissions for teachers
    if current_user.role == UserRole.TEACHER:
        can_access = await check_teacher_can_access_class(
            db, current_user.id, class_id, current_school.id
        )
        if not can_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

    response = ClassResponse.from_orm(class_obj)

    # Add teacher name - use eager loading to avoid lazy loading issues
    if class_obj.teacher_id:
        result = await db.execute(
            select(User).where(User.id == class_obj.teacher_id)
        )
        teacher = result.scalar_one_or_none()
        if teacher:
            response.teacher_name = teacher.full_name

    # Add student count - use a separate query to avoid lazy loading
    student_count_result = await db.execute(
        select(func.count(Student.id)).where(
            Student.current_class_id == class_id,
            Student.is_deleted == False
        )
    )
    response.student_count = student_count_result.scalar() or 0

    return response


@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: str,
    class_data: ClassUpdate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update class information (Admin/Super Admin only)"""
    updated_class = await AcademicService.update_class(
        db, class_id, current_school.id, class_data
    )

    if not updated_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    response = ClassResponse.from_orm(updated_class)

    # Add teacher name - use eager loading to avoid lazy loading issues
    if updated_class.teacher_id:
        result = await db.execute(
            select(User).where(User.id == updated_class.teacher_id)
        )
        teacher = result.scalar_one_or_none()
        if teacher:
            response.teacher_name = teacher.full_name

    return response


@router.delete("/{class_id}")
async def delete_class(
    class_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete class (Admin/Super Admin only)"""
    class_obj = await AcademicService.get_class_by_id(db, class_id, current_school.id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Soft delete
    class_obj.is_deleted = True
    await db.commit()
    
    return {"message": "Class deleted successfully"}


@router.get("/{class_id}/timetable", response_model=List[TimetableEntryResponse])
async def get_class_timetable(
    class_id: str,
    term_id: str = Query(..., description="Term ID"),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get timetable for a specific class"""
    # Verify class exists
    class_obj = await AcademicService.get_class_by_id(db, class_id, current_school.id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    timetable_entries = await AcademicService.get_class_timetable(
        db, class_id, term_id, current_school.id
    )
    
    # Enhance response with related data
    response_entries = []
    for entry in timetable_entries:
        entry_response = TimetableEntryResponse.from_orm(entry)
        
        # Add related names (you might want to optimize this with joins)
        if hasattr(entry, 'class_') and entry.class_:
            entry_response.class_name = entry.class_.name
        if hasattr(entry, 'subject') and entry.subject:
            entry_response.subject_name = entry.subject.name
        if hasattr(entry, 'teacher') and entry.teacher:
            entry_response.teacher_name = entry.teacher.full_name
        if hasattr(entry, 'term') and entry.term:
            entry_response.term_name = entry.term.name
        
        response_entries.append(entry_response)
    
    return response_entries
