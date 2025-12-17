from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_school_owner, get_current_school, SchoolContext, get_current_active_user
from app.models.user import User, UserRole
from app.models.school import School
from app.models.teacher_permission import PermissionType
from app.models.notification import NotificationType
from app.schemas.teacher_permission import (
    TeacherPermissionCreate,
    TeacherPermissionUpdate,
    TeacherPermissionBulkCreate,
    TeacherPermissionResponse
)
from app.schemas.notification import NotificationCreate
from app.services.teacher_permission_service import TeacherPermissionService
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.schemas.audit_log import AuditLogCreate
from sqlalchemy import select

router = APIRouter()

# Permission labels for display
PERMISSION_LABELS = {
    "manage_students": "Manage Students",
    "manage_fees": "Manage Fees",
    "manage_assets": "Manage Assets",
    "manage_grades": "Manage Grades",
    "manage_classes": "Manage Classes",
    "manage_attendance": "Manage Attendance",
    "view_analytics": "View Analytics"
}


@router.post("/", response_model=TeacherPermissionResponse)
async def grant_permission(
    permission_data: TeacherPermissionCreate,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Grant a permission to a teacher (School Owner only)"""
    current_user = school_context.user
    current_school = school_context.school
    
    # Verify teacher exists and belongs to school
    teacher_result = await db.execute(
        select(User).where(
            User.id == permission_data.teacher_id,
            User.school_id == school_context.school_id,
            User.role == UserRole.TEACHER,
            User.is_deleted == False
        )
    )
    teacher = teacher_result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found in your school"
        )
    
    # Grant permission
    permission = await TeacherPermissionService.grant_permission(
        db,
        permission_data,
        school_context.school_id,
        current_user.id
    )
    
    # Send notification to teacher
    perm_label = PERMISSION_LABELS.get(permission_data.permission_type.value, permission_data.permission_type.value)
    await NotificationService.create_notification(
        db=db,
        notification_data=NotificationCreate(
            user_id=teacher.id,
            title="New Permission Granted",
            message=f"You have been granted '{perm_label}' permission by {current_user.full_name}.",
            type=NotificationType.INFO,
            link=f"/{current_school.code}/my-permissions"
        ),
        school_id=school_context.school_id
    )
    
    # Log the action
    await AuditService.log_action(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            action="GRANT_PERMISSION",
            entity_type="teacher_permission",
            entity_id=permission.id,
            details={
                "teacher_id": permission_data.teacher_id,
                "teacher_name": teacher.full_name,
                "permission_type": permission_data.permission_type.value
            }
        ),
        school_context.school_id
    )
    
    return permission


@router.post("/bulk", response_model=List[TeacherPermissionResponse])
async def grant_bulk_permissions(
    bulk_data: TeacherPermissionBulkCreate,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Grant multiple permissions to a teacher at once (School Owner only)"""
    current_user = school_context.user
    current_school = school_context.school
    
    # Verify teacher exists and belongs to school
    teacher_result = await db.execute(
        select(User).where(
            User.id == bulk_data.teacher_id,
            User.school_id == school_context.school_id,
            User.role == UserRole.TEACHER,
            User.is_deleted == False
        )
    )
    teacher = teacher_result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found in your school"
        )
    
    # Grant permissions
    permissions = await TeacherPermissionService.grant_bulk_permissions(
        db,
        bulk_data,
        school_context.school_id,
        current_user.id
    )
    
    # Send notification to teacher
    perm_labels = [PERMISSION_LABELS.get(p.value, p.value) for p in bulk_data.permissions]
    perm_list = ", ".join(perm_labels)
    await NotificationService.create_notification(
        db=db,
        notification_data=NotificationCreate(
            user_id=teacher.id,
            title="New Permissions Granted",
            message=f"You have been granted the following permissions by {current_user.full_name}: {perm_list}",
            type=NotificationType.INFO,
            link=f"/{current_school.code}/my-permissions"
        ),
        school_id=school_context.school_id
    )
    
    # Log the action
    await AuditService.log_action(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            action="GRANT_BULK_PERMISSIONS",
            entity_type="teacher_permission",
            entity_id=bulk_data.teacher_id,
            details={
                "teacher_id": bulk_data.teacher_id,
                "teacher_name": teacher.full_name,
                "permissions": [p.value for p in bulk_data.permissions]
            }
        ),
        school_context.school_id
    )
    
    return permissions


@router.get("/", response_model=List[TeacherPermissionResponse])
async def get_all_permissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all permission assignments for this school (School Owner only)"""
    permissions, _ = await TeacherPermissionService.get_all_permissions(
        db,
        school_context.school_id,
        skip,
        limit
    )
    return permissions


@router.get("/teacher/{teacher_id}", response_model=List[TeacherPermissionResponse])
async def get_teacher_permissions(
    teacher_id: str,
    include_inactive: bool = Query(False),
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all permissions for a specific teacher (School Owner only)"""
    permissions = await TeacherPermissionService.get_teacher_permissions(
        db,
        teacher_id,
        school_context.school_id,
        include_inactive
    )
    return permissions


@router.get("/my-permissions", response_model=List[TeacherPermissionResponse])
async def get_my_permissions(
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get current user's delegated permissions (for teachers)"""
    if current_user.role != UserRole.TEACHER:
        return []
    
    permissions = await TeacherPermissionService.get_teacher_permissions(
        db,
        current_user.id,
        current_school.id
    )
    return permissions


@router.put("/{permission_id}", response_model=TeacherPermissionResponse)
async def update_permission(
    permission_id: str,
    update_data: TeacherPermissionUpdate,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a permission (enable/disable or change expiration) (School Owner only)"""
    current_user = school_context.user
    
    permission = await TeacherPermissionService.update_permission(
        db,
        permission_id,
        update_data,
        school_context.school_id
    )
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    # Log the action
    await AuditService.log_action(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            action="UPDATE_PERMISSION",
            entity_type="teacher_permission",
            entity_id=permission_id,
            details={
                "is_active": update_data.is_active,
                "expires_at": str(update_data.expires_at) if update_data.expires_at else None
            }
        ),
        school_context.school_id
    )
    
    return permission


@router.delete("/{permission_id}")
async def revoke_permission(
    permission_id: str,
    school_context: SchoolContext = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Revoke a permission (School Owner only)"""
    current_user = school_context.user
    
    success = await TeacherPermissionService.revoke_permission(
        db,
        permission_id,
        school_context.school_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    # Log the action
    await AuditService.log_action(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            action="REVOKE_PERMISSION",
            entity_type="teacher_permission",
            entity_id=permission_id,
            details={}
        ),
        school_context.school_id
    )
    
    return {"message": "Permission revoked successfully"}


@router.get("/types", response_model=List[dict])
async def get_permission_types() -> Any:
    """Get all available permission types"""
    return [
        {"value": perm.value, "label": perm.value.replace("_", " ").title()}
        for perm in PermissionType
    ]
