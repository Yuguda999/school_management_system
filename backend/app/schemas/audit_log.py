from typing import Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime

class AuditLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_delegated: bool = False
    delegated_by: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    user_id: str

class AuditLogResponse(AuditLogBase):
    id: str
    school_id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

