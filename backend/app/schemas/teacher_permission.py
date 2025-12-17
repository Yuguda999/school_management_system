from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.models.teacher_permission import PermissionType


class TeacherPermissionBase(BaseModel):
    """Base schema for teacher permissions"""
    permission_type: PermissionType
    expires_at: Optional[datetime] = None
    is_active: bool = True


class TeacherPermissionCreate(TeacherPermissionBase):
    """Schema for creating a new teacher permission"""
    teacher_id: str


class TeacherPermissionUpdate(BaseModel):
    """Schema for updating teacher permission"""
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class TeacherPermissionBulkCreate(BaseModel):
    """Schema for granting multiple permissions at once"""
    teacher_id: str
    permissions: List[PermissionType]
    expires_at: Optional[datetime] = None


class TeacherInfo(BaseModel):
    """Basic teacher info for response"""
    id: str
    first_name: str
    last_name: str
    email: str
    
    class Config:
        from_attributes = True


class GranterInfo(BaseModel):
    """Basic info about the user who granted the permission"""
    id: str
    first_name: str
    last_name: str
    
    class Config:
        from_attributes = True


class TeacherPermissionResponse(TeacherPermissionBase):
    """Response schema for teacher permission"""
    id: str
    school_id: str
    teacher_id: str
    granted_by: str
    teacher: Optional[TeacherInfo] = None
    granter: Optional[GranterInfo] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TeacherWithPermissions(BaseModel):
    """Response showing a teacher with all their permissions"""
    teacher: TeacherInfo
    permissions: List[TeacherPermissionResponse]
