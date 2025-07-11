import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.class_model import Class
from app.models.attendance import Attendance
from app.models.fee import FeeStructure, FeeAssignment, FeePayment
from app.core.security import get_password_hash


class TestIntegration:
    """Integration tests for the school management system."""

    @pytest.fixture
    async def setup_complete_school(self, db_session: AsyncSession, test_school):
        """Set up a complete school with users, classes, and data."""
        # Create admin user
        admin_user = User(
            email="admin@integration.com",
            password_hash=get_password_hash("admin123"),
            first_name="School",
            last_name="Admin",
            role=UserRole.ADMIN,
            school_id=test_school.id,
            is_active=True,
            is_verified=True
        )
        db_session.add(admin_user)
        
        # Create teacher user
        teacher_user = User(
            email="teacher@integration.com",
            password_hash=get_password_hash("teacher123"),
            first_name="Math",
            last_name="Teacher",
            role=UserRole.TEACHER,
            school_id=test_school.id,
            is_active=True,
            is_verified=True
        )
        db_session.add(teacher_user)
        
        # Create student user
        student_user = User(
            email="student@integration.com",
            password_hash=get_password_hash("student123"),
            first_name="Test",
            last_name="Student",
            role=UserRole.STUDENT,
            school_id=test_school.id,
            is_active=True,
            is_verified=True
        )
        db_session.add(student_user)
        
        # Create parent user
        parent_user = User(
            email="parent@integration.com",
            password_hash=get_password_hash("parent123"),
            first_name="Test",
            last_name="Parent",
            role=UserRole.PARENT,
            school_id=test_school.id,
            is_active=True,
            is_verified=True
        )
        db_session.add(parent_user)
        
        await db_session.commit()
        await db_session.refresh(admin_user)
        await db_session.refresh(teacher_user)
        await db_session.refresh(student_user)
        await db_session.refresh(parent_user)
        
        # Create teacher profile
        teacher = Teacher(
            user_id=teacher_user.id,
            employee_id="TCH001",
            department="Mathematics",
            qualification="M.Sc Mathematics",
            experience_years=5,
            hire_date="2023-01-01",
            salary=50000.00
        )
        db_session.add(teacher)
        
        # Create class
        class_obj = Class(
            name="Grade 10-A",
            academic_session="2023-2024",
            school_id=test_school.id,
            class_teacher_id=teacher_user.id,
            capacity=30,
            room_number="101"
        )
        db_session.add(class_obj)
        await db_session.commit()
        await db_session.refresh(class_obj)
        
        # Create student profile
        student = Student(
            user_id=student_user.id,
            admission_number="STU001",
            date_of_birth="2005-01-01",
            gender="male",
            address_line1="123 Student Street",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria",
            phone="+1234567890",
            emergency_contact_name="Test Parent",
            emergency_contact_phone="+1234567890",
            emergency_contact_relationship="parent",
            class_id=class_obj.id,
            parent_id=parent_user.id
        )
        db_session.add(student)
        
        # Create fee structure
        fee_structure = FeeStructure(
            name="Tuition Fee - Grade 10",
            academic_session="2023-2024",
            class_level="Grade 10",
            fee_type="tuition",
            amount=50000.00,
            is_mandatory=True,
            due_date="2023-12-31",
            late_fee_amount=5000.00,
            late_fee_days=7,
            school_id=test_school.id
        )
        db_session.add(fee_structure)
        
        await db_session.commit()
        await db_session.refresh(student)
        await db_session.refresh(fee_structure)
        
        # Create fee assignment
        fee_assignment = FeeAssignment(
            student_id=student.id,
            fee_structure_id=fee_structure.id,
            amount=50000.00,
            due_date="2023-12-31",
            status="pending"
        )
        db_session.add(fee_assignment)
        
        await db_session.commit()
        
        return {
            "admin_user": admin_user,
            "teacher_user": teacher_user,
            "student_user": student_user,
            "parent_user": parent_user,
            "teacher": teacher,
            "student": student,
            "class": class_obj,
            "fee_structure": fee_structure,
            "fee_assignment": fee_assignment
        }

    def test_complete_student_enrollment_workflow(
        self, 
        client: TestClient, 
        setup_complete_school
    ):
        """Test complete student enrollment workflow."""
        admin_user = setup_complete_school["admin_user"]
        
        # Login as admin
        response = client.post(
            "/api/v1/auth/login",
            json={"email": admin_user.email, "password": "admin123"}
        )
        assert response.status_code == 200
        admin_token = response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # 1. Create a new student
        student_data = {
            "admission_number": "STU002",
            "first_name": "New",
            "last_name": "Student",
            "email": "newstudent@integration.com",
            "date_of_birth": "2006-01-01",
            "gender": "female",
            "address_line1": "456 New Street",
            "city": "Test City",
            "state": "Test State",
            "postal_code": "12345",
            "country": "Nigeria",
            "phone": "+1234567891",
            "emergency_contact_name": "New Parent",
            "emergency_contact_phone": "+1234567891",
            "emergency_contact_relationship": "parent"
        }
        
        response = client.post(
            "/api/v1/students", 
            json=student_data, 
            headers=admin_headers
        )
        assert response.status_code == 201
        new_student = response.json()
        
        # 2. Assign student to class
        class_id = setup_complete_school["class"].id
        response = client.put(
            f"/api/v1/students/{new_student['id']}/assign-class",
            json={"class_id": str(class_id)},
            headers=admin_headers
        )
        assert response.status_code == 200
        
        # 3. Create fee assignment for new student
        fee_structure_id = setup_complete_school["fee_structure"].id
        response = client.post(
            "/api/v1/fees/assignments",
            json={
                "student_id": new_student["id"],
                "fee_structure_id": str(fee_structure_id),
                "amount": 50000.00,
                "due_date": "2023-12-31"
            },
            headers=admin_headers
        )
        assert response.status_code == 201
        
        # 4. Verify student appears in class roster
        response = client.get(
            f"/api/v1/classes/{class_id}/students",
            headers=admin_headers
        )
        assert response.status_code == 200
        students = response.json()["students"]
        student_ids = [s["id"] for s in students]
        assert new_student["id"] in student_ids

    def test_attendance_marking_workflow(
        self, 
        client: TestClient, 
        setup_complete_school
    ):
        """Test complete attendance marking workflow."""
        teacher_user = setup_complete_school["teacher_user"]
        student = setup_complete_school["student"]
        class_obj = setup_complete_school["class"]
        
        # Login as teacher
        response = client.post(
            "/api/v1/auth/login",
            json={"email": teacher_user.email, "password": "teacher123"}
        )
        assert response.status_code == 200
        teacher_token = response.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        
        # 1. Get class students
        response = client.get(
            f"/api/v1/classes/{class_obj.id}/students",
            headers=teacher_headers
        )
        assert response.status_code == 200
        students = response.json()["students"]
        
        # 2. Mark attendance
        attendance_data = {
            "class_id": str(class_obj.id),
            "date": "2023-10-01",
            "attendance_records": [
                {
                    "student_id": str(student.id),
                    "status": "present",
                    "remarks": "On time"
                }
            ]
        }
        
        response = client.post(
            "/api/v1/attendance",
            json=attendance_data,
            headers=teacher_headers
        )
        assert response.status_code == 201
        
        # 3. Verify attendance was recorded
        response = client.get(
            f"/api/v1/attendance?class_id={class_obj.id}&date=2023-10-01",
            headers=teacher_headers
        )
        assert response.status_code == 200
        attendance_records = response.json()["attendance_records"]
        assert len(attendance_records) == 1
        assert attendance_records[0]["status"] == "present"

    def test_fee_payment_workflow(
        self, 
        client: TestClient, 
        setup_complete_school
    ):
        """Test complete fee payment workflow."""
        admin_user = setup_complete_school["admin_user"]
        student = setup_complete_school["student"]
        fee_assignment = setup_complete_school["fee_assignment"]
        
        # Login as admin
        response = client.post(
            "/api/v1/auth/login",
            json={"email": admin_user.email, "password": "admin123"}
        )
        assert response.status_code == 200
        admin_token = response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # 1. Get pending fee assignments
        response = client.get(
            f"/api/v1/fees/assignments?student_id={student.id}&status=pending",
            headers=admin_headers
        )
        assert response.status_code == 200
        assignments = response.json()["assignments"]
        assert len(assignments) > 0
        
        # 2. Record payment
        payment_data = {
            "student_id": str(student.id),
            "fee_assignment_id": str(fee_assignment.id),
            "amount": 50000.00,
            "payment_method": "cash",
            "payment_date": "2023-10-01",
            "transaction_reference": "TXN123456",
            "notes": "Full payment for tuition fee"
        }
        
        response = client.post(
            "/api/v1/fees/payments",
            json=payment_data,
            headers=admin_headers
        )
        assert response.status_code == 201
        payment = response.json()
        
        # 3. Verify payment was recorded
        response = client.get(
            f"/api/v1/fees/payments/{payment['id']}",
            headers=admin_headers
        )
        assert response.status_code == 200
        payment_details = response.json()
        assert payment_details["amount"] == 50000.00
        assert payment_details["payment_method"] == "cash"
        
        # 4. Generate receipt
        response = client.get(
            f"/api/v1/fees/payments/{payment['id']}/receipt",
            headers=admin_headers
        )
        assert response.status_code == 200

    def test_communication_workflow(
        self, 
        client: TestClient, 
        setup_complete_school
    ):
        """Test complete communication workflow."""
        admin_user = setup_complete_school["admin_user"]
        parent_user = setup_complete_school["parent_user"]
        class_obj = setup_complete_school["class"]
        
        # Login as admin
        response = client.post(
            "/api/v1/auth/login",
            json={"email": admin_user.email, "password": "admin123"}
        )
        assert response.status_code == 200
        admin_token = response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # 1. Create announcement
        announcement_data = {
            "title": "School Holiday Notice",
            "content": "School will be closed on October 15th for holiday.",
            "target_audience": "all_parents",
            "is_urgent": False,
            "start_date": "2023-10-01T00:00:00Z",
            "end_date": "2023-10-15T23:59:59Z",
            "category": "holiday"
        }
        
        response = client.post(
            "/api/v1/communication/announcements",
            json=announcement_data,
            headers=admin_headers
        )
        assert response.status_code == 201
        announcement = response.json()
        
        # 2. Publish announcement
        response = client.post(
            f"/api/v1/communication/announcements/{announcement['id']}/publish",
            headers=admin_headers
        )
        assert response.status_code == 200
        
        # 3. Send message to class
        message_data = {
            "subject": "Important Class Notice",
            "content": "Please attend the parent-teacher meeting tomorrow.",
            "message_type": "email",
            "recipient_type": "class",
            "recipient_class_id": str(class_obj.id),
            "is_urgent": True
        }
        
        response = client.post(
            "/api/v1/communication/messages",
            json=message_data,
            headers=admin_headers
        )
        assert response.status_code == 201
        message = response.json()
        
        # 4. Send message
        response = client.post(
            f"/api/v1/communication/messages/{message['id']}/send",
            headers=admin_headers
        )
        assert response.status_code == 200
        
        # 5. Login as parent and check messages
        response = client.post(
            "/api/v1/auth/login",
            json={"email": parent_user.email, "password": "parent123"}
        )
        assert response.status_code == 200
        parent_token = response.json()["access_token"]
        parent_headers = {"Authorization": f"Bearer {parent_token}"}
        
        response = client.get(
            "/api/v1/communication/my-messages",
            headers=parent_headers
        )
        assert response.status_code == 200
        messages = response.json()["messages"]
        # Should receive messages targeted to parents

    def test_academic_performance_workflow(
        self, 
        client: TestClient, 
        setup_complete_school
    ):
        """Test academic performance tracking workflow."""
        teacher_user = setup_complete_school["teacher_user"]
        student = setup_complete_school["student"]
        class_obj = setup_complete_school["class"]
        
        # Login as teacher
        response = client.post(
            "/api/v1/auth/login",
            json={"email": teacher_user.email, "password": "teacher123"}
        )
        assert response.status_code == 200
        teacher_token = response.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        
        # 1. Create subject
        subject_data = {
            "name": "Mathematics",
            "code": "MATH101",
            "description": "Basic Mathematics",
            "credit_hours": 3
        }
        
        response = client.post(
            "/api/v1/subjects",
            json=subject_data,
            headers=teacher_headers
        )
        assert response.status_code == 201
        subject = response.json()
        
        # 2. Create assessment
        assessment_data = {
            "title": "Mid-term Exam",
            "subject_id": subject["id"],
            "class_id": str(class_obj.id),
            "assessment_type": "exam",
            "total_marks": 100,
            "date": "2023-10-15",
            "description": "Mid-term examination for Mathematics"
        }
        
        response = client.post(
            "/api/v1/assessments",
            json=assessment_data,
            headers=teacher_headers
        )
        assert response.status_code == 201
        assessment = response.json()
        
        # 3. Record grades
        grade_data = {
            "assessment_id": assessment["id"],
            "grades": [
                {
                    "student_id": str(student.id),
                    "marks_obtained": 85,
                    "remarks": "Good performance"
                }
            ]
        }
        
        response = client.post(
            "/api/v1/grades",
            json=grade_data,
            headers=teacher_headers
        )
        assert response.status_code == 201
        
        # 4. Get student academic record
        response = client.get(
            f"/api/v1/students/{student.id}/academic-record",
            headers=teacher_headers
        )
        assert response.status_code == 200
        academic_record = response.json()
        assert "grades" in academic_record
        assert len(academic_record["grades"]) > 0

    def test_role_based_access_control(
        self, 
        client: TestClient, 
        setup_complete_school
    ):
        """Test role-based access control across the system."""
        student_user = setup_complete_school["student_user"]
        teacher_user = setup_complete_school["teacher_user"]
        admin_user = setup_complete_school["admin_user"]
        
        # Test student access
        response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "student123"}
        )
        student_token = response.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        
        # Student should not be able to create other students
        response = client.post(
            "/api/v1/students",
            json={"admission_number": "STU999"},
            headers=student_headers
        )
        assert response.status_code == 403
        
        # Student should be able to view their own profile
        response = client.get(
            "/api/v1/profile",
            headers=student_headers
        )
        assert response.status_code == 200
        
        # Test teacher access
        response = client.post(
            "/api/v1/auth/login",
            json={"email": teacher_user.email, "password": "teacher123"}
        )
        teacher_token = response.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        
        # Teacher should be able to mark attendance
        response = client.get(
            "/api/v1/attendance",
            headers=teacher_headers
        )
        assert response.status_code == 200
        
        # Teacher should not be able to manage fee structures
        response = client.post(
            "/api/v1/fees/structures",
            json={"name": "Test Fee"},
            headers=teacher_headers
        )
        assert response.status_code == 403
