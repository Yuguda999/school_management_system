"""
Session Service - Manages academic session lifecycle

This service handles:
- Creating and managing academic sessions
- Session status transitions (upcoming -> active -> completed -> archived)
- Setting current session
- Session completion and archival
"""

from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import date
import uuid

from app.models.academic_session import AcademicSession, SessionStatus
from app.models.academic import Term, TermType
from app.models.school import School
from app.schemas.academic_session import (
    AcademicSessionCreate,
    AcademicSessionUpdate,
    AcademicSessionResponse,
    AcademicSessionWithTermsResponse,
)


class SessionService:
    """Service for managing academic session lifecycle"""
    
    @staticmethod
    async def create_session(
        db: AsyncSession,
        school_id: str,
        session_data: AcademicSessionCreate
    ) -> AcademicSession:
        """
        Create a new academic session.
        
        This creates the session record but does NOT create terms.
        Terms should be created separately using the bulk term creation endpoint.
        """
        # Check if session already exists for this school
        existing_result = await db.execute(
            select(AcademicSession).where(
                AcademicSession.name == session_data.name,
                AcademicSession.school_id == school_id,
                AcademicSession.is_deleted == False
            )
        )
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Academic session '{session_data.name}' already exists"
            )
        
        # Create the session
        session = AcademicSession(
            id=str(uuid.uuid4()),
            name=session_data.name,
            start_date=session_data.start_date,
            end_date=session_data.end_date,
            term_count=session_data.term_count,
            status=SessionStatus.UPCOMING,
            is_current=False,
            promotion_completed=False,
            school_id=school_id
        )
        
        db.add(session)
        # Note: Terms are created manually via the Term Management page.
        # The session's term_count defines the maximum number of terms allowed.
        await db.commit()
        await db.refresh(session)
        
        return session
    
    @staticmethod
    async def get_session(
        db: AsyncSession,
        session_id: str,
        school_id: str
    ) -> Optional[AcademicSession]:
        """Get an academic session by ID"""
        result = await db.execute(
            select(AcademicSession)
            .options(selectinload(AcademicSession.terms))
            .where(
                AcademicSession.id == session_id,
                AcademicSession.school_id == school_id,
                AcademicSession.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_sessions(
        db: AsyncSession,
        school_id: str,
        status_filter: Optional[SessionStatus] = None,
        is_current: Optional[bool] = None
    ) -> List[AcademicSession]:
        """Get all academic sessions for a school"""
        query = select(AcademicSession).where(
            AcademicSession.school_id == school_id,
            AcademicSession.is_deleted == False
        )
        
        if status_filter:
            query = query.where(AcademicSession.status == status_filter)
        
        if is_current is not None:
            query = query.where(AcademicSession.is_current == is_current)
        
        query = query.order_by(AcademicSession.start_date.desc())
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_current_session(
        db: AsyncSession,
        school_id: str
    ) -> Optional[AcademicSession]:
        """Get the current active academic session for a school"""
        result = await db.execute(
            select(AcademicSession)
            .options(selectinload(AcademicSession.terms))
            .where(
                AcademicSession.school_id == school_id,
                AcademicSession.is_current == True,
                AcademicSession.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_session(
        db: AsyncSession,
        session_id: str,
        school_id: str,
        session_data: AcademicSessionUpdate
    ) -> Optional[AcademicSession]:
        """Update an academic session"""
        session = await SessionService.get_session(db, session_id, school_id)
        
        if not session:
            return None
        
        update_data = session_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(session, field, value)
        
        await db.commit()
        await db.refresh(session)
        
        return session
    
    @staticmethod
    async def start_session(
        db: AsyncSession,
        school_id: str,
        session_id: str
    ) -> AcademicSession:
        """
        Start/activate an academic session.
        
        This will:
        1. Set the session status to ACTIVE
        2. Set is_current to True
        3. Unset is_current from any other session
        """
        session = await SessionService.get_session(db, session_id, school_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic session not found"
            )
        
        if session.status == SessionStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot start a completed session"
            )
        
        if session.status == SessionStatus.ARCHIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot start an archived session"
            )
        
        # Unset current from all other sessions
        all_sessions = await SessionService.get_sessions(db, school_id)
        for s in all_sessions:
            if s.is_current:
                s.is_current = False
        
        # Set this session as active and current
        session.status = SessionStatus.ACTIVE
        session.is_current = True
        
        await db.commit()
        await db.refresh(session)
        
        return session
    
    @staticmethod
    async def complete_session(
        db: AsyncSession,
        school_id: str,
        session_id: str
    ) -> AcademicSession:
        """
        Complete an academic session.
        
        This marks the session as completed. It should typically be done
        after all terms have ended and promotions have been processed.
        """
        session = await SessionService.get_session(db, session_id, school_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic session not found"
            )
        
        if session.status != SessionStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only active sessions can be completed"
            )
        
        # Check if all terms have ended
        today = date.today()
        terms_result = await db.execute(
            select(Term).where(
                Term.academic_session_id == session_id,
                Term.is_deleted == False
            )
        )
        terms = terms_result.scalars().all()
        
        ongoing_terms = [t for t in terms if t.end_date >= today]
        if ongoing_terms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot complete session: {len(ongoing_terms)} term(s) are still ongoing"
            )
        
        session.status = SessionStatus.COMPLETED
        session.is_current = False
        
        await db.commit()
        await db.refresh(session)
        
        return session
    
    @staticmethod
    async def archive_session(
        db: AsyncSession,
        school_id: str,
        session_id: str
    ) -> AcademicSession:
        """Archive a completed session"""
        session = await SessionService.get_session(db, session_id, school_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic session not found"
            )
        
        if session.status != SessionStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only completed sessions can be archived"
            )
        
        session.status = SessionStatus.ARCHIVED
        
        await db.commit()
        await db.refresh(session)
        
        return session
    
    @staticmethod
    async def set_current_session(
        db: AsyncSession,
        school_id: str,
        session_id: str
    ) -> AcademicSession:
        """Set an academic session as the current one"""
        session = await SessionService.get_session(db, session_id, school_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic session not found"
            )
        
        if session.status in [SessionStatus.COMPLETED, SessionStatus.ARCHIVED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot set a completed or archived session as current"
            )
        
        # Unset current from all sessions
        all_sessions = await SessionService.get_sessions(db, school_id)
        for s in all_sessions:
            if s.is_current:
                s.is_current = False
        
        # Set this session as current
        session.is_current = True
        if session.status == SessionStatus.UPCOMING:
            session.status = SessionStatus.ACTIVE
        
        await db.commit()
        await db.refresh(session)
        
        return session
    
    @staticmethod
    async def link_terms_to_session(
        db: AsyncSession,
        school_id: str,
        session_id: str
    ) -> int:
        """
        Link existing terms (by academic_session string) to the AcademicSession record.
        
        This is useful for migrating existing data.
        Returns the number of terms linked.
        """
        session = await SessionService.get_session(db, session_id, school_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic session not found"
            )
        
        # Find terms with matching academic_session string
        result = await db.execute(
            select(Term).where(
                Term.academic_session == session.name,
                Term.school_id == school_id,
                Term.is_deleted == False,
                Term.academic_session_id == None  # Only unlinked terms
            )
        )
        terms = result.scalars().all()
        
        for term in terms:
            term.academic_session_id = session_id
        
        await db.commit()
        
        return len(terms)
    
    @staticmethod
    async def get_session_by_name(
        db: AsyncSession,
        school_id: str,
        session_name: str
    ) -> Optional[AcademicSession]:
        """Get an academic session by its name (e.g., '2023/2024')"""
        result = await db.execute(
            select(AcademicSession)
            .options(selectinload(AcademicSession.terms))
            .where(
                AcademicSession.name == session_name,
                AcademicSession.school_id == school_id,
                AcademicSession.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def delete_session(
        db: AsyncSession,
        school_id: str,
        session_id: str
    ) -> bool:
        """Soft delete an academic session"""
        session = await SessionService.get_session(db, session_id, school_id)
        
        if not session:
            return False
        
        if session.is_current:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the current session"
            )
        
        session.is_deleted = True
        await db.commit()
        
        return True
