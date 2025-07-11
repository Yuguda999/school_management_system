from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, text
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
import logging

from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import Class, Subject, Term
from app.models.fee import FeeStructure, FeePayment, FeeAssignment, PaymentStatus
from app.models.grade import Grade, Exam
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
        term_id: Optional[str] = None
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
        
        # Add term filtering for term-specific data
        if term_id:
            # For students, we might want to filter by enrollment term
            # This would need to be adjusted based on your enrollment model
            pass
        
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
        
        # Attendance rate (simplified calculation)
        # This would need to be implemented based on your attendance model
        attendance_rate = 92.5  # Placeholder
        
        return DashboardStats(
            total_students=total_students,
            total_teachers=total_teachers,
            total_classes=total_classes,
            total_subjects=total_subjects,
            active_terms=active_terms,
            pending_fees=pending_fees,
            recent_enrollments=recent_enrollments,
            attendance_rate=attendance_rate,
            total_revenue=total_revenue
        )

    @staticmethod
    async def get_enrollment_trend(
        db: AsyncSession,
        school_id: str,
        months: int = 6
    ) -> List[EnrollmentTrend]:
        """Get enrollment trend data"""
        # This is a simplified implementation
        # In a real scenario, you'd query actual enrollment data by month
        
        trends = []
        for i in range(months):
            month_date = datetime.utcnow() - timedelta(days=30 * i)
            month_name = month_date.strftime("%b %Y")
            
            # Mock data - replace with actual query
            students = 1200 + (i * 10)
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
        # This is a simplified implementation
        # In a real scenario, you'd query actual revenue data by month
        
        revenue_data = []
        for i in range(months):
            month_date = datetime.utcnow() - timedelta(days=30 * i)
            month_name = month_date.strftime("%b %Y")
            
            # Mock data - replace with actual query
            revenue = 25000.0 + (i * 2000)
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
        filters: DashboardFilters
    ) -> DashboardData:
        """Get complete dashboard data"""
        
        # Get all dashboard components
        stats = await DashboardService.get_dashboard_stats(
            db, school_id, filters.term_id
        )
        
        enrollment_trend = await DashboardService.get_enrollment_trend(
            db, school_id
        )
        
        revenue_data = await DashboardService.get_revenue_data(
            db, school_id, filters.term_id
        )
        
        # Mock data for other components
        attendance_data = [
            AttendanceData(status="Present", count=1150, percentage=92.0),
            AttendanceData(status="Absent", count=75, percentage=6.0),
            AttendanceData(status="Late", count=25, percentage=2.0)
        ]
        
        performance_data = [
            PerformanceData(subject="Mathematics", average_score=78.5, target_score=80.0),
            PerformanceData(subject="English", average_score=82.3, target_score=80.0),
            PerformanceData(subject="Science", average_score=75.8, target_score=80.0),
            PerformanceData(subject="History", average_score=79.2, target_score=80.0)
        ]
        
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
