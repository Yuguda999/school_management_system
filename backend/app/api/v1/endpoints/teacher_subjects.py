from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_active_user, require_admin, get_current_school
from app.models.user import User
from app.models.school import School
from app.schemas.academic import (
    TeacherSubjectAssignmentCreate,
    TeacherSubjectAssignmentUpdate,
    TeacherSubjectAssignmentResponse,
    ClassSubjectAssignmentCreate,
    ClassSubjectAssignmentUpdate,
    ClassSubjectAssignmentResponse,
    BulkTeacherSubjectAssignment,
    BulkClassSubjectAssignment
)
from app.services.teacher_subject_service import TeacherSubjectService, ClassSubjectService

router = APIRouter()


# Teacher-Subject Assignment Endpoints
@router.post("/teachers/{teacher_id}/subjects", response_model=TeacherSubjectAssignmentResponse)
async def assign_subject_to_teacher(
    teacher_id: str,
    assignment_data: TeacherSubjectAssignmentCreate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Assign a subject to a teacher (Admin only)"""
    # Override teacher_id from URL
    assignment_data.teacher_id = teacher_id
    
    assignment = await TeacherSubjectService.assign_subject_to_teacher(
        db, assignment_data, current_school.id
    )
    return assignment


@router.post("/teachers/{teacher_id}/subjects/bulk", response_model=List[TeacherSubjectAssignmentResponse])
async def bulk_assign_subjects_to_teacher(
    teacher_id: str,
    assignment_data: BulkTeacherSubjectAssignment,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Assign multiple subjects to a teacher (Admin only)"""
    # Override teacher_id from URL
    assignment_data.teacher_id = teacher_id
    
    assignments = await TeacherSubjectService.bulk_assign_subjects_to_teacher(
        db, assignment_data, current_school.id
    )
    return assignments


@router.get("/teachers/{teacher_id}/subjects", response_model=List[TeacherSubjectAssignmentResponse])
async def get_teacher_subjects(
    teacher_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all subjects assigned to a teacher"""
    assignments = await TeacherSubjectService.get_teacher_subjects(
        db, teacher_id, current_school.id
    )
    return assignments


@router.get("/subjects/{subject_id}/teachers", response_model=List[TeacherSubjectAssignmentResponse])
async def get_subject_teachers(
    subject_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all teachers assigned to a subject"""
    assignments = await TeacherSubjectService.get_subject_teachers(
        db, subject_id, current_school.id
    )
    return assignments


@router.put("/teacher-subjects/{assignment_id}", response_model=TeacherSubjectAssignmentResponse)
async def update_teacher_subject_assignment(
    assignment_id: str,
    assignment_data: TeacherSubjectAssignmentUpdate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a teacher-subject assignment (Admin only)"""
    assignment = await TeacherSubjectService.update_teacher_subject_assignment(
        db, assignment_id, assignment_data, current_school.id
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    return assignment


@router.delete("/teacher-subjects/{assignment_id}")
async def remove_teacher_subject_assignment(
    assignment_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Remove a teacher-subject assignment (Admin only)"""
    success = await TeacherSubjectService.remove_teacher_subject_assignment(
        db, assignment_id, current_school.id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    return {"message": "Assignment removed successfully"}


# Class-Subject Assignment Endpoints
@router.post("/classes/{class_id}/subjects", response_model=ClassSubjectAssignmentResponse)
async def assign_subject_to_class(
    class_id: str,
    assignment_data: ClassSubjectAssignmentCreate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Assign a subject to a class (Admin only)"""
    # Override class_id from URL
    assignment_data.class_id = class_id
    
    assignment = await ClassSubjectService.assign_subject_to_class(
        db, assignment_data, current_school.id
    )
    return assignment


@router.post("/classes/{class_id}/subjects/bulk", response_model=List[ClassSubjectAssignmentResponse])
async def bulk_assign_subjects_to_class(
    class_id: str,
    assignment_data: BulkClassSubjectAssignment,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Assign multiple subjects to a class (Admin only)"""
    # Override class_id from URL
    assignment_data.class_id = class_id
    
    assignments = await ClassSubjectService.bulk_assign_subjects_to_class(
        db, assignment_data, current_school.id
    )
    return assignments


@router.get("/classes/{class_id}/subjects", response_model=List[ClassSubjectAssignmentResponse])
async def get_class_subjects(
    class_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all subjects assigned to a class"""
    assignments = await ClassSubjectService.get_class_subjects(
        db, class_id, current_school.id
    )
    return assignments


@router.get("/subjects/{subject_id}/classes", response_model=List[ClassSubjectAssignmentResponse])
async def get_subject_classes(
    subject_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all classes assigned to a subject"""
    assignments = await ClassSubjectService.get_subject_classes(
        db, subject_id, current_school.id
    )
    return assignments


@router.delete("/class-subjects/{assignment_id}")
async def remove_class_subject_assignment(
    assignment_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Remove a class-subject assignment (Admin only)"""
    success = await ClassSubjectService.remove_class_subject_assignment(
        db, assignment_id, current_school.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    return {"message": "Assignment removed successfully"}


@router.put("/classes/{class_id}/subjects/{assignment_id}", response_model=ClassSubjectAssignmentResponse)
async def update_class_subject_assignment(
    class_id: str,
    assignment_id: str,
    assignment_data: ClassSubjectAssignmentUpdate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a class-subject assignment (Admin only)"""
    assignment = await ClassSubjectService.update_class_subject_assignment(
        db, assignment_id, assignment_data, current_school.id
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    return assignment


@router.delete("/classes/{class_id}/subjects/{assignment_id}")
async def remove_subject_from_class(
    class_id: str,
    assignment_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Remove a subject from a class (Admin only)"""
    success = await ClassSubjectService.remove_class_subject_assignment(
        db, assignment_id, current_school.id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    return {"message": "Subject removed from class successfully"}
