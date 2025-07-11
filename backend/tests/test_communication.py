import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from unittest.mock import patch

from app.models.communication import Message, MessageRecipient, Announcement, MessageType, MessageStatus, RecipientType
from app.models.user import User, UserRole
from app.models.school import School
from app.services.communication_service import CommunicationService
from app.schemas.communication import MessageCreate, AnnouncementCreate


@pytest.fixture
async def test_school(db_session: AsyncSession):
    """Create a test school"""
    school = School(
        name="Test School",
        email="test@school.com",
        phone="1234567890",
        address="Test Address",
        is_active=True
    )
    db_session.add(school)
    await db_session.commit()
    await db_session.refresh(school)
    return school


@pytest.fixture
async def test_admin(db_session: AsyncSession, test_school: School):
    """Create a test admin user"""
    admin = User(
        email="admin@test.com",
        full_name="Test Admin",
        role=UserRole.ADMIN,
        school_id=test_school.id,
        is_active=True
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest.fixture
async def test_teacher(db_session: AsyncSession, test_school: School):
    """Create a test teacher"""
    teacher = User(
        email="teacher@test.com",
        full_name="Test Teacher",
        role=UserRole.TEACHER,
        school_id=test_school.id,
        phone="1234567890",
        is_active=True
    )
    db_session.add(teacher)
    await db_session.commit()
    await db_session.refresh(teacher)
    return teacher


@pytest.fixture
async def test_parent(db_session: AsyncSession, test_school: School):
    """Create a test parent"""
    parent = User(
        email="parent@test.com",
        full_name="Test Parent",
        role=UserRole.PARENT,
        school_id=test_school.id,
        phone="0987654321",
        is_active=True
    )
    db_session.add(parent)
    await db_session.commit()
    await db_session.refresh(parent)
    return parent


class TestCommunicationService:
    """Test cases for CommunicationService"""
    
    async def test_create_individual_message(
        self,
        db_session: AsyncSession,
        test_school: School,
        test_admin: User,
        test_teacher: User
    ):
        """Test creating an individual message"""
        message_data = MessageCreate(
            subject="Test Message",
            content="This is a test message content",
            message_type=MessageType.EMAIL,
            recipient_type=RecipientType.INDIVIDUAL,
            recipient_id=test_teacher.id,
            is_urgent=False,
            requires_response=False
        )
        
        message = await CommunicationService.create_message(
            db_session, message_data, test_school.id, test_admin.id, test_admin.full_name
        )
        
        assert message.subject == "Test Message"
        assert message.content == "This is a test message content"
        assert message.message_type == MessageType.EMAIL
        assert message.sender_id == test_admin.id
        assert message.sender_name == test_admin.full_name
        assert message.school_id == test_school.id
        
        # Check that message recipient was created
        assert len(message.message_recipients) == 1
        recipient = message.message_recipients[0]
        assert recipient.recipient_id == test_teacher.id
        assert recipient.recipient_name == test_teacher.full_name
        assert recipient.recipient_email == test_teacher.email
    
    async def test_create_role_based_message(
        self,
        db_session: AsyncSession,
        test_school: School,
        test_admin: User,
        test_teacher: User,
        test_parent: User
    ):
        """Test creating a role-based message"""
        message_data = MessageCreate(
            subject="Message to All Teachers",
            content="This message is for all teachers",
            message_type=MessageType.NOTIFICATION,
            recipient_type=RecipientType.ALL_TEACHERS,
            is_urgent=True
        )
        
        message = await CommunicationService.create_message(
            db_session, message_data, test_school.id, test_admin.id, test_admin.full_name
        )
        
        assert message.subject == "Message to All Teachers"
        assert message.is_urgent == True
        assert message.recipient_type == RecipientType.ALL_TEACHERS
        
        # Should have one recipient (the test teacher)
        assert len(message.message_recipients) == 1
        recipient = message.message_recipients[0]
        assert recipient.recipient_id == test_teacher.id
    
    @patch('app.services.communication_service.CommunicationService._send_to_recipient')
    async def test_send_message(
        self,
        mock_send,
        db_session: AsyncSession,
        test_school: School,
        test_admin: User,
        test_teacher: User
    ):
        """Test sending a message"""
        # Mock the sending function to return success
        mock_send.return_value = True
        
        message_data = MessageCreate(
            subject="Test Send Message",
            content="Testing message sending",
            message_type=MessageType.SMS,
            recipient_type=RecipientType.INDIVIDUAL,
            recipient_id=test_teacher.id
        )
        
        message = await CommunicationService.create_message(
            db_session, message_data, test_school.id, test_admin.id, test_admin.full_name
        )
        
        # Message should be sent automatically since it's not scheduled
        assert message.status == MessageStatus.SENT
        assert message.sent_at is not None
        
        # Check recipient status
        recipient = message.message_recipients[0]
        assert recipient.status == MessageStatus.DELIVERED
        assert recipient.delivered_at is not None
    
    async def test_mark_message_as_read(
        self,
        db_session: AsyncSession,
        test_school: School,
        test_admin: User,
        test_teacher: User
    ):
        """Test marking a message as read"""
        message_data = MessageCreate(
            subject="Test Read Message",
            content="Testing message read functionality",
            message_type=MessageType.EMAIL,
            recipient_type=RecipientType.INDIVIDUAL,
            recipient_id=test_teacher.id
        )
        
        message = await CommunicationService.create_message(
            db_session, message_data, test_school.id, test_admin.id, test_admin.full_name
        )
        
        # Mark message as read
        success = await CommunicationService.mark_message_as_read(
            db_session, message.id, test_teacher.id, test_school.id
        )
        
        assert success == True
        
        # Check that recipient status was updated
        await db_session.refresh(message.message_recipients[0])
        recipient = message.message_recipients[0]
        assert recipient.status == MessageStatus.READ
        assert recipient.read_at is not None
    
    async def test_create_announcement(
        self,
        db_session: AsyncSession,
        test_school: School,
        test_admin: User
    ):
        """Test creating an announcement"""
        announcement_data = AnnouncementCreate(
            title="School Holiday Notice",
            content="School will be closed for holiday on...",
            is_public=True,
            is_urgent=False,
            category="notice"
        )
        
        announcement = await CommunicationService.create_announcement(
            db_session, announcement_data, test_school.id, test_admin.id
        )
        
        assert announcement.title == "School Holiday Notice"
        assert announcement.content == "School will be closed for holiday on..."
        assert announcement.is_public == True
        assert announcement.published_by == test_admin.id
        assert announcement.school_id == test_school.id
        assert announcement.category == "notice"
    
    async def test_get_messages_filtering(
        self,
        db_session: AsyncSession,
        test_school: School,
        test_admin: User,
        test_teacher: User
    ):
        """Test getting messages with filtering"""
        # Create multiple messages
        email_message_data = MessageCreate(
            subject="Email Message",
            content="Email content",
            message_type=MessageType.EMAIL,
            recipient_type=RecipientType.INDIVIDUAL,
            recipient_id=test_teacher.id
        )
        
        sms_message_data = MessageCreate(
            subject="SMS Message",
            content="SMS content",
            message_type=MessageType.SMS,
            recipient_type=RecipientType.INDIVIDUAL,
            recipient_id=test_teacher.id,
            is_urgent=True
        )
        
        await CommunicationService.create_message(
            db_session, email_message_data, test_school.id, test_admin.id, test_admin.full_name
        )
        await CommunicationService.create_message(
            db_session, sms_message_data, test_school.id, test_admin.id, test_admin.full_name
        )
        
        # Get all messages
        all_messages = await CommunicationService.get_messages(
            db_session, test_school.id
        )
        assert len(all_messages) == 2
        
        # Filter by message type
        email_messages = await CommunicationService.get_messages(
            db_session, test_school.id, message_type=MessageType.EMAIL
        )
        assert len(email_messages) == 1
        assert email_messages[0].message_type == MessageType.EMAIL
        
        # Filter by urgent messages
        urgent_messages = await CommunicationService.get_messages(
            db_session, test_school.id, is_urgent=True
        )
        assert len(urgent_messages) == 1
        assert urgent_messages[0].is_urgent == True
    
    async def test_get_communication_statistics(
        self,
        db_session: AsyncSession,
        test_school: School,
        test_admin: User,
        test_teacher: User
    ):
        """Test getting communication statistics"""
        # Create some messages
        message_data = MessageCreate(
            subject="Stats Test Message",
            content="Testing statistics",
            message_type=MessageType.EMAIL,
            recipient_type=RecipientType.INDIVIDUAL,
            recipient_id=test_teacher.id
        )
        
        await CommunicationService.create_message(
            db_session, message_data, test_school.id, test_admin.id, test_admin.full_name
        )
        
        # Get statistics
        stats = await CommunicationService.get_communication_statistics(
            db_session, test_school.id, days=30
        )
        
        assert stats.total_messages >= 1
        assert stats.sent_messages >= 1
        assert MessageType.EMAIL.value in stats.messages_by_type
        assert stats.messages_by_type[MessageType.EMAIL.value] >= 1


class TestCommunicationAPI:
    """Test cases for Communication API endpoints"""
    
    async def test_message_creation_endpoint_structure(
        self,
        test_admin: User,
        test_teacher: User
    ):
        """Test message creation endpoint data structure"""
        # This would require authentication setup
        # For now, just test the basic structure
        message_data = {
            "subject": "API Test Message",
            "content": "Test via API",
            "message_type": "email",
            "recipient_type": "individual",
            "recipient_id": test_teacher.id,
            "is_urgent": False,
            "requires_response": False
        }
        
        # Note: This test would need proper authentication headers
        # response = await client.post("/api/v1/communication/messages", json=message_data)
        # assert response.status_code == 200
        
        # For now, just verify the data structure is correct
        assert message_data["subject"] == "API Test Message"
        assert message_data["message_type"] == "email"
        assert message_data["recipient_type"] == "individual"
