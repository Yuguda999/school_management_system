"""
Promotion Request Model

Stores promotion decision submissions from teachers for approval by school owners.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SQLAlchemyEnum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.models.base import BaseModel


class PromotionRequestStatus(str, enum.Enum):
    """Status of a promotion request"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PromotionRequest(BaseModel):
    """
    Promotion Request Model
    
    Stores teacher-submitted promotion decisions awaiting approval.
    """
    __tablename__ = "promotion_requests"

    # Relationships
    school_id = Column(String(36), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("academic_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Submitter info
    submitted_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Decisions as JSON array: [{student_id, action, next_class_id}]
    decisions = Column(JSON, nullable=False, default=list)
    
    # Approval status
    status = Column(
        SQLAlchemyEnum(PromotionRequestStatus),
        default=PromotionRequestStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Review info
    reviewed_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Relationships
    school = relationship("School", backref="promotion_requests")
    session = relationship("AcademicSession", backref="promotion_requests")
    class_ = relationship("Class", backref="promotion_requests")
    submitter = relationship("User", foreign_keys=[submitted_by], backref="submitted_promotion_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by], backref="reviewed_promotion_requests")
