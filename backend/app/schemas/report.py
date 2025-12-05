from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import date, datetime


class MonthlyRevenue(BaseModel):
    month: str
    amount: float


class FeeTypeBreakdown(BaseModel):
    fee_type: str
    amount: float
    percentage: float


class FinancialReport(BaseModel):
    total_revenue: float
    fees_collected: float
    pending_fees: float
    overdue_fees: float
    collection_rate: float
    monthly_revenue: List[MonthlyRevenue]
    fee_type_breakdown: List[FeeTypeBreakdown]


class FinancialReportParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    term_id: Optional[str] = None


# ============== Extended Financial Reports (P1.2) ==============

class AgingBucketReport(BaseModel):
    """Aging bucket for outstanding fees"""
    bucket_name: str  # "0-30 days", "31-60 days", "61-90 days", "90+ days"
    student_count: int
    total_amount: float
    percentage_of_total: float


class StudentOutstanding(BaseModel):
    """Student with outstanding fees"""
    student_id: str
    student_name: str
    admission_number: str
    class_name: str
    total_outstanding: float
    oldest_due_date: Optional[date] = None
    days_overdue: int = 0


class ClassFeeReport(BaseModel):
    """Fee collection report per class"""
    class_id: str
    class_name: str
    total_students: int
    total_assigned: float
    total_collected: float
    total_pending: float
    total_overdue: float
    collection_rate: float
    students_with_outstanding: int


class TermFeeReport(BaseModel):
    """Fee collection report per term"""
    term_id: str
    term_name: str
    academic_session: str
    total_assigned: float
    total_collected: float
    total_pending: float
    collection_rate: float


class ExtendedFinancialReport(FinancialReport):
    """Extended financial report with aging and breakdowns"""
    aging_buckets: List[AgingBucketReport] = []
    class_breakdown: List[ClassFeeReport] = []
    term_breakdown: List[TermFeeReport] = []
    top_outstanding_students: List[StudentOutstanding] = []
    payment_trend: List[Dict[str, Any]] = []  # Daily/weekly payment trend


# ============== Attendance Reports ==============

class AttendanceReportParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    term_id: Optional[str] = None
    class_id: Optional[str] = None


class DailyAttendance(BaseModel):
    """Daily attendance summary"""
    date: date
    present: int
    absent: int
    late: int
    excused: int
    total: int
    attendance_rate: float


class ClassAttendanceReport(BaseModel):
    """Attendance report per class"""
    class_id: str
    class_name: str
    total_students: int
    average_attendance_rate: float
    total_present: int
    total_absent: int
    total_late: int
    total_excused: int
    students_below_threshold: int  # Students with <80% attendance


class StudentAttendanceReport(BaseModel):
    """Attendance report per student"""
    student_id: str
    student_name: str
    admission_number: str
    class_name: str
    present_count: int
    absent_count: int
    late_count: int
    excused_count: int
    total_days: int
    attendance_rate: float


class AttendanceReport(BaseModel):
    """Complete attendance report"""
    overall_attendance_rate: float
    total_school_days: int
    daily_attendance: List[DailyAttendance] = []
    class_breakdown: List[ClassAttendanceReport] = []
    students_below_threshold: List[StudentAttendanceReport] = []


# ============== Academic Reports ==============

class AcademicReportParams(BaseModel):
    term_id: Optional[str] = None
    class_id: Optional[str] = None
    subject_id: Optional[str] = None
    exam_id: Optional[str] = None


class SubjectPerformanceReport(BaseModel):
    """Performance report per subject"""
    subject_id: str
    subject_name: str
    average_score: float
    highest_score: float
    lowest_score: float
    pass_rate: float
    total_students: int
    grade_distribution: Dict[str, int] = {}  # {"A": 10, "B": 15, ...}


class ClassPerformanceReport(BaseModel):
    """Performance report per class"""
    class_id: str
    class_name: str
    average_score: float
    highest_score: float
    lowest_score: float
    pass_rate: float
    total_students: int
    subject_breakdown: List[SubjectPerformanceReport] = []


class StudentPerformanceReport(BaseModel):
    """Performance report per student"""
    student_id: str
    student_name: str
    admission_number: str
    class_name: str
    average_score: float
    total_subjects: int
    subjects_passed: int
    subjects_failed: int
    position: Optional[int] = None


class AcademicReport(BaseModel):
    """Complete academic report"""
    overall_average: float
    overall_pass_rate: float
    total_students: int
    class_breakdown: List[ClassPerformanceReport] = []
    subject_breakdown: List[SubjectPerformanceReport] = []
    top_performers: List[StudentPerformanceReport] = []
    underperformers: List[StudentPerformanceReport] = []


# ============== Enrollment Reports (P2.1) ==============

class EnrollmentReportParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    term_id: Optional[str] = None
    class_id: Optional[str] = None
    grade_level: Optional[str] = None


class EnrollmentByClass(BaseModel):
    """Enrollment count per class"""
    class_id: str
    class_name: str
    level: str
    total_students: int
    new_students: int
    returning_students: int
    capacity: Optional[int] = None
    utilization_rate: Optional[float] = None


class EnrollmentByGrade(BaseModel):
    """Enrollment count per grade level"""
    grade_level: str
    total_students: int
    new_students: int
    returning_students: int
    class_count: int


class EnrollmentTrendPoint(BaseModel):
    """Enrollment trend data point"""
    period: str  # "2024-01", "2024 Q1", etc.
    total: int
    new_students: int
    returning_students: int
    withdrawals: int = 0


class CohortRetention(BaseModel):
    """Cohort retention data"""
    cohort_year: int
    original_count: int
    current_count: int
    retention_rate: float
    periods: List[Dict[str, Any]] = []  # Period-by-period retention


class EnrollmentReport(BaseModel):
    """Complete enrollment report"""
    total_students: int
    new_students: int
    returning_students: int
    withdrawals: int
    net_change: int
    class_breakdown: List[EnrollmentByClass] = []
    grade_breakdown: List[EnrollmentByGrade] = []
    enrollment_trend: List[EnrollmentTrendPoint] = []
    cohort_retention: List[CohortRetention] = []


# ============== Teacher Reports (P2.4) ==============

class TeacherReportParams(BaseModel):
    teacher_id: Optional[str] = None
    term_id: Optional[str] = None
    class_id: Optional[str] = None


class TeacherClassReport(BaseModel):
    """Teacher's class performance"""
    class_id: str
    class_name: str
    subject_id: str
    subject_name: str
    total_students: int
    average_score: Optional[float] = None
    attendance_rate: Optional[float] = None


class TeacherWorkloadReport(BaseModel):
    """Teacher workload summary"""
    teacher_id: str
    teacher_name: str
    email: str
    total_classes: int
    total_students: int
    total_subjects: int
    cbt_tests_created: int
    cbt_tests_graded: int
    average_class_performance: Optional[float] = None
    class_breakdown: List[TeacherClassReport] = []


class TeacherReport(BaseModel):
    """Complete teacher report"""
    total_teachers: int
    average_classes_per_teacher: float
    average_students_per_teacher: float
    teacher_breakdown: List[TeacherWorkloadReport] = []
