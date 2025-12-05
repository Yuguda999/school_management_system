from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, date


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


# ============== Advanced Analytics Schemas (P1.1 - Executive Dashboard 2.0) ==============

class ClassStats(BaseModel):
    """Per-class statistics for drill-down"""
    class_id: str
    class_name: str
    level: str
    total_students: int
    attendance_rate: float
    average_grade: Optional[float] = None
    total_fees: float = 0
    fees_collected: float = 0
    pending_fees: float = 0
    collection_rate: float = 0

    class Config:
        from_attributes = True


class AttendanceByClass(BaseModel):
    """Attendance statistics per class"""
    class_id: str
    class_name: str
    present_count: int
    absent_count: int
    late_count: int
    excused_count: int
    total_students: int
    attendance_rate: float

    class Config:
        from_attributes = True


class PerformanceByClass(BaseModel):
    """Academic performance per class"""
    class_id: str
    class_name: str
    average_score: float
    highest_score: Optional[float] = None
    lowest_score: Optional[float] = None
    pass_rate: float
    total_graded_students: int
    below_threshold_count: int = 0  # Students below 50%

    class Config:
        from_attributes = True


class FeesByClass(BaseModel):
    """Fee collection status per class"""
    class_id: str
    class_name: str
    total_students: int
    total_fees: float
    fees_collected: float
    pending_fees: float
    overdue_fees: float
    collection_rate: float

    class Config:
        from_attributes = True


class TeacherWorkloadStats(BaseModel):
    """Teacher workload statistics"""
    teacher_id: str
    teacher_name: str
    class_count: int
    student_count: int
    subject_count: int
    average_class_performance: Optional[float] = None
    average_attendance_rate: Optional[float] = None
    cbt_tests_created: int = 0

    class Config:
        from_attributes = True


class DrillDownFilters(BaseModel):
    """Filters for drill-down analytics"""
    term_id: Optional[str] = None
    class_id: Optional[str] = None
    grade_level: Optional[str] = None
    subject_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    threshold: Optional[float] = 50.0  # Threshold for underperforming classes

    class Config:
        from_attributes = True


class DrillDownData(BaseModel):
    """Detailed drill-down data for a specific metric"""
    metric: str  # 'attendance', 'performance', 'fees', 'enrollment'
    summary: Dict[str, Any]
    class_breakdown: List[ClassStats] = []
    trend_data: List[Dict[str, Any]] = []
    below_threshold: List[Dict[str, Any]] = []  # Items below threshold

    class Config:
        from_attributes = True


class ExtendedDashboardStats(DashboardStats):
    """Extended dashboard stats with class-level breakdowns"""
    # Class-level aggregates
    class_level_stats: List[ClassStats] = []
    attendance_by_class: List[AttendanceByClass] = []
    performance_by_class: List[PerformanceByClass] = []
    fees_by_class: List[FeesByClass] = []

    # Summary metrics
    classes_below_attendance_threshold: int = 0
    classes_below_performance_threshold: int = 0
    classes_with_high_pending_fees: int = 0

    class Config:
        from_attributes = True


# ============== Enrollment & Cohort Trends (P2.1) ==============

class EnrollmentTrendPoint(BaseModel):
    """Enrollment trend data point"""
    date: date
    period_label: str  # e.g., "2024 Q1", "Jan 2024"
    total: int
    new_students: int
    returning_students: int

    class Config:
        from_attributes = True


class CohortRetentionPoint(BaseModel):
    """Cohort retention data"""
    period_label: str  # e.g., "Year 1", "Term 2"
    retained_count: int
    original_count: int
    retention_percentage: float

    class Config:
        from_attributes = True


class EnrollmentAnalytics(BaseModel):
    """Complete enrollment analytics"""
    current_enrollment: int = 0
    previous_enrollment: int = 0
    growth_rate: float = 0.0
    retention_rate: float = 0.0
    enrollment_trends: List[EnrollmentTrendPoint] = []
    cohort_retention: List[CohortRetentionPoint] = []
    grade_level_distribution: List[Dict[str, Any]] = []
    by_class: List[Dict[str, Any]] = []
    gender_distribution: Dict[str, int] = {}
    total_new_this_term: int = 0
    total_returning: int = 0

    class Config:
        from_attributes = True


# ============== Financial Analytics (P1.2) ==============

class AgingBucket(BaseModel):
    """Aging bucket for outstanding fees"""
    bucket_name: str  # "0-30 days", "31-60 days", etc.
    count: int
    amount: float

    class Config:
        from_attributes = True


class RevenueByTerm(BaseModel):
    """Revenue data per term"""
    term_id: str
    term_name: str
    academic_session: str
    target_revenue: float
    actual_revenue: float
    collection_rate: float

    class Config:
        from_attributes = True


class FeeTypePerformance(BaseModel):
    """Performance by fee type"""
    fee_type: str
    total_assigned: float
    collected: float
    pending: float
    overdue: float
    collection_rate: float

    class Config:
        from_attributes = True


class FinancialAnalytics(BaseModel):
    """Complete financial analytics"""
    total_revenue: float
    total_collected: float
    total_pending: float
    total_overdue: float
    overall_collection_rate: float
    aging_buckets: List[AgingBucket] = []
    revenue_by_term: List[RevenueByTerm] = []
    fee_type_breakdown: List[FeeTypePerformance] = []
    top_classes_by_outstanding: List[FeesByClass] = []

    class Config:
        from_attributes = True


