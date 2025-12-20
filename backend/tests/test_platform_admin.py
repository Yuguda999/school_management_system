import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.core.security import get_password_hash

# Note: 'client' and 'db_session' fixtures are automatically provided by conftest.py 
# if we do not import anything conflicting.

@pytest.mark.asyncio
async def test_platform_admin_login_and_dashboard(db_session: AsyncSession, client):
    """
    Test that a platform admin can:
    1. Log in (get token)
    2. Access the dashboard endpoint
    
    Uses 'client' fixture from conftest.py which handles dependency overrides for test DB.
    """
    # Create user manually
    admin_email = "test_admin_2@example.com"
    admin_password = "test_password"
    
    user = User(
        email=admin_email,
        password_hash=get_password_hash(admin_password),
        first_name="Test",
        last_name="Admin",
        role=UserRole.PLATFORM_SUPER_ADMIN,
        is_active=True,
        is_verified=True,
        profile_completed=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # 1. Login (using sync client)
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": admin_email,
            "password": admin_password
        }
    )
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    tokens = login_response.json()
    assert "access_token" in tokens
    access_token = tokens["access_token"]
    
    # 2. Access Dashboard
    dashboard_response = client.get(
        "/api/v1/platform/dashboard",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert dashboard_response.status_code == 200, f"Dashboard access failed: {dashboard_response.text}"
    data = dashboard_response.json()
    assert "statistics" in data
    assert "recent_schools" in data
    
    # 3. Access Schools List
    schools_response = client.get(
        "/api/v1/platform/schools",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert schools_response.status_code == 200, f"Schools list access failed: {schools_response.text}"
    schools = schools_response.json()
    assert isinstance(schools, list)

@pytest.mark.asyncio
async def test_platform_admin_access_control(db_session: AsyncSession, client):
    """Ensure regular users cannot access admin endpoints"""
    # Create regular user
    regular_user = User(
        email="regular_2@example.com",
        password_hash=get_password_hash("password123"),
        first_name="Regular",
        last_name="User",
        role=UserRole.TEACHER,
        is_active=True
    )
    db_session.add(regular_user)
    await db_session.commit()
    
    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": regular_user.email, "password": "password123"}
    )
    # Expect 403 because main login is only for Admin/Owner
    assert login_resp.status_code == 403
