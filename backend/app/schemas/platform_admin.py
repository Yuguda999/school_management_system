from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime


class SchoolOwnerCreate(BaseModel):
    """Schema for creating a school owner"""
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()


class SchoolOwnerResponse(BaseModel):
    """Schema for school owner response"""
    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    school_id: Optional[str] = None
    created_at: datetime
    temp_password: Optional[str] = None  # Only included when creating
    
    class Config:
        from_attributes = True
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class SchoolOwnerUpdate(BaseModel):
    """Schema for updating a school owner"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class PlatformStatistics(BaseModel):
    """Schema for platform statistics"""
    total_schools: int
    active_schools: int
    total_school_owners: int
    schools_this_month: int
    growth_metrics: Dict[str, str]


class SchoolDetailResponse(BaseModel):
    """Schema for detailed school information"""
    id: str
    name: str
    code: str
    email: str
    phone: Optional[str] = None
    address: str
    owner_name: str
    owner_email: str
    is_active: bool
    is_verified: bool
    created_at: str
    student_count: int
    teacher_count: int
    last_activity: Optional[str] = None


class TrialStatistics(BaseModel):
    """Schema for trial statistics"""
    total_trial_schools: int
    active_trials: int
    expired_trials: int
    converted_trials: int
    trial_conversion_rate: float
    average_trial_duration: float
    trials_expiring_soon: int  # Expiring in next 7 days


class PlatformActivity(BaseModel):
    """Schema for platform activity"""
    type: str
    title: str
    description: str
    timestamp: str
    icon: str


class PlatformDashboardData(BaseModel):
    """Schema for platform dashboard data"""
    statistics: PlatformStatistics
    recent_schools: List[SchoolDetailResponse]
    recent_activity: List[PlatformActivity]
    trial_statistics: TrialStatistics


class SchoolStatusUpdate(BaseModel):
    """Schema for updating school status"""
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class PlatformSettings(BaseModel):
    """Schema for platform settings"""
    registration_enabled: bool = True
    max_schools_per_owner: int = 1
    require_email_verification: bool = True
    auto_approve_schools: bool = False
    platform_name: str = "School Management Platform"
    support_email: str = "support@platform.com"
    maintenance_mode: bool = False


class BulkSchoolAction(BaseModel):
    """Schema for bulk school actions"""
    school_ids: List[str]
    action: str  # activate, deactivate, verify, unverify
    
    @validator('action')
    def validate_action(cls, v):
        allowed_actions = ['activate', 'deactivate', 'verify', 'unverify']
        if v not in allowed_actions:
            raise ValueError(f'Action must be one of: {", ".join(allowed_actions)}')
        return v
    
    @validator('school_ids')
    def validate_school_ids(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one school ID must be provided')
        if len(v) > 50:
            raise ValueError('Cannot perform bulk action on more than 50 schools at once')
        return v


class PlatformAnalytics(BaseModel):
    """Schema for platform analytics"""
    period: str  # daily, weekly, monthly, yearly
    school_registrations: List[Dict[str, Any]]
    user_growth: List[Dict[str, Any]]
    activity_metrics: List[Dict[str, Any]]
    revenue_data: List[Dict[str, Any]]  # For future subscription features


class SchoolPerformanceMetrics(BaseModel):
    """Schema for school performance metrics"""
    school_id: str
    school_name: str
    total_students: int
    total_teachers: int
    active_classes: int
    last_activity: Optional[str] = None
    performance_score: float  # 0-100 based on activity, growth, etc.
    growth_rate: float  # Percentage growth in students
    engagement_score: float  # Based on login frequency, feature usage


class PlatformHealthCheck(BaseModel):
    """Schema for platform health check"""
    status: str  # healthy, warning, critical
    database_status: str
    api_response_time: float
    active_users_24h: int
    error_rate_24h: float
    storage_usage: Dict[str, Any]
    last_backup: Optional[str] = None