# ============== Teacher Analytics (P2.4) ==============

class TeacherPerformanceMetrics(BaseModel):
    """Detailed teacher performance metrics"""
    teacher_id: str
    teacher_name: str
    email: str
    classes_taught: int
    total_students: int
    subjects_taught: int
    average_student_grade: Optional[float] = None
    class_attendance_rate: Optional[float] = None
    cbt_tests_created: int = 0
    cbt_tests_graded: int = 0
    assignments_created: int = 0
    subject_breakdown: List[Dict[str, Any]] = []
    class_breakdown: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True


class TeacherAnalytics(BaseModel):
    """Complete teacher analytics"""
    total_teachers: int
    average_workload: float
    teachers_above_average_workload: int
    teacher_metrics: List[TeacherPerformanceMetrics] = []

    class Config:
        from_attributes = True


# ============== Class Insights for Teachers (P1.3) ==============

class StudentAtRisk(BaseModel):
    """Student at risk summary"""
    student_id: str
    student_name: str
    admission_number: str
    attendance_rate: float
    average_grade: Optional[float] = None
    risk_level: str  # "high", "medium", "low"
    risk_factors: List[str] = []  # e.g., ["low_grades", "poor_attendance"]

    class Config:
        from_attributes = True


class GradeDistribution(BaseModel):
    """Grade distribution for a class/subject"""
    grade: str  # A, B, C, D, E, F
    count: int
    percentage: float

    class Config:
        from_attributes = True


class ClassInsights(BaseModel):
    """Complete class insights for teachers"""
    class_id: str
    class_name: str
    total_students: int

    # Attendance metrics
    attendance_rate: float
    attendance_trend: List[Dict[str, Any]] = []  # Daily/weekly trend

    # Performance metrics
    average_grade: Optional[float] = None
    grade_distribution: List[GradeDistribution] = []
    subject_performance: List[Dict[str, Any]] = []

    # At-risk students
    at_risk_students: List[StudentAtRisk] = []
    high_risk_count: int = 0

    # Recommendations
    recommendations: List[str] = []

    class Config:
        from_attributes = True


# ============== Student Analytics (P1.4 - Enhanced Personal Dashboard) ==============

class SubjectPerformance(BaseModel):
    """Student's performance in a subject"""
    subject_id: str
    subject_name: str
    current_average: Optional[float] = None
    previous_average: Optional[float] = None
    trend: str = "stable"  # "improving", "declining", "stable"
    grade_count: int = 0
    last_exam_score: Optional[float] = None

    class Config:
        from_attributes = True


class TermPerformance(BaseModel):
    """Performance data for a term"""
    term_id: str
    term_name: str
    academic_session: str
    overall_average: Optional[float] = None
    subject_count: int = 0
    attendance_rate: Optional[float] = None
    position: Optional[int] = None

    class Config:
        from_attributes = True


class StudentAnalytics(BaseModel):
    """Complete student analytics for personal dashboard"""
    student_id: str
    student_name: str
    current_class: Optional[str] = None

    # Overall performance
    current_average: Optional[float] = None
    previous_average: Optional[float] = None
    improvement_percentage: Optional[float] = None
    overall_trend: str = "stable"

    # Attendance
    current_term_attendance: Optional[float] = None
    attendance_correlation: Optional[str] = None  # How attendance affects grades

    # Subject breakdown
    subjects: List[SubjectPerformance] = []
    strongest_subject: Optional[str] = None
    weakest_subject: Optional[str] = None

    # Term history
    term_history: List[TermPerformance] = []

    # Insights
    insights: List[str] = []

    class Config:
        from_attributes = True


# ============== Student Tasks/Deadlines (P1.5) ==============

class StudentTask(BaseModel):
    """A task or deadline for a student"""
    id: str
    task_type: str  # "cbt_test", "assignment", "event"
    title: str
    description: Optional[str] = None
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    status: str = "pending"  # "pending", "in_progress", "completed", "overdue"
    priority: str = "normal"  # "high", "normal", "low"

    class Config:
        from_attributes = True


class StudentTaskList(BaseModel):
    """Complete task list for a student"""
    upcoming_tasks: List[StudentTask] = []
    overdue_tasks: List[StudentTask] = []
    completed_tasks: List[StudentTask] = []
    total_pending: int = 0
    total_overdue: int = 0

    class Config:
        from_attributes = True


# ============== Grade Benchmarks (P3.3) ==============

class GradeBenchmark(BaseModel):
    """Anonymized grade benchmark"""
    subject_id: str
    subject_name: str
    exam_id: Optional[str] = None
    exam_name: Optional[str] = None
    student_score: float
    class_average: float
    class_highest: float
    class_lowest: float
    percentile: float  # Student's percentile in class
    distribution: List[Dict[str, int]] = []  # Score ranges and counts

    class Config:
        from_attributes = True


# ============== Original Models ==============

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


class ExtendedDashboardData(BaseModel):
    """Extended dashboard data with drill-down capabilities"""
    stats: ExtendedDashboardStats
    enrollment_trend: List[EnrollmentTrend]
    revenue_data: List[RevenueData]
    attendance_data: List[AttendanceData]
    performance_data: List[PerformanceData]
    recent_activities: List[RecentActivity]

    # Additional analytics
    class_level_stats: List[ClassStats] = []
    attendance_by_class: List[AttendanceByClass] = []
    performance_by_class: List[PerformanceByClass] = []
    fees_by_class: List[FeesByClass] = []

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
