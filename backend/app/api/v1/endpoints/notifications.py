from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_active_user, get_current_school, get_current_school_context, SchoolContext
from app.models.user import User
from app.models.school import School
from app.schemas.notification import NotificationCreate, NotificationResponse, NotificationUpdate
from app.services.notification_service import NotificationService

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get notifications for the current user (supports both User and Student)"""
    notifications, _ = await NotificationService.get_notifications(
        db, school_context.user.id, school_context.school_id, skip, limit, unread_only
    )
    return notifications

@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: str,
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mark a notification as read"""
    notification = await NotificationService.mark_as_read(
        db, notification_id, school_context.user.id, school_context.school_id
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return notification

@router.put("/read-all")
async def mark_all_notifications_as_read(
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mark all notifications as read for the current user"""
    count = await NotificationService.mark_all_as_read(
        db, school_context.user.id, school_context.school_id
    )
    return {"message": f"Marked {count} notifications as read"}

# Internal use or admin only
@router.post("/", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a notification (Internal/Admin)"""
    # In a real app, we might restrict who can create notifications via API
    # For now, allowing any authenticated user to create (e.g. for testing)
    # or restrict to admin if needed.
    return await NotificationService.create_notification(
        db, notification_data, current_school.id
    )
