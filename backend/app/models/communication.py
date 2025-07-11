from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Text, DateTime, JSON, Integer
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class MessageType(str, enum.Enum):
    SMS = "sms"
    EMAIL = "email"
    NOTIFICATION = "notification"
    ANNOUNCEMENT = "announcement"


class MessageStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class RecipientType(str, enum.Enum):
    INDIVIDUAL = "individual"
    CLASS = "class"
    ROLE = "role"
    ALL_PARENTS = "all_parents"
    ALL_TEACHERS = "all_teachers"
    ALL_STUDENTS = "all_students"
    CUSTOM_GROUP = "custom_group"


class Message(TenantBaseModel):
    """Message/Communication model"""
    
    __tablename__ = "messages"
    
    # Message content
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), nullable=False)
    
    # Sender information
    sender_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    sender_name = Column(String(200), nullable=False)
    
    # Recipient information
    recipient_type = Column(Enum(RecipientType), nullable=False)
    recipient_id = Column(String(36), ForeignKey("users.id"), nullable=True)  # For individual messages
    recipient_class_id = Column(String(36), ForeignKey("classes.id"), nullable=True)  # For class messages
    recipient_role = Column(String(50), nullable=True)  # For role-based messages
    
    # Message status
    status = Column(Enum(MessageStatus), default=MessageStatus.DRAFT, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    
    # Scheduling
    scheduled_at = Column(DateTime, nullable=True)
    is_scheduled = Column(Boolean, default=False, nullable=False)
    
    # Message configuration
    is_urgent = Column(Boolean, default=False, nullable=False)
    requires_response = Column(Boolean, default=False, nullable=False)
    
    # Additional data
    additional_data = Column(JSON, nullable=True, default={})
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_messages")
    recipient_class = relationship("Class")
    message_recipients = relationship("MessageRecipient", back_populates="message")
    
    def __repr__(self):
        return f"<Message(id={self.id}, subject={self.subject}, type={self.message_type})>"


class MessageRecipient(TenantBaseModel):
    """Individual message recipients for tracking delivery status"""
    
    __tablename__ = "message_recipients"
    
    # Foreign Keys
    message_id = Column(String(36), ForeignKey("messages.id"), nullable=False)
    recipient_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Recipient details
    recipient_name = Column(String(200), nullable=False)
    recipient_email = Column(String(255), nullable=True)
    recipient_phone = Column(String(20), nullable=True)
    
    # Delivery status
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    message = relationship("Message", back_populates="message_recipients")
    recipient = relationship("User")
    
    def __repr__(self):
        return f"<MessageRecipient(message_id={self.message_id}, recipient_id={self.recipient_id}, status={self.status})>"


class Announcement(TenantBaseModel):
    """School announcements model"""
    
    __tablename__ = "announcements"
    
    # Announcement content
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    
    # Publishing details
    published_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    published_at = Column(DateTime, nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    
    # Visibility settings
    is_public = Column(Boolean, default=True, nullable=False)  # Visible to all school members
    target_roles = Column(JSON, nullable=True)  # Specific roles if not public
    target_classes = Column(JSON, nullable=True)  # Specific classes
    
    # Scheduling
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    # Priority and categorization
    is_urgent = Column(Boolean, default=False, nullable=False)
    category = Column(String(50), nullable=True)  # e.g., "academic", "event", "notice"
    
    # Additional information
    attachments = Column(JSON, nullable=True, default=[])
    additional_data = Column(JSON, nullable=True, default={})
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    publisher = relationship("User")
    
    def __repr__(self):
        return f"<Announcement(id={self.id}, title={self.title}, published={self.is_published})>"


class NotificationTemplate(TenantBaseModel):
    """Template for automated notifications"""
    
    __tablename__ = "notification_templates"
    
    # Template details
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    template_type = Column(String(50), nullable=False)  # e.g., "fee_reminder", "exam_result"
    
    # Template content
    subject_template = Column(String(255), nullable=False)
    content_template = Column(Text, nullable=False)
    
    # Configuration
    is_active = Column(Boolean, default=True, nullable=False)
    message_type = Column(Enum(MessageType), nullable=False)
    
    # Trigger configuration
    trigger_event = Column(String(100), nullable=False)  # e.g., "fee_due", "exam_published"
    trigger_conditions = Column(JSON, nullable=True, default={})
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    creator = relationship("User")
    
    def __repr__(self):
        return f"<NotificationTemplate(id={self.id}, name={self.name}, type={self.template_type})>"
