from typing import Optional, List
from pydantic import BaseModel, EmailStr, validator
from app.models.user import UserRole, Gender
from datetime import date, datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SchoolOption(BaseModel):
    """School option for selection"""
    id: str
    name: str
    code: str
    logo_url: Optional[str] = None
    is_primary: bool


class SchoolSelectionRequest(BaseModel):
    """Request to select a school for a school owner"""
    school_id: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: UserRole
    school_id: Optional[str]
    full_name: str
    profile_completed: bool
    # For school owners with multiple schools
    requires_school_selection: bool = False
    available_schools: Optional[List[SchoolOption]] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    school_id: Optional[str] = None
