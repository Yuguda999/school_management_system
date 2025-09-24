from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import BaseModel


class SchoolOwnership(BaseModel):
    """Junction table for many-to-many relationship between school owners and schools"""
    
    __tablename__ = "school_ownerships"
    
    # Foreign Keys
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Ownership Details
    is_primary_owner = Column(Boolean, default=False, nullable=False)  # Primary owner who registered the school
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Permissions (for future use)
    can_manage_billing = Column(Boolean, default=True, nullable=False)
    can_manage_users = Column(Boolean, default=True, nullable=False)
    can_manage_settings = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    granted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    granted_by = Column(String(36), ForeignKey("users.id"), nullable=True)  # Who granted this ownership
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="owned_schools")
    school = relationship("School", back_populates="owners")
    granted_by_user = relationship("User", foreign_keys=[granted_by])
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'school_id', name='unique_user_school_ownership'),
    )
    
    def __repr__(self):
        return f"<SchoolOwnership(user_id={self.user_id}, school_id={self.school_id}, is_primary={self.is_primary_owner})>"
