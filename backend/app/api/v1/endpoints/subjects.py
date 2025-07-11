from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_active_user, require_admin, get_current_school
from app.models.user import User
from app.models.school import School
from app.schemas.academic import SubjectCreate, SubjectUpdate, SubjectResponse
from app.services.academic_service import AcademicService

router = APIRouter()


@router.post("/", response_model=SubjectResponse)
async def create_subject(
    subject_data: SubjectCreate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new subject (Admin/Super Admin only)"""
    subject = await AcademicService.create_subject(db, subject_data, current_school.id)
    return SubjectResponse.from_orm(subject)


@router.get("/", response_model=List[SubjectResponse])
async def get_subjects(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_core: Optional[bool] = Query(None, description="Filter by core subjects"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all subjects"""
    skip = (page - 1) * size
    subjects = await AcademicService.get_subjects(
        db, current_school.id, is_active, is_core, skip, size
    )
    
    return [SubjectResponse.from_orm(subject) for subject in subjects]


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get subject by ID"""
    from sqlalchemy import select
    from app.models.academic import Subject
    
    result = await db.execute(
        select(Subject).where(
            Subject.id == subject_id,
            Subject.school_id == current_school.id,
            Subject.is_deleted == False
        )
    )
    subject = result.scalar_one_or_none()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    return SubjectResponse.from_orm(subject)


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    subject_data: SubjectUpdate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update subject information (Admin/Super Admin only)"""
    from sqlalchemy import select
    from app.models.academic import Subject
    
    # Get subject
    result = await db.execute(
        select(Subject).where(
            Subject.id == subject_id,
            Subject.school_id == current_school.id,
            Subject.is_deleted == False
        )
    )
    subject = result.scalar_one_or_none()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Check code uniqueness if being updated
    if subject_data.code and subject_data.code != subject.code:
        code_result = await db.execute(
            select(Subject).where(
                Subject.code == subject_data.code,
                Subject.school_id == current_school.id,
                Subject.id != subject_id,
                Subject.is_deleted == False
            )
        )
        if code_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject code already exists"
            )
    
    # Update fields
    update_data = subject_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subject, field, value)
    
    await db.commit()
    await db.refresh(subject)
    
    return SubjectResponse.from_orm(subject)


@router.delete("/{subject_id}")
async def delete_subject(
    subject_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete subject (Admin/Super Admin only)"""
    from sqlalchemy import select
    from app.models.academic import Subject
    
    result = await db.execute(
        select(Subject).where(
            Subject.id == subject_id,
            Subject.school_id == current_school.id,
            Subject.is_deleted == False
        )
    )
    subject = result.scalar_one_or_none()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Soft delete
    subject.is_deleted = True
    await db.commit()
    
    return {"message": "Subject deleted successfully"}
