"""
Alerts API Endpoints for Automated Reporting & Alert Rules (P3.1)
"""

from typing import Any, Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_school_admin, get_current_school
from app.models.user import User
from app.models.school import School
from app.services.alert_service import AlertService
from app.schemas.alert_rule import (
    AlertRuleCreate, AlertRuleUpdate, AlertRuleResponse,
    AlertNotificationResponse, AlertAcknowledge, AlertResolve,
    AlertType, AlertSeverity
)

router = APIRouter()


# ============== Alert Rules ==============

@router.get("/rules", response_model=List[AlertRuleResponse])
async def list_alert_rules(
    alert_type: Optional[AlertType] = Query(None, description="Filter by alert type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """List all alert rules"""
    return await AlertService.list_rules(
        db, current_school.id, alert_type, is_active
    )


@router.post("/rules", response_model=AlertRuleResponse)
async def create_alert_rule(
    rule_data: AlertRuleCreate,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new alert rule"""
    return await AlertService.create_rule(
        db, current_school.id, current_user.id, rule_data
    )


@router.get("/rules/{rule_id}", response_model=AlertRuleResponse)
async def get_alert_rule(
    rule_id: str,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific alert rule"""
    rule = await AlertService.get_rule(db, current_school.id, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    return rule


@router.put("/rules/{rule_id}", response_model=AlertRuleResponse)
async def update_alert_rule(
    rule_id: str,
    rule_data: AlertRuleUpdate,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update an alert rule"""
    rule = await AlertService.update_rule(db, current_school.id, rule_id, rule_data)
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    return rule


@router.delete("/rules/{rule_id}")
async def delete_alert_rule(
    rule_id: str,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete an alert rule"""
    success = await AlertService.delete_rule(db, current_school.id, rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    return {"message": "Alert rule deleted successfully"}


@router.post("/rules/{rule_id}/evaluate", response_model=List[AlertNotificationResponse])
async def evaluate_alert_rule(
    rule_id: str,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Manually evaluate an alert rule"""
    return await AlertService.evaluate_rule(db, current_school.id, rule_id)


# ============== Alert Notifications ==============

@router.get("/notifications", response_model=List[AlertNotificationResponse])
async def list_alert_notifications(
    rule_id: Optional[str] = Query(None, description="Filter by rule ID"),
    is_acknowledged: Optional[bool] = Query(None, description="Filter by acknowledged status"),
    is_resolved: Optional[bool] = Query(None, description="Filter by resolved status"),
    severity: Optional[AlertSeverity] = Query(None, description="Filter by severity"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of notifications"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """List alert notifications"""
    return await AlertService.list_notifications(
        db, current_school.id, rule_id, is_acknowledged, is_resolved, severity, limit
    )


@router.post("/notifications/{notification_id}/acknowledge", response_model=AlertNotificationResponse)
async def acknowledge_notification(
    notification_id: str,
    data: AlertAcknowledge,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Acknowledge an alert notification"""
    result = await AlertService.acknowledge_notification(
        db, current_school.id, notification_id, current_user.id, data
    )
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    return result


@router.post("/notifications/{notification_id}/resolve", response_model=AlertNotificationResponse)
async def resolve_notification(
    notification_id: str,
    data: AlertResolve,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Resolve an alert notification"""
    result = await AlertService.resolve_notification(
        db, current_school.id, notification_id, current_user.id, data
    )
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    return result

