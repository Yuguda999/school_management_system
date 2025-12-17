from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class PermissionType(str, enum.Enum):
    """Available permissions that can be delegated to teachers"""
    MANAGE_STUDENTS = "manage_students"  # Register/edit/delete students
    MANAGE_FEES = "manage_fees"  # Create/edit fee records and payments
    MANAGE_ASSETS = "manage_assets"  # Manage school assets
    MANAGE_GRADES = "manage_grades"  # Enter/edit grades and report cards
    MANAGE_CLASSES = "manage_classes"  # Create/edit classes and enrollments
    MANAGE_ATTENDANCE = "manage_attendance"  # Record attendance
    VIEW_ANALYTICS = "view_analytics"  # Access school analytics


class TeacherPermission(TenantBaseModel):
    """Model for storing delegated permissions from school owners to teachers"""
    
    __tablename__ = "teacher_permissions"
    
    # The teacher receiving the permission
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # The type of permission granted
    permission_type = Column(Enum(PermissionType), nullable=False)
    
    # The school owner who granted this permission
    granted_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Optional expiration date for the permission
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Whether the permission is currently active
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id], backref="permissions")
    granter = relationship("User", foreign_keys=[granted_by])
    
    def __repr__(self):
        return f"<TeacherPermission(teacher_id={self.teacher_id}, permission={self.permission_type})>"
