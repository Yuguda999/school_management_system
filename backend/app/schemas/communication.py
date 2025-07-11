from typing import Optional, List, Dict, Any
from pydantic import BaseModel, validator, Field, EmailStr
from datetime import datetime
from app.models.communication import MessageType, MessageStatus, RecipientType


class MessageBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    message_type: MessageType
    recipient_type: RecipientType
    recipient_id: Optional[str] = None
    recipient_class_id: Optional[str] = None
    recipient_role: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    is_urgent: bool = False
    requires_response: bool = False
    metadata: Optional[Dict[str, Any]] = {}
    
    @validator('recipient_id')
    def validate_individual_recipient(cls, v, values):
        if values.get('recipient_type') == RecipientType.INDIVIDUAL and not v:
            raise ValueError('recipient_id is required for individual messages')
        return v
    
    @validator('recipient_class_id')
    def validate_class_recipient(cls, v, values):
        if values.get('recipient_type') == RecipientType.CLASS and not v:
            raise ValueError('recipient_class_id is required for class messages')
        return v
    
    @validator('recipient_role')
    def validate_role_recipient(cls, v, values):
        recipient_type = values.get('recipient_type')
        if recipient_type in [RecipientType.ROLE] and not v:
            raise ValueError('recipient_role is required for role-based messages')
        return v


class MessageCreate(MessageBase):
    pass


class MessageUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    scheduled_at: Optional[datetime] = None
    is_urgent: Optional[bool] = None
    requires_response: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class MessageResponse(MessageBase):
    id: str
    sender_id: str
    sender_name: str
    status: MessageStatus
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    is_scheduled: bool
    total_recipients: Optional[int] = None
    delivered_count: Optional[int] = None
    read_count: Optional[int] = None
    failed_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MessageRecipientBase(BaseModel):
    recipient_name: str
    recipient_email: Optional[EmailStr] = None
    recipient_phone: Optional[str] = None


class MessageRecipientResponse(MessageRecipientBase):
    id: str
    message_id: str
    recipient_id: str
    status: MessageStatus
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class BulkMessageCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    message_type: MessageType
    recipient_ids: List[str] = Field(..., min_items=1)
    scheduled_at: Optional[datetime] = None
    is_urgent: bool = False
    requires_response: bool = False
    metadata: Optional[Dict[str, Any]] = {}


class AnnouncementBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    is_public: bool = True
    target_roles: Optional[List[str]] = None
    target_classes: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_urgent: bool = False
    category: Optional[str] = Field(None, max_length=50)
    attachments: Optional[List[Dict[str, Any]]] = []
    metadata: Optional[Dict[str, Any]] = {}
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        if v and 'start_date' in values and values['start_date'] and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    is_public: Optional[bool] = None
    target_roles: Optional[List[str]] = None
    target_classes: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_urgent: Optional[bool] = None
    category: Optional[str] = Field(None, max_length=50)
    attachments: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    is_published: Optional[bool] = None


class AnnouncementResponse(AnnouncementBase):
    id: str
    published_by: str
    published_at: Optional[datetime] = None
    is_published: bool
    publisher_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NotificationTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    template_type: str = Field(..., min_length=1, max_length=50)
    subject_template: str = Field(..., min_length=1, max_length=255)
    content_template: str = Field(..., min_length=1)
    message_type: MessageType
    trigger_event: str = Field(..., min_length=1, max_length=100)
    trigger_conditions: Optional[Dict[str, Any]] = {}


class NotificationTemplateCreate(NotificationTemplateBase):
    pass


class NotificationTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    template_type: Optional[str] = Field(None, min_length=1, max_length=50)
    subject_template: Optional[str] = Field(None, min_length=1, max_length=255)
    content_template: Optional[str] = Field(None, min_length=1)
    message_type: Optional[MessageType] = None
    trigger_event: Optional[str] = Field(None, min_length=1, max_length=100)
    trigger_conditions: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class NotificationTemplateResponse(NotificationTemplateBase):
    id: str
    is_active: bool
    created_by: str
    creator_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MessageStatistics(BaseModel):
    total_messages: int
    sent_messages: int
    delivered_messages: int
    read_messages: int
    failed_messages: int
    scheduled_messages: int
    messages_by_type: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
    
    class Config:
        from_attributes = True


class CommunicationDashboard(BaseModel):
    total_messages: int
    total_announcements: int
    active_templates: int
    recent_messages: List[MessageResponse]
    recent_announcements: List[AnnouncementResponse]
    message_statistics: MessageStatistics
    
    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    message_id: str


class MarkAsReadRequest(BaseModel):
    message_ids: List[str] = Field(..., min_items=1)


class MessageFilter(BaseModel):
    message_type: Optional[MessageType] = None
    status: Optional[MessageStatus] = None
    recipient_type: Optional[RecipientType] = None
    sender_id: Optional[str] = None
    recipient_id: Optional[str] = None
    is_urgent: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search_query: Optional[str] = None
