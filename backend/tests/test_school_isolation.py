"""
Comprehensive tests for school isolation functionality.

This test suite verifies that complete school isolation is maintained
across all entities and operations in the system.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from unittest.mock import AsyncMock, patch

from app.models.school import School
from app.models.user import User, UserRole
from app.models.student import Student, StudentStatus
from app.models.academic import Class, Subject, Term, Enrollment
from app.models.grade import Grade, Exam
from app.models.fee import FeeStructure, FeeAssignment, FeePayment
from app.models.communication import Message, Announcement
from app.models.document import Document
from app.utils.school_isolation import (
    SchoolIsolationValidator,
    SchoolIsolationService,
    SchoolIsolationQueryBuilder,
    validate_and_get_entity,
    validate_and_get_entities,
    create_school_filtered_query
)


class TestSchoolIsolationValidator:
    """Test school isolation validation"""
    
    @pytest.mark.asyncio
    async def test_validate_single_entity_access_success(self, db: AsyncSession):
        """Test successful validation of single entity access"""
        # Create test schools
        school1 = School(
            name="Test School 1",
            code="TEST1",
            email="test1@example.com",
            address_line1="123 Test St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        school2 = School(
            name="Test School 2", 
            code="TEST2",
            email="test2@example.com",
            address_line1="456 Test Ave",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school1)
        db.add(school2)
        await db.commit()
        await db.refresh(school1)
        await db.refresh(school2)
        
        # Create test student in school1
        student = Student(
            admission_number="STU001",
            first_name="John",
            last_name="Doe",
            date_of_birth="2010-01-01",
            gender="male",
            address_line1="123 Student St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            admission_date="2023-09-01",
            school_id=school1.id
        )
        
        db.add(student)
        await db.commit()
        await db.refresh(student)
        
        # Test validation - should succeed for correct school
        result = await SchoolIsolationValidator.validate_single_entity_access(
            db, student.id, Student, school1.id
        )
        
        assert result.id == student.id
        assert result.school_id == school1.id
    
    @pytest.mark.asyncio
    async def test_validate_single_entity_access_failure(self, db: AsyncSession):
        """Test failure when trying to access entity from different school"""
        # Create test schools
        school1 = School(
            name="Test School 1",
            code="TEST1",
            email="test1@example.com",
            address_line1="123 Test St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        school2 = School(
            name="Test School 2",
            code="TEST2", 
            email="test2@example.com",
            address_line1="456 Test Ave",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school1)
        db.add(school2)
        await db.commit()
        await db.refresh(school1)
        await db.refresh(school2)
        
        # Create test student in school1
        student = Student(
            admission_number="STU001",
            first_name="John",
            last_name="Doe",
            date_of_birth="2010-01-01",
            gender="male",
            address_line1="123 Student St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            admission_date="2023-09-01",
            school_id=school1.id
        )
        
        db.add(student)
        await db.commit()
        await db.refresh(student)
        
        # Test validation - should fail for different school
        with pytest.raises(HTTPException) as exc_info:
            await SchoolIsolationValidator.validate_single_entity_access(
                db, student.id, Student, school2.id
            )
        
        assert exc_info.value.status_code == 404
    
    @pytest.mark.asyncio
    async def test_validate_multiple_entities_access_success(self, db: AsyncSession):
        """Test successful validation of multiple entities access"""
        # Create test school
        school = School(
            name="Test School",
            code="TEST",
            email="test@example.com",
            address_line1="123 Test St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school)
        await db.commit()
        await db.refresh(school)
        
        # Create test students
        students = []
        for i in range(3):
            student = Student(
                admission_number=f"STU{i+1:03d}",
                first_name=f"Student{i+1}",
                last_name="Doe",
                date_of_birth="2010-01-01",
                gender="male",
                address_line1="123 Student St",
                city="Test City",
                state="Test State",
                postal_code="12345",
                admission_date="2023-09-01",
                school_id=school.id
            )
            students.append(student)
            db.add(student)
        
        await db.commit()
        for student in students:
            await db.refresh(student)
        
        # Test validation - should succeed for all students in same school
        student_ids = [student.id for student in students]
        result = await SchoolIsolationValidator.validate_multiple_entities_access(
            db, student_ids, Student, school.id
        )
        
        assert len(result) == 3
        assert all(student.school_id == school.id for student in result)
    
    @pytest.mark.asyncio
    async def test_validate_multiple_entities_access_failure(self, db: AsyncSession):
        """Test failure when trying to access entities from different schools"""
        # Create test schools
        school1 = School(
            name="Test School 1",
            code="TEST1",
            email="test1@example.com",
            address_line1="123 Test St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        school2 = School(
            name="Test School 2",
            code="TEST2",
            email="test2@example.com",
            address_line1="456 Test Ave",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school1)
        db.add(school2)
        await db.commit()
        await db.refresh(school1)
        await db.refresh(school2)
        
        # Create students in different schools
        student1 = Student(
            admission_number="STU001",
            first_name="Student1",
            last_name="Doe",
            date_of_birth="2010-01-01",
            gender="male",
            address_line1="123 Student St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            admission_date="2023-09-01",
            school_id=school1.id
        )
        
        student2 = Student(
            admission_number="STU002",
            first_name="Student2",
            last_name="Doe",
            date_of_birth="2010-01-01",
            gender="male",
            address_line1="123 Student St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            admission_date="2023-09-01",
            school_id=school2.id
        )
        
        db.add(student1)
        db.add(student2)
        await db.commit()
        await db.refresh(student1)
        await db.refresh(student2)
        
        # Test validation - should fail when trying to access students from different schools
        with pytest.raises(HTTPException) as exc_info:
            await SchoolIsolationValidator.validate_multiple_entities_access(
                db, [student1.id, student2.id], Student, school1.id
            )
        
        assert exc_info.value.status_code == 400


class TestSchoolIsolationService:
    """Test school isolation service operations"""
    
    @pytest.mark.asyncio
    async def test_create_entity_with_validation(self, db: AsyncSession):
        """Test creating entity with validation"""
        # Create test school
        school = School(
            name="Test School",
            code="TEST",
            email="test@example.com",
            address_line1="123 Test St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school)
        await db.commit()
        await db.refresh(school)
        
        # Create student data
        student_data = {
            "admission_number": "STU001",
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "2010-01-01",
            "gender": "male",
            "address_line1": "123 Student St",
            "city": "Test City",
            "state": "Test State",
            "postal_code": "12345",
            "admission_date": "2023-09-01"
        }
        
        # Create student with validation
        student = await SchoolIsolationService.create_entity_with_validation(
            db, student_data, Student, school.id
        )
        
        assert student.school_id == school.id
        assert student.admission_number == "STU001"
        assert student.first_name == "John"
    
    @pytest.mark.asyncio
    async def test_update_entity_with_validation(self, db: AsyncSession):
        """Test updating entity with validation"""
        # Create test school
        school = School(
            name="Test School",
            code="TEST",
            email="test@example.com",
            address_line1="123 Test St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school)
        await db.commit()
        await db.refresh(school)
        
        # Create test student
        student = Student(
            admission_number="STU001",
            first_name="John",
            last_name="Doe",
            date_of_birth="2010-01-01",
            gender="male",
            address_line1="123 Student St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            admission_date="2023-09-01",
            school_id=school.id
        )
        
        db.add(student)
        await db.commit()
        await db.refresh(student)
        
        # Update student data
        update_data = {
            "first_name": "Jane",
            "middle_name": "Marie"
        }
        
        # Update student with validation
        updated_student = await SchoolIsolationService.update_entity_with_validation(
            db, student.id, update_data, Student, school.id
        )
        
        assert updated_student.first_name == "Jane"
        assert updated_student.middle_name == "Marie"
        assert updated_student.school_id == school.id
    
    @pytest.mark.asyncio
    async def test_delete_entity_with_validation(self, db: AsyncSession):
        """Test deleting entity with validation"""
        # Create test school
        school = School(
            name="Test School",
            code="TEST",
            email="test@example.com",
            address_line1="123 Test St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school)
        await db.commit()
        await db.refresh(school)
        
        # Create test student
        student = Student(
            admission_number="STU001",
            first_name="John",
            last_name="Doe",
            date_of_birth="2010-01-01",
            gender="male",
            address_line1="123 Student St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            admission_date="2023-09-01",
            school_id=school.id
        )
        
        db.add(student)
        await db.commit()
        await db.refresh(student)
        
        # Delete student with validation
        result = await SchoolIsolationService.delete_entity_with_validation(
            db, student.id, Student, school.id
        )
        
        assert result is True
        
        # Verify soft delete
        await db.refresh(student)
        assert student.is_deleted is True


class TestSchoolIsolationQueryBuilder:
    """Test school isolation query builder"""
    
    def test_create_base_query(self):
        """Test creating base query with school isolation"""
        school_id = "test-school-id"
        builder = SchoolIsolationQueryBuilder(school_id)
        
        query = builder.create_base_query(Student)
        
        # The query should include school_id filter
        assert str(query).count("school_id") > 0
    
    def test_add_pagination(self):
        """Test adding pagination to query"""
        school_id = "test-school-id"
        builder = SchoolIsolationQueryBuilder(school_id)
        
        query = builder.create_base_query(Student)
        paginated_query = builder.add_pagination(query, skip=10, limit=20)
        
        # The query should include LIMIT and OFFSET
        assert "LIMIT" in str(paginated_query)
        assert "OFFSET" in str(paginated_query)


class TestConvenienceFunctions:
    """Test convenience functions for school isolation"""
    
    @pytest.mark.asyncio
    async def test_validate_and_get_entity(self, db: AsyncSession):
        """Test convenience function for validating and getting entity"""
        # Create test school and student
        school = School(
            name="Test School",
            code="TEST",
            email="test@example.com",
            address_line1="123 Test St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school)
        await db.commit()
        await db.refresh(school)
        
        student = Student(
            admission_number="STU001",
            first_name="John",
            last_name="Doe",
            date_of_birth="2010-01-01",
            gender="male",
            address_line1="123 Student St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            admission_date="2023-09-01",
            school_id=school.id
        )
        
        db.add(student)
        await db.commit()
        await db.refresh(student)
        
        # Test convenience function
        result = await validate_and_get_entity(
            db, student.id, Student, school.id
        )
        
        assert result.id == student.id
        assert result.school_id == school.id
    
    @pytest.mark.asyncio
    async def test_validate_and_get_entities(self, db: AsyncSession):
        """Test convenience function for validating and getting multiple entities"""
        # Create test school
        school = School(
            name="Test School",
            code="TEST",
            email="test@example.com",
            address_line1="123 Test St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school)
        await db.commit()
        await db.refresh(school)
        
        # Create test students
        students = []
        for i in range(2):
            student = Student(
                admission_number=f"STU{i+1:03d}",
                first_name=f"Student{i+1}",
                last_name="Doe",
                date_of_birth="2010-01-01",
                gender="male",
                address_line1="123 Student St",
                city="Test City",
                state="Test State",
                postal_code="12345",
                admission_date="2023-09-01",
                school_id=school.id
            )
            students.append(student)
            db.add(student)
        
        await db.commit()
        for student in students:
            await db.refresh(student)
        
        # Test convenience function
        student_ids = [student.id for student in students]
        result = await validate_and_get_entities(
            db, student_ids, Student, school.id
        )
        
        assert len(result) == 2
        assert all(student.school_id == school.id for student in result)
    
    def test_create_school_filtered_query(self):
        """Test convenience function for creating school-filtered query"""
        school_id = "test-school-id"
        
        query = create_school_filtered_query(Student, school_id)
        
        # The query should include school_id filter
        assert str(query).count("school_id") > 0


class TestCrossSchoolIsolation:
    """Test cross-school isolation scenarios"""
    
    @pytest.mark.asyncio
    async def test_students_cannot_access_other_school_data(self, db: AsyncSession):
        """Test that students cannot access data from other schools"""
        # Create two schools
        school1 = School(
            name="School 1",
            code="SCH1",
            email="school1@example.com",
            address_line1="123 School St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        school2 = School(
            name="School 2",
            code="SCH2",
            email="school2@example.com",
            address_line1="456 School Ave",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school1)
        db.add(school2)
        await db.commit()
        await db.refresh(school1)
        await db.refresh(school2)
        
        # Create students in each school
        student1 = Student(
            admission_number="STU001",
            first_name="Student1",
            last_name="Doe",
            date_of_birth="2010-01-01",
            gender="male",
            address_line1="123 Student St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            admission_date="2023-09-01",
            school_id=school1.id
        )
        
        student2 = Student(
            admission_number="STU002",
            first_name="Student2",
            last_name="Smith",
            date_of_birth="2010-01-01",
            gender="female",
            address_line1="456 Student Ave",
            city="Test City",
            state="Test State",
            postal_code="12345",
            admission_date="2023-09-01",
            school_id=school2.id
        )
        
        db.add(student1)
        db.add(student2)
        await db.commit()
        await db.refresh(student1)
        await db.refresh(student2)
        
        # Try to access student2 from school1 context - should fail
        with pytest.raises(HTTPException):
            await validate_and_get_entity(
                db, student2.id, Student, school1.id,
                error_message="Student not found in your school"
            )
        
        # Try to access student1 from school2 context - should fail
        with pytest.raises(HTTPException):
            await validate_and_get_entity(
                db, student1.id, Student, school2.id,
                error_message="Student not found in your school"
            )
    
    @pytest.mark.asyncio
    async def test_teachers_cannot_access_other_school_data(self, db: AsyncSession):
        """Test that teachers cannot access data from other schools"""
        # Create two schools
        school1 = School(
            name="School 1",
            code="SCH1",
            email="school1@example.com",
            address_line1="123 School St",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        school2 = School(
            name="School 2",
            code="SCH2",
            email="school2@example.com",
            address_line1="456 School Ave",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="Nigeria"
        )
        
        db.add(school1)
        db.add(school2)
        await db.commit()
        await db.refresh(school1)
        await db.refresh(school2)
        
        # Create teachers in each school
        teacher1 = User(
            email="teacher1@school1.com",
            username="teacher1",
            password_hash="hashed_password",
            first_name="Teacher1",
            last_name="Doe",
            role=UserRole.TEACHER,
            school_id=school1.id
        )
        
        teacher2 = User(
            email="teacher2@school2.com",
            username="teacher2",
            password_hash="hashed_password",
            first_name="Teacher2",
            last_name="Smith",
            role=UserRole.TEACHER,
            school_id=school2.id
        )
        
        db.add(teacher1)
        db.add(teacher2)
        await db.commit()
        await db.refresh(teacher1)
        await db.refresh(teacher2)
        
        # Try to access teacher2 from school1 context - should fail
        with pytest.raises(HTTPException):
            await validate_and_get_entity(
                db, teacher2.id, User, school1.id,
                error_message="Teacher not found in your school"
            )
        
        # Try to access teacher1 from school2 context - should fail
        with pytest.raises(HTTPException):
            await validate_and_get_entity(
                db, teacher1.id, User, school2.id,
                error_message="Teacher not found in your school"
            )


@pytest.mark.asyncio
async def test_comprehensive_isolation_scenario(db: AsyncSession):
    """Test comprehensive isolation scenario with multiple entity types"""
    # Create two schools
    school1 = School(
        name="School 1",
        code="SCH1",
        email="school1@example.com",
        address_line1="123 School St",
        city="Test City",
        state="Test State",
        postal_code="12345",
        country="Nigeria"
    )
    school2 = School(
        name="School 2",
        code="SCH2",
        email="school2@example.com",
        address_line1="456 School Ave",
        city="Test City",
        state="Test State",
        postal_code="12345",
        country="Nigeria"
    )
    
    db.add(school1)
    db.add(school2)
    await db.commit()
    await db.refresh(school1)
    await db.refresh(school2)
    
    # Create entities for school1
    student1 = Student(
        admission_number="STU001",
        first_name="Student1",
        last_name="Doe",
        date_of_birth="2010-01-01",
        gender="male",
        address_line1="123 Student St",
        city="Test City",
        state="Test State",
        postal_code="12345",
        admission_date="2023-09-01",
        school_id=school1.id
    )
    
    subject1 = Subject(
        name="Mathematics",
        code="MATH",
        school_id=school1.id
    )
    
    class1 = Class(
        name="Primary 1A",
        level="primary_1",
        academic_session="2023/2024",
        school_id=school1.id
    )
    
    # Create entities for school2
    student2 = Student(
        admission_number="STU002",
        first_name="Student2",
        last_name="Smith",
        date_of_birth="2010-01-01",
        gender="female",
        address_line1="456 Student Ave",
        city="Test City",
        state="Test State",
        postal_code="12345",
        admission_date="2023-09-01",
        school_id=school2.id
    )
    
    subject2 = Subject(
        name="Science",
        code="SCI",
        school_id=school2.id
    )
    
    class2 = Class(
        name="Primary 2B",
        level="primary_2",
        academic_session="2023/2024",
        school_id=school2.id
    )
    
    # Add all entities to database
    entities = [student1, subject1, class1, student2, subject2, class2]
    for entity in entities:
        db.add(entity)
    
    await db.commit()
    for entity in entities:
        await db.refresh(entity)
    
    # Test that school1 cannot access school2 entities
    with pytest.raises(HTTPException):
        await validate_and_get_entity(db, student2.id, Student, school1.id)
    
    with pytest.raises(HTTPException):
        await validate_and_get_entity(db, subject2.id, Subject, school1.id)
    
    with pytest.raises(HTTPException):
        await validate_and_get_entity(db, class2.id, Class, school1.id)
    
    # Test that school2 cannot access school1 entities
    with pytest.raises(HTTPException):
        await validate_and_get_entity(db, student1.id, Student, school2.id)
    
    with pytest.raises(HTTPException):
        await validate_and_get_entity(db, subject1.id, Subject, school2.id)
    
    with pytest.raises(HTTPException):
        await validate_and_get_entity(db, class1.id, Class, school2.id)
    
    # Test that each school can access its own entities
    result1 = await validate_and_get_entity(db, student1.id, Student, school1.id)
    assert result1.id == student1.id
    
    result2 = await validate_and_get_entity(db, student2.id, Student, school2.id)
    assert result2.id == student2.id
    
    print("✅ Comprehensive school isolation test passed!")
