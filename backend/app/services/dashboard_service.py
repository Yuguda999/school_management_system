from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, text
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
import logging

from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import Class, Subject, Term, Attendance, AttendanceStatus, TimetableEntry
from app.models.fee import FeeStructure, FeePayment, FeeAssignment, PaymentStatus
from app.models.grade import Grade, Exam, ExamType
from app.models.school import School
from app.schemas.dashboard import (
    DashboardStats, DashboardData, EnrollmentTrend, RevenueData,
    AttendanceData, PerformanceData, RecentActivity, DashboardFilters
)

logger = logging.getLogger(__name__)


class DashboardService:
    """Service class for dashboard operations"""

    @staticmethod
    async def get_dashboard_stats(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None,
        current_user: Optional[User] = None
    ) -> DashboardStats:
        """Get dashboard statistics"""
        
        # Base conditions
        base_conditions = [
            User.school_id == school_id,
            User.is_deleted == False
        ]
        
        student_conditions = [
            Student.school_id == school_id,
            Student.is_deleted == False
        ]
        
        # Total students
        students_result = await db.execute(
            select(func.count(Student.id)).where(and_(*student_conditions))
        )
        total_students = students_result.scalar() or 0
        
        # Total teachers
        teachers_result = await db.execute(
            select(func.count(User.id)).where(
                and_(*base_conditions, User.role == UserRole.TEACHER)
            )
        )
        total_teachers = teachers_result.scalar() or 0
        
        # Total classes
        classes_result = await db.execute(
            select(func.count(Class.id)).where(
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        total_classes = classes_result.scalar() or 0
        
        # Total subjects
        subjects_result = await db.execute(
            select(func.count(Subject.id)).where(
                Subject.school_id == school_id,
                Subject.is_deleted == False
            )
        )
        total_subjects = subjects_result.scalar() or 0
        
        # Active terms
        terms_result = await db.execute(
            select(func.count(Term.id)).where(
                Term.school_id == school_id,
                Term.is_active == True,
                Term.is_deleted == False
            )
        )
        active_terms = terms_result.scalar() or 0
        
        # Pending fees (term-specific if term_id provided)
        fee_conditions = [
            FeeAssignment.school_id == school_id,
            FeeAssignment.is_deleted == False,
            FeeAssignment.status == PaymentStatus.PENDING
        ]

        if term_id:
            fee_conditions.append(FeeAssignment.term_id == term_id)

        pending_fees_result = await db.execute(
            select(func.sum(FeeAssignment.amount_outstanding)).where(and_(*fee_conditions))
        )
        pending_fees = float(pending_fees_result.scalar() or 0)
        
        # Total revenue (term-specific if term_id provided)
        revenue_conditions = [
            FeePayment.school_id == school_id,
            FeePayment.is_deleted == False
        ]

        if term_id:
            # Join with FeeAssignment to get term information
            revenue_result = await db.execute(
                select(func.sum(FeePayment.amount)).
                join(FeeAssignment, FeePayment.fee_assignment_id == FeeAssignment.id).
                where(
                    and_(
                        *revenue_conditions,
                        FeeAssignment.term_id == term_id
                    )
                )
            )
        else:
            revenue_result = await db.execute(
                select(func.sum(FeePayment.amount)).where(and_(*revenue_conditions))
            )
        total_revenue = float(revenue_result.scalar() or 0)
        
        # Recent enrollments (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_enrollments_result = await db.execute(
            select(func.count(Student.id)).where(
                and_(
                    *student_conditions,
                    Student.created_at >= thirty_days_ago
                )
            )
        )
        recent_enrollments = recent_enrollments_result.scalar() or 0
        
        # Attendance rate
        attendance_query = select(func.count(Attendance.id)).where(
            Attendance.school_id == school_id
        )
        if term_id:
            attendance_query = attendance_query.where(Attendance.term_id == term_id)
            
        total_attendance_records = (await db.execute(attendance_query)).scalar() or 0
        
        if total_attendance_records > 0:
            present_query = attendance_query.where(Attendance.status == AttendanceStatus.PRESENT)
            present_records = (await db.execute(present_query)).scalar() or 0
            attendance_rate = (present_records / total_attendance_records) * 100
        else:
            attendance_rate = 0.0

        # Teacher specific stats
        my_students_count = None
        my_classes_count = None
        assignments_due = None
        average_grade = None

        if current_user and current_user.role == UserRole.TEACHER:
            # My Classes (Classes where teacher is assigned or has timetable entry)
            # 1. Class Teacher
            class_teacher_classes = await db.execute(
                select(Class.id).where(
                    Class.teacher_id == current_user.id,
                    Class.school_id == school_id,
                    Class.is_deleted == False
                )
            )
            class_ids = set(class_teacher_classes.scalars().all())
            
            # 2. Timetable Classes
            timetable_classes = await db.execute(
                select(TimetableEntry.class_id).where(
                    TimetableEntry.teacher_id == current_user.id,
                    TimetableEntry.school_id == school_id
                )
            )
            class_ids.update(timetable_classes.scalars().all())
            my_classes_count = len(class_ids)

            # My Students (Students in those classes)
            if class_ids:
                my_students_result = await db.execute(
                    select(func.count(Student.id)).where(
                        Student.current_class_id.in_(class_ids),
                        Student.school_id == school_id,
                        Student.is_deleted == False
                    )
                )
                my_students_count = my_students_result.scalar() or 0
            else:
                my_students_count = 0

            # Assignments Due (Future exams of type ASSIGNMENT created by teacher)
            assignments_result = await db.execute(
                select(func.count(Exam.id)).where(
                    Exam.created_by == current_user.id,
                    Exam.exam_type == ExamType.ASSIGNMENT,
                    Exam.exam_date >= datetime.utcnow().date(),
                    Exam.school_id == school_id,
                    Exam.is_deleted == False
                )
            )
            assignments_due = assignments_result.scalar() or 0

            # Average Grade (Average of grades in exams created by teacher)
            avg_grade_result = await db.execute(
                select(func.avg(Grade.percentage)).
                join(Exam, Grade.exam_id == Exam.id).
                where(
                    Exam.created_by == current_user.id,
                    Exam.school_id == school_id,
                    Grade.school_id == school_id
                )
            )
            average_grade = float(avg_grade_result.scalar() or 0.0)
        
        return DashboardStats(
            total_students=total_students,
            total_teachers=total_teachers,
            total_classes=total_classes,
            total_subjects=total_subjects,
            active_terms=active_terms,
            pending_fees=pending_fees,
            recent_enrollments=recent_enrollments,
            attendance_rate=round(attendance_rate, 1),
            total_revenue=total_revenue,
            my_students_count=my_students_count,
            my_classes_count=my_classes_count,
            assignments_due=assignments_due,
            average_grade=round(average_grade, 1) if average_grade is not None else None
        )

    @staticmethod
    async def get_enrollment_trend(
        db: AsyncSession,
        school_id: str,
        months: int = 6
    ) -> List[EnrollmentTrend]:
        """Get enrollment trend data"""
        trends = []
        now = datetime.utcnow()
        
        for i in range(months):
            # Calculate date point
            date_point = now - timedelta(days=30 * i)
            month_name = date_point.strftime("%b %Y")
            
            # Count students created up to this date (cumulative)
            query = select(func.count(Student.id)).where(
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.created_at <= date_point
            )
            students = (await db.execute(query)).scalar() or 0
            
            trends.append(EnrollmentTrend(month=month_name, students=students))
        
        return list(reversed(trends))

    @staticmethod
    async def get_revenue_data(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None,
        months: int = 6
    ) -> List[RevenueData]:
        """Get revenue data for charts"""
        revenue_data = []
        now = datetime.utcnow()
        
        for i in range(months):
            # Calculate date range for the month (approximate)
            end_date = now - timedelta(days=30 * i)
            start_date = end_date - timedelta(days=30)
            month_name = end_date.strftime("%b %Y")
            
            # Sum payments in this range
            query = select(func.sum(FeePayment.amount)).where(
                FeePayment.school_id == school_id,
                FeePayment.is_deleted == False,
                FeePayment.payment_date >= start_date.date(),
                FeePayment.payment_date <= end_date.date()
            )
            
            if term_id:
                query = query.join(FeeAssignment, FeePayment.fee_assignment_id == FeeAssignment.id).where(
                    FeeAssignment.term_id == term_id
                )
            
            revenue = float((await db.execute(query)).scalar() or 0)
            revenue_data.append(RevenueData(month=month_name, revenue=revenue))
        
        return list(reversed(revenue_data))

    @staticmethod
    async def get_recent_activities(
        db: AsyncSession,
        school_id: str,
        limit: int = 10
    ) -> List[RecentActivity]:
        """Get recent activities"""
        # This is a simplified implementation
        # In a real scenario, you'd query actual activities from various tables
        
        activities = []
        
        # Recent student enrollments
        recent_students = await db.execute(
            select(Student).where(
                Student.school_id == school_id,
                Student.is_deleted == False
            ).order_by(desc(Student.created_at)).limit(5)
        )
        
        for student in recent_students.scalars():
            activities.append(RecentActivity(
                id=student.id,
                type="enrollment",
                title="New Student Enrollment",
                description=f"{student.first_name} {student.last_name} enrolled",
                timestamp=student.created_at
            ))
        
        # Sort by timestamp and limit
        activities.sort(key=lambda x: x.timestamp, reverse=True)
        return activities[:limit]

    @staticmethod
    async def get_dashboard_data(
        db: AsyncSession,
        school_id: str,
        filters: DashboardFilters,
        current_user: Optional[User] = None
    ) -> DashboardData:
        """Get complete dashboard data"""
        
        # Get all dashboard components
        stats = await DashboardService.get_dashboard_stats(
            db, school_id, filters.term_id, current_user
        )
        
        enrollment_trend = await DashboardService.get_enrollment_trend(
            db, school_id
        )
        
        revenue_data = await DashboardService.get_revenue_data(
            db, school_id, filters.term_id
        )
        
        # Attendance Data (Today's attendance distribution)
        today = datetime.utcnow().date()
        attendance_counts = await db.execute(
            select(Attendance.status, func.count(Attendance.id)).
            where(
                Attendance.school_id == school_id,
                Attendance.date == today
            ).
            group_by(Attendance.status)
        )
        
        attendance_map = {status: count for status, count in attendance_counts.all()}
        total_attendance = sum(attendance_map.values())
        
        attendance_data = []
        # If no attendance today, maybe show empty or 0s
        for status in AttendanceStatus:
            count = attendance_map.get(status, 0)
            percentage = (count / total_attendance * 100) if total_attendance > 0 else 0.0
            attendance_data.append(AttendanceData(
                status=status.value.title(),
                count=count,
                percentage=round(percentage, 1)
            ))
        
        # Performance Data (Average score per subject)
        perf_query = select(Subject.name, func.avg(Grade.percentage)).\
            join(Grade, Subject.id == Grade.subject_id).\
            where(
                Subject.school_id == school_id,
                Subject.is_deleted == False,
                Grade.is_deleted == False
            )
            
        if filters.term_id:
            perf_query = perf_query.where(Grade.term_id == filters.term_id)
            
        perf_query = perf_query.group_by(Subject.name).limit(5)
        
        perf_results = await db.execute(perf_query)
        
        performance_data = []
        for subject_name, avg_score in perf_results.all():
            performance_data.append(PerformanceData(
                subject=subject_name,
                average_score=float(avg_score or 0),
                target_score=70.0 
            ))
        
        recent_activities = await DashboardService.get_recent_activities(
            db, school_id
        )
        
        return DashboardData(
            stats=stats,
            enrollment_trend=enrollment_trend,
            revenue_data=revenue_data,
            attendance_data=attendance_data,
            performance_data=performance_data,
            recent_activities=recent_activities
        )
