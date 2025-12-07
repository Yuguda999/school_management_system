from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Date, Integer
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class SessionStatus(str, enum.Enum):
    """Status of an academic session"""
    UPCOMING = "upcoming"       # Session not yet started
    ACTIVE = "active"           # Currently active session
    COMPLETED = "completed"     # Session ended, all work done
    ARCHIVED = "archived"       # Old session, archived for records


class AcademicSession(TenantBaseModel):
    """
    Academic session/year model.
    
    Represents a full academic year (e.g., 2023/2024) which contains
    multiple terms (2 or 3 depending on school configuration).
    """
    
    __tablename__ = "academic_sessions"
    
    # Session identification
    name = Column(String(20), nullable=False)  # e.g., "2023/2024"
    
    # Session dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Status
    status = Column(
        Enum(SessionStatus), 
        default=SessionStatus.UPCOMING, 
        nullable=False
    )
    
    # Configuration snapshot at session creation
    # This captures the school's term_count setting at the time of session creation
    term_count = Column(Integer, default=3, nullable=False)  # 2 or 3
    
    # Flags
    is_current = Column(Boolean, default=False, nullable=False)
    promotion_completed = Column(Boolean, default=False, nullable=False)
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    school = relationship("School", back_populates="academic_sessions")
    terms = relationship("Term", back_populates="academic_session_rel", foreign_keys="Term.academic_session_id")
    class_history = relationship("StudentClassHistory", back_populates="academic_session_rel")
    
    def __repr__(self):
        return f"<AcademicSession(id={self.id}, name={self.name}, status={self.status})>"
    
    @property
    def is_fully_completed(self) -> bool:
        """Check if all terms in this session are completed"""
        if not self.terms:
            return False
        
        from datetime import date
        today = date.today()
        return all(term.end_date < today for term in self.terms if not term.is_deleted)
    
    @property
    def active_term(self):
        """Get the currently active term in this session"""
        for term in self.terms:
            if term.is_current and not term.is_deleted:
                return term
        return None
