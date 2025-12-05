"""
Unit tests for Material Service (P3.2)
"""

import pytest
import pytest_asyncio
from uuid import uuid4
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.material_service import MaterialService
from app.models.teacher_material import (
    TeacherMaterial, MaterialFolder, MaterialType, DifficultyLevel
)


@pytest_asyncio.fixture
async def test_teacher(db_session: AsyncSession, test_school):
    """Create a test teacher user."""
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash

    user = User(
        email="teacher@test.com",
        password_hash=get_password_hash("testpassword"),
        first_name="Test",
        last_name="Teacher",
        role=UserRole.TEACHER,
        school_id=test_school.id,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_subject(db_session: AsyncSession, test_school):
    """Create a test subject."""
    from app.models.academic import Subject

    subject = Subject(
        name="Mathematics",
        code="MATH101",
        school_id=test_school.id
    )
    db_session.add(subject)
    await db_session.commit()
    await db_session.refresh(subject)
    return subject


class TestMaterialService:
    """Test cases for MaterialService"""

    @pytest.mark.asyncio
    async def test_create_material(self, db_session: AsyncSession, test_school, test_teacher, test_subject):
        """Test creating a new material."""
        material = await MaterialService.create_material(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            title="Algebra Notes",
            description="Introduction to algebra concepts",
            material_type=MaterialType.DOCUMENT,
            file_name="algebra.pdf",
            original_file_name="algebra.pdf",
            file_path="/uploads/algebra.pdf",
            file_size=1024,
            mime_type="application/pdf",
            subject_id=test_subject.id,
            tags=["algebra", "math", "notes"],
            difficulty_level=DifficultyLevel.BEGINNER
        )

        assert material is not None
        assert material.title == "Algebra Notes"
        assert material.school_id == test_school.id
        assert material.uploaded_by == test_teacher.id
        assert "algebra" in material.tags

    @pytest.mark.asyncio
    async def test_get_material(self, db_session: AsyncSession, test_school, test_teacher):
        """Test retrieving a material by ID."""
        # Create a material first
        material = await MaterialService.create_material(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            title="Test Material",
            material_type=MaterialType.DOCUMENT,
            file_name="test.pdf",
            original_file_name="test.pdf",
            file_path="/uploads/test.pdf",
            file_size=1024,
            mime_type="application/pdf"
        )

        # Retrieve it
        retrieved = await MaterialService.get_material(
            db=db_session,
            school_id=test_school.id,
            material_id=material.id
        )

        assert retrieved is not None
        assert retrieved.id == material.id
        assert retrieved.title == "Test Material"

    @pytest.mark.asyncio
    async def test_update_material(self, db_session: AsyncSession, test_school, test_teacher):
        """Test updating a material."""
        material = await MaterialService.create_material(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            title="Original Title",
            material_type=MaterialType.DOCUMENT,
            file_name="test.pdf",
            original_file_name="test.pdf",
            file_path="/uploads/test.pdf",
            file_size=1024,
            mime_type="application/pdf"
        )

        updated = await MaterialService.update_material(
            db=db_session,
            school_id=test_school.id,
            material_id=material.id,
            title="Updated Title",
            description="New description"
        )

        assert updated is not None
        assert updated.title == "Updated Title"
        assert updated.description == "New description"

    @pytest.mark.asyncio
    async def test_delete_material(self, db_session: AsyncSession, test_school, test_teacher):
        """Test deleting a material (soft delete)."""
        material = await MaterialService.create_material(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            title="To Delete",
            material_type=MaterialType.DOCUMENT,
            file_name="test.pdf",
            original_file_name="test.pdf",
            file_path="/uploads/test.pdf",
            file_size=1024,
            mime_type="application/pdf"
        )

        result = await MaterialService.delete_material(
            db=db_session,
            school_id=test_school.id,
            material_id=material.id
        )

        assert result is True

        # Verify it's marked as deleted
        deleted = await MaterialService.get_material(
            db=db_session,
            school_id=test_school.id,
            material_id=material.id
        )
        assert deleted is None

    @pytest.mark.asyncio
    async def test_smart_search(self, db_session: AsyncSession, test_school, test_teacher, test_subject):
        """Test smart search functionality."""
        # Create test materials (published for search)
        await MaterialService.create_material(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            title="Algebra Basics",
            description="Learn algebra fundamentals",
            material_type=MaterialType.DOCUMENT,
            file_name="algebra.pdf",
            original_file_name="algebra.pdf",
            file_path="/uploads/algebra.pdf",
            file_size=1024,
            mime_type="application/pdf",
            subject_id=test_subject.id,
            tags=["algebra", "basics"],
            is_published=True
        )

        await MaterialService.create_material(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            title="Geometry Introduction",
            description="Geometry concepts",
            material_type=MaterialType.DOCUMENT,
            file_name="geometry.pdf",
            original_file_name="geometry.pdf",
            file_path="/uploads/geometry.pdf",
            file_size=1024,
            mime_type="application/pdf",
            subject_id=test_subject.id,
            tags=["geometry", "shapes"],
            is_published=True
        )

        # Search for algebra
        results = await MaterialService.smart_search(
            db=db_session,
            school_id=test_school.id,
            query="algebra"
        )

        assert len(results) >= 1
        assert any("Algebra" in r["title"] for r in results)

    @pytest.mark.asyncio
    async def test_add_and_remove_tags(self, db_session: AsyncSession, test_school, test_teacher):
        """Test adding and removing tags from a material."""
        material = await MaterialService.create_material(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            title="Test Tags",
            material_type=MaterialType.DOCUMENT,
            file_name="test.pdf",
            original_file_name="test.pdf",
            file_path="/uploads/test.pdf",
            file_size=1024,
            mime_type="application/pdf",
            tags=["initial"]
        )

        # Add tags
        updated = await MaterialService.add_tags(
            db=db_session,
            school_id=test_school.id,
            material_id=material.id,
            tags=["new_tag", "another_tag"]
        )

        assert "new_tag" in updated.tags
        assert "another_tag" in updated.tags
        assert "initial" in updated.tags

        # Remove tag
        updated = await MaterialService.remove_tags(
            db=db_session,
            school_id=test_school.id,
            material_id=material.id,
            tags=["initial"]
        )

        assert "initial" not in updated.tags
        assert "new_tag" in updated.tags

    @pytest.mark.asyncio
    async def test_create_and_manage_folder(self, db_session: AsyncSession, test_school, test_teacher):
        """Test folder creation and material organization."""
        # Create a folder
        folder = await MaterialService.create_folder(
            db=db_session,
            school_id=test_school.id,
            teacher_id=test_teacher.id,
            name="Math Resources"
        )

        assert folder is not None
        assert folder.name == "Math Resources"

        # Create a material
        material = await MaterialService.create_material(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            title="Resource in Folder",
            material_type=MaterialType.DOCUMENT,
            file_name="test.pdf",
            original_file_name="test.pdf",
            file_path="/uploads/test.pdf",
            file_size=1024,
            mime_type="application/pdf"
        )

        # Add material to folder
        folder_item = await MaterialService.add_material_to_folder(
            db=db_session,
            school_id=test_school.id,
            folder_id=folder.id,
            material_id=material.id
        )

        assert folder_item is not None
        assert folder_item.folder_id == folder.id
        assert folder_item.material_id == material.id

    @pytest.mark.asyncio
    async def test_get_material_statistics(self, db_session: AsyncSession, test_school, test_teacher):
        """Test getting material statistics."""
        # Create materials
        await MaterialService.create_material(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            title="Material 1",
            material_type=MaterialType.DOCUMENT,
            file_name="test1.pdf",
            original_file_name="test1.pdf",
            file_path="/uploads/test1.pdf",
            file_size=1024,
            mime_type="application/pdf"
        )

        await MaterialService.create_material(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            title="Material 2",
            material_type=MaterialType.VIDEO,
            file_name="test2.mp4",
            original_file_name="test2.mp4",
            file_path="/uploads/test2.mp4",
            file_size=2048,
            mime_type="video/mp4"
        )

        stats = await MaterialService.get_material_statistics(
            db=db_session,
            school_id=test_school.id
        )

        assert stats["total_materials"] >= 2
        assert "materials_by_type" in stats

