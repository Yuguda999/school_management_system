"""
Unit tests for Curriculum Service (P2.3)
"""

import pytest
import pytest_asyncio
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.curriculum_service import CurriculumService
from app.models.curriculum import CurriculumUnit, LessonPlanItem, CoverageStatus


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
async def test_class(db_session: AsyncSession, test_school):
    """Create a test class."""
    from app.models.academic import Class, ClassLevel

    class_ = Class(
        name="JSS 1A",
        level=ClassLevel.JSS_1,
        section="A",
        academic_session="2023/2024",
        school_id=test_school.id
    )
    db_session.add(class_)
    await db_session.commit()
    await db_session.refresh(class_)
    return class_


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


@pytest_asyncio.fixture
async def test_term(db_session: AsyncSession, test_school):
    """Create a test term."""
    from app.models.academic import Term, TermType

    term = Term(
        name="First Term",
        type=TermType.FIRST_TERM,
        academic_session="2023/2024",
        school_id=test_school.id,
        start_date=date(2024, 9, 1),
        end_date=date(2024, 12, 20),
        is_current=True
    )
    db_session.add(term)
    await db_session.commit()
    await db_session.refresh(term)
    return term


class TestCurriculumService:
    """Test cases for CurriculumService"""

    @pytest.mark.asyncio
    async def test_create_curriculum_unit(
        self, db_session: AsyncSession, test_school, test_teacher,
        test_class, test_subject, test_term
    ):
        """Test creating a curriculum unit."""
        from app.schemas.curriculum import CurriculumUnitCreate

        unit_data = CurriculumUnitCreate(
            name="Algebra Fundamentals",
            description="Introduction to algebraic expressions",
            subject_id=test_subject.id,
            class_id=test_class.id,
            term_id=test_term.id,
            estimated_hours=10,
            learning_objectives=["Understand variables", "Solve simple equations"]
        )

        unit = await CurriculumService.create_unit(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            unit_data=unit_data
        )

        assert unit is not None
        assert unit.name == "Algebra Fundamentals"
        assert unit.coverage_status == CoverageStatus.PLANNED

    @pytest.mark.asyncio
    async def test_update_unit_status(
        self, db_session: AsyncSession, test_school, test_teacher,
        test_class, test_subject, test_term
    ):
        """Test updating curriculum unit status."""
        from app.schemas.curriculum import CurriculumUnitCreate

        unit_data = CurriculumUnitCreate(
            name="Test Unit",
            subject_id=test_subject.id,
            class_id=test_class.id,
            term_id=test_term.id
        )

        unit = await CurriculumService.create_unit(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            unit_data=unit_data
        )

        updated = await CurriculumService.mark_unit_status(
            db=db_session,
            school_id=test_school.id,
            unit_id=unit.id,
            status=CoverageStatus.IN_PROGRESS
        )

        assert updated.coverage_status == CoverageStatus.IN_PROGRESS

    @pytest.mark.asyncio
    async def test_create_lesson_plan_item(
        self, db_session: AsyncSession, test_school, test_teacher,
        test_class, test_subject, test_term
    ):
        """Test creating a lesson plan item."""
        from app.schemas.curriculum import CurriculumUnitCreate, LessonPlanItemCreate

        # Create a unit first
        unit_data = CurriculumUnitCreate(
            name="Parent Unit",
            subject_id=test_subject.id,
            class_id=test_class.id,
            term_id=test_term.id
        )

        unit = await CurriculumService.create_unit(
            db=db_session,
            school_id=test_school.id,
            user_id=test_teacher.id,
            unit_data=unit_data
        )

        lesson_data = LessonPlanItemCreate(
            title="Introduction to Variables",
            description="Learn what variables are",
            curriculum_unit_id=unit.id,
            subject_id=test_subject.id,
            class_id=test_class.id,
            term_id=test_term.id,
            scheduled_date=date(2024, 9, 15),
            duration_minutes=45
        )

        lesson = await CurriculumService.create_lesson_plan(
            db=db_session,
            school_id=test_school.id,
            teacher_id=test_teacher.id,
            plan_data=lesson_data
        )

        assert lesson is not None
        assert lesson.title == "Introduction to Variables"
        assert lesson.is_delivered is False

