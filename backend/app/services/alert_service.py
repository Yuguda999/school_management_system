"""
Alert Service for Automated Reporting & Alert Rules (P3.1)
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.models.alert_rule import (
    AlertRule, AlertNotification, ScheduledReport,
    AlertType, AlertSeverity, AlertConditionOperator, AlertFrequency
)
from app.models.student import Student, StudentStatus
from app.models.academic import Attendance, AttendanceStatus, Class
from app.models.grade import Grade
from app.models.fee import FeeAssignment, PaymentStatus
from app.schemas.alert_rule import (
    AlertRuleCreate, AlertRuleUpdate, AlertRuleResponse,
    AlertNotificationResponse, AlertAcknowledge, AlertResolve,
    ScheduledReportCreate, ScheduledReportUpdate, ScheduledReportResponse
)
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from app.models.notification import NotificationType
import logging

logger = logging.getLogger(__name__)


class AlertService:
    """Service for managing alert rules and notifications"""

    @staticmethod
    async def create_rule(
        db: AsyncSession,
        school_id: str,
        user_id: str,
        rule_data: AlertRuleCreate
    ) -> AlertRuleResponse:
        """Create a new alert rule"""
        rule = AlertRule(
            school_id=school_id,
            created_by=user_id,
            name=rule_data.name,
            description=rule_data.description,
            alert_type=rule_data.alert_type,
            severity=rule_data.severity,
            metric=rule_data.metric,
            operator=rule_data.operator,
            threshold=rule_data.threshold,
            scope_type=rule_data.scope_type,
            scope_id=rule_data.scope_id,
            notify_roles=rule_data.notify_roles,
            notify_users=rule_data.notify_users,
            notification_channels=rule_data.notification_channels,
            frequency=rule_data.frequency,
            is_active=rule_data.is_active,
            additional_config=rule_data.additional_config,
            next_evaluation_at=AlertService._calculate_next_evaluation(rule_data.frequency)
        )
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return AlertRuleResponse.model_validate(rule)

    @staticmethod
    def _calculate_next_evaluation(frequency: AlertFrequency) -> datetime:
        """Calculate next evaluation time based on frequency"""
        now = datetime.utcnow()
        if frequency == AlertFrequency.REALTIME:
            return now
        elif frequency == AlertFrequency.HOURLY:
            return now + timedelta(hours=1)
        elif frequency == AlertFrequency.DAILY:
            return now.replace(hour=6, minute=0, second=0) + timedelta(days=1)
        elif frequency == AlertFrequency.WEEKLY:
            return now + timedelta(weeks=1)
        return now + timedelta(days=1)

    @staticmethod
    async def list_rules(
        db: AsyncSession,
        school_id: str,
        alert_type: Optional[AlertType] = None,
        is_active: Optional[bool] = None
    ) -> List[AlertRuleResponse]:
        """List alert rules with optional filters"""
        conditions = [
            AlertRule.school_id == school_id,
            AlertRule.is_deleted == False
        ]
        if alert_type:
            conditions.append(AlertRule.alert_type == alert_type)
        if is_active is not None:
            conditions.append(AlertRule.is_active == is_active)
        
        result = await db.execute(
            select(AlertRule).where(and_(*conditions)).order_by(AlertRule.created_at.desc())
        )
        rules = result.scalars().all()
        return [AlertRuleResponse.model_validate(r) for r in rules]

    @staticmethod
    async def get_rule(
        db: AsyncSession,
        school_id: str,
        rule_id: str
    ) -> Optional[AlertRuleResponse]:
        """Get a specific alert rule"""
        result = await db.execute(
            select(AlertRule).where(
                AlertRule.id == rule_id,
                AlertRule.school_id == school_id,
                AlertRule.is_deleted == False
            )
        )
        rule = result.scalar_one_or_none()
        return AlertRuleResponse.model_validate(rule) if rule else None

    @staticmethod
    async def update_rule(
        db: AsyncSession,
        school_id: str,
        rule_id: str,
        rule_data: AlertRuleUpdate
    ) -> Optional[AlertRuleResponse]:
        """Update an alert rule"""
        result = await db.execute(
            select(AlertRule).where(
                AlertRule.id == rule_id,
                AlertRule.school_id == school_id,
                AlertRule.is_deleted == False
            )
        )
        rule = result.scalar_one_or_none()
        if not rule:
            return None
        
        update_data = rule_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(rule, field, value)
        
        await db.commit()
        await db.refresh(rule)
        return AlertRuleResponse.model_validate(rule)

    @staticmethod
    async def delete_rule(
        db: AsyncSession,
        school_id: str,
        rule_id: str
    ) -> bool:
        """Soft delete an alert rule"""
        result = await db.execute(
            select(AlertRule).where(
                AlertRule.id == rule_id,
                AlertRule.school_id == school_id,
                AlertRule.is_deleted == False
            )
        )
        rule = result.scalar_one_or_none()
        if not rule:
            return False

        rule.is_deleted = True
        await db.commit()
        return True

    # ============== Alert Evaluation ==============

    @staticmethod
    async def evaluate_rule(
        db: AsyncSession,
        school_id: str,
        rule_id: str
    ) -> List[AlertNotificationResponse]:
        """Evaluate an alert rule and create notifications if triggered"""
        result = await db.execute(
            select(AlertRule).where(
                AlertRule.id == rule_id,
                AlertRule.school_id == school_id,
                AlertRule.is_deleted == False,
                AlertRule.is_active == True
            )
        )
        rule = result.scalar_one_or_none()
        if not rule:
            return []

        notifications = []

        # Evaluate based on alert type
        if rule.alert_type == AlertType.ATTENDANCE:
            notifications = await AlertService._evaluate_attendance_rule(db, school_id, rule)
        elif rule.alert_type == AlertType.GRADE:
            notifications = await AlertService._evaluate_grade_rule(db, school_id, rule)
        elif rule.alert_type == AlertType.FEE:
            notifications = await AlertService._evaluate_fee_rule(db, school_id, rule)

        # Update rule evaluation time
        rule.last_evaluated_at = datetime.utcnow()
        rule.next_evaluation_at = AlertService._calculate_next_evaluation(rule.frequency)
        await db.commit()

        return notifications

    @staticmethod
    async def _evaluate_attendance_rule(
        db: AsyncSession,
        school_id: str,
        rule: AlertRule
    ) -> List[AlertNotificationResponse]:
        """Evaluate attendance-based alert rules"""
        notifications = []

        # Get students with low attendance
        if rule.scope_type == "school":
            students_query = select(Student).where(
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            )
        elif rule.scope_type == "class" and rule.scope_id:
            students_query = select(Student).where(
                Student.school_id == school_id,
                Student.current_class_id == rule.scope_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            )
        else:
            return []

        students_result = await db.execute(students_query)
        students = students_result.scalars().all()

        for student in students:
            # Calculate attendance rate
            att_result = await db.execute(
                select(
                    func.count(Attendance.id).label('total'),
                    func.sum(func.case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)).label('present')
                ).where(
                    Attendance.student_id == student.id,
                    Attendance.school_id == school_id,
                    Attendance.is_deleted == False
                )
            )
            att = att_result.one()
            if not att.total or att.total == 0:
                continue

            rate = (att.present or 0) / att.total * 100

            # Check if condition is met
            if AlertService._check_condition(rate, rule.operator, rule.threshold):
                # Create notification
                notification = AlertNotification(
                    school_id=school_id,
                    rule_id=rule.id,
                    title=f"Attendance Alert: {student.full_name}",
                    message=f"Student {student.full_name} has attendance rate of {rate:.1f}% (threshold: {rule.threshold}%)",
                    severity=rule.severity,
                    context_type="student",
                    context_id=student.id,
                    context_data={"student_name": student.full_name, "class_id": student.current_class_id},
                    metric_value=rate,
                    threshold_value=rule.threshold
                )
                db.add(notification)
                await db.flush()

                # Send in-app notifications to configured users
                await AlertService._send_alert_notifications(db, school_id, rule, notification)

                notifications.append(AlertNotificationResponse.model_validate(notification))

        await db.commit()
        return notifications

    @staticmethod
    async def _evaluate_grade_rule(
        db: AsyncSession,
        school_id: str,
        rule: AlertRule
    ) -> List[AlertNotificationResponse]:
        """Evaluate grade-based alert rules"""
        notifications = []

        # Get students with grades below threshold
        if rule.scope_type == "school":
            students_query = select(Student).where(
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            )
        elif rule.scope_type == "class" and rule.scope_id:
            students_query = select(Student).where(
                Student.school_id == school_id,
                Student.current_class_id == rule.scope_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE
            )
        else:
            return []

        students_result = await db.execute(students_query)
        students = students_result.scalars().all()

        for student in students:
            # Calculate average grade
            grade_result = await db.execute(
                select(func.avg(Grade.percentage)).where(
                    Grade.student_id == student.id,
                    Grade.school_id == school_id,
                    Grade.is_deleted == False
                )
            )
            avg_grade = grade_result.scalar()
            if avg_grade is None:
                continue

            # Check if condition is met
            if AlertService._check_condition(float(avg_grade), rule.operator, rule.threshold):
                notification = AlertNotification(
                    school_id=school_id,
                    rule_id=rule.id,
                    title=f"Grade Alert: {student.full_name}",
                    message=f"Student {student.full_name} has average grade of {avg_grade:.1f}% (threshold: {rule.threshold}%)",
                    severity=rule.severity,
                    context_type="student",
                    context_id=student.id,
                    context_data={"student_name": student.full_name},
                    metric_value=float(avg_grade),
                    threshold_value=rule.threshold
                )
                db.add(notification)
                await db.flush()

                await AlertService._send_alert_notifications(db, school_id, rule, notification)
                notifications.append(AlertNotificationResponse.model_validate(notification))

        await db.commit()
        return notifications

    @staticmethod
    async def _evaluate_fee_rule(
        db: AsyncSession,
        school_id: str,
        rule: AlertRule
    ) -> List[AlertNotificationResponse]:
        """Evaluate fee-based alert rules"""
        notifications = []

        # Get students with overdue fees
        overdue_result = await db.execute(
            select(
                Student.id,
                Student.first_name,
                Student.last_name,
                func.sum(FeeAssignment.amount_due - FeeAssignment.amount_paid).label('outstanding')
            ).join(
                FeeAssignment, FeeAssignment.student_id == Student.id
            ).where(
                Student.school_id == school_id,
                Student.is_deleted == False,
                FeeAssignment.status.in_([PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE]),
                FeeAssignment.is_deleted == False
            ).group_by(Student.id, Student.first_name, Student.last_name)
        )

        for student_id, first_name, last_name, outstanding in overdue_result.all():
            if outstanding is None or outstanding <= 0:
                continue

            if AlertService._check_condition(float(outstanding), rule.operator, rule.threshold):
                notification = AlertNotification(
                    school_id=school_id,
                    rule_id=rule.id,
                    title=f"Fee Alert: {first_name} {last_name}",
                    message=f"Student {first_name} {last_name} has outstanding fees of {outstanding:.2f} (threshold: {rule.threshold})",
                    severity=rule.severity,
                    context_type="student",
                    context_id=student_id,
                    context_data={"student_name": f"{first_name} {last_name}"},
                    metric_value=float(outstanding),
                    threshold_value=rule.threshold
                )
                db.add(notification)
                await db.flush()

                await AlertService._send_alert_notifications(db, school_id, rule, notification)
                notifications.append(AlertNotificationResponse.model_validate(notification))

        await db.commit()
        return notifications

    @staticmethod
    def _check_condition(value: float, operator: AlertConditionOperator, threshold: float) -> bool:
        """Check if a value meets the alert condition"""
        if operator == AlertConditionOperator.LESS_THAN:
            return value < threshold
        elif operator == AlertConditionOperator.LESS_THAN_OR_EQUAL:
            return value <= threshold
        elif operator == AlertConditionOperator.GREATER_THAN:
            return value > threshold
        elif operator == AlertConditionOperator.GREATER_THAN_OR_EQUAL:
            return value >= threshold
        elif operator == AlertConditionOperator.EQUAL:
            return value == threshold
        elif operator == AlertConditionOperator.NOT_EQUAL:
            return value != threshold
        return False

    @staticmethod
    async def _send_alert_notifications(
        db: AsyncSession,
        school_id: str,
        rule: AlertRule,
        alert: AlertNotification
    ):
        """Send notifications to configured recipients"""
        from app.models.user import User, UserRole

        recipients = set()

        # Add users by role
        if rule.notify_roles:
            for role_str in rule.notify_roles:
                try:
                    role = UserRole(role_str)
                    users_result = await db.execute(
                        select(User.id).where(
                            User.school_id == school_id,
                            User.role == role,
                            User.is_deleted == False,
                            User.is_active == True
                        )
                    )
                    for (user_id,) in users_result.all():
                        recipients.add(user_id)
                except ValueError:
                    pass

        # Add specific users
        if rule.notify_users:
            recipients.update(rule.notify_users)

        # Create in-app notifications
        if "in_app" in rule.notification_channels:
            for user_id in recipients:
                await NotificationService.create_notification(
                    db=db,
                    school_id=school_id,
                    notification_data=NotificationCreate(
                        user_id=user_id,
                        title=alert.title,
                        message=alert.message,
                        type=NotificationType.WARNING if alert.severity == AlertSeverity.WARNING else NotificationType.INFO,
                        link=f"/alerts/{alert.id}"
                    )
                )

    # ============== Alert Notifications ==============

    @staticmethod
    async def list_notifications(
        db: AsyncSession,
        school_id: str,
        rule_id: Optional[str] = None,
        is_acknowledged: Optional[bool] = None,
        is_resolved: Optional[bool] = None,
        severity: Optional[AlertSeverity] = None,
        limit: int = 50
    ) -> List[AlertNotificationResponse]:
        """List alert notifications"""
        conditions = [
            AlertNotification.school_id == school_id,
            AlertNotification.is_deleted == False
        ]
        if rule_id:
            conditions.append(AlertNotification.rule_id == rule_id)
        if is_acknowledged is not None:
            conditions.append(AlertNotification.is_acknowledged == is_acknowledged)
        if is_resolved is not None:
            conditions.append(AlertNotification.is_resolved == is_resolved)
        if severity:
            conditions.append(AlertNotification.severity == severity)

        result = await db.execute(
            select(AlertNotification).where(
                and_(*conditions)
            ).order_by(AlertNotification.created_at.desc()).limit(limit)
        )
        notifications = result.scalars().all()
        return [AlertNotificationResponse.model_validate(n) for n in notifications]

    @staticmethod
    async def acknowledge_notification(
        db: AsyncSession,
        school_id: str,
        notification_id: str,
        user_id: str,
        data: AlertAcknowledge
    ) -> Optional[AlertNotificationResponse]:
        """Acknowledge an alert notification"""
        result = await db.execute(
            select(AlertNotification).where(
                AlertNotification.id == notification_id,
                AlertNotification.school_id == school_id,
                AlertNotification.is_deleted == False
            )
        )
        notification = result.scalar_one_or_none()
        if not notification:
            return None

        notification.is_acknowledged = True
        notification.acknowledged_by = user_id
        notification.acknowledged_at = datetime.utcnow()

        await db.commit()
        await db.refresh(notification)
        return AlertNotificationResponse.model_validate(notification)

    @staticmethod
    async def resolve_notification(
        db: AsyncSession,
        school_id: str,
        notification_id: str,
        user_id: str,
        data: AlertResolve
    ) -> Optional[AlertNotificationResponse]:
        """Resolve an alert notification"""
        result = await db.execute(
            select(AlertNotification).where(
                AlertNotification.id == notification_id,
                AlertNotification.school_id == school_id,
                AlertNotification.is_deleted == False
            )
        )
        notification = result.scalar_one_or_none()
        if not notification:
            return None

        notification.is_resolved = True
        notification.resolved_by = user_id
        notification.resolved_at = datetime.utcnow()
        notification.resolution_notes = data.resolution_notes

        await db.commit()
        await db.refresh(notification)
        return AlertNotificationResponse.model_validate(notification)

