from sqlalchemy import Column, String, DateTime, Boolean, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum
from .base import TenantBaseModel


class InvitationStatus(str, enum.Enum):
    """Status of teacher invitation"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class TeacherInvitation(TenantBaseModel):
    """Model for teacher invitations"""
    
    __tablename__ = "teacher_invitations"
    
    # Basic invitation info
    email = Column(String(255), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    
    # Invitation token and status
    invitation_token = Column(String(255), nullable=False, unique=True, index=True)
    status = Column(Enum(InvitationStatus), default=InvitationStatus.PENDING, nullable=False)
    
    # Timestamps
    expires_at = Column(DateTime, nullable=False)
    invited_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    
    # Invitation details
    invited_by = Column(String(36), nullable=False)  # User ID who sent the invitation
    invitation_message = Column(Text, nullable=True)
    
    # Professional info (optional, can be filled during invitation)
    department = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    
    def __repr__(self):
        return f"<TeacherInvitation(id={self.id}, email={self.email}, status={self.status})>"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_expired(self):
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_pending(self):
        return self.status == InvitationStatus.PENDING and not self.is_expired
    
    @classmethod
    def create_invitation_token(cls):
        """Generate a secure invitation token"""
        import secrets
        return secrets.token_urlsafe(32)
    
    @classmethod
    def get_expiry_time(cls, hours=72):
        """Get expiry time (default 72 hours from now)"""
        return datetime.utcnow() + timedelta(hours=hours)
