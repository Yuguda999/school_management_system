"""
Academic Sessions API Endpoints

This module provides endpoints for managing academic sessions.
"""

from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_school_admin, SchoolContext, get_current_school_context
from app.models.academic_session import SessionStatus
from app.schemas.academic_session import (
    AcademicSessionCreate,
    AcademicSessionUpdate,
    AcademicSessionResponse,
    AcademicSessionWithTermsResponse,
)
from app.services.session_service import SessionService


router = APIRouter()


@router.post("/", response_model=AcademicSessionResponse)
async def create_session(
    session_data: AcademicSessionCreate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new academic session.
    
    This creates the session record. Terms should be created separately
    using the bulk term creation endpoint.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    session = await SessionService.create_session(db, current_school.id, session_data)
    return AcademicSessionResponse.model_validate(session)


@router.get("/", response_model=List[AcademicSessionResponse])
async def get_sessions(
    status_filter: Optional[SessionStatus] = Query(None, description="Filter by session status"),
    is_current: Optional[bool] = Query(None, description="Filter by current session"),
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all academic sessions for the school."""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    sessions = await SessionService.get_sessions(
        db, current_school.id, status_filter, is_current
    )
    return [AcademicSessionResponse.model_validate(s) for s in sessions]


@router.get("/current", response_model=AcademicSessionWithTermsResponse)
async def get_current_session(
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get the current active academic session."""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    session = await SessionService.get_current_session(db, current_school.id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No current academic session set"
        )
    
    return AcademicSessionWithTermsResponse.model_validate(session)


@router.get("/{session_id}", response_model=AcademicSessionWithTermsResponse)
async def get_session(
    session_id: str,
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific academic session by ID."""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    session = await SessionService.get_session(db, session_id, current_school.id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic session not found"
        )
    
    return AcademicSessionWithTermsResponse.model_validate(session)


@router.put("/{session_id}", response_model=AcademicSessionResponse)
async def update_session(
    session_id: str,
    session_data: AcademicSessionUpdate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update an academic session."""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    session = await SessionService.update_session(
        db, session_id, current_school.id, session_data
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic session not found"
        )
    
    return AcademicSessionResponse.model_validate(session)


@router.post("/{session_id}/start")
async def start_session(
    session_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Start/activate an academic session.
    
    This will set the session as active and current, and unset any
    other session that was current.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    session = await SessionService.start_session(db, current_school.id, session_id)
    
    return {
        "message": f"Academic session '{session.name}' is now active",
        "session_id": session.id
    }


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Complete an academic session.
    
    This should be done after all terms have ended. Typically followed
    by running promotions.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    session = await SessionService.complete_session(db, current_school.id, session_id)
    
    return {
        "message": f"Academic session '{session.name}' has been completed",
        "session_id": session.id,
        "next_step": "You can now run student promotions for this session"
    }


@router.post("/{session_id}/archive")
async def archive_session(
    session_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Archive a completed academic session."""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    session = await SessionService.archive_session(db, current_school.id, session_id)
    
    return {
        "message": f"Academic session '{session.name}' has been archived",
        "session_id": session.id
    }


@router.post("/{session_id}/set-current")
async def set_current_session(
    session_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Set an academic session as the current one."""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    session = await SessionService.set_current_session(db, current_school.id, session_id)
    
    return {
        "message": f"Academic session '{session.name}' is now current",
        "session_id": session.id
    }


@router.post("/{session_id}/link-terms")
async def link_terms_to_session(
    session_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Link existing terms to this academic session.
    
    This is useful for migrating existing data where terms have the
    academic_session string but not the academic_session_id FK.
    """
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    count = await SessionService.link_terms_to_session(db, current_school.id, session_id)
    
    return {
        "message": f"Linked {count} terms to the academic session",
        "terms_linked": count
    }


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Soft delete an academic session."""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    success = await SessionService.delete_session(db, current_school.id, session_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic session not found"
        )
    
    return {"message": "Academic session deleted successfully"}
