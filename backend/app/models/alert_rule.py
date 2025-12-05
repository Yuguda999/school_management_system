"""
Alert Rule Model for Automated Reporting & Alert Rules (P3.1)
"""

from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Enum as SQLEnum, JSON, DateTime, Float
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class AlertType(str, enum.Enum):
    """Types of alerts"""
    ATTENDANCE = "attendance"
    GRADE = "grade"
    FEE = "fee"
    BEHAVIOR = "behavior"
    ENROLLMENT = "enrollment"
    CUSTOM = "custom"


class AlertSeverity(str, enum.Enum):
    """Severity levels for alerts"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertConditionOperator(str, enum.Enum):
    """Operators for alert conditions"""
    LESS_THAN = "lt"
    LESS_THAN_OR_EQUAL = "lte"
    GREATER_THAN = "gt"
    GREATER_THAN_OR_EQUAL = "gte"
    EQUAL = "eq"
    NOT_EQUAL = "neq"


class AlertFrequency(str, enum.Enum):
    """How often to check the alert condition"""
    REALTIME = "realtime"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"


class AlertRule(TenantBaseModel):
    """Model for automated alert rules"""
    
    __tablename__ = "alert_rules"
    
    # Rule details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    alert_type = Column(SQLEnum(AlertType), nullable=False)
    severity = Column(SQLEnum(AlertSeverity), default=AlertSeverity.WARNING, nullable=False)
    
    # Condition configuration
    metric = Column(String(100), nullable=False)  # e.g., "attendance_rate", "average_grade"
    operator = Column(SQLEnum(AlertConditionOperator), nullable=False)
    threshold = Column(Float, nullable=False)  # e.g., 80.0 for 80%
    
    # Scope
    scope_type = Column(String(50), nullable=False)  # "school", "class", "student"
    scope_id = Column(String(36), nullable=True)  # Optional specific class/student ID
    
    # Notification settings
    notify_roles = Column(JSON, default=[])  # Roles to notify: ["school_admin", "teacher"]
    notify_users = Column(JSON, default=[])  # Specific user IDs to notify
    notification_channels = Column(JSON, default=["in_app"])  # ["in_app", "email", "sms"]
    
    # Scheduling
    frequency = Column(SQLEnum(AlertFrequency), default=AlertFrequency.DAILY, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_evaluated_at = Column(DateTime, nullable=True)
    next_evaluation_at = Column(DateTime, nullable=True)
    
    # Additional configuration
    additional_config = Column(JSON, nullable=True, default={})
    
    # Creator
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    creator = relationship("User", backref="created_alert_rules")
    notifications = relationship("AlertNotification", back_populates="rule")
    
    def __repr__(self):
        return f"<AlertRule {self.name} - {self.alert_type.value}>"


class AlertNotification(TenantBaseModel):
    """Model for alert notifications triggered by rules"""
    
    __tablename__ = "alert_notifications"
    
    # Rule reference
    rule_id = Column(String(36), ForeignKey("alert_rules.id"), nullable=False, index=True)
    
    # Alert details
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(SQLEnum(AlertSeverity), nullable=False)
    
    # Context
    context_type = Column(String(50), nullable=True)  # "student", "class", etc.
    context_id = Column(String(36), nullable=True)  # ID of the affected entity
    context_data = Column(JSON, nullable=True)  # Additional context data
    
    # Metric values at time of alert
    metric_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    
    # Status
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Relationships
    rule = relationship("AlertRule", back_populates="notifications")
    acknowledger = relationship("User", foreign_keys=[acknowledged_by])
    resolver = relationship("User", foreign_keys=[resolved_by])
    
    def __repr__(self):
        return f"<AlertNotification {self.title} - {self.severity.value}>"


class ScheduledReport(TenantBaseModel):
    """Model for scheduled automated reports"""
    
    __tablename__ = "scheduled_reports"
    
    # Report details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    report_type = Column(String(50), nullable=False)  # "financial", "attendance", "academic"
    
    # Schedule
    frequency = Column(SQLEnum(AlertFrequency), nullable=False)
    day_of_week = Column(String(10), nullable=True)  # For weekly: "monday", "friday"
    time_of_day = Column(String(5), nullable=True)  # "09:00"
    
    # Recipients
    recipient_roles = Column(JSON, default=[])
    recipient_users = Column(JSON, default=[])
    delivery_channels = Column(JSON, default=["email"])  # ["email", "in_app"]
    
    # Report configuration
    report_config = Column(JSON, nullable=True, default={})  # Filters, date ranges, etc.
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    
    # Creator
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    creator = relationship("User", backref="created_scheduled_reports")
    
    def __repr__(self):
        return f"<ScheduledReport {self.name} - {self.report_type}>"

