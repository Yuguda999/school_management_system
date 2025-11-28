from sqlalchemy import Column, String, Boolean, Text, Enum
import enum
from app.models.base import TenantBaseModel

class NotificationType(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"

class Notification(TenantBaseModel):
    __tablename__ = "notifications"

    user_id = Column(String(36), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default=NotificationType.INFO, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    link = Column(String(500), nullable=True)
    
    # We might want to add metadata or related entity info later, but keeping it simple for now.
