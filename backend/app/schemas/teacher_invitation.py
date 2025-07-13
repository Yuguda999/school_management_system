from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, validator
from app.models.teacher_invitation import InvitationStatus


class TeacherInvitationBase(BaseModel):
    """Base schema for teacher invitation"""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    invitation_message: Optional[str] = Field(None, max_length=500)


class TeacherInvitationCreate(TeacherInvitationBase):
    """Schema for creating teacher invitation"""
    pass


class TeacherInvitationResponse(TeacherInvitationBase):
    """Schema for teacher invitation response"""
    id: str
    invitation_token: str
    status: InvitationStatus
    expires_at: datetime
    invited_at: datetime
    accepted_at: Optional[datetime] = None
    invited_by: str
    school_id: str
    full_name: str
    is_expired: bool
    is_pending: bool
    
    class Config:
        from_attributes = True


class TeacherInvitationListResponse(BaseModel):
    """Schema for paginated teacher invitation list"""
    invitations: list[TeacherInvitationResponse]
    total: int
    page: int
    size: int
    pages: int


class InvitationAcceptRequest(BaseModel):
    """Schema for accepting teacher invitation"""
    invitation_token: str
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    
    # Optional additional info that can be provided during acceptance
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[str] = None  # YYYY-MM-DD format
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    
    # Professional details
    qualification: Optional[str] = Field(None, max_length=255)
    experience_years: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=1000)
    
    # Address information
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v


class InvitationAcceptResponse(BaseModel):
    """Schema for invitation acceptance response"""
    message: str
    user_id: str
    access_token: str
    refresh_token: str
    user_email: str
    user_role: str
    school_id: str
    full_name: str
    profile_completed: bool


class InvitationStatusUpdate(BaseModel):
    """Schema for updating invitation status"""
    status: InvitationStatus


class InvitationResendRequest(BaseModel):
    """Schema for resending invitation"""
    invitation_id: str
    new_expiry_hours: Optional[int] = Field(72, ge=1, le=168)  # 1 hour to 1 week


class InvitationValidationResponse(BaseModel):
    """Schema for invitation token validation"""
    valid: bool
    invitation: Optional[TeacherInvitationResponse] = None
    message: str
