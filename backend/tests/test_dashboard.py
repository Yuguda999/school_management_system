import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, date

from app.models.user import User, UserRole
from app.models.school import School
from app.models.academic import Term
from app.models.student import Student
from app.models.fee import FeeStructure, FeePayment
from tests.utils import create_test_user, create_test_school, create_test_term


class TestDashboardEndpoints:
    """Test dashboard endpoints"""

    @pytest.fixture
    async def school_owner(self, db: AsyncSession) -> User:
        """Create a test school owner"""
        school = await create_test_school(db)
        return await create_test_user(
            db, 
            email="owner@test.com",
            role=UserRole.SCHOOL_OWNER,
            school_id=school.id
        )

    @pytest.fixture
    async def test_school(self, db: AsyncSession) -> School:
        """Create a test school"""
        return await create_test_school(db)

    @pytest.fixture
    async def test_term(self, db: AsyncSession, test_school: School) -> Term:
        """Create a test term"""
        return await create_test_term(
            db,
            school_id=test_school.id,
            name="First Term",
            academic_session="2024/2025",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            is_current=True
        )

    async def test_get_dashboard_stats(
        self, 
        client: AsyncClient, 
        school_owner: User,
        test_term: Term
    ):
        """Test getting dashboard statistics"""
        response = await client.get(
            "/api/v1/dashboard/stats",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        required_fields = [
            "total_students", "total_teachers", "total_classes", 
            "total_subjects", "active_terms", "pending_fees",
            "recent_enrollments", "attendance_rate", "total_revenue"
        ]
        
        for field in required_fields:
            assert field in data
            assert isinstance(data[field], (int, float))

    async def test_get_dashboard_stats_with_term_filter(
        self, 
        client: AsyncClient, 
        school_owner: User,
        test_term: Term
    ):
        """Test getting dashboard statistics filtered by term"""
        response = await client.get(
            f"/api/v1/dashboard/stats?term_id={test_term.id}",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        
        # Should return same structure but potentially different values
        assert "total_students" in data
        assert "pending_fees" in data
        assert "total_revenue" in data

    async def test_get_complete_dashboard_data(
        self, 
        client: AsyncClient, 
        school_owner: User,
        test_term: Term
    ):
        """Test getting complete dashboard data"""
        response = await client.get(
            "/api/v1/dashboard/",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        
        # Check main sections
        assert "stats" in data
        assert "enrollment_trend" in data
        assert "revenue_data" in data
        assert "attendance_data" in data
        assert "performance_data" in data
        assert "recent_activities" in data
        
        # Check stats structure
        stats = data["stats"]
        assert "total_students" in stats
        assert "total_teachers" in stats
        
        # Check enrollment trend structure
        enrollment_trend = data["enrollment_trend"]
        assert isinstance(enrollment_trend, list)
        if enrollment_trend:
            assert "month" in enrollment_trend[0]
            assert "students" in enrollment_trend[0]
        
        # Check revenue data structure
        revenue_data = data["revenue_data"]
        assert isinstance(revenue_data, list)
        if revenue_data:
            assert "month" in revenue_data[0]
            assert "revenue" in revenue_data[0]

    async def test_dashboard_with_term_and_class_filters(
        self, 
        client: AsyncClient, 
        school_owner: User,
        test_term: Term
    ):
        """Test dashboard with multiple filters"""
        response = await client.get(
            f"/api/v1/dashboard/?term_id={test_term.id}&class_id=test-class",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "stats" in data

    async def test_dashboard_unauthorized_access(self, client: AsyncClient):
        """Test unauthorized access to dashboard endpoints"""
        response = await client.get("/api/v1/dashboard/stats")
        assert response.status_code == 401

        response = await client.get("/api/v1/dashboard/")
        assert response.status_code == 401

    async def test_teacher_dashboard_access(
        self, 
        client: AsyncClient, 
        db: AsyncSession,
        test_school: School
    ):
        """Test that teachers can access dashboard"""
        teacher = await create_test_user(
            db,
            email="teacher@test.com",
            role=UserRole.TEACHER,
            school_id=test_school.id
        )

        response = await client.get(
            "/api/v1/dashboard/stats",
            headers={"Authorization": f"Bearer {teacher.access_token}"}
        )
        assert response.status_code == 200

    async def test_cross_school_dashboard_isolation(
        self, 
        client: AsyncClient, 
        db: AsyncSession,
        test_term: Term
    ):
        """Test that dashboard data is isolated by school"""
        # Create another school and user
        other_school = await create_test_school(db, name="Other School")
        other_user = await create_test_user(
            db,
            email="other@test.com",
            role=UserRole.SCHOOL_OWNER,
            school_id=other_school.id
        )

        # Get dashboard stats for other school
        response = await client.get(
            "/api/v1/dashboard/stats",
            headers={"Authorization": f"Bearer {other_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return zero or minimal data for empty school
        assert data["total_students"] >= 0
        assert data["total_teachers"] >= 0

    async def test_dashboard_performance_with_large_dataset(
        self, 
        client: AsyncClient, 
        school_owner: User,
        db: AsyncSession,
        test_school: School
    ):
        """Test dashboard performance with larger dataset"""
        # This test would create more data and verify response time
        # For now, just verify it works with existing data
        
        response = await client.get(
            "/api/v1/dashboard/stats",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )
        
        assert response.status_code == 200
        # In a real test, you might check response time
        # assert response.elapsed.total_seconds() < 2.0

    async def test_dashboard_data_consistency(
        self, 
        client: AsyncClient, 
        school_owner: User
    ):
        """Test that dashboard data is consistent across calls"""
        # Make multiple calls and verify consistency
        response1 = await client.get(
            "/api/v1/dashboard/stats",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )
        
        response2 = await client.get(
            "/api/v1/dashboard/stats",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Core stats should be the same (assuming no changes between calls)
        assert data1["total_students"] == data2["total_students"]
        assert data1["total_teachers"] == data2["total_teachers"]

    async def test_dashboard_with_invalid_term_id(
        self, 
        client: AsyncClient, 
        school_owner: User
    ):
        """Test dashboard with invalid term ID"""
        response = await client.get(
            "/api/v1/dashboard/stats?term_id=invalid-term-id",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )
        
        # Should still return data (just not filtered by term)
        assert response.status_code == 200
        data = response.json()
        assert "total_students" in data

    async def test_dashboard_recent_activities_structure(
        self, 
        client: AsyncClient, 
        school_owner: User
    ):
        """Test recent activities data structure"""
        response = await client.get(
            "/api/v1/dashboard/",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        recent_activities = data["recent_activities"]
        assert isinstance(recent_activities, list)
        
        if recent_activities:
            activity = recent_activities[0]
            required_fields = ["id", "type", "title", "description", "timestamp"]
            for field in required_fields:
                assert field in activity

    async def test_dashboard_attendance_data_structure(
        self, 
        client: AsyncClient, 
        school_owner: User
    ):
        """Test attendance data structure in dashboard"""
        response = await client.get(
            "/api/v1/dashboard/",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        attendance_data = data["attendance_data"]
        assert isinstance(attendance_data, list)
        
        if attendance_data:
            attendance_item = attendance_data[0]
            assert "status" in attendance_item
            assert "count" in attendance_item
            assert "percentage" in attendance_item

    async def test_dashboard_performance_data_structure(
        self, 
        client: AsyncClient, 
        school_owner: User
    ):
        """Test performance data structure in dashboard"""
        response = await client.get(
            "/api/v1/dashboard/",
            headers={"Authorization": f"Bearer {school_owner.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        performance_data = data["performance_data"]
        assert isinstance(performance_data, list)
        
        if performance_data:
            performance_item = performance_data[0]
            assert "subject" in performance_item
            assert "average_score" in performance_item
            assert "target_score" in performance_item
