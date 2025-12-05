import pytest
from fastapi.testclient import TestClient


def test_login_success(client: TestClient, test_admin_user, test_school):
    """Test successful login."""
    response = client.post(
        f"/api/v1/auth/school/{test_school.code}/login",
        json={
            "email": test_admin_user.email,
            "password": "testpassword"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == test_admin_user.email
    assert data["role"] == test_admin_user.role.value


def test_login_invalid_credentials(client: TestClient, test_admin_user, test_school):
    """Test login with invalid credentials."""
    response = client.post(
        f"/api/v1/auth/school/{test_school.code}/login",
        json={
            "email": test_admin_user.email,
            "password": "wrongpassword"
        }
    )

    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_nonexistent_user(client: TestClient, test_school):
    """Test login with nonexistent user."""
    response = client.post(
        f"/api/v1/auth/school/{test_school.code}/login",
        json={
            "email": "nonexistent@test.com",
            "password": "testpassword"
        }
    )

    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_get_current_user(client: TestClient, auth_headers):
    """Test getting current user information."""
    response = client.get(
        "/api/v1/auth/me",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "email" in data
    assert "full_name" in data
    assert "role" in data


def test_get_current_user_unauthorized(client: TestClient):
    """Test getting current user without authentication."""
    response = client.get("/api/v1/auth/me")
    
    assert response.status_code == 403  # No authorization header


def test_change_password(client: TestClient, auth_headers):
    """Test changing password."""
    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "testpassword",
            "new_password": "newtestpassword"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert "Password changed successfully" in response.json()["message"]


def test_change_password_wrong_current(client: TestClient, auth_headers):
    """Test changing password with wrong current password."""
    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "wrongpassword",
            "new_password": "newtestpassword"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 400
    assert "Incorrect current password" in response.json()["detail"]
