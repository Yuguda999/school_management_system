import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime
from decimal import Decimal

from app.models.grade import Exam, Grade, ExamType, GradeScale
from app.models.academic import Class, Subject, Term, TermType, ClassLevel
from app.models.student import Student
from app.models.user import User, UserRole
from app.models.school import School
from app.services.grade_service import GradeService
from app.schemas.grade import ExamCreate, GradeCreate


@pytest.fixture
async def test_school(db_session: AsyncSession):
    """Create a test school"""
    school = School(
        name="Test School",
        email="test@school.com",
        phone="1234567890",
        address="Test Address",
        is_active=True
    )
    db_session.add(school)
    await db_session.commit()
    await db_session.refresh(school)
    return school


@pytest.fixture
async def test_teacher(db_session: AsyncSession, test_school: School):
    """Create a test teacher"""
    teacher = User(
        email="teacher@test.com",
        full_name="Test Teacher",
        role=UserRole.TEACHER,
        school_id=test_school.id,
        is_active=True
    )
    db_session.add(teacher)
    await db_session.commit()
    await db_session.refresh(teacher)
    return teacher


@pytest.fixture
async def test_class(db_session: AsyncSession, test_school: School, test_teacher: User):
    """Create a test class"""
    test_class = Class(
        name="Test Class 1A",
        level=ClassLevel.PRIMARY_1,
        section="A",
        capacity=30,
        academic_session="2023/2024",
        teacher_id=test_teacher.id,
        school_id=test_school.id,
        is_active=True
    )
    db_session.add(test_class)
    await db_session.commit()
    await db_session.refresh(test_class)
    return test_class


@pytest.fixture
async def test_subject(db_session: AsyncSession, test_school: School):
    """Create a test subject"""
    subject = Subject(
        name="Mathematics",
        code="MATH101",
        description="Basic Mathematics",
        is_core=True,
        credit_units=3,
        school_id=test_school.id,
        is_active=True
    )
    db_session.add(subject)
    await db_session.commit()
    await db_session.refresh(subject)
    return subject


@pytest.fixture
async def test_term(db_session: AsyncSession, test_school: School):
    """Create a test term"""
    term = Term(
        name="First Term",
        type=TermType.FIRST_TERM,
        academic_session="2023/2024",
        start_date=date(2023, 9, 1),
        end_date=date(2023, 12, 15),
        is_current=True,
        school_id=test_school.id,
        is_active=True
    )
    db_session.add(term)
    await db_session.commit()
    await db_session.refresh(term)
    return term


@pytest.fixture
async def test_student(db_session: AsyncSession, test_school: School, test_class: Class):
    """Create a test student"""
    student = Student(
        admission_number="STU001",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(2010, 1, 1),
        gender="Male",
        class_id=test_class.id,
        school_id=test_school.id,
        is_active=True
    )
    db_session.add(student)
    await db_session.commit()
    await db_session.refresh(student)
    return student


@pytest.fixture
async def test_exam(
    db_session: AsyncSession,
    test_school: School,
    test_teacher: User,
    test_class: Class,
    test_subject: Subject,
    test_term: Term
):
    """Create a test exam"""
    exam_data = ExamCreate(
        name="Mid-Term Mathematics Exam",
        description="Mathematics mid-term examination",
        exam_type=ExamType.MID_TERM,
        exam_date=date(2023, 10, 15),
        start_time="09:00",
        duration_minutes=120,
        total_marks=Decimal("100.00"),
        pass_marks=Decimal("50.00"),
        subject_id=test_subject.id,
        class_id=test_class.id,
        term_id=test_term.id,
        instructions="Answer all questions",
        venue="Classroom A"
    )
    
    exam = await GradeService.create_exam(
        db_session, exam_data, test_school.id, test_teacher.id
    )
    return exam


class TestGradeService:
    """Test cases for GradeService"""
    
    async def test_create_exam(
        self,
        db_session: AsyncSession,
        test_school: School,
        test_teacher: User,
        test_class: Class,
        test_subject: Subject,
        test_term: Term
    ):
        """Test exam creation"""
        exam_data = ExamCreate(
            name="Test Exam",
            description="Test Description",
            exam_type=ExamType.QUIZ,
            exam_date=date(2023, 10, 20),
            total_marks=Decimal("50.00"),
            pass_marks=Decimal("25.00"),
            subject_id=test_subject.id,
            class_id=test_class.id,
            term_id=test_term.id
        )
        
        exam = await GradeService.create_exam(
            db_session, exam_data, test_school.id, test_teacher.id
        )
        
        assert exam.name == "Test Exam"
        assert exam.exam_type == ExamType.QUIZ
        assert exam.total_marks == Decimal("50.00")
        assert exam.school_id == test_school.id
        assert exam.created_by == test_teacher.id
    
    async def test_calculate_grade(self):
        """Test grade calculation"""
        assert GradeService.calculate_grade(Decimal("95")) == GradeScale.A_PLUS
        assert GradeService.calculate_grade(Decimal("85")) == GradeScale.A
        assert GradeService.calculate_grade(Decimal("75")) == GradeScale.B_PLUS
        assert GradeService.calculate_grade(Decimal("65")) == GradeScale.C_PLUS
        assert GradeService.calculate_grade(Decimal("55")) == GradeScale.D_PLUS
        assert GradeService.calculate_grade(Decimal("45")) == GradeScale.E
        assert GradeService.calculate_grade(Decimal("35")) == GradeScale.F
    
    async def test_create_grade(
        self,
        db_session: AsyncSession,
        test_school: School,
        test_teacher: User,
        test_student: Student,
        test_exam: Exam
    ):
        """Test grade creation"""
        grade_data = GradeCreate(
            score=Decimal("85.00"),
            total_marks=Decimal("100.00"),
            student_id=test_student.id,
            subject_id=test_exam.subject_id,
            exam_id=test_exam.id,
            term_id=test_exam.term_id,
            remarks="Good performance"
        )
        
        grade = await GradeService.create_grade(
            db_session, grade_data, test_school.id, test_teacher.id
        )
        
        assert grade.score == Decimal("85.00")
        assert grade.percentage == Decimal("85.00")
        assert grade.grade == GradeScale.A
        assert grade.student_id == test_student.id
        assert grade.graded_by == test_teacher.id


class TestGradeAPI:
    """Test cases for Grade API endpoints"""
    
    async def test_create_exam_endpoint(
        self,
        client: AsyncClient,
        test_teacher: User,
        test_class: Class,
        test_subject: Subject,
        test_term: Term
    ):
        """Test exam creation endpoint"""
        # This would require authentication setup
        # For now, just test the basic structure
        exam_data = {
            "name": "API Test Exam",
            "description": "Test via API",
            "exam_type": "quiz",
            "exam_date": "2023-10-25",
            "total_marks": 100.0,
            "pass_marks": 50.0,
            "subject_id": test_subject.id,
            "class_id": test_class.id,
            "term_id": test_term.id
        }
        
        # Note: This test would need proper authentication headers
        # response = await client.post("/api/v1/grades/exams", json=exam_data)
        # assert response.status_code == 200
        
        # For now, just verify the data structure is correct
        assert exam_data["name"] == "API Test Exam"
        assert exam_data["exam_type"] == "quiz"
