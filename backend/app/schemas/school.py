from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime


class SchoolBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "Nigeria"
    description: Optional[str] = None
    motto: Optional[str] = None
    established_year: Optional[str] = None
    current_session: str
    current_term: str


class SchoolCreate(SchoolBase):
    code: str
    
    @validator('code')
    def validate_code(cls, v):
        if len(v) < 3:
            raise ValueError('School code must be at least 3 characters long')
        return v.upper()
    
    @validator('current_session')
    def validate_session(cls, v):
        # Validate format like "2023/2024"
        if not v or len(v.split('/')) != 2:
            raise ValueError('Session must be in format "YYYY/YYYY"')
        return v


class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    motto: Optional[str] = None
    established_year: Optional[str] = None
    current_session: Optional[str] = None
    current_term: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class SchoolResponse(SchoolBase):
    id: str
    code: str
    logo_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    is_active: bool
    is_verified: bool

    # Subscription & Trial Information
    subscription_plan: str
    subscription_status: str
    trial_started_at: Optional[datetime] = None
    trial_expires_at: Optional[datetime] = None
    trial_days: int
    trial_days_remaining: Optional[int] = None
    is_trial: Optional[bool] = None
    trial_expired: Optional[bool] = None

    # Usage Limits
    max_students: Optional[int] = None
    max_teachers: Optional[int] = None
    max_classes: Optional[int] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FreemiumRegistration(BaseModel):
    """Schema for freemium trial registration"""
    # School Information
    school_name: str
    school_code: str
    email: EmailStr
    phone: Optional[str] = None

    # Location Information
    address: str
    city: str
    state: str
    country: str = "Nigeria"
    postal_code: Optional[str] = "00000"

    # Academic Information
    current_session: Optional[str] = "2024/2025"
    current_term: Optional[str] = "First Term"

    # Admin Information
    admin_name: str
    admin_email: EmailStr
    admin_password: str

    @validator('admin_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

    @validator('school_code')
    def validate_code(cls, v):
        if len(v) < 3:
            raise ValueError('School code must be at least 3 characters long')
        return v.upper()


class SchoolRegistration(SchoolCreate):
    """Schema for school registration with admin user"""
    admin_first_name: str
    admin_last_name: str
    admin_email: EmailStr
    admin_password: str
    admin_phone: Optional[str] = None

    @validator('admin_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class SchoolRegistrationResponse(BaseModel):
    school: SchoolResponse
    admin_user_id: str
    message: str
    trial_expires_at: Optional[datetime] = None
    trial_days_remaining: Optional[int] = None


class SchoolSettings(BaseModel):
    """Schema for school settings"""
    academic_calendar: Optional[Dict[str, Any]] = None
    grading_system: Optional[Dict[str, Any]] = None
    fee_settings: Optional[Dict[str, Any]] = None
    communication_settings: Optional[Dict[str, Any]] = None
    general_settings: Optional[Dict[str, Any]] = None
    theme_settings: Optional[Dict[str, Any]] = None


class SchoolThemeSettings(BaseModel):
    """Schema for school theme settings"""
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    dark_mode_enabled: Optional[bool] = None
    custom_css: Optional[str] = None


class SchoolStats(BaseModel):
    """Schema for school statistics"""
    total_students: int
    total_teachers: int
    total_classes: int
    total_subjects: int
    active_terms: int
    
    class Config:
        from_attributes = True
