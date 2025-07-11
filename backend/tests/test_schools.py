import pytest
from fastapi.testclient import TestClient


def test_register_school(client: TestClient):
    """Test school registration."""
    response = client.post(
        "/api/v1/schools/register",
        json={
            "name": "New Test School",
            "code": "NTS001",
            "email": "newtest@school.com",
            "address_line1": "456 New Street",
            "city": "New City",
            "state": "New State",
            "postal_code": "54321",
            "current_session": "2023/2024",
            "current_term": "First Term",
            "admin_first_name": "New",
            "admin_last_name": "Admin",
            "admin_email": "newadmin@test.com",
            "admin_password": "newpassword123"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "school" in data
    assert "admin_user_id" in data
    assert data["school"]["name"] == "New Test School"
    assert data["school"]["code"] == "NTS001"


def test_register_school_duplicate_code(client: TestClient, test_school):
    """Test school registration with duplicate code."""
    response = client.post(
        "/api/v1/schools/register",
        json={
            "name": "Duplicate School",
            "code": test_school.code,  # Use existing code
            "email": "duplicate@school.com",
            "address_line1": "789 Duplicate Street",
            "city": "Duplicate City",
            "state": "Duplicate State",
            "postal_code": "98765",
            "current_session": "2023/2024",
            "current_term": "First Term",
            "admin_first_name": "Duplicate",
            "admin_last_name": "Admin",
            "admin_email": "duplicateadmin@test.com",
            "admin_password": "duplicatepassword123"
        }
    )
    
    assert response.status_code == 400
    assert "School code already exists" in response.json()["detail"]


def test_get_my_school(client: TestClient, auth_headers, test_school):
    """Test getting current school information."""
    response = client.get(
        "/api/v1/schools/me",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_school.id
    assert data["name"] == test_school.name
    assert data["code"] == test_school.code


def test_update_my_school(client: TestClient, auth_headers):
    """Test updating school information."""
    response = client.put(
        "/api/v1/schools/me",
        json={
            "name": "Updated Test School",
            "description": "This is an updated test school"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Test School"
    assert data["description"] == "This is an updated test school"


def test_get_school_stats(client: TestClient, auth_headers):
    """Test getting school statistics."""
    response = client.get(
        "/api/v1/schools/me/stats",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "total_students" in data
    assert "total_teachers" in data
    assert "total_classes" in data
    assert "total_subjects" in data
    assert "active_terms" in data


def test_update_school_settings(client: TestClient, auth_headers):
    """Test updating school settings."""
    response = client.put(
        "/api/v1/schools/me/settings",
        json={
            "general_settings": {
                "school_hours": "8:00 AM - 3:00 PM",
                "break_time": "10:30 AM - 11:00 AM"
            },
            "grading_system": {
                "scale": "A-F",
                "pass_mark": 50
            }
        },
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "Settings updated successfully" in data["message"]
    assert "settings" in data


def test_get_school_settings(client: TestClient, auth_headers):
    """Test getting school settings."""
    response = client.get(
        "/api/v1/schools/me/settings",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "settings" in data
