from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class DashboardStats(BaseModel):
    """Dashboard statistics schema"""
    total_students: int
    total_teachers: int
    total_classes: int
    total_subjects: int
    active_terms: int
    pending_fees: float
    recent_enrollments: int
    attendance_rate: float
    total_revenue: float
    
    # Teacher specific stats
    my_students_count: Optional[int] = None
    my_classes_count: Optional[int] = None
    assignments_due: Optional[int] = None
    average_grade: Optional[float] = None
    
    class Config:
        from_attributes = True


class EnrollmentTrend(BaseModel):
    """Enrollment trend data"""
    month: str
    students: int
    
    class Config:
        from_attributes = True


class RevenueData(BaseModel):
    """Revenue data for charts"""
    month: str
    revenue: float
    
    class Config:
        from_attributes = True


class AttendanceData(BaseModel):
    """Attendance distribution data"""
    status: str
    count: int
    percentage: float
    
    class Config:
        from_attributes = True


class PerformanceData(BaseModel):
    """Academic performance data"""
    subject: str
    average_score: float
    target_score: float
    
    class Config:
        from_attributes = True


class RecentActivity(BaseModel):
    """Recent activity item"""
    id: str
    type: str  # 'enrollment', 'payment', 'grade', 'attendance'
    title: str
    description: str
    timestamp: datetime
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class DashboardData(BaseModel):
    """Complete dashboard data"""
    stats: DashboardStats
    enrollment_trend: List[EnrollmentTrend]
    revenue_data: List[RevenueData]
    attendance_data: List[AttendanceData]
    performance_data: List[PerformanceData]
    recent_activities: List[RecentActivity]
    
    class Config:
        from_attributes = True


class DashboardFilters(BaseModel):
    """Dashboard filters"""
    term_id: Optional[str] = None
    class_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True
