from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class SchoolSummary(BaseModel):
    """Summary information about a school for selection"""
    id: str
    name: str
    code: str
    logo_url: Optional[str] = None
    is_primary: bool  # Whether this is the primary school for the owner
    subscription_plan: str
    subscription_status: str
    is_trial: bool
    trial_expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class OwnedSchoolsResponse(BaseModel):
    """Response containing all schools owned by a user"""
    schools: List[SchoolSummary]
    total_count: int
    has_multiple_schools: bool


class SchoolSelectionRequest(BaseModel):
    """Request to select a school context"""
    school_id: str


class SchoolSelectionResponse(BaseModel):
    """Response after selecting a school"""
    access_token: str
    school: SchoolSummary
    message: str = "School context updated successfully"


class SchoolOwnershipDetails(BaseModel):
    """Detailed ownership information"""
    id: str
    user_id: str
    school_id: str
    is_primary_owner: bool
    is_active: bool
    can_manage_billing: bool
    can_manage_users: bool
    can_manage_settings: bool
    granted_at: datetime
    granted_by: Optional[str] = None
    
    class Config:
        from_attributes = True


class AddSchoolOwnershipRequest(BaseModel):
    """Request to add school ownership"""
    user_email: str
    school_id: str
    can_manage_billing: bool = True
    can_manage_users: bool = True
    can_manage_settings: bool = True


class TransferOwnershipRequest(BaseModel):
    """Request to transfer primary ownership"""
    school_id: str
    new_owner_email: str
