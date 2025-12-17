from sqlalchemy import Column, String, JSON, Text, Boolean, ForeignKey
from app.models.base import TenantBaseModel

class AuditLog(TenantBaseModel):
    __tablename__ = "audit_logs"

    user_id = Column(String(36), nullable=False, index=True)  # The actor
    action = Column(String(100), nullable=False)  # e.g., "CREATE", "UPDATE", "DELETE", "LOGIN"
    entity_type = Column(String(100), nullable=False)  # e.g., "student", "class", "grade"
    entity_id = Column(String(36), nullable=True)  # ID of the affected entity
    details = Column(JSON, nullable=True)  # Store before/after state or other details
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Delegated action tracking
    is_delegated = Column(Boolean, default=False, nullable=False)  # True if action was by delegated teacher
    delegated_by = Column(String(36), ForeignKey("users.id"), nullable=True)  # Owner who delegated the permission

