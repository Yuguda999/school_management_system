import pytest
from datetime import date, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic import Term, TermType
from app.models.user import User
from app.models.school import School


class TestTermEndpoints:
    """Test cases for term management endpoints"""

    @pytest.mark.asyncio
    async def test_create_term_success(
        self,
        client: AsyncClient,
        admin_user: User,
        admin_headers: dict,
        db_session: AsyncSession
    ):
        """Test successful term creation"""
        term_data = {
            "name": "First Term",
            "type": "first_term",
            "academic_session": "2024/2025",
            "start_date": "2024-01-01",
            "end_date": "2024-03-31"
        }

        response = await client.post(
            "/api/v1/terms",
            json=term_data,
            headers=admin_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == term_data["name"]
        assert data["type"] == term_data["type"]
        assert data["academic_session"] == term_data["academic_session"]
        assert data["school_id"] == admin_user.school_id

    @pytest.mark.asyncio
    async def test_create_term_validation_errors(
        self,
        client: AsyncClient,
        admin_headers: dict
    ):
        """Test term creation with validation errors"""
        # Test invalid academic session format
        term_data = {
            "name": "First Term",
            "type": "first_term",
            "academic_session": "2024",  # Invalid format
            "start_date": "2024-01-01",
            "end_date": "2024-03-31"
        }

        response = await client.post(
            "/api/v1/terms",
            json=term_data,
            headers=admin_headers
        )

        assert response.status_code == 422

        # Test end date before start date
        term_data = {
            "name": "First Term",
            "type": "first_term",
            "academic_session": "2024/2025",
            "start_date": "2024-03-31",
            "end_date": "2024-01-01"  # Before start date
        }

        response = await client.post(
            "/api/v1/terms",
            json=term_data,
            headers=admin_headers
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_duplicate_term(
        self,
        client: AsyncClient,
        admin_user: User,
        admin_headers: dict,
        db_session: AsyncSession
    ):
        """Test creating duplicate term fails"""
        # Create first term
        term = Term(
            name="First Term",
            type=TermType.FIRST_TERM,
            academic_session="2024/2025",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            school_id=admin_user.school_id
        )
        db_session.add(term)
        await db_session.commit()

        # Try to create duplicate
        term_data = {
            "name": "First Term Duplicate",
            "type": "first_term",
            "academic_session": "2024/2025",
            "start_date": "2024-01-01",
            "end_date": "2024-03-31"
        }

        response = await client.post(
            "/api/v1/terms",
            json=term_data,
            headers=admin_headers
        )

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_overlapping_terms(
        self,
        client: AsyncClient,
        admin_user: User,
        admin_headers: dict,
        db_session: AsyncSession
    ):
        """Test creating overlapping terms fails"""
        # Create first term
        term = Term(
            name="First Term",
            type=TermType.FIRST_TERM,
            academic_session="2024/2025",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            school_id=admin_user.school_id
        )
        db_session.add(term)
        await db_session.commit()

        # Try to create overlapping term
        term_data = {
            "name": "Second Term",
            "type": "second_term",
            "academic_session": "2024/2025",
            "start_date": "2024-02-15",  # Overlaps with first term
            "end_date": "2024-05-31"
        }

        response = await client.post(
            "/api/v1/terms",
            json=term_data,
            headers=admin_headers
        )

        assert response.status_code == 400
        assert "overlap" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_terms(
        self,
        client: AsyncClient,
        admin_user: User,
        admin_headers: dict,
        db_session: AsyncSession
    ):
        """Test getting terms list"""
        # Create test terms
        terms = [
            Term(
                name="First Term",
                type=TermType.FIRST_TERM,
                academic_session="2024/2025",
                start_date=date(2024, 1, 1),
                end_date=date(2024, 3, 31),
                school_id=admin_user.school_id
            ),
            Term(
                name="Second Term",
                type=TermType.SECOND_TERM,
                academic_session="2024/2025",
                start_date=date(2024, 4, 1),
                end_date=date(2024, 6, 30),
                school_id=admin_user.school_id
            )
        ]
        
        for term in terms:
            db_session.add(term)
        await db_session.commit()

        response = await client.get("/api/v1/terms", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(term["school_id"] == admin_user.school_id for term in data)

    @pytest.mark.asyncio
    async def test_set_current_term(
        self,
        client: AsyncClient,
        admin_user: User,
        admin_headers: dict,
        db_session: AsyncSession
    ):
        """Test setting current term"""
        # Create test term
        term = Term(
            name="First Term",
            type=TermType.FIRST_TERM,
            academic_session="2024/2025",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            school_id=admin_user.school_id
        )
        db_session.add(term)
        await db_session.commit()
        await db_session.refresh(term)

        response = await client.post(
            f"/api/v1/terms/{term.id}/set-current",
            headers=admin_headers
        )

        assert response.status_code == 200
        assert "current term" in response.json()["message"]

        # Verify term is now current
        await db_session.refresh(term)
        assert term.is_current is True

    @pytest.mark.asyncio
    async def test_get_current_term(
        self,
        client: AsyncClient,
        admin_user: User,
        admin_headers: dict,
        db_session: AsyncSession
    ):
        """Test getting current term"""
        # Create and set current term
        term = Term(
            name="First Term",
            type=TermType.FIRST_TERM,
            academic_session="2024/2025",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            school_id=admin_user.school_id,
            is_current=True
        )
        db_session.add(term)
        await db_session.commit()

        response = await client.get("/api/v1/terms/current", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == term.id
        assert data["is_current"] is True

    @pytest.mark.asyncio
    async def test_bulk_term_creation(
        self,
        client: AsyncClient,
        admin_headers: dict
    ):
        """Test bulk term creation"""
        bulk_data = {
            "academic_session": "2024/2025",
            "first_term_start": "2024-01-01",
            "first_term_end": "2024-03-31",
            "second_term_start": "2024-04-01",
            "second_term_end": "2024-06-30",
            "third_term_start": "2024-07-01",
            "third_term_end": "2024-09-30"
        }

        response = await client.post(
            "/api/v1/terms/bulk",
            json=bulk_data,
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["academic_session"] == "2024/2025"
        assert len(data["terms_created"]) == 3
        assert "successfully created" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_update_term(
        self,
        client: AsyncClient,
        admin_user: User,
        admin_headers: dict,
        db_session: AsyncSession
    ):
        """Test updating term"""
        # Create test term
        term = Term(
            name="First Term",
            type=TermType.FIRST_TERM,
            academic_session="2024/2025",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            school_id=admin_user.school_id
        )
        db_session.add(term)
        await db_session.commit()
        await db_session.refresh(term)

        update_data = {
            "name": "Updated First Term",
            "end_date": "2024-04-15"
        }

        response = await client.put(
            f"/api/v1/terms/{term.id}",
            json=update_data,
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated First Term"
        assert data["end_date"] == "2024-04-15"

    @pytest.mark.asyncio
    async def test_delete_term(
        self,
        client: AsyncClient,
        admin_user: User,
        admin_headers: dict,
        db_session: AsyncSession
    ):
        """Test deleting term"""
        # Create test term
        term = Term(
            name="First Term",
            type=TermType.FIRST_TERM,
            academic_session="2024/2025",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            school_id=admin_user.school_id
        )
        db_session.add(term)
        await db_session.commit()
        await db_session.refresh(term)

        response = await client.delete(
            f"/api/v1/terms/{term.id}",
            headers=admin_headers
        )

        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_unauthorized_access(
        self,
        client: AsyncClient,
        student_headers: dict
    ):
        """Test that non-admin users cannot manage terms"""
        term_data = {
            "name": "First Term",
            "type": "first_term",
            "academic_session": "2024/2025",
            "start_date": "2024-01-01",
            "end_date": "2024-03-31"
        }

        response = await client.post(
            "/api/v1/terms",
            json=term_data,
            headers=student_headers
        )

        assert response.status_code == 403
