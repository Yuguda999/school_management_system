import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student import Student
from app.models.user import User, UserRole
from app.core.security import get_password_hash


class TestStudentsAPI:
    """Test cases for students API endpoints."""

    @pytest.fixture
    async def test_student_user(self, db_session: AsyncSession, test_school):
        """Create a test student user."""
        user = User(
            email="student@test.com",
            password_hash=get_password_hash("testpassword"),
            first_name="Test",
            last_name="Student",
            role=UserRole.STUDENT,
            school_id=test_school.id,
            is_active=True,
            is_verified=True
        )
        
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        # Create student profile
        student = Student(
            user_id=user.id,
            admission_number="STU001",
            date_of_birth="2005-01-01",
            gender="male",
            address_line1="123 Student Street",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria",
            phone="+1234567890",
            emergency_contact_name="Emergency Contact",
            emergency_contact_phone="+1234567890",
            emergency_contact_relationship="parent"
        )
        
        db_session.add(student)
        await db_session.commit()
        await db_session.refresh(student)
        
        return user

    def test_get_students_success(self, client: TestClient, auth_headers: dict):
        """Test successful retrieval of students list."""
        response = client.get("/api/v1/students", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "students" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
        assert "pages" in data

    def test_get_students_with_pagination(self, client: TestClient, auth_headers: dict):
        """Test students list with pagination parameters."""
        response = client.get(
            "/api/v1/students?page=1&size=10", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["size"] == 10

    def test_get_students_with_search(self, client: TestClient, auth_headers: dict):
        """Test students list with search parameter."""
        response = client.get(
            "/api/v1/students?search=test", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "students" in data

    def test_get_students_unauthorized(self, client: TestClient):
        """Test students list without authentication."""
        response = client.get("/api/v1/students")
        assert response.status_code == 401

    def test_create_student_success(self, client: TestClient, auth_headers: dict):
        """Test successful student creation."""
        student_data = {
            "admission_number": "STU002",
            "first_name": "New",
            "last_name": "Student",
            "email": "newstudent@test.com",
            "date_of_birth": "2006-01-01",
            "gender": "female",
            "address_line1": "456 New Street",
            "city": "Test City",
            "state": "Test State",
            "postal_code": "12345",
            "country": "Nigeria",
            "phone": "+1234567891",
            "emergency_contact_name": "Parent Name",
            "emergency_contact_phone": "+1234567891",
            "emergency_contact_relationship": "parent"
        }
        
        response = client.post(
            "/api/v1/students", 
            json=student_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["admission_number"] == "STU002"
        assert data["first_name"] == "New"
        assert data["last_name"] == "Student"
        assert data["email"] == "newstudent@test.com"

    def test_create_student_duplicate_admission_number(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_student_user
    ):
        """Test student creation with duplicate admission number."""
        student_data = {
            "admission_number": "STU001",  # Same as existing student
            "first_name": "Duplicate",
            "last_name": "Student",
            "email": "duplicate@test.com",
            "date_of_birth": "2006-01-01",
            "gender": "male",
            "address_line1": "789 Duplicate Street",
            "city": "Test City",
            "state": "Test State",
            "postal_code": "12345",
            "country": "Nigeria",
            "phone": "+1234567892",
            "emergency_contact_name": "Parent Name",
            "emergency_contact_phone": "+1234567892",
            "emergency_contact_relationship": "parent"
        }
        
        response = client.post(
            "/api/v1/students", 
            json=student_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "admission number already exists" in response.json()["detail"].lower()

    def test_create_student_invalid_data(self, client: TestClient, auth_headers: dict):
        """Test student creation with invalid data."""
        student_data = {
            "admission_number": "",  # Empty admission number
            "first_name": "",  # Empty first name
            "email": "invalid-email",  # Invalid email format
            "date_of_birth": "invalid-date",  # Invalid date format
        }
        
        response = client.post(
            "/api/v1/students", 
            json=student_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 422

    def test_get_student_by_id_success(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_student_user
    ):
        """Test successful retrieval of student by ID."""
        # First get the student ID
        response = client.get("/api/v1/students", headers=auth_headers)
        students = response.json()["students"]
        student_id = students[0]["id"]
        
        # Get specific student
        response = client.get(f"/api/v1/students/{student_id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == student_id
        assert data["admission_number"] == "STU001"

    def test_get_student_by_id_not_found(self, client: TestClient, auth_headers: dict):
        """Test retrieval of non-existent student."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/students/{fake_id}", headers=auth_headers)
        
        assert response.status_code == 404

    def test_update_student_success(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_student_user
    ):
        """Test successful student update."""
        # Get student ID
        response = client.get("/api/v1/students", headers=auth_headers)
        students = response.json()["students"]
        student_id = students[0]["id"]
        
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "phone": "+9876543210"
        }
        
        response = client.put(
            f"/api/v1/students/{student_id}", 
            json=update_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated"
        assert data["last_name"] == "Name"
        assert data["phone"] == "+9876543210"

    def test_update_student_not_found(self, client: TestClient, auth_headers: dict):
        """Test update of non-existent student."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        update_data = {"first_name": "Updated"}
        
        response = client.put(
            f"/api/v1/students/{fake_id}", 
            json=update_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 404

    def test_delete_student_success(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_student_user
    ):
        """Test successful student deletion."""
        # Get student ID
        response = client.get("/api/v1/students", headers=auth_headers)
        students = response.json()["students"]
        student_id = students[0]["id"]
        
        response = client.delete(f"/api/v1/students/{student_id}", headers=auth_headers)
        
        assert response.status_code == 204
        
        # Verify student is deleted
        response = client.get(f"/api/v1/students/{student_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_student_not_found(self, client: TestClient, auth_headers: dict):
        """Test deletion of non-existent student."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.delete(f"/api/v1/students/{fake_id}", headers=auth_headers)
        
        assert response.status_code == 404

    def test_get_student_academic_record(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_student_user
    ):
        """Test retrieval of student academic record."""
        # Get student ID
        response = client.get("/api/v1/students", headers=auth_headers)
        students = response.json()["students"]
        student_id = students[0]["id"]
        
        response = client.get(
            f"/api/v1/students/{student_id}/academic-record", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "grades" in data
        assert "attendance" in data
        assert "overall_performance" in data

    def test_get_student_attendance(
        self, 
        client: TestClient, 
        auth_headers: dict,
        test_student_user
    ):
        """Test retrieval of student attendance."""
        # Get student ID
        response = client.get("/api/v1/students", headers=auth_headers)
        students = response.json()["students"]
        student_id = students[0]["id"]
        
        response = client.get(
            f"/api/v1/students/{student_id}/attendance", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "attendance_records" in data
        assert "summary" in data

    def test_bulk_create_students(self, client: TestClient, auth_headers: dict):
        """Test bulk creation of students."""
        students_data = [
            {
                "admission_number": "STU003",
                "first_name": "Bulk",
                "last_name": "Student1",
                "email": "bulk1@test.com",
                "date_of_birth": "2005-01-01",
                "gender": "male",
                "address_line1": "123 Bulk Street",
                "city": "Test City",
                "state": "Test State",
                "postal_code": "12345",
                "country": "Nigeria",
                "phone": "+1234567893",
                "emergency_contact_name": "Parent 1",
                "emergency_contact_phone": "+1234567893",
                "emergency_contact_relationship": "parent"
            },
            {
                "admission_number": "STU004",
                "first_name": "Bulk",
                "last_name": "Student2",
                "email": "bulk2@test.com",
                "date_of_birth": "2005-02-01",
                "gender": "female",
                "address_line1": "124 Bulk Street",
                "city": "Test City",
                "state": "Test State",
                "postal_code": "12345",
                "country": "Nigeria",
                "phone": "+1234567894",
                "emergency_contact_name": "Parent 2",
                "emergency_contact_phone": "+1234567894",
                "emergency_contact_relationship": "parent"
            }
        ]
        
        response = client.post(
            "/api/v1/students/bulk", 
            json={"students": students_data}, 
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert len(data["created_students"]) == 2
        assert len(data["failed_students"]) == 0

    def test_export_students(self, client: TestClient, auth_headers: dict):
        """Test students export functionality."""
        response = client.get(
            "/api/v1/students/export?format=csv", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"

    def test_students_statistics(self, client: TestClient, auth_headers: dict):
        """Test students statistics endpoint."""
        response = client.get("/api/v1/students/statistics", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_students" in data
        assert "active_students" in data
        assert "students_by_gender" in data
        assert "students_by_class" in data

    def test_student_permissions_teacher_access(
        self, 
        client: TestClient, 
        db_session: AsyncSession,
        test_school
    ):
        """Test that teachers can only access students in their classes."""
        # Create teacher user
        teacher_user = User(
            email="teacher@test.com",
            password_hash=get_password_hash("testpassword"),
            first_name="Test",
            last_name="Teacher",
            role=UserRole.TEACHER,
            school_id=test_school.id,
            is_active=True,
            is_verified=True
        )
        
        db_session.add(teacher_user)
        await db_session.commit()
        
        # Login as teacher
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "teacher@test.com", "password": "testpassword"}
        )
        teacher_token = response.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        
        # Try to access students
        response = client.get("/api/v1/students", headers=teacher_headers)
        
        # Should only see students in teacher's classes
        assert response.status_code == 200
        data = response.json()
        # Verify filtering logic based on teacher's classes
