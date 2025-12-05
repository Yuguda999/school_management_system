"""
Unit tests for Alert Service (P3.1)
"""

import pytest
import pytest_asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.alert_service import AlertService
from app.models.alert_rule import (
    AlertRule, AlertNotification, AlertType, AlertSeverity,
    AlertConditionOperator, AlertFrequency
)


@pytest_asyncio.fixture
async def test_admin(db_session: AsyncSession, test_school):
    """Create a test admin user."""
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash

    user = User(
        email="admin@test.com",
        password_hash=get_password_hash("testpassword"),
        first_name="Test",
        last_name="Admin",
        role=UserRole.SCHOOL_ADMIN,
        school_id=test_school.id,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


class TestAlertService:
    """Test cases for AlertService"""

    @pytest.mark.asyncio
    async def test_create_alert_rule(self, db_session: AsyncSession, test_school, test_admin):
        """Test creating an alert rule."""
        from app.schemas.alert_rule import AlertRuleCreate

        rule_data = AlertRuleCreate(
            name="Low Attendance Alert",
            description="Alert when student attendance drops below 80%",
            alert_type=AlertType.ATTENDANCE,
            severity=AlertSeverity.WARNING,
            metric="attendance_rate",
            operator=AlertConditionOperator.LESS_THAN,
            threshold=80.0,
            scope_type="school",
            frequency=AlertFrequency.DAILY,
            notify_roles=["school_admin"]
        )

        rule = await AlertService.create_rule(
            db=db_session,
            school_id=test_school.id,
            user_id=test_admin.id,
            rule_data=rule_data
        )

        assert rule is not None
        assert rule.name == "Low Attendance Alert"
        assert rule.threshold == 80.0
        assert rule.is_active is True

    @pytest.mark.asyncio
    async def test_list_alert_rules(self, db_session: AsyncSession, test_school, test_admin):
        """Test retrieving alert rules."""
        from app.schemas.alert_rule import AlertRuleCreate

        # Create rules
        rule_data1 = AlertRuleCreate(
            name="Rule 1",
            alert_type=AlertType.ATTENDANCE,
            severity=AlertSeverity.WARNING,
            metric="attendance_rate",
            operator=AlertConditionOperator.LESS_THAN,
            threshold=80.0,
            scope_type="school"
        )
        await AlertService.create_rule(
            db=db_session,
            school_id=test_school.id,
            user_id=test_admin.id,
            rule_data=rule_data1
        )

        rule_data2 = AlertRuleCreate(
            name="Rule 2",
            alert_type=AlertType.GRADE,
            severity=AlertSeverity.CRITICAL,
            metric="average_grade",
            operator=AlertConditionOperator.LESS_THAN,
            threshold=50.0,
            scope_type="school"
        )
        await AlertService.create_rule(
            db=db_session,
            school_id=test_school.id,
            user_id=test_admin.id,
            rule_data=rule_data2
        )

        rules = await AlertService.list_rules(
            db=db_session,
            school_id=test_school.id
        )

        assert len(rules) >= 2

    @pytest.mark.asyncio
    async def test_update_rule_active(self, db_session: AsyncSession, test_school, test_admin):
        """Test updating rule active state."""
        from app.schemas.alert_rule import AlertRuleCreate, AlertRuleUpdate

        rule_data = AlertRuleCreate(
            name="Toggle Test",
            alert_type=AlertType.ATTENDANCE,
            severity=AlertSeverity.WARNING,
            metric="attendance_rate",
            operator=AlertConditionOperator.LESS_THAN,
            threshold=80.0,
            scope_type="school"
        )
        rule = await AlertService.create_rule(
            db=db_session,
            school_id=test_school.id,
            user_id=test_admin.id,
            rule_data=rule_data
        )

        # Toggle off
        update_data = AlertRuleUpdate(is_active=False)
        updated = await AlertService.update_rule(
            db=db_session,
            school_id=test_school.id,
            rule_id=rule.id,
            rule_data=update_data
        )

        assert updated.is_active is False

        # Toggle on
        update_data = AlertRuleUpdate(is_active=True)
        updated = await AlertService.update_rule(
            db=db_session,
            school_id=test_school.id,
            rule_id=rule.id,
            rule_data=update_data
        )

        assert updated.is_active is True

    @pytest.mark.asyncio
    async def test_delete_rule(self, db_session: AsyncSession, test_school, test_admin):
        """Test deleting an alert rule."""
        from app.schemas.alert_rule import AlertRuleCreate

        rule_data = AlertRuleCreate(
            name="Delete Test Rule",
            alert_type=AlertType.ATTENDANCE,
            severity=AlertSeverity.WARNING,
            metric="attendance_rate",
            operator=AlertConditionOperator.LESS_THAN,
            threshold=80.0,
            scope_type="school"
        )
        rule = await AlertService.create_rule(
            db=db_session,
            school_id=test_school.id,
            user_id=test_admin.id,
            rule_data=rule_data
        )

        result = await AlertService.delete_rule(
            db=db_session,
            school_id=test_school.id,
            rule_id=rule.id
        )

        assert result is True

        # Verify it's deleted
        rules = await AlertService.list_rules(
            db=db_session,
            school_id=test_school.id
        )
        assert not any(r.id == rule.id for r in rules)

