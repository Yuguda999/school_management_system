from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_active_user, require_admin, get_current_school
from app.models.user import User
from app.models.school import School
from app.models.academic import Term
from app.schemas.academic import TermCreate, TermUpdate, TermResponse
from app.services.academic_service import AcademicService

router = APIRouter()


@router.post("/", response_model=TermResponse)
async def create_term(
    term_data: TermCreate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new term (Admin/Super Admin only)"""
    term = await AcademicService.create_term(db, term_data, current_school.id)
    return TermResponse.from_orm(term)


@router.get("/", response_model=List[TermResponse])
async def get_terms(
    academic_session: Optional[str] = Query(None, description="Filter by academic session"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_current: Optional[bool] = Query(None, description="Filter by current term"),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all terms"""
    query = select(Term).where(
        Term.school_id == current_school.id,
        Term.is_deleted == False
    )
    
    if academic_session:
        query = query.where(Term.academic_session == academic_session)
    
    if is_active is not None:
        query = query.where(Term.is_active == is_active)
    
    if is_current is not None:
        query = query.where(Term.is_current == is_current)
    
    query = query.order_by(Term.academic_session.desc(), Term.start_date.desc())
    
    result = await db.execute(query)
    terms = result.scalars().all()
    
    return [TermResponse.from_orm(term) for term in terms]


@router.get("/current", response_model=TermResponse)
async def get_current_term(
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get current term"""
    result = await db.execute(
        select(Term).where(
            Term.school_id == current_school.id,
            Term.is_current == True,
            Term.is_deleted == False
        )
    )
    term = result.scalar_one_or_none()
    
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No current term set"
        )
    
    return TermResponse.from_orm(term)


@router.get("/{term_id}", response_model=TermResponse)
async def get_term(
    term_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get term by ID"""
    result = await db.execute(
        select(Term).where(
            Term.id == term_id,
            Term.school_id == current_school.id,
            Term.is_deleted == False
        )
    )
    term = result.scalar_one_or_none()
    
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found"
        )
    
    return TermResponse.from_orm(term)


@router.put("/{term_id}", response_model=TermResponse)
async def update_term(
    term_id: str,
    term_data: TermUpdate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update term information (Admin/Super Admin only)"""
    result = await db.execute(
        select(Term).where(
            Term.id == term_id,
            Term.school_id == current_school.id,
            Term.is_deleted == False
        )
    )
    term = result.scalar_one_or_none()
    
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found"
        )
    
    # Update fields
    update_data = term_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(term, field, value)
    
    await db.commit()
    await db.refresh(term)
    
    return TermResponse.from_orm(term)


@router.post("/{term_id}/set-current")
async def set_current_term(
    term_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Set term as current (Admin/Super Admin only)"""
    success = await AcademicService.set_current_term(db, term_id, current_school.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found"
        )
    
    return {"message": "Term set as current successfully"}


@router.delete("/{term_id}")
async def delete_term(
    term_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete term (Admin/Super Admin only)"""
    result = await db.execute(
        select(Term).where(
            Term.id == term_id,
            Term.school_id == current_school.id,
            Term.is_deleted == False
        )
    )
    term = result.scalar_one_or_none()
    
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found"
        )
    
    # Soft delete
    term.is_deleted = True
    await db.commit()
    
    return {"message": "Term deleted successfully"}
