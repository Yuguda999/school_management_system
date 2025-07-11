from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.orm import selectinload, joinedload
from fastapi import HTTPException, status
from datetime import datetime, timedelta
import asyncio
import logging

from app.models.communication import (
    Message, MessageRecipient, Announcement, NotificationTemplate,
    MessageType, MessageStatus, RecipientType
)
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import Class
from app.schemas.communication import (
    MessageCreate, MessageUpdate, BulkMessageCreate,
    AnnouncementCreate, AnnouncementUpdate,
    NotificationTemplateCreate, NotificationTemplateUpdate,
    MessageStatistics, CommunicationDashboard
)

logger = logging.getLogger(__name__)


class CommunicationService:
    """Service class for communication operations"""
    
    @staticmethod
    async def create_message(
        db: AsyncSession,
        message_data: MessageCreate,
        school_id: str,
        sender_id: str,
        sender_name: str
    ) -> Message:
        """Create a new message"""
        # Create message
        message_dict = message_data.dict()
        message_dict.update({
            'school_id': school_id,
            'sender_id': sender_id,
            'sender_name': sender_name,
            'is_scheduled': bool(message_data.scheduled_at)
        })
        
        message = Message(**message_dict)
        db.add(message)
        await db.commit()
        await db.refresh(message)
        
        # Create message recipients based on recipient type
        recipients = await CommunicationService._get_recipients(
            db, message_data, school_id
        )
        
        # Create MessageRecipient records
        for recipient in recipients:
            message_recipient = MessageRecipient(
                message_id=message.id,
                recipient_id=recipient['id'],
                recipient_name=recipient['name'],
                recipient_email=recipient.get('email'),
                recipient_phone=recipient.get('phone'),
                school_id=school_id
            )
            db.add(message_recipient)
        
        await db.commit()
        
        # Send message immediately if not scheduled
        if not message.is_scheduled:
            await CommunicationService.send_message(db, message.id, school_id)
        
        return message
    
    @staticmethod
    async def _get_recipients(
        db: AsyncSession,
        message_data: MessageCreate,
        school_id: str
    ) -> List[Dict[str, Any]]:
        """Get list of recipients based on recipient type"""
        recipients = []
        
        if message_data.recipient_type == RecipientType.INDIVIDUAL:
            # Single recipient
            result = await db.execute(
                select(User).where(
                    User.id == message_data.recipient_id,
                    User.school_id == school_id,
                    User.is_deleted == False
                )
            )
            user = result.scalar_one_or_none()
            if user:
                recipients.append({
                    'id': user.id,
                    'name': user.full_name,
                    'email': user.email,
                    'phone': user.phone
                })
        
        elif message_data.recipient_type == RecipientType.CLASS:
            # All students in a class
            result = await db.execute(
                select(Student).options(
                    selectinload(Student.user)
                ).where(
                    Student.class_id == message_data.recipient_class_id,
                    Student.school_id == school_id,
                    Student.is_deleted == False
                )
            )
            students = result.scalars().all()
            for student in students:
                if student.user:
                    recipients.append({
                        'id': student.user.id,
                        'name': student.user.full_name,
                        'email': student.user.email,
                        'phone': student.user.phone
                    })
        
        elif message_data.recipient_type == RecipientType.ROLE:
            # All users with specific role
            result = await db.execute(
                select(User).where(
                    User.role == message_data.recipient_role,
                    User.school_id == school_id,
                    User.is_deleted == False,
                    User.is_active == True
                )
            )
            users = result.scalars().all()
            for user in users:
                recipients.append({
                    'id': user.id,
                    'name': user.full_name,
                    'email': user.email,
                    'phone': user.phone
                })
        
        elif message_data.recipient_type == RecipientType.ALL_TEACHERS:
            # All teachers
            result = await db.execute(
                select(User).where(
                    User.role == UserRole.TEACHER,
                    User.school_id == school_id,
                    User.is_deleted == False,
                    User.is_active == True
                )
            )
            users = result.scalars().all()
            for user in users:
                recipients.append({
                    'id': user.id,
                    'name': user.full_name,
                    'email': user.email,
                    'phone': user.phone
                })
        
        elif message_data.recipient_type == RecipientType.ALL_STUDENTS:
            # All students
            result = await db.execute(
                select(Student).options(
                    selectinload(Student.user)
                ).where(
                    Student.school_id == school_id,
                    Student.is_deleted == False,
                    Student.is_active == True
                )
            )
            students = result.scalars().all()
            for student in students:
                if student.user:
                    recipients.append({
                        'id': student.user.id,
                        'name': student.user.full_name,
                        'email': student.user.email,
                        'phone': student.user.phone
                    })
        
        elif message_data.recipient_type == RecipientType.ALL_PARENTS:
            # All parents
            result = await db.execute(
                select(User).where(
                    User.role == UserRole.PARENT,
                    User.school_id == school_id,
                    User.is_deleted == False,
                    User.is_active == True
                )
            )
            users = result.scalars().all()
            for user in users:
                recipients.append({
                    'id': user.id,
                    'name': user.full_name,
                    'email': user.email,
                    'phone': user.phone
                })
        
        return recipients
    
    @staticmethod
    async def send_message(
        db: AsyncSession,
        message_id: str,
        school_id: str
    ) -> bool:
        """Send a message to all recipients"""
        # Get message with recipients
        result = await db.execute(
            select(Message).options(
                selectinload(Message.message_recipients)
            ).where(
                Message.id == message_id,
                Message.school_id == school_id,
                Message.is_deleted == False
            )
        )
        message = result.scalar_one_or_none()
        if not message:
            return False
        
        # Update message status
        message.status = MessageStatus.SENT
        message.sent_at = datetime.utcnow()
        
        # Send to each recipient
        for recipient in message.message_recipients:
            try:
                # Simulate sending (in real implementation, integrate with SMS/Email providers)
                success = await CommunicationService._send_to_recipient(
                    message, recipient
                )
                
                if success:
                    recipient.status = MessageStatus.DELIVERED
                    recipient.delivered_at = datetime.utcnow()
                else:
                    recipient.status = MessageStatus.FAILED
                    recipient.failed_at = datetime.utcnow()
                    recipient.error_message = "Failed to send"
                    
            except Exception as e:
                logger.error(f"Failed to send message to {recipient.recipient_id}: {str(e)}")
                recipient.status = MessageStatus.FAILED
                recipient.failed_at = datetime.utcnow()
                recipient.error_message = str(e)
                recipient.retry_count += 1
        
        await db.commit()
        return True
    
    @staticmethod
    async def _send_to_recipient(
        message: Message,
        recipient: MessageRecipient
    ) -> bool:
        """Send message to individual recipient (mock implementation)"""
        # In a real implementation, this would integrate with:
        # - SMS providers (Twilio, AWS SNS, etc.)
        # - Email providers (SendGrid, AWS SES, etc.)
        # - Push notification services
        
        try:
            if message.message_type == MessageType.EMAIL:
                # Mock email sending
                logger.info(f"Sending email to {recipient.recipient_email}: {message.subject}")
                await asyncio.sleep(0.1)  # Simulate network delay
                return True
                
            elif message.message_type == MessageType.SMS:
                # Mock SMS sending
                logger.info(f"Sending SMS to {recipient.recipient_phone}: {message.content[:50]}...")
                await asyncio.sleep(0.1)  # Simulate network delay
                return True
                
            elif message.message_type == MessageType.NOTIFICATION:
                # Mock push notification
                logger.info(f"Sending notification to {recipient.recipient_name}: {message.subject}")
                await asyncio.sleep(0.1)  # Simulate network delay
                return True
                
            return False
            
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            return False

    @staticmethod
    async def get_messages(
        db: AsyncSession,
        school_id: str,
        sender_id: Optional[str] = None,
        recipient_id: Optional[str] = None,
        message_type: Optional[MessageType] = None,
        status: Optional[MessageStatus] = None,
        is_urgent: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Message]:
        """Get messages with filtering"""
        query = select(Message).options(
            selectinload(Message.sender),
            selectinload(Message.message_recipients)
        ).where(
            Message.school_id == school_id,
            Message.is_deleted == False
        )

        if sender_id:
            query = query.where(Message.sender_id == sender_id)
        if recipient_id:
            query = query.join(MessageRecipient).where(
                MessageRecipient.recipient_id == recipient_id
            )
        if message_type:
            query = query.where(Message.message_type == message_type)
        if status:
            query = query.where(Message.status == status)
        if is_urgent is not None:
            query = query.where(Message.is_urgent == is_urgent)

        query = query.order_by(desc(Message.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_message_by_id(
        db: AsyncSession,
        message_id: str,
        school_id: str
    ) -> Optional[Message]:
        """Get message by ID"""
        result = await db.execute(
            select(Message).options(
                selectinload(Message.sender),
                selectinload(Message.message_recipients)
            ).where(
                Message.id == message_id,
                Message.school_id == school_id,
                Message.is_deleted == False
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def mark_message_as_read(
        db: AsyncSession,
        message_id: str,
        recipient_id: str,
        school_id: str
    ) -> bool:
        """Mark message as read by recipient"""
        result = await db.execute(
            select(MessageRecipient).where(
                MessageRecipient.message_id == message_id,
                MessageRecipient.recipient_id == recipient_id,
                MessageRecipient.school_id == school_id
            )
        )
        recipient = result.scalar_one_or_none()

        if recipient and recipient.status != MessageStatus.READ:
            recipient.status = MessageStatus.READ
            recipient.read_at = datetime.utcnow()
            await db.commit()
            return True

        return False

    # Announcement Management
    @staticmethod
    async def create_announcement(
        db: AsyncSession,
        announcement_data: AnnouncementCreate,
        school_id: str,
        published_by: str
    ) -> Announcement:
        """Create a new announcement"""
        announcement_dict = announcement_data.dict()
        announcement_dict.update({
            'school_id': school_id,
            'published_by': published_by
        })

        announcement = Announcement(**announcement_dict)
        db.add(announcement)
        await db.commit()
        await db.refresh(announcement)

        return announcement

    @staticmethod
    async def get_announcements(
        db: AsyncSession,
        school_id: str,
        is_published: Optional[bool] = None,
        is_public: Optional[bool] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Announcement]:
        """Get announcements with filtering"""
        query = select(Announcement).options(
            selectinload(Announcement.publisher)
        ).where(
            Announcement.school_id == school_id,
            Announcement.is_deleted == False
        )

        if is_published is not None:
            query = query.where(Announcement.is_published == is_published)
        if is_public is not None:
            query = query.where(Announcement.is_public == is_public)
        if category:
            query = query.where(Announcement.category == category)

        # Filter by date range if announcement has start/end dates
        now = datetime.utcnow()
        query = query.where(
            or_(
                Announcement.start_date.is_(None),
                Announcement.start_date <= now
            )
        ).where(
            or_(
                Announcement.end_date.is_(None),
                Announcement.end_date >= now
            )
        )

        query = query.order_by(desc(Announcement.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def publish_announcement(
        db: AsyncSession,
        announcement_id: str,
        school_id: str
    ) -> Optional[Announcement]:
        """Publish an announcement"""
        result = await db.execute(
            select(Announcement).where(
                Announcement.id == announcement_id,
                Announcement.school_id == school_id,
                Announcement.is_deleted == False
            )
        )
        announcement = result.scalar_one_or_none()

        if announcement:
            announcement.is_published = True
            announcement.published_at = datetime.utcnow()
            await db.commit()
            await db.refresh(announcement)

        return announcement

    # Notification Template Management
    @staticmethod
    async def create_notification_template(
        db: AsyncSession,
        template_data: NotificationTemplateCreate,
        school_id: str,
        created_by: str
    ) -> NotificationTemplate:
        """Create a new notification template"""
        template_dict = template_data.dict()
        template_dict.update({
            'school_id': school_id,
            'created_by': created_by
        })

        template = NotificationTemplate(**template_dict)
        db.add(template)
        await db.commit()
        await db.refresh(template)

        return template

    @staticmethod
    async def get_communication_statistics(
        db: AsyncSession,
        school_id: str,
        days: int = 30
    ) -> MessageStatistics:
        """Get communication statistics"""
        start_date = datetime.utcnow() - timedelta(days=days)

        # Total messages
        total_result = await db.execute(
            select(func.count(Message.id)).where(
                Message.school_id == school_id,
                Message.created_at >= start_date,
                Message.is_deleted == False
            )
        )
        total_messages = total_result.scalar() or 0

        # Messages by status
        status_counts = {}
        for status in MessageStatus:
            count_result = await db.execute(
                select(func.count(Message.id)).where(
                    Message.school_id == school_id,
                    Message.status == status,
                    Message.created_at >= start_date,
                    Message.is_deleted == False
                )
            )
            status_counts[status.value] = count_result.scalar() or 0

        # Messages by type
        type_counts = {}
        for msg_type in MessageType:
            count_result = await db.execute(
                select(func.count(Message.id)).where(
                    Message.school_id == school_id,
                    Message.message_type == msg_type,
                    Message.created_at >= start_date,
                    Message.is_deleted == False
                )
            )
            type_counts[msg_type.value] = count_result.scalar() or 0

        # Recent activity (simplified)
        recent_activity = []

        return MessageStatistics(
            total_messages=total_messages,
            sent_messages=status_counts.get('sent', 0),
            delivered_messages=status_counts.get('delivered', 0),
            read_messages=status_counts.get('read', 0),
            failed_messages=status_counts.get('failed', 0),
            scheduled_messages=status_counts.get('draft', 0),
            messages_by_type=type_counts,
            recent_activity=recent_activity
        )
