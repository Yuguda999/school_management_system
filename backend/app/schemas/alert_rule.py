"""
Alert Rule Schemas for Automated Reporting & Alert Rules (P3.1)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class AlertType(str, Enum):
    ATTENDANCE = "attendance"
    GRADE = "grade"
    FEE = "fee"
    BEHAVIOR = "behavior"
    ENROLLMENT = "enrollment"
    CUSTOM = "custom"


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertConditionOperator(str, Enum):
    LESS_THAN = "lt"
    LESS_THAN_OR_EQUAL = "lte"
    GREATER_THAN = "gt"
    GREATER_THAN_OR_EQUAL = "gte"
    EQUAL = "eq"
    NOT_EQUAL = "neq"


class AlertFrequency(str, Enum):
    REALTIME = "realtime"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"


# Alert Rule Schemas
class AlertRuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    alert_type: AlertType
    severity: AlertSeverity = AlertSeverity.WARNING
    metric: str = Field(..., min_length=1, max_length=100)
    operator: AlertConditionOperator
    threshold: float
    scope_type: str = "school"
    scope_id: Optional[str] = None
    notify_roles: List[str] = []
    notify_users: List[str] = []
    notification_channels: List[str] = ["in_app"]
    frequency: AlertFrequency = AlertFrequency.DAILY
    is_active: bool = True
    additional_config: Optional[Dict[str, Any]] = None


class AlertRuleCreate(AlertRuleBase):
    pass


class AlertRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    severity: Optional[AlertSeverity] = None
    metric: Optional[str] = None
    operator: Optional[AlertConditionOperator] = None
    threshold: Optional[float] = None
    scope_type: Optional[str] = None
    scope_id: Optional[str] = None
    notify_roles: Optional[List[str]] = None
    notify_users: Optional[List[str]] = None
    notification_channels: Optional[List[str]] = None
    frequency: Optional[AlertFrequency] = None
    is_active: Optional[bool] = None
    additional_config: Optional[Dict[str, Any]] = None


class AlertRuleResponse(AlertRuleBase):
    id: str
    created_by: str
    last_evaluated_at: Optional[datetime] = None
    next_evaluation_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Alert Notification Schemas
class AlertNotificationBase(BaseModel):
    title: str
    message: str
    severity: AlertSeverity
    context_type: Optional[str] = None
    context_id: Optional[str] = None
    context_data: Optional[Dict[str, Any]] = None
    metric_value: Optional[float] = None
    threshold_value: Optional[float] = None


class AlertNotificationResponse(AlertNotificationBase):
    id: str
    rule_id: str
    is_acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    is_resolved: bool
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AlertAcknowledge(BaseModel):
    notes: Optional[str] = None


class AlertResolve(BaseModel):
    resolution_notes: str


# Scheduled Report Schemas
class ScheduledReportBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    report_type: str
    frequency: AlertFrequency
    day_of_week: Optional[str] = None
    time_of_day: Optional[str] = None
    recipient_roles: List[str] = []
    recipient_users: List[str] = []
    delivery_channels: List[str] = ["email"]
    report_config: Optional[Dict[str, Any]] = None
    is_active: bool = True


class ScheduledReportCreate(ScheduledReportBase):
    pass


class ScheduledReportUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    frequency: Optional[AlertFrequency] = None
    day_of_week: Optional[str] = None
    time_of_day: Optional[str] = None
    recipient_roles: Optional[List[str]] = None
    recipient_users: Optional[List[str]] = None
    delivery_channels: Optional[List[str]] = None
    report_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class ScheduledReportResponse(ScheduledReportBase):
    id: str
    created_by: str
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

