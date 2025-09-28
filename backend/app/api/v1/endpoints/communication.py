from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_school_admin,
    require_teacher_or_admin_user,
    get_current_school
)
from app.models.user import User, UserRole
from app.models.school import School
from app.models.communication import MessageType, MessageStatus, RecipientType
from app.schemas.communication import (
    MessageCreate,
    MessageUpdate,
    MessageResponse,
    BulkMessageCreate,
    MessageRecipientResponse,
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementResponse,
    NotificationTemplateCreate,
    NotificationTemplateUpdate,
    NotificationTemplateResponse,
    MessageStatistics,
    SendMessageRequest,
    MarkAsReadRequest
)
from app.services.communication_service import CommunicationService

router = APIRouter()


# Message Management Endpoints
@router.post("/messages", response_model=MessageResponse)
async def create_message(
    message_data: MessageCreate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new message (Teacher/Admin only)"""
    message = await CommunicationService.create_message(
        db, message_data, current_school.id, current_user.id, current_user.full_name
    )
    
    # Prepare response with additional data
    response = MessageResponse.from_orm(message)
    if message.message_recipients:
        response.total_recipients = len(message.message_recipients)
        response.delivered_count = len([r for r in message.message_recipients if r.status == MessageStatus.DELIVERED])
        response.read_count = len([r for r in message.message_recipients if r.status == MessageStatus.READ])
        response.failed_count = len([r for r in message.message_recipients if r.status == MessageStatus.FAILED])
    
    return response


@router.post("/messages/bulk", response_model=List[MessageResponse])
async def create_bulk_messages(
    bulk_data: BulkMessageCreate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create multiple individual messages (Teacher/Admin only)"""
    messages = []
    
    for recipient_id in bulk_data.recipient_ids:
        message_data = MessageCreate(
            subject=bulk_data.subject,
            content=bulk_data.content,
            message_type=bulk_data.message_type,
            recipient_type=RecipientType.INDIVIDUAL,
            recipient_id=recipient_id,
            scheduled_at=bulk_data.scheduled_at,
            is_urgent=bulk_data.is_urgent,
            requires_response=bulk_data.requires_response,
            metadata=bulk_data.metadata
        )
        
        message = await CommunicationService.create_message(
            db, message_data, current_school.id, current_user.id, current_user.full_name
        )
        messages.append(message)
    
    response_messages = []
    for message in messages:
        message_response = MessageResponse.from_orm(message)
        if message.message_recipients:
            message_response.total_recipients = len(message.message_recipients)
            message_response.delivered_count = len([r for r in message.message_recipients if r.status == MessageStatus.DELIVERED])
            message_response.read_count = len([r for r in message.message_recipients if r.status == MessageStatus.READ])
            message_response.failed_count = len([r for r in message.message_recipients if r.status == MessageStatus.FAILED])
        
        response_messages.append(message_response)
    
    return response_messages


@router.get("/messages", response_model=List[MessageResponse])
async def get_messages(
    message_type: Optional[MessageType] = Query(None, description="Filter by message type"),
    status: Optional[MessageStatus] = Query(None, description="Filter by status"),
    is_urgent: Optional[bool] = Query(None, description="Filter by urgent messages"),
    sender_id: Optional[str] = Query(None, description="Filter by sender"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all messages with filtering"""
    # Students and parents can only see messages sent to them
    recipient_id = None
    if current_user.role in [UserRole.STUDENT, UserRole.PARENT]:
        recipient_id = current_user.id
    
    skip = (page - 1) * size
    messages = await CommunicationService.get_messages(
        db, current_school.id, sender_id, recipient_id, message_type, 
        status, is_urgent, skip, size
    )
    
    response_messages = []
    for message in messages:
        message_response = MessageResponse.from_orm(message)
        if message.message_recipients:
            message_response.total_recipients = len(message.message_recipients)
            message_response.delivered_count = len([r for r in message.message_recipients if r.status == MessageStatus.DELIVERED])
            message_response.read_count = len([r for r in message.message_recipients if r.status == MessageStatus.READ])
            message_response.failed_count = len([r for r in message.message_recipients if r.status == MessageStatus.FAILED])
        
        response_messages.append(message_response)
    
    return response_messages


@router.get("/messages/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get message by ID"""
    message = await CommunicationService.get_message_by_id(db, message_id, current_school.id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check access permissions
    if current_user.role in [UserRole.STUDENT, UserRole.PARENT]:
        # Check if user is a recipient
        is_recipient = any(
            r.recipient_id == current_user.id 
            for r in message.message_recipients
        )
        if not is_recipient:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    response = MessageResponse.from_orm(message)
    if message.message_recipients:
        response.total_recipients = len(message.message_recipients)
        response.delivered_count = len([r for r in message.message_recipients if r.status == MessageStatus.DELIVERED])
        response.read_count = len([r for r in message.message_recipients if r.status == MessageStatus.READ])
        response.failed_count = len([r for r in message.message_recipients if r.status == MessageStatus.FAILED])
    
    return response


@router.post("/messages/{message_id}/send")
async def send_message(
    message_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Send a scheduled message (Teacher/Admin only)"""
    success = await CommunicationService.send_message(db, message_id, current_school.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    return {"message": "Message sent successfully"}


@router.post("/messages/mark-read")
async def mark_messages_as_read(
    request: MarkAsReadRequest,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mark messages as read by current user"""
    marked_count = 0
    
    for message_id in request.message_ids:
        success = await CommunicationService.mark_message_as_read(
            db, message_id, current_user.id, current_school.id
        )
        if success:
            marked_count += 1
    
    return {"message": f"Marked {marked_count} messages as read"}


# Announcement Management Endpoints
@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new announcement (Admin only)"""
    announcement = await CommunicationService.create_announcement(
        db, announcement_data, current_school.id, current_user.id
    )
    
    response = AnnouncementResponse.from_orm(announcement)
    if announcement.publisher:
        response.publisher_name = announcement.publisher.full_name
    
    return response


@router.get("/announcements", response_model=List[AnnouncementResponse])
async def get_announcements(
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    is_public: Optional[bool] = Query(None, description="Filter by public announcements"),
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all announcements"""
    # Non-admin users can only see published announcements
    if current_user.role not in [UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PLATFORM_SUPER_ADMIN]:
        is_published = True
    
    skip = (page - 1) * size
    announcements = await CommunicationService.get_announcements(
        db, current_school.id, is_published, is_public, category, skip, size
    )
    
    response_announcements = []
    for announcement in announcements:
        announcement_response = AnnouncementResponse.from_orm(announcement)
        if announcement.publisher:
            announcement_response.publisher_name = announcement.publisher.full_name
        
        response_announcements.append(announcement_response)
    
    return response_announcements


@router.post("/announcements/{announcement_id}/publish")
async def publish_announcement(
    announcement_id: str,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Publish an announcement (Admin only)"""
    announcement = await CommunicationService.publish_announcement(
        db, announcement_id, current_school.id
    )
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    return {"message": "Announcement published successfully"}


@router.get("/statistics", response_model=MessageStatistics)
async def get_communication_statistics(
    days: int = Query(30, ge=1, le=365, description="Number of days for statistics"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get communication statistics (Teacher/Admin only)"""
    statistics = await CommunicationService.get_communication_statistics(
        db, current_school.id, days
    )
    
    return statistics
