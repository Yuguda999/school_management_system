from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, distinct
from app.core.database import get_db
from app.core.deps import get_current_active_user, get_current_school
from app.models.user import User
from app.models.school import School
from app.models.academic import Term

router = APIRouter()


@router.get("/", response_model=List[str])
async def get_academic_sessions(
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all academic sessions for the school"""
    result = await db.execute(
        select(distinct(Term.academic_session))
        .where(
            Term.school_id == current_school.id,
            Term.is_deleted == False
        )
        .order_by(Term.academic_session.desc())
    )
    sessions = result.scalars().all()
    return list(sessions)


@router.get("/current", response_model=str)
async def get_current_academic_session(
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get current academic session"""
    # Get the current term's academic session
    result = await db.execute(
        select(Term.academic_session)
        .where(
            Term.school_id == current_school.id,
            Term.is_current == True,
            Term.is_deleted == False
        )
    )
    current_session = result.scalar_one_or_none()
    
    if not current_session:
        # If no current term is set, get the latest academic session
        result = await db.execute(
            select(Term.academic_session)
            .where(
                Term.school_id == current_school.id,
                Term.is_deleted == False
            )
            .order_by(Term.academic_session.desc())
            .limit(1)
        )
        current_session = result.scalar_one_or_none()
    
    if not current_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No academic session found"
        )
    
    return current_session
