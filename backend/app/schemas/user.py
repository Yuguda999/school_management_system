from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, EmailStr, validator
from datetime import date, datetime
from app.models.user import UserRole, Gender


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: UserRole
    username: Optional[str] = None
    
    # Staff-specific fields
    employee_id: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    username: Optional[str] = None
    
    # Staff-specific fields
    employee_id: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[str] = None
    
    # Profile fields
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None


class UserResponse(UserBase):
    id: str
    username: Optional[str] = None
    role: UserRole
    school_id: str
    
    # Staff-specific fields
    employee_id: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[str] = None
    
    # Profile fields
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None

    # Status fields
    is_active: bool
    is_verified: bool
    profile_completed: bool
    last_login: Optional[str] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Helper schema for user-subject relationships
class UserSubjectInfo(BaseModel):
    subject_id: str
    subject_name: str
    subject_code: str
    is_head_of_subject: bool

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    size: int
    pages: int


class StaffCreate(UserCreate):
    """Schema for creating staff members"""
    role: UserRole = UserRole.TEACHER
    employee_id: str
    department: str
    position: str

    @validator('role')
    def validate_staff_role(cls, v):
        if v not in [UserRole.TEACHER, UserRole.SCHOOL_ADMIN]:
            raise ValueError('Staff role must be either teacher or school admin')
        return v


class TeacherCreateWithSubjects(StaffCreate):
    """Schema for creating teachers with subject assignments"""
    subject_ids: Optional[List[str]] = None
    head_of_subject_id: Optional[str] = None  # Subject ID for which teacher is head

    @validator('head_of_subject_id')
    def validate_head_of_subject(cls, v, values):
        if v and 'subject_ids' in values and values['subject_ids']:
            if v not in values['subject_ids']:
                raise ValueError('Head of subject must be one of the assigned subjects')
        return v


class ParentCreate(UserCreate):
    """Schema for creating parent users"""
    role: UserRole = UserRole.PARENT
    
    @validator('role')
    def validate_parent_role(cls, v):
        if v != UserRole.PARENT:
            raise ValueError('Role must be parent')
        return v


class UserStatusUpdate(BaseModel):
    """Schema for updating user status"""
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserRoleUpdate(BaseModel):
    """Schema for updating user role"""
    role: UserRole
