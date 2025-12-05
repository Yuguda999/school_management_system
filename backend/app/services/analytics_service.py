"""
Advanced Analytics Service for School Management System
Implements P1.1 - Executive School Analytics Dashboard 2.0
Implements P1.2 - Fees & Financial Performance Analytics
Implements P1.3 - Class Performance Insights Panel
Implements P2.1 - Enrollment & Cohort Trends Explorer
Implements P2.4 - Teacher Performance & Workload Insights
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_, case, text
from datetime import datetime, timedelta, date
import logging

from app.models.user import User, UserRole
from app.models.student import Student, StudentStatus
from app.models.academic import (
    Class, Subject, Term, Attendance, AttendanceStatus,
    TimetableEntry, Enrollment, class_subject_association, teacher_subject_association
)
from app.models.fee import FeeStructure, FeePayment, FeeAssignment, PaymentStatus, FeeType
from app.models.grade import Grade, Exam, ExamType
from app.models.cbt import CBTTest, CBTSubmission, SubmissionStatus
from app.schemas.dashboard import (
    ClassStats, AttendanceByClass, PerformanceByClass, FeesByClass,
    TeacherWorkloadStats, DrillDownFilters, DrillDownData, ExtendedDashboardStats,
    EnrollmentAnalytics, EnrollmentTrendPoint, CohortRetentionPoint,
    FinancialAnalytics, AgingBucket, RevenueByTerm, FeeTypePerformance,
    TeacherAnalytics, TeacherPerformanceMetrics,
    ClassInsights, StudentAtRisk, GradeDistribution,
    StudentAnalytics, SubjectPerformance, TermPerformance,
    StudentTask, StudentTaskList, GradeBenchmark
)
from app.schemas.report import (
    ExtendedFinancialReport, AgingBucketReport, StudentOutstanding,
    ClassFeeReport, TermFeeReport, AttendanceReport, DailyAttendance,
    ClassAttendanceReport, StudentAttendanceReport, AcademicReport,
    ClassPerformanceReport, SubjectPerformanceReport, StudentPerformanceReport,
    EnrollmentReport, EnrollmentByClass, EnrollmentByGrade, CohortRetention,
    TeacherReport, TeacherWorkloadReport, TeacherClassReport
)

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service class for advanced analytics operations"""

    # ============== P1.1 - Executive Dashboard 2.0 ==============

    @staticmethod
    async def get_class_level_stats(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None
    ) -> List[ClassStats]:
        """Get statistics per class for drill-down"""
        
        # Get all classes
        classes_result = await db.execute(
            select(Class).where(
                Class.school_id == school_id,
                Class.is_deleted == False
            ).order_by(Class.name)
        )
        classes = classes_result.scalars().all()
        
        class_stats = []
        for cls in classes:
            # Count students in class
            student_count = await db.execute(
                select(func.count(Student.id)).where(
                    Student.current_class_id == cls.id,
                    Student.school_id == school_id,
                    Student.is_deleted == False,
                    Student.status == StudentStatus.ACTIVE
                )
            )
            total_students = student_count.scalar() or 0
            
            # Calculate attendance rate
            attendance_conditions = [
                Attendance.class_id == cls.id,
                Attendance.school_id == school_id
            ]
            if term_id:
                attendance_conditions.append(Attendance.term_id == term_id)
            
            total_att = await db.execute(
                select(func.count(Attendance.id)).where(and_(*attendance_conditions))
            )
            total_attendance = total_att.scalar() or 0
            
            present_att = await db.execute(
                select(func.count(Attendance.id)).where(
                    and_(*attendance_conditions, Attendance.status == AttendanceStatus.PRESENT)
                )
            )
            present_count = present_att.scalar() or 0
            
            attendance_rate = (present_count / total_attendance * 100) if total_attendance > 0 else 0.0
            
            # Calculate average grade
            grade_conditions = [
                Grade.class_id == cls.id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            ]
            if term_id:
                grade_conditions.append(Grade.term_id == term_id)
            
            avg_grade = await db.execute(
                select(func.avg(Grade.percentage)).where(and_(*grade_conditions))
            )
            average_grade = avg_grade.scalar()
            
            # Calculate fees
            fee_conditions = [
                FeeAssignment.school_id == school_id,
                FeeAssignment.is_deleted == False
            ]
            if term_id:
                fee_conditions.append(FeeAssignment.term_id == term_id)
            
            # Get student IDs in this class
            student_ids_result = await db.execute(
                select(Student.id).where(
                    Student.current_class_id == cls.id,
                    Student.school_id == school_id,
                    Student.is_deleted == False
                )
            )
            student_ids = [s for s in student_ids_result.scalars().all()]
            
            total_fees = 0.0
            fees_collected = 0.0
            pending_fees = 0.0
            
            if student_ids:
                # Total fees assigned
                total_result = await db.execute(
                    select(func.sum(FeeAssignment.amount)).where(
                        and_(*fee_conditions, FeeAssignment.student_id.in_(student_ids))
                    )
                )
                total_fees = float(total_result.scalar() or 0)
                
                # Fees collected
                collected_result = await db.execute(
                    select(func.sum(FeeAssignment.amount_paid)).where(
                        and_(*fee_conditions, FeeAssignment.student_id.in_(student_ids))
                    )
                )
                fees_collected = float(collected_result.scalar() or 0)
                
                pending_fees = total_fees - fees_collected
            
            collection_rate = (fees_collected / total_fees * 100) if total_fees > 0 else 0.0
            
            class_stats.append(ClassStats(
                class_id=cls.id,
                class_name=cls.name,
                level=cls.level or "",
                total_students=total_students,
                attendance_rate=round(attendance_rate, 1),
                average_grade=round(average_grade, 1) if average_grade else None,
                total_fees=total_fees,
                fees_collected=fees_collected,
                pending_fees=pending_fees,
                collection_rate=round(collection_rate, 1)
            ))

        return class_stats

    @staticmethod
    async def get_attendance_by_class(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[AttendanceByClass]:
        """Get attendance breakdown per class"""

        classes_result = await db.execute(
            select(Class).where(
                Class.school_id == school_id,
                Class.is_deleted == False
            ).order_by(Class.name)
        )
        classes = classes_result.scalars().all()

        attendance_by_class = []
        for cls in classes:
            conditions = [
                Attendance.class_id == cls.id,
                Attendance.school_id == school_id
            ]
            if term_id:
                conditions.append(Attendance.term_id == term_id)
            if start_date:
                conditions.append(Attendance.date >= start_date)
            if end_date:
                conditions.append(Attendance.date <= end_date)

            # Count by status
            status_counts = await db.execute(
                select(Attendance.status, func.count(Attendance.id)).where(
                    and_(*conditions)
                ).group_by(Attendance.status)
            )
            counts = {status: count for status, count in status_counts.all()}

            present = counts.get(AttendanceStatus.PRESENT, 0)
            absent = counts.get(AttendanceStatus.ABSENT, 0)
            late = counts.get(AttendanceStatus.LATE, 0)
            excused = counts.get(AttendanceStatus.EXCUSED, 0)
            total = present + absent + late + excused

            # Get student count
            student_count = await db.execute(
                select(func.count(Student.id)).where(
                    Student.current_class_id == cls.id,
                    Student.school_id == school_id,
                    Student.is_deleted == False,
                    Student.status == StudentStatus.ACTIVE
                )
            )
            total_students = student_count.scalar() or 0

            attendance_rate = ((present + late) / total * 100) if total > 0 else 0.0

            attendance_by_class.append(AttendanceByClass(
                class_id=cls.id,
                class_name=cls.name,
                present_count=present,
                absent_count=absent,
                late_count=late,
                excused_count=excused,
                total_students=total_students,
                attendance_rate=round(attendance_rate, 1)
            ))

        return attendance_by_class

    @staticmethod
    async def get_performance_by_class(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None,
        threshold: float = 50.0
    ) -> List[PerformanceByClass]:
        """Get academic performance breakdown per class"""

        classes_result = await db.execute(
            select(Class).where(
                Class.school_id == school_id,
                Class.is_deleted == False
            ).order_by(Class.name)
        )
        classes = classes_result.scalars().all()

        performance_by_class = []
        for cls in classes:
            conditions = [
                Grade.class_id == cls.id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            ]
            if term_id:
                conditions.append(Grade.term_id == term_id)

            # Get grade statistics
            stats = await db.execute(
                select(
                    func.avg(Grade.percentage),
                    func.max(Grade.percentage),
                    func.min(Grade.percentage),
                    func.count(func.distinct(Grade.student_id))
                ).where(and_(*conditions))
            )
            avg_score, max_score, min_score, graded_students = stats.one()

            # Count students passing (>= threshold)
            passing = await db.execute(
                select(func.count(func.distinct(Grade.student_id))).where(
                    and_(*conditions, Grade.percentage >= threshold)
                )
            )
            passing_count = passing.scalar() or 0

            # Count students below threshold
            below = await db.execute(
                select(func.count(func.distinct(Grade.student_id))).where(
                    and_(*conditions, Grade.percentage < threshold)
                )
            )
            below_count = below.scalar() or 0

            pass_rate = (passing_count / graded_students * 100) if graded_students else 0.0

            performance_by_class.append(PerformanceByClass(
                class_id=cls.id,
                class_name=cls.name,
                average_score=round(float(avg_score or 0), 1),
                highest_score=float(max_score) if max_score else None,
                lowest_score=float(min_score) if min_score else None,
                pass_rate=round(pass_rate, 1),
                total_graded_students=graded_students or 0,
                below_threshold_count=below_count
            ))

        return performance_by_class

    @staticmethod
    async def get_fees_by_class(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None
    ) -> List[FeesByClass]:
        """Get fee collection status per class"""

        classes_result = await db.execute(
            select(Class).where(
                Class.school_id == school_id,
                Class.is_deleted == False
            ).order_by(Class.name)
        )
        classes = classes_result.scalars().all()

        fees_by_class = []
        for cls in classes:
            # Get student IDs in this class
            student_ids_result = await db.execute(
                select(Student.id).where(
                    Student.current_class_id == cls.id,
                    Student.school_id == school_id,
                    Student.is_deleted == False
                )
            )
            student_ids = [s for s in student_ids_result.scalars().all()]

            if not student_ids:
                fees_by_class.append(FeesByClass(
                    class_id=cls.id,
                    class_name=cls.name,
                    total_students=0,
                    total_fees=0,
                    fees_collected=0,
                    pending_fees=0,
                    overdue_fees=0,
                    collection_rate=0
                ))
                continue

            fee_conditions = [
                FeeAssignment.school_id == school_id,
                FeeAssignment.is_deleted == False,
                FeeAssignment.student_id.in_(student_ids)
            ]
            if term_id:
                fee_conditions.append(FeeAssignment.term_id == term_id)

            # Total fees
            total_result = await db.execute(
                select(func.sum(FeeAssignment.amount)).where(and_(*fee_conditions))
            )
            total_fees = float(total_result.scalar() or 0)

            # Collected
            collected_result = await db.execute(
                select(func.sum(FeeAssignment.amount_paid)).where(and_(*fee_conditions))
            )
            fees_collected = float(collected_result.scalar() or 0)

            # Overdue (past due date and not fully paid)
            overdue_result = await db.execute(
                select(func.sum(FeeAssignment.amount_outstanding)).where(
                    and_(
                        *fee_conditions,
                        FeeAssignment.due_date < datetime.utcnow().date(),
                        FeeAssignment.status != PaymentStatus.PAID
                    )
                )
            )
            overdue_fees = float(overdue_result.scalar() or 0)

            pending_fees = total_fees - fees_collected
            collection_rate = (fees_collected / total_fees * 100) if total_fees > 0 else 0.0

            fees_by_class.append(FeesByClass(
                class_id=cls.id,
                class_name=cls.name,
                total_students=len(student_ids),
                total_fees=total_fees,
                fees_collected=fees_collected,
                pending_fees=pending_fees,
                overdue_fees=overdue_fees,
                collection_rate=round(collection_rate, 1)
            ))

        return fees_by_class

    # ============== P1.2 - Financial Analytics ==============

    @staticmethod
    async def get_financial_analytics(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None
    ) -> FinancialAnalytics:
        """Get comprehensive financial analytics"""

        fee_conditions = [
            FeeAssignment.school_id == school_id,
            FeeAssignment.is_deleted == False
        ]
        if term_id:
            fee_conditions.append(FeeAssignment.term_id == term_id)

        # Total revenue (all collected)
        total_collected_result = await db.execute(
            select(func.sum(FeeAssignment.amount_paid)).where(and_(*fee_conditions))
        )
        total_collected = float(total_collected_result.scalar() or 0)

        # Total assigned
        total_assigned_result = await db.execute(
            select(func.sum(FeeAssignment.amount)).where(and_(*fee_conditions))
        )
        total_revenue = float(total_assigned_result.scalar() or 0)

        # Total pending
        total_pending = total_revenue - total_collected

        # Total overdue
        overdue_result = await db.execute(
            select(func.sum(FeeAssignment.amount_outstanding)).where(
                and_(
                    *fee_conditions,
                    FeeAssignment.due_date < datetime.utcnow().date(),
                    FeeAssignment.status != PaymentStatus.PAID
                )
            )
        )
        total_overdue = float(overdue_result.scalar() or 0)

        collection_rate = (total_collected / total_revenue * 100) if total_revenue > 0 else 0.0

        # Aging buckets
        aging_buckets = await AnalyticsService._get_aging_buckets(db, school_id, term_id)

        # Revenue by term
        revenue_by_term = await AnalyticsService._get_revenue_by_term(db, school_id)

        # Fee type breakdown
        fee_type_breakdown = await AnalyticsService._get_fee_type_performance(db, school_id, term_id)

        # Top classes by outstanding
        fees_by_class = await AnalyticsService.get_fees_by_class(db, school_id, term_id)
        top_classes = sorted(fees_by_class, key=lambda x: x.pending_fees, reverse=True)[:5]

        return FinancialAnalytics(
            total_revenue=total_revenue,
            total_collected=total_collected,
            total_pending=total_pending,
            total_overdue=total_overdue,
            overall_collection_rate=round(collection_rate, 1),
            aging_buckets=aging_buckets,
            revenue_by_term=revenue_by_term,
            fee_type_breakdown=fee_type_breakdown,
            top_classes_by_outstanding=top_classes
        )

    @staticmethod
    async def _get_aging_buckets(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None
    ) -> List[AgingBucket]:
        """Get aging buckets for outstanding fees"""
        today = datetime.utcnow().date()
        buckets = [
            ("0-30 days", 0, 30),
            ("31-60 days", 31, 60),
            ("61-90 days", 61, 90),
            ("90+ days", 91, 9999)
        ]

        aging_buckets = []
        for bucket_name, min_days, max_days in buckets:
            min_date = today - timedelta(days=max_days)
            max_date = today - timedelta(days=min_days)

            conditions = [
                FeeAssignment.school_id == school_id,
                FeeAssignment.is_deleted == False,
                FeeAssignment.status != PaymentStatus.PAID,
                FeeAssignment.due_date <= max_date,
                FeeAssignment.due_date > min_date
            ]
            if term_id:
                conditions.append(FeeAssignment.term_id == term_id)

            result = await db.execute(
                select(
                    func.count(FeeAssignment.id),
                    func.sum(FeeAssignment.amount_outstanding)
                ).where(and_(*conditions))
            )
            count, amount = result.one()

            aging_buckets.append(AgingBucket(
                bucket_name=bucket_name,
                count=count or 0,
                amount=float(amount or 0)
            ))

        return aging_buckets

    @staticmethod
    async def _get_revenue_by_term(
        db: AsyncSession,
        school_id: str
    ) -> List[RevenueByTerm]:
        """Get revenue breakdown by term"""

        terms_result = await db.execute(
            select(Term).where(
                Term.school_id == school_id,
                Term.is_deleted == False
            ).order_by(desc(Term.start_date)).limit(6)
        )
        terms = terms_result.scalars().all()

        revenue_by_term = []
        for term in terms:
            # Total assigned for term
            assigned_result = await db.execute(
                select(func.sum(FeeAssignment.amount)).where(
                    FeeAssignment.school_id == school_id,
                    FeeAssignment.term_id == term.id,
                    FeeAssignment.is_deleted == False
                )
            )
            target = float(assigned_result.scalar() or 0)

            # Total collected for term
            collected_result = await db.execute(
                select(func.sum(FeeAssignment.amount_paid)).where(
                    FeeAssignment.school_id == school_id,
                    FeeAssignment.term_id == term.id,
                    FeeAssignment.is_deleted == False
                )
            )
            actual = float(collected_result.scalar() or 0)

            collection_rate = (actual / target * 100) if target > 0 else 0.0

            revenue_by_term.append(RevenueByTerm(
                term_id=term.id,
                term_name=term.name,
                academic_session=term.academic_session or "",
                target_revenue=target,
                actual_revenue=actual,
                collection_rate=round(collection_rate, 1)
            ))

        return revenue_by_term

    @staticmethod
    async def _get_fee_type_performance(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None
    ) -> List[FeeTypePerformance]:
        """Get performance breakdown by fee type"""

        # Get fee structures grouped by type
        conditions = [
            FeeAssignment.school_id == school_id,
            FeeAssignment.is_deleted == False
        ]
        if term_id:
            conditions.append(FeeAssignment.term_id == term_id)

        # Join with FeeStructure to get fee type
        result = await db.execute(
            select(
                FeeStructure.fee_type,
                func.sum(FeeAssignment.amount),
                func.sum(FeeAssignment.amount_paid),
                func.sum(FeeAssignment.amount_outstanding)
            ).join(
                FeeStructure, FeeAssignment.fee_structure_id == FeeStructure.id
            ).where(
                and_(*conditions)
            ).group_by(FeeStructure.fee_type)
        )

        fee_type_performance = []
        for fee_type, total, collected, outstanding in result.all():
            total = float(total or 0)
            collected = float(collected or 0)
            pending = float(outstanding or 0)

            # Calculate overdue for this fee type
            overdue_result = await db.execute(
                select(func.sum(FeeAssignment.amount_outstanding)).join(
                    FeeStructure, FeeAssignment.fee_structure_id == FeeStructure.id
                ).where(
                    and_(
                        *conditions,
                        FeeStructure.fee_type == fee_type,
                        FeeAssignment.due_date < datetime.utcnow().date(),
                        FeeAssignment.status != PaymentStatus.PAID
                    )
                )
            )
            overdue = float(overdue_result.scalar() or 0)

            collection_rate = (collected / total * 100) if total > 0 else 0.0

            fee_type_performance.append(FeeTypePerformance(
                fee_type=fee_type.value if hasattr(fee_type, 'value') else str(fee_type),
                total_assigned=total,
                collected=collected,
                pending=pending,
                overdue=overdue,
                collection_rate=round(collection_rate, 1)
            ))

        return fee_type_performance

    # ============== P1.3 - Class Performance Insights ==============

    @staticmethod
    async def get_class_insights(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        term_id: Optional[str] = None
    ) -> ClassInsights:
        """Get detailed insights for a specific class"""

        # Get class info
        class_result = await db.execute(
            select(Class).where(
                Class.id == class_id,
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        cls = class_result.scalar_one_or_none()
        if not cls:
            raise ValueError(f"Class not found: {class_id}")

        # Get students in class
        students_result = await db.execute(
            select(Student).where(
                Student.current_class_id == class_id,
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            )
        )
        students = students_result.scalars().all()
        total_students = len(students)

        # Calculate attendance rate
        att_conditions = [
            Attendance.class_id == class_id,
            Attendance.school_id == school_id
        ]
        if term_id:
            att_conditions.append(Attendance.term_id == term_id)

        total_att = await db.execute(
            select(func.count(Attendance.id)).where(and_(*att_conditions))
        )
        total_attendance = total_att.scalar() or 0

        present_att = await db.execute(
            select(func.count(Attendance.id)).where(
                and_(*att_conditions,
                     or_(Attendance.status == AttendanceStatus.PRESENT,
                         Attendance.status == AttendanceStatus.LATE))
            )
        )
        present_count = present_att.scalar() or 0
        attendance_rate = (present_count / total_attendance * 100) if total_attendance > 0 else 0.0

        # Calculate average grade
        grade_conditions = [
            Grade.class_id == class_id,
            Grade.school_id == school_id,
            Grade.is_deleted == False
        ]
        if term_id:
            grade_conditions.append(Grade.term_id == term_id)

        avg_grade_result = await db.execute(
            select(func.avg(Grade.percentage)).where(and_(*grade_conditions))
        )
        average_grade = avg_grade_result.scalar()

        # Grade distribution
        grade_distribution = await AnalyticsService._get_grade_distribution(
            db, school_id, class_id, term_id
        )

        # Subject performance
        subject_performance = await AnalyticsService._get_subject_performance_for_class(
            db, school_id, class_id, term_id
        )

        # At-risk students
        at_risk_students = await AnalyticsService._get_at_risk_students(
            db, school_id, class_id, term_id
        )
        high_risk_count = len([s for s in at_risk_students if s.risk_level == "high"])

        # Generate recommendations
        recommendations = []
        if attendance_rate < 80:
            recommendations.append("Attendance rate is below 80%. Consider implementing attendance improvement strategies.")
        if average_grade and average_grade < 50:
            recommendations.append("Class average is below 50%. Consider additional tutoring or review sessions.")
        if high_risk_count > 0:
            recommendations.append(f"{high_risk_count} students are at high risk. Immediate intervention recommended.")

        return ClassInsights(
            class_id=class_id,
            class_name=cls.name,
            total_students=total_students,
            attendance_rate=round(attendance_rate, 1),
            attendance_trend=[],  # Can be extended with daily/weekly trends
            average_grade=round(average_grade, 1) if average_grade else None,
            grade_distribution=grade_distribution,
            subject_performance=subject_performance,
            at_risk_students=at_risk_students,
            high_risk_count=high_risk_count,
            recommendations=recommendations
        )

    @staticmethod
    async def _get_grade_distribution(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        term_id: Optional[str] = None
    ) -> List[GradeDistribution]:
        """Get grade distribution for a class"""

        conditions = [
            Grade.class_id == class_id,
            Grade.school_id == school_id,
            Grade.is_deleted == False
        ]
        if term_id:
            conditions.append(Grade.term_id == term_id)

        # Define grade ranges
        grade_ranges = [
            ("A", 70, 100),
            ("B", 60, 69),
            ("C", 50, 59),
            ("D", 40, 49),
            ("E", 30, 39),
            ("F", 0, 29)
        ]

        total_grades = await db.execute(
            select(func.count(Grade.id)).where(and_(*conditions))
        )
        total = total_grades.scalar() or 0

        distribution = []
        for grade_letter, min_score, max_score in grade_ranges:
            count_result = await db.execute(
                select(func.count(Grade.id)).where(
                    and_(
                        *conditions,
                        Grade.percentage >= min_score,
                        Grade.percentage <= max_score
                    )
                )
            )
            count = count_result.scalar() or 0
            percentage = (count / total * 100) if total > 0 else 0.0

            distribution.append(GradeDistribution(
                grade=grade_letter,
                count=count,
                percentage=round(percentage, 1)
            ))

        return distribution

    @staticmethod
    async def _get_subject_performance_for_class(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        term_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get subject-wise performance for a class"""

        conditions = [
            Grade.class_id == class_id,
            Grade.school_id == school_id,
            Grade.is_deleted == False
        ]
        if term_id:
            conditions.append(Grade.term_id == term_id)

        result = await db.execute(
            select(
                Subject.id,
                Subject.name,
                func.avg(Grade.percentage),
                func.max(Grade.percentage),
                func.min(Grade.percentage),
                func.count(Grade.id)
            ).join(
                Subject, Grade.subject_id == Subject.id
            ).where(
                and_(*conditions)
            ).group_by(Subject.id, Subject.name)
        )

        subject_performance = []
        for subj_id, subj_name, avg_score, max_score, min_score, count in result.all():
            subject_performance.append({
                "subject_id": subj_id,
                "subject_name": subj_name,
                "average_score": round(float(avg_score or 0), 1),
                "highest_score": float(max_score) if max_score else None,
                "lowest_score": float(min_score) if min_score else None,
                "grade_count": count
            })

        return subject_performance

    @staticmethod
    async def _get_at_risk_students(
        db: AsyncSession,
        school_id: str,
        class_id: str,
        term_id: Optional[str] = None
    ) -> List[StudentAtRisk]:
        """Identify at-risk students in a class"""

        # Get students in class
        students_result = await db.execute(
            select(Student).where(
                Student.current_class_id == class_id,
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            )
        )
        students = students_result.scalars().all()

        at_risk = []
        for student in students:
            risk_factors = []

            # Check attendance
            att_conditions = [
                Attendance.student_id == student.id,
                Attendance.school_id == school_id
            ]
            if term_id:
                att_conditions.append(Attendance.term_id == term_id)

            total_att = await db.execute(
                select(func.count(Attendance.id)).where(and_(*att_conditions))
            )
            total_attendance = total_att.scalar() or 0

            present_att = await db.execute(
                select(func.count(Attendance.id)).where(
                    and_(*att_conditions,
                         or_(Attendance.status == AttendanceStatus.PRESENT,
                             Attendance.status == AttendanceStatus.LATE))
                )
            )
            present_count = present_att.scalar() or 0
            attendance_rate = (present_count / total_attendance * 100) if total_attendance > 0 else 100.0

            if attendance_rate < 75:
                risk_factors.append("poor_attendance")

            # Check grades
            grade_conditions = [
                Grade.student_id == student.id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            ]
            if term_id:
                grade_conditions.append(Grade.term_id == term_id)

            avg_grade_result = await db.execute(
                select(func.avg(Grade.percentage)).where(and_(*grade_conditions))
            )
            average_grade = avg_grade_result.scalar()

            if average_grade and average_grade < 40:
                risk_factors.append("low_grades")
            elif average_grade and average_grade < 50:
                risk_factors.append("below_average_grades")

            # Determine risk level
            if len(risk_factors) >= 2 or "low_grades" in risk_factors:
                risk_level = "high"
            elif len(risk_factors) == 1:
                risk_level = "medium"
            else:
                risk_level = "low"

            # Only include students with risk factors
            if risk_factors:
                at_risk.append(StudentAtRisk(
                    student_id=student.id,
                    student_name=f"{student.first_name} {student.last_name}",
                    admission_number=student.admission_number or "",
                    attendance_rate=round(attendance_rate, 1),
                    average_grade=round(average_grade, 1) if average_grade else None,
                    risk_level=risk_level,
                    risk_factors=risk_factors
                ))

        # Sort by risk level (high first)
        risk_order = {"high": 0, "medium": 1, "low": 2}
        at_risk.sort(key=lambda x: risk_order.get(x.risk_level, 3))

        return at_risk

    # ============== P2.1 - Enrollment & Cohort Trends ==============

    @staticmethod
    async def get_enrollment_analytics(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None
    ) -> EnrollmentAnalytics:
        """Get comprehensive enrollment analytics"""

        # Get enrollment trends (last 12 months)
        enrollment_trends = await AnalyticsService._get_enrollment_trends(db, school_id)

        # Get cohort retention
        cohort_retention = await AnalyticsService._get_cohort_retention(db, school_id)

        # Get grade level distribution
        grade_distribution = await AnalyticsService._get_grade_level_distribution(db, school_id)

        # Get class enrollment data
        by_class = await AnalyticsService._get_class_enrollment_data(db, school_id)

        # Get gender distribution
        gender_dist_result = await db.execute(
            select(Student.gender, func.count(Student.id)).where(
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            ).group_by(Student.gender)
        )
        gender_distribution = {str(gender): count for gender, count in gender_dist_result.all() if gender}

        # Calculate totals
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        new_this_term = await db.execute(
            select(func.count(Student.id)).where(
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.created_at >= thirty_days_ago
            )
        )
        total_new = new_this_term.scalar() or 0

        total_students = await db.execute(
            select(func.count(Student.id)).where(
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            )
        )
        current_enrollment = total_students.scalar() or 0
        
        # Estimate previous enrollment (e.g., last month or start of term)
        # For simplicity, we'll assume previous = current - new (net growth)
        previous_enrollment = current_enrollment - total_new
        
        # Calculate growth rate
        growth_rate = 0.0
        if previous_enrollment > 0:
            growth_rate = ((current_enrollment - previous_enrollment) / previous_enrollment) * 100

        # Calculate retention rate
        retention_rate = 0.0
        if cohort_retention:
            retention_rate = sum(c.retention_percentage for c in cohort_retention) / len(cohort_retention)

        return EnrollmentAnalytics(
            current_enrollment=current_enrollment,
            previous_enrollment=previous_enrollment,
            growth_rate=round(growth_rate, 1),
            retention_rate=round(retention_rate, 1),
            enrollment_trends=enrollment_trends,
            cohort_retention=cohort_retention,
            grade_level_distribution=grade_distribution,
            by_class=by_class,
            gender_distribution=gender_distribution,
            total_new_this_term=total_new,
            total_returning=current_enrollment - total_new
        )

    @staticmethod
    async def _get_enrollment_trends(
        db: AsyncSession,
        school_id: str,
        months: int = 12
    ) -> List[EnrollmentTrendPoint]:
        """Get enrollment trends over time"""
        trends = []
        now = datetime.utcnow()

        for i in range(months):
            end_date = now - timedelta(days=30 * i)
            start_date = end_date - timedelta(days=30)
            period_label = end_date.strftime("%b %Y")

            # Total students at this point
            total_result = await db.execute(
                select(func.count(Student.id)).where(
                    Student.school_id == school_id,
                    Student.is_deleted == False,
                    Student.created_at <= end_date
                )
            )
            total = total_result.scalar() or 0

            # New students in this period
            new_result = await db.execute(
                select(func.count(Student.id)).where(
                    Student.school_id == school_id,
                    Student.is_deleted == False,
                    Student.created_at >= start_date,
                    Student.created_at <= end_date
                )
            )
            new_students = new_result.scalar() or 0

            returning = total - new_students

            trends.append(EnrollmentTrendPoint(
                date=end_date.date(),
                period_label=period_label,
                total=total,
                new_students=new_students,
                returning_students=returning
            ))

        return list(reversed(trends))

    @staticmethod
    async def _get_cohort_retention(
        db: AsyncSession,
        school_id: str
    ) -> List[CohortRetentionPoint]:
        """Get cohort retention data"""
        retention = []
        now = datetime.utcnow()

        # Look at yearly cohorts
        for year_offset in range(3):
            year = now.year - year_offset
            year_start = datetime(year, 1, 1)
            year_end = datetime(year, 12, 31)

            # Students enrolled in that year
            original_result = await db.execute(
                select(func.count(Student.id)).where(
                    Student.school_id == school_id,
                    Student.created_at >= year_start,
                    Student.created_at <= year_end
                )
            )
            original_count = original_result.scalar() or 0

            if original_count == 0:
                continue

            # Students still active
            retained_result = await db.execute(
                select(func.count(Student.id)).where(
                    Student.school_id == school_id,
                    Student.created_at >= year_start,
                    Student.created_at <= year_end,
                    Student.is_deleted == False,
                    Student.status == StudentStatus.ACTIVE
                )
            )
            retained_count = retained_result.scalar() or 0

            retention_pct = (retained_count / original_count * 100) if original_count > 0 else 0.0

            retention.append(CohortRetentionPoint(
                period_label=f"Year {year}",
                retained_count=retained_count,
                original_count=original_count,
                retention_percentage=round(retention_pct, 1)
            ))

        return retention

    @staticmethod
    async def _get_grade_level_distribution(
        db: AsyncSession,
        school_id: str
    ) -> List[Dict[str, Any]]:
        """Get student distribution by grade level"""

        result = await db.execute(
            select(
                Class.level,
                func.count(Student.id)
            ).join(
                Student, Student.current_class_id == Class.id
            ).where(
                Class.school_id == school_id,
                Class.is_deleted == False,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            ).group_by(Class.level)
        )

        distribution = []
        for level, count in result.all():
            distribution.append({
                "grade_level": level or "Unassigned",
                "student_count": count
            })

        return distribution

    @staticmethod
    async def _get_class_enrollment_data(
        db: AsyncSession,
        school_id: str
    ) -> List[Dict[str, Any]]:
        """Get enrollment data by class with capacity utilization"""
        
        result = await db.execute(
            select(
                Class.id,
                Class.name,
                Class.capacity,
                func.count(Student.id)
            ).outerjoin(
                Student, and_(
                    Student.current_class_id == Class.id,
                    Student.is_deleted == False,
                    Student.status == StudentStatus.ACTIVE
                )
            ).where(
                Class.school_id == school_id,
                Class.is_deleted == False
            ).group_by(Class.id, Class.name, Class.capacity)
        )
        
        class_data = []
        for class_id, class_name, capacity, count in result.all():
            capacity = capacity or 30  # Default fallback
            utilization = (count / capacity * 100) if capacity > 0 else 0
            
            class_data.append({
                "class_id": class_id,
                "class_name": class_name,
                "count": count,
                "capacity": capacity,
                "utilization": round(utilization, 1)
            })
            
        return class_data

    # ============== P2.4 - Teacher Performance & Workload ==============

    @staticmethod
    async def get_teacher_analytics(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None,
        teacher_id: Optional[str] = None
    ) -> TeacherAnalytics:
        """Get comprehensive teacher analytics"""

        # Build query
        query = select(User).where(
            User.school_id == school_id,
            User.role == UserRole.TEACHER,
            User.is_deleted == False,
            User.is_active == True
        )

        if teacher_id:
            query = query.where(User.id == teacher_id)

        # Get teachers
        teachers_result = await db.execute(query)
        teachers = teachers_result.scalars().all()

        teacher_metrics = []
        total_workload = 0

        for teacher in teachers:
            metrics = await AnalyticsService._get_teacher_metrics(
                db, school_id, teacher.id, term_id
            )
            teacher_metrics.append(metrics)
            total_workload += metrics.classes_taught

        avg_workload = total_workload / len(teachers) if teachers else 0
        above_avg = len([t for t in teacher_metrics if t.classes_taught > avg_workload])

        return TeacherAnalytics(
            total_teachers=len(teachers),
            average_workload=round(avg_workload, 1),
            teachers_above_average_workload=above_avg,
            teacher_metrics=teacher_metrics
        )

    @staticmethod
    async def _get_teacher_metrics(
        db: AsyncSession,
        school_id: str,
        teacher_id: str,
        term_id: Optional[str] = None
    ) -> TeacherPerformanceMetrics:
        """Get detailed metrics for a specific teacher"""

        # Get teacher info
        teacher_result = await db.execute(
            select(User).where(User.id == teacher_id)
        )
        teacher = teacher_result.scalar_one()

        # Classes taught (as class teacher)
        class_teacher_result = await db.execute(
            select(func.count(Class.id)).where(
                Class.teacher_id == teacher_id,
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        classes_as_teacher = class_teacher_result.scalar() or 0

        # Classes from timetable
        timetable_classes = await db.execute(
            select(func.count(func.distinct(TimetableEntry.class_id))).where(
                TimetableEntry.teacher_id == teacher_id,
                TimetableEntry.school_id == school_id
            )
        )
        classes_from_timetable = timetable_classes.scalar() or 0

        total_classes = max(classes_as_teacher, classes_from_timetable)

        # Subjects taught
        subjects_result = await db.execute(
            select(func.count(func.distinct(teacher_subject_association.c.subject_id))).where(
                teacher_subject_association.c.teacher_id == teacher_id,
                teacher_subject_association.c.school_id == school_id,
                teacher_subject_association.c.is_deleted == False
            )
        )
        subjects_taught = subjects_result.scalar() or 0

        # Students taught
        class_ids_result = await db.execute(
            select(Class.id).where(
                or_(
                    Class.teacher_id == teacher_id,
                    Class.id.in_(
                        select(TimetableEntry.class_id).where(
                            TimetableEntry.teacher_id == teacher_id
                        )
                    )
                ),
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        class_ids = [c for c in class_ids_result.scalars().all()]

        total_students = 0
        if class_ids:
            students_result = await db.execute(
                select(func.count(Student.id)).where(
                    Student.current_class_id.in_(class_ids),
                    Student.school_id == school_id,
                    Student.is_deleted == False,
                    Student.status == StudentStatus.ACTIVE
                )
            )
            total_students = students_result.scalar() or 0

        # Average student grade (for exams created by teacher)
        grade_conditions = [
            Exam.created_by == teacher_id,
            Exam.school_id == school_id,
            Grade.school_id == school_id,
            Grade.is_deleted == False
        ]
        if term_id:
            grade_conditions.append(Grade.term_id == term_id)

        avg_grade_result = await db.execute(
            select(func.avg(Grade.percentage)).join(
                Exam, Grade.exam_id == Exam.id
            ).where(and_(*grade_conditions))
        )
        avg_grade = avg_grade_result.scalar()

        # CBT tests created
        cbt_conditions = [
            CBTTest.created_by == teacher_id,
            CBTTest.school_id == school_id,
            CBTTest.is_deleted == False
        ]
        cbt_created = await db.execute(
            select(func.count(CBTTest.id)).where(and_(*cbt_conditions))
        )
        cbt_tests_created = cbt_created.scalar() or 0

        # CBT tests graded (submissions graded)
        cbt_graded = await db.execute(
            select(func.count(func.distinct(CBTSubmission.test_id))).join(
                CBTTest, CBTSubmission.test_id == CBTTest.id
            ).where(
                CBTTest.created_by == teacher_id,
                CBTTest.school_id == school_id,
                CBTSubmission.status == SubmissionStatus.GRADED
            )
        )
        cbt_tests_graded = cbt_graded.scalar() or 0

        return TeacherPerformanceMetrics(
            teacher_id=teacher_id,
            teacher_name=f"{teacher.first_name} {teacher.last_name}",
            email=teacher.email,
            classes_taught=total_classes,
            total_students=total_students,
            subjects_taught=subjects_taught,
            average_student_grade=round(avg_grade, 1) if avg_grade else None,
            class_attendance_rate=None,  # Can be calculated if needed
            cbt_tests_created=cbt_tests_created,
            cbt_tests_graded=cbt_tests_graded,
            assignments_created=0,  # Can be extended
            subject_breakdown=[],
            class_breakdown=[]
        )

    # ============== P1.4 - Enhanced Student Analytics ==============

    @staticmethod
    async def get_student_analytics(
        db: AsyncSession,
        school_id: str,
        student_id: str
    ) -> StudentAnalytics:
        """Get comprehensive analytics for a student"""

        # Get student info
        student_result = await db.execute(
            select(Student).where(
                Student.id == student_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        student = student_result.scalar_one_or_none()
        if not student:
            raise ValueError(f"Student not found: {student_id}")

        # Get current class
        current_class = None
        if student.current_class_id:
            class_result = await db.execute(
                select(Class.name).where(Class.id == student.current_class_id)
            )
            current_class = class_result.scalar()

        # Get current term
        current_term = await db.execute(
            select(Term).where(
                Term.school_id == school_id,
                Term.is_active == True,
                Term.is_deleted == False
            )
        )
        term = current_term.scalar_one_or_none()
        current_term_id = term.id if term else None

        # Get previous term
        previous_term = None
        if term:
            prev_term_result = await db.execute(
                select(Term).where(
                    Term.school_id == school_id,
                    Term.is_deleted == False,
                    Term.end_date < term.start_date
                ).order_by(desc(Term.end_date)).limit(1)
            )
            previous_term = prev_term_result.scalar_one_or_none()

        # Current average
        current_avg_result = await db.execute(
            select(func.avg(Grade.percentage)).where(
                Grade.student_id == student_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False,
                Grade.term_id == current_term_id if current_term_id else True
            )
        )
        current_average = current_avg_result.scalar()

        # Previous average
        previous_average = None
        if previous_term:
            prev_avg_result = await db.execute(
                select(func.avg(Grade.percentage)).where(
                    Grade.student_id == student_id,
                    Grade.school_id == school_id,
                    Grade.is_deleted == False,
                    Grade.term_id == previous_term.id
                )
            )
            previous_average = prev_avg_result.scalar()

        # Calculate improvement
        improvement = None
        overall_trend = "stable"
        if current_average and previous_average:
            improvement = current_average - previous_average
            if improvement > 5:
                overall_trend = "improving"
            elif improvement < -5:
                overall_trend = "declining"

        # Current term attendance
        attendance_rate = None
        if current_term_id:
            total_att = await db.execute(
                select(func.count(Attendance.id)).where(
                    Attendance.student_id == student_id,
                    Attendance.school_id == school_id,
                    Attendance.term_id == current_term_id
                )
            )
            total = total_att.scalar() or 0

            present_att = await db.execute(
                select(func.count(Attendance.id)).where(
                    Attendance.student_id == student_id,
                    Attendance.school_id == school_id,
                    Attendance.term_id == current_term_id,
                    or_(Attendance.status == AttendanceStatus.PRESENT,
                        Attendance.status == AttendanceStatus.LATE)
                )
            )
            present = present_att.scalar() or 0
            attendance_rate = (present / total * 100) if total > 0 else None

        # Subject performance
        subjects = await AnalyticsService._get_student_subject_performance(
            db, school_id, student_id, current_term_id, previous_term.id if previous_term else None
        )

        # Find strongest and weakest subjects
        strongest = None
        weakest = None
        if subjects:
            sorted_subjects = sorted(
                [s for s in subjects if s.current_average is not None],
                key=lambda x: x.current_average or 0,
                reverse=True
            )
            if sorted_subjects:
                strongest = sorted_subjects[0].subject_name
                weakest = sorted_subjects[-1].subject_name

        # Term history
        term_history = await AnalyticsService._get_student_term_history(
            db, school_id, student_id
        )

        # Generate insights
        insights = []
        if overall_trend == "improving":
            insights.append(f"Great progress! Your average improved by {abs(improvement):.1f}% from last term.")
        elif overall_trend == "declining":
            insights.append(f"Your average dropped by {abs(improvement):.1f}% from last term. Consider seeking help.")

        if attendance_rate and attendance_rate < 80:
            insights.append("Your attendance is below 80%. Regular attendance can improve your grades.")

        if strongest and weakest and strongest != weakest:
            insights.append(f"Your strongest subject is {strongest}. Focus more on {weakest} to improve.")

        return StudentAnalytics(
            student_id=student_id,
            student_name=f"{student.first_name} {student.last_name}",
            current_class=current_class,
            current_average=round(current_average, 1) if current_average else None,
            previous_average=round(previous_average, 1) if previous_average else None,
            improvement_percentage=round(improvement, 1) if improvement else None,
            overall_trend=overall_trend,
            current_term_attendance=round(attendance_rate, 1) if attendance_rate else None,
            attendance_correlation=None,
            subjects=subjects,
            strongest_subject=strongest,
            weakest_subject=weakest,
            term_history=term_history,
            insights=insights
        )

    @staticmethod
    async def _get_student_subject_performance(
        db: AsyncSession,
        school_id: str,
        student_id: str,
        current_term_id: Optional[str],
        previous_term_id: Optional[str]
    ) -> List[SubjectPerformance]:
        """Get subject-wise performance for a student"""

        # Get all subjects the student has grades for
        subjects_result = await db.execute(
            select(Subject.id, Subject.name).join(
                Grade, Grade.subject_id == Subject.id
            ).where(
                Grade.student_id == student_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            ).distinct()
        )

        subject_performance = []
        for subj_id, subj_name in subjects_result.all():
            # Current term average
            current_avg = None
            if current_term_id:
                curr_result = await db.execute(
                    select(func.avg(Grade.percentage)).where(
                        Grade.student_id == student_id,
                        Grade.subject_id == subj_id,
                        Grade.term_id == current_term_id,
                        Grade.is_deleted == False
                    )
                )
                current_avg = curr_result.scalar()

            # Previous term average
            previous_avg = None
            if previous_term_id:
                prev_result = await db.execute(
                    select(func.avg(Grade.percentage)).where(
                        Grade.student_id == student_id,
                        Grade.subject_id == subj_id,
                        Grade.term_id == previous_term_id,
                        Grade.is_deleted == False
                    )
                )
                previous_avg = prev_result.scalar()

            # Determine trend
            trend = "stable"
            if current_avg and previous_avg:
                diff = current_avg - previous_avg
                if diff > 5:
                    trend = "improving"
                elif diff < -5:
                    trend = "declining"

            # Grade count
            count_result = await db.execute(
                select(func.count(Grade.id)).where(
                    Grade.student_id == student_id,
                    Grade.subject_id == subj_id,
                    Grade.is_deleted == False
                )
            )
            grade_count = count_result.scalar() or 0

            # Last exam score
            last_grade = await db.execute(
                select(Grade.percentage).where(
                    Grade.student_id == student_id,
                    Grade.subject_id == subj_id,
                    Grade.is_deleted == False
                ).order_by(desc(Grade.created_at)).limit(1)
            )
            last_score = last_grade.scalar()

            subject_performance.append(SubjectPerformance(
                subject_id=subj_id,
                subject_name=subj_name,
                current_average=round(current_avg, 1) if current_avg else None,
                previous_average=round(previous_avg, 1) if previous_avg else None,
                trend=trend,
                grade_count=grade_count,
                last_exam_score=round(last_score, 1) if last_score else None
            ))

        return subject_performance

    @staticmethod
    async def _get_student_term_history(
        db: AsyncSession,
        school_id: str,
        student_id: str
    ) -> List[TermPerformance]:
        """Get term-by-term performance history for a student"""

        # Get all terms with grades
        terms_result = await db.execute(
            select(Term).join(
                Grade, Grade.term_id == Term.id
            ).where(
                Grade.student_id == student_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False,
                Term.is_deleted == False
            ).distinct().order_by(desc(Term.start_date)).limit(6)
        )
        terms = terms_result.scalars().all()

        term_history = []
        for term in terms:
            # Average for term
            avg_result = await db.execute(
                select(func.avg(Grade.percentage)).where(
                    Grade.student_id == student_id,
                    Grade.term_id == term.id,
                    Grade.is_deleted == False
                )
            )
            avg = avg_result.scalar()

            # Subject count
            subj_count = await db.execute(
                select(func.count(func.distinct(Grade.subject_id))).where(
                    Grade.student_id == student_id,
                    Grade.term_id == term.id,
                    Grade.is_deleted == False
                )
            )
            subjects = subj_count.scalar() or 0

            # Attendance rate
            total_att = await db.execute(
                select(func.count(Attendance.id)).where(
                    Attendance.student_id == student_id,
                    Attendance.term_id == term.id
                )
            )
            total = total_att.scalar() or 0

            present_att = await db.execute(
                select(func.count(Attendance.id)).where(
                    Attendance.student_id == student_id,
                    Attendance.term_id == term.id,
                    or_(Attendance.status == AttendanceStatus.PRESENT,
                        Attendance.status == AttendanceStatus.LATE)
                )
            )
            present = present_att.scalar() or 0
            att_rate = (present / total * 100) if total > 0 else None

            term_history.append(TermPerformance(
                term_id=term.id,
                term_name=term.name,
                academic_session=term.academic_session or "",
                overall_average=round(avg, 1) if avg else None,
                subject_count=subjects,
                attendance_rate=round(att_rate, 1) if att_rate else None,
                position=None  # Can be calculated if needed
            ))

        return term_history

    # ============== P1.5 - Student Tasks & Deadlines ==============

    @staticmethod
    async def get_student_tasks(
        db: AsyncSession,
        school_id: str,
        student_id: str
    ) -> StudentTaskList:
        """Get all tasks and deadlines for a student"""

        # Get student's class
        student_result = await db.execute(
            select(Student).where(
                Student.id == student_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        student = student_result.scalar_one_or_none()
        if not student:
            raise ValueError(f"Student not found: {student_id}")

        now = datetime.utcnow()
        upcoming_tasks = []
        overdue_tasks = []
        completed_tasks = []

        # Get CBT tests scheduled for student's class
        if student.current_class_id:
            from app.models.cbt import CBTTestSchedule

            # Upcoming CBT tests
            cbt_result = await db.execute(
                select(CBTTest, CBTTestSchedule, Subject).join(
                    CBTTestSchedule, CBTTest.id == CBTTestSchedule.test_id
                ).outerjoin(
                    Subject, CBTTest.subject_id == Subject.id
                ).where(
                    CBTTestSchedule.class_id == student.current_class_id,
                    CBTTest.school_id == school_id,
                    CBTTest.is_deleted == False,
                    CBTTestSchedule.is_active == True
                )
            )

            for test, schedule, subject in cbt_result.all():
                # Check if student has submitted
                submission = await db.execute(
                    select(CBTSubmission).where(
                        CBTSubmission.test_id == test.id,
                        CBTSubmission.student_id == student_id
                    )
                )
                sub = submission.scalar_one_or_none()

                task = StudentTask(
                    id=test.id,
                    task_type="cbt_test",
                    title=test.title,
                    description=test.description,
                    subject_id=subject.id if subject else None,
                    subject_name=subject.name if subject else None,
                    due_date=schedule.end_time,
                    start_date=schedule.start_time,
                    status="completed" if sub and sub.is_submitted else (
                        "overdue" if schedule.end_time < now else "pending"
                    ),
                    priority="high" if schedule.end_time and (schedule.end_time - now).days <= 1 else "normal"
                )

                if task.status == "completed":
                    completed_tasks.append(task)
                elif task.status == "overdue":
                    overdue_tasks.append(task)
                else:
                    upcoming_tasks.append(task)

        # Get assignments (exams of type ASSIGNMENT)
        assignment_result = await db.execute(
            select(Exam, Subject).outerjoin(
                Subject, Exam.subject_id == Subject.id
            ).where(
                Exam.school_id == school_id,
                Exam.is_deleted == False,
                Exam.exam_type == ExamType.ASSIGNMENT,
                or_(
                    Exam.class_id == student.current_class_id,
                    Exam.class_id == None  # School-wide assignments
                )
            )
        )

        for exam, subject in assignment_result.all():
            # Check if student has a grade
            grade_result = await db.execute(
                select(Grade).where(
                    Grade.exam_id == exam.id,
                    Grade.student_id == student_id
                )
            )
            grade = grade_result.scalar_one_or_none()

            due_datetime = datetime.combine(exam.exam_date, datetime.min.time()) if exam.exam_date else None

            task = StudentTask(
                id=exam.id,
                task_type="assignment",
                title=exam.name,
                description=f"Assignment for {subject.name}" if subject else "Assignment",
                subject_id=subject.id if subject else None,
                subject_name=subject.name if subject else None,
                due_date=due_datetime,
                status="completed" if grade else (
                    "overdue" if due_datetime and due_datetime < now else "pending"
                ),
                priority="high" if due_datetime and (due_datetime - now).days <= 1 else "normal"
            )

            if task.status == "completed":
                completed_tasks.append(task)
            elif task.status == "overdue":
                overdue_tasks.append(task)
            else:
                upcoming_tasks.append(task)

        # Sort by due date
        upcoming_tasks.sort(key=lambda x: x.due_date or datetime.max)
        overdue_tasks.sort(key=lambda x: x.due_date or datetime.min, reverse=True)
        completed_tasks.sort(key=lambda x: x.due_date or datetime.min, reverse=True)

        return StudentTaskList(
            upcoming_tasks=upcoming_tasks[:20],  # Limit to 20
            overdue_tasks=overdue_tasks[:10],
            completed_tasks=completed_tasks[:10],
            total_pending=len(upcoming_tasks),
            total_overdue=len(overdue_tasks)
        )

    # ============== P3.3 - Grade Benchmarks ==============

    @staticmethod
    async def get_grade_benchmarks(
        db: AsyncSession,
        school_id: str,
        student_id: str,
        term_id: Optional[str] = None
    ) -> List[GradeBenchmark]:
        """Get anonymized grade benchmarks for a student"""

        # Get student's class
        student_result = await db.execute(
            select(Student).where(
                Student.id == student_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        student = student_result.scalar_one_or_none()
        if not student or not student.current_class_id:
            return []

        # Get subjects with grades
        conditions = [
            Grade.student_id == student_id,
            Grade.school_id == school_id,
            Grade.is_deleted == False
        ]
        if term_id:
            conditions.append(Grade.term_id == term_id)

        subjects_result = await db.execute(
            select(Subject.id, Subject.name).join(
                Grade, Grade.subject_id == Subject.id
            ).where(and_(*conditions)).distinct()
        )

        benchmarks = []
        for subj_id, subj_name in subjects_result.all():
            # Get student's average for this subject
            student_avg = await db.execute(
                select(func.avg(Grade.percentage)).where(
                    Grade.student_id == student_id,
                    Grade.subject_id == subj_id,
                    Grade.school_id == school_id,
                    Grade.is_deleted == False,
                    Grade.term_id == term_id if term_id else True
                )
            )
            student_score = student_avg.scalar()
            if not student_score:
                continue

            # Get class statistics for this subject
            class_conditions = [
                Grade.class_id == student.current_class_id,
                Grade.subject_id == subj_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            ]
            if term_id:
                class_conditions.append(Grade.term_id == term_id)

            class_stats = await db.execute(
                select(
                    func.avg(Grade.percentage),
                    func.max(Grade.percentage),
                    func.min(Grade.percentage),
                    func.count(func.distinct(Grade.student_id))
                ).where(and_(*class_conditions))
            )
            class_avg, class_max, class_min, total_students = class_stats.one()

            if not class_avg:
                continue

            # Calculate percentile
            below_count = await db.execute(
                select(func.count(func.distinct(Grade.student_id))).where(
                    and_(
                        *class_conditions,
                        Grade.percentage < student_score
                    )
                )
            )
            below = below_count.scalar() or 0
            percentile = (below / total_students * 100) if total_students > 0 else 50.0

            # Get distribution
            distribution = []
            ranges = [(0, 29), (30, 39), (40, 49), (50, 59), (60, 69), (70, 100)]
            for min_score, max_score in ranges:
                count_result = await db.execute(
                    select(func.count(func.distinct(Grade.student_id))).where(
                        and_(
                            *class_conditions,
                            Grade.percentage >= min_score,
                            Grade.percentage <= max_score
                        )
                    )
                )
                count = count_result.scalar() or 0
                distribution.append({
                    "range": f"{min_score}-{max_score}",
                    "count": count
                })

            benchmarks.append(GradeBenchmark(
                subject_id=subj_id,
                subject_name=subj_name,
                student_score=round(student_score, 1),
                class_average=round(float(class_avg), 1),
                class_highest=round(float(class_max), 1) if class_max else 0,
                class_lowest=round(float(class_min), 1) if class_min else 0,
                percentile=round(percentile, 1),
                distribution=distribution
            ))

        return benchmarks

    # ============== P2.6 - Communication & Engagement Analytics ==============

    @staticmethod
    async def get_engagement_analytics(
        db: AsyncSession,
        school_id: str,
        days: int = 30
    ) -> dict:
        """Get communication and engagement analytics"""
        from app.models.communication import Message, MessageRecipient, Announcement, MessageStatus
        from app.models.notification import Notification

        start_date = datetime.utcnow() - timedelta(days=days)

        # Message statistics
        msg_result = await db.execute(
            select(
                func.count(Message.id).label('total'),
                func.sum(case((Message.status == MessageStatus.DELIVERED, 1), else_=0)).label('delivered'),
                func.sum(case((Message.status == MessageStatus.READ, 1), else_=0)).label('read'),
                func.sum(case((Message.status == MessageStatus.FAILED, 1), else_=0)).label('failed')
            ).where(
                Message.school_id == school_id,
                Message.created_at >= start_date,
                Message.is_deleted == False
            )
        )
        msg_stats = msg_result.one()

        # Recipient engagement
        recipient_result = await db.execute(
            select(
                func.count(MessageRecipient.id).label('total'),
                func.sum(case((MessageRecipient.status == MessageStatus.READ, 1), else_=0)).label('read')
            ).where(
                MessageRecipient.school_id == school_id,
                MessageRecipient.sent_at >= start_date,
                MessageRecipient.is_deleted == False
            )
        )
        recipient_stats = recipient_result.one()

        # Announcement statistics
        ann_result = await db.execute(
            select(func.count(Announcement.id)).where(
                Announcement.school_id == school_id,
                Announcement.created_at >= start_date,
                Announcement.is_published == True,
                Announcement.is_deleted == False
            )
        )
        total_announcements = ann_result.scalar() or 0

        # Notification statistics
        notif_result = await db.execute(
            select(
                func.count(Notification.id).label('total'),
                func.sum(case((Notification.is_read == True, 1), else_=0)).label('read')
            ).where(
                Notification.school_id == school_id,
                Notification.created_at >= start_date,
                Notification.is_deleted == False
            )
        )
        notif_stats = notif_result.one()

        # Daily message trend
        daily_trend = []
        for i in range(min(days, 14)):  # Last 14 days
            day_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
            day_end = day_start + timedelta(days=1)

            day_count = await db.execute(
                select(func.count(Message.id)).where(
                    Message.school_id == school_id,
                    Message.created_at >= day_start,
                    Message.created_at < day_end,
                    Message.is_deleted == False
                )
            )
            daily_trend.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "count": day_count.scalar() or 0
            })

        daily_trend.reverse()

        # Calculate engagement rate
        total_recipients = recipient_stats.total or 0
        read_recipients = recipient_stats.read or 0
        engagement_rate = (read_recipients / total_recipients * 100) if total_recipients > 0 else 0

        return {
            "period_days": days,
            "messages": {
                "total": msg_stats.total or 0,
                "delivered": msg_stats.delivered or 0,
                "read": msg_stats.read or 0,
                "failed": msg_stats.failed or 0,
                "delivery_rate": round((msg_stats.delivered or 0) / (msg_stats.total or 1) * 100, 1)
            },
            "recipients": {
                "total": total_recipients,
                "engaged": read_recipients,
                "engagement_rate": round(engagement_rate, 1)
            },
            "announcements": {
                "total": total_announcements
            },
            "notifications": {
                "total": notif_stats.total or 0,
                "read": notif_stats.read or 0,
                "read_rate": round((notif_stats.read or 0) / (notif_stats.total or 1) * 100, 1)
            },
            "daily_trend": daily_trend
        }

    # ============== P2.7 - Smart Study Recommendations ==============

    @staticmethod
    async def get_study_recommendations(
        db: AsyncSession,
        school_id: str,
        student_id: str
    ) -> dict:
        """Get AI-powered study recommendations for a student"""

        # Get student's weak subjects (below 60% average)
        weak_subjects = await db.execute(
            select(
                Subject.id,
                Subject.name,
                func.avg(Grade.percentage).label('avg_score')
            ).join(
                Grade, Grade.subject_id == Subject.id
            ).where(
                Grade.student_id == student_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            ).group_by(Subject.id, Subject.name).having(
                func.avg(Grade.percentage) < 60
            ).order_by(func.avg(Grade.percentage))
        )
        weak = weak_subjects.all()

        # Get student's strong subjects (above 75% average)
        strong_subjects = await db.execute(
            select(
                Subject.id,
                Subject.name,
                func.avg(Grade.percentage).label('avg_score')
            ).join(
                Grade, Grade.subject_id == Subject.id
            ).where(
                Grade.student_id == student_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            ).group_by(Subject.id, Subject.name).having(
                func.avg(Grade.percentage) >= 75
            ).order_by(func.avg(Grade.percentage).desc())
        )
        strong = strong_subjects.all()

        # Get recent grade trends
        recent_grades = await db.execute(
            select(
                Subject.name,
                Grade.percentage,
                Grade.created_at
            ).join(
                Subject, Grade.subject_id == Subject.id
            ).where(
                Grade.student_id == student_id,
                Grade.school_id == school_id,
                Grade.is_deleted == False
            ).order_by(Grade.created_at.desc()).limit(10)
        )
        recent = recent_grades.all()

        # Get attendance pattern
        attendance_result = await db.execute(
            select(
                func.count(Attendance.id).label('total'),
                func.sum(case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)).label('present')
            ).where(
                Attendance.student_id == student_id,
                Attendance.school_id == school_id,
                Attendance.is_deleted == False
            )
        )
        att = attendance_result.one()
        attendance_rate = (att.present or 0) / (att.total or 1) * 100

        # Generate recommendations
        recommendations = []

        # Weak subject recommendations
        for subj_id, subj_name, avg_score in weak[:3]:
            recommendations.append({
                "type": "focus_area",
                "priority": "high",
                "subject": subj_name,
                "current_score": round(float(avg_score), 1),
                "message": f"Focus on improving {subj_name}. Current average: {round(float(avg_score), 1)}%",
                "suggested_actions": [
                    f"Dedicate extra study time to {subj_name}",
                    "Seek help from teacher or tutor",
                    "Practice more exercises and past questions"
                ]
            })

        # Attendance recommendation
        if attendance_rate < 80:
            recommendations.append({
                "type": "attendance",
                "priority": "high",
                "message": f"Improve attendance rate. Current: {round(attendance_rate, 1)}%",
                "suggested_actions": [
                    "Attend all classes regularly",
                    "Arrive on time",
                    "Communicate with teachers about any absences"
                ]
            })

        # Strong subject recommendations
        for subj_id, subj_name, avg_score in strong[:2]:
            recommendations.append({
                "type": "strength",
                "priority": "low",
                "subject": subj_name,
                "current_score": round(float(avg_score), 1),
                "message": f"Excellent performance in {subj_name}! Keep it up.",
                "suggested_actions": [
                    "Consider helping classmates",
                    "Explore advanced topics",
                    "Participate in competitions"
                ]
            })

        return {
            "student_id": student_id,
            "weak_subjects": [
                {"id": s[0], "name": s[1], "average": round(float(s[2]), 1)}
                for s in weak
            ],
            "strong_subjects": [
                {"id": s[0], "name": s[1], "average": round(float(s[2]), 1)}
                for s in strong
            ],
            "attendance_rate": round(attendance_rate, 1),
            "recommendations": recommendations,
            "recent_performance": [
                {"subject": r[0], "score": float(r[1]), "date": r[2].isoformat()}
                for r in recent
            ]
        }

