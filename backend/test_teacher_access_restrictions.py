"""
Test script to verify teacher access restrictions in the school management system.
This script tests that teachers can only access resources they are assigned to
and cannot access admin-only features.
"""

import asyncio
import sys
import os
from typing import Dict, Any

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.school import School
from app.models.student import Student
from app.models.academic import Class, Subject
from app.services.user_service import UserService
from app.services.academic_service import AcademicService
from app.services.student_service import StudentService
from app.services.teacher_subject_service import TeacherSubjectService
from app.schemas.user import UserCreate, TeacherCreateWithSubjects
from app.schemas.academic import ClassCreate, SubjectCreate, TeacherSubjectAssignmentCreate
from app.schemas.student import StudentCreate
from app.core.deps import (
    check_teacher_can_access_student,
    check_teacher_can_access_class,
    check_teacher_can_access_subject
)


class TeacherAccessTest:
    def __init__(self):
        self.db: AsyncSession = None
        self.school: School = None
        self.admin_user: User = None
        self.teacher1: User = None
        self.teacher2: User = None
        self.class1: Class = None
        self.class2: Class = None
        self.subject1: Subject = None
        self.subject2: Subject = None
        self.student1: Student = None
        self.student2: Student = None
        self.student3: Student = None

    async def setup_test_data(self):
        """Create test data for teacher access testing"""
        print("Setting up test data...")

        # Get database session
        from app.core.database import AsyncSessionLocal
        self.db = AsyncSessionLocal()

        # Find existing school and admin (assuming test data exists)
        from sqlalchemy import select
        
        # Get first school
        school_result = await self.db.execute(
            select(School).where(School.is_deleted == False).limit(1)
        )
        self.school = school_result.scalar_one_or_none()
        
        if not self.school:
            print("❌ No school found. Please run the main test setup first.")
            return False

        # Get admin user
        admin_result = await self.db.execute(
            select(User).where(
                User.school_id == self.school.id,
                User.role == UserRole.SUPER_ADMIN,
                User.is_deleted == False
            ).limit(1)
        )
        self.admin_user = admin_result.scalar_one_or_none()
        
        if not self.admin_user:
            print("❌ No admin user found. Please run the main test setup first.")
            return False

        # Create test subjects with unique codes
        import uuid
        unique_suffix = str(uuid.uuid4())[:8]

        try:
            subject1_data = SubjectCreate(
                name=f"Mathematics-{unique_suffix}",
                code=f"MATH{unique_suffix}",
                description="Basic Mathematics",
                is_core=True
            )
            self.subject1 = await AcademicService.create_subject(
                self.db, subject1_data, self.school.id
            )

            subject2_data = SubjectCreate(
                name=f"English-{unique_suffix}",
                code=f"ENG{unique_suffix}",
                description="English Language",
                is_core=True
            )
            self.subject2 = await AcademicService.create_subject(
                self.db, subject2_data, self.school.id
            )

            # Create test classes
            class1_data = ClassCreate(
                name=f"SS1A-{unique_suffix}",
                level="ss_1",
                section="A",
                academic_session="2024-2025",
                capacity=30
            )
            self.class1 = await AcademicService.create_class(
                self.db, class1_data, self.school.id
            )

            class2_data = ClassCreate(
                name=f"SS1B-{unique_suffix}",
                level="ss_1",
                section="B",
                academic_session="2024-2025",
                capacity=30
            )
            self.class2 = await AcademicService.create_class(
                self.db, class2_data, self.school.id
            )

            # Create test teachers (without subjects first)
            from app.schemas.user import StaffCreate

            teacher1_data = StaffCreate(
                email=f"teacher1-{unique_suffix}@test.com",
                first_name="John",
                last_name="Teacher",
                password="password123",
                role=UserRole.TEACHER,
                employee_id=f"EMP001-{unique_suffix}",
                department="Mathematics",
                position="Teacher"
            )
            self.teacher1 = await UserService.create_user(
                self.db, teacher1_data, self.school.id
            )

            teacher2_data = StaffCreate(
                email=f"teacher2-{unique_suffix}@test.com",
                first_name="Jane",
                last_name="Teacher",
                password="password123",
                role=UserRole.TEACHER,
                employee_id=f"EMP002-{unique_suffix}",
                department="English",
                position="Teacher"
            )
            self.teacher2 = await UserService.create_user(
                self.db, teacher2_data, self.school.id
            )

            # Assign subjects to teachers
            assignment1_data = TeacherSubjectAssignmentCreate(
                teacher_id=self.teacher1.id,
                subject_id=self.subject1.id,
                is_head_of_subject=True
            )
            await TeacherSubjectService.assign_subject_to_teacher(
                self.db, assignment1_data, self.school.id
            )

            assignment2_data = TeacherSubjectAssignmentCreate(
                teacher_id=self.teacher2.id,
                subject_id=self.subject2.id,
                is_head_of_subject=True
            )
            await TeacherSubjectService.assign_subject_to_teacher(
                self.db, assignment2_data, self.school.id
            )

            # Make teacher1 class teacher for class1
            self.class1.teacher_id = self.teacher1.id
            await self.db.commit()

            # Create test students
            from datetime import date

            student1_data = StudentCreate(
                first_name="Alice",
                last_name="Student",
                admission_number=f"STU001-{unique_suffix}",
                current_class_id=self.class1.id,
                date_of_birth=date(2008, 1, 1),
                gender="female",
                address_line1="123 Test Street",
                city="Test City",
                state="Test State",
                postal_code="12345",
                admission_date=date(2024, 1, 1)
            )
            self.student1 = await StudentService.create_student(
                self.db, student1_data, self.school.id
            )

            student2_data = StudentCreate(
                first_name="Bob",
                last_name="Student",
                admission_number=f"STU002-{unique_suffix}",
                current_class_id=self.class1.id,
                date_of_birth=date(2008, 2, 1),
                gender="male",
                address_line1="456 Test Avenue",
                city="Test City",
                state="Test State",
                postal_code="12345",
                admission_date=date(2024, 1, 1)
            )
            self.student2 = await StudentService.create_student(
                self.db, student2_data, self.school.id
            )

            student3_data = StudentCreate(
                first_name="Charlie",
                last_name="Student",
                admission_number=f"STU003-{unique_suffix}",
                current_class_id=self.class2.id,
                date_of_birth=date(2008, 3, 1),
                gender="male",
                address_line1="789 Test Road",
                city="Test City",
                state="Test State",
                postal_code="12345",
                admission_date=date(2024, 1, 1)
            )
            self.student3 = await StudentService.create_student(
                self.db, student3_data, self.school.id
            )

            print("✅ Test data setup completed successfully")
            return True

        except Exception as e:
            print(f"❌ Error setting up test data: {e}")
            return False

    async def test_teacher_student_access(self):
        """Test that teachers can only access students in their classes/subjects"""
        print("\n🧪 Testing teacher student access...")
        
        # Teacher1 should be able to access students in class1 (students 1 and 2)
        can_access_student1 = await check_teacher_can_access_student(
            self.db, self.teacher1.id, self.student1.id, self.school.id
        )
        can_access_student2 = await check_teacher_can_access_student(
            self.db, self.teacher1.id, self.student2.id, self.school.id
        )
        can_access_student3 = await check_teacher_can_access_student(
            self.db, self.teacher1.id, self.student3.id, self.school.id
        )

        if can_access_student1 and can_access_student2 and not can_access_student3:
            print("✅ Teacher1 can access students in their class only")
        else:
            print(f"❌ Teacher1 access check failed: student1={can_access_student1}, student2={can_access_student2}, student3={can_access_student3}")

        # Teacher2 should not be able to access any students (not a class teacher)
        can_access_student1_t2 = await check_teacher_can_access_student(
            self.db, self.teacher2.id, self.student1.id, self.school.id
        )
        can_access_student2_t2 = await check_teacher_can_access_student(
            self.db, self.teacher2.id, self.student2.id, self.school.id
        )
        can_access_student3_t2 = await check_teacher_can_access_student(
            self.db, self.teacher2.id, self.student3.id, self.school.id
        )

        if not can_access_student1_t2 and not can_access_student2_t2 and not can_access_student3_t2:
            print("✅ Teacher2 cannot access students (not a class teacher)")
        else:
            print(f"❌ Teacher2 access check failed: should not access any students")

    async def test_teacher_class_access(self):
        """Test that teachers can only access classes they teach"""
        print("\n🧪 Testing teacher class access...")
        
        # Teacher1 should be able to access class1 (class teacher)
        can_access_class1 = await check_teacher_can_access_class(
            self.db, self.teacher1.id, self.class1.id, self.school.id
        )
        can_access_class2 = await check_teacher_can_access_class(
            self.db, self.teacher1.id, self.class2.id, self.school.id
        )

        if can_access_class1 and not can_access_class2:
            print("✅ Teacher1 can access their assigned class only")
        else:
            print(f"❌ Teacher1 class access failed: class1={can_access_class1}, class2={can_access_class2}")

        # Teacher2 should not be able to access any classes
        can_access_class1_t2 = await check_teacher_can_access_class(
            self.db, self.teacher2.id, self.class1.id, self.school.id
        )
        can_access_class2_t2 = await check_teacher_can_access_class(
            self.db, self.teacher2.id, self.class2.id, self.school.id
        )

        if not can_access_class1_t2 and not can_access_class2_t2:
            print("✅ Teacher2 cannot access classes (not a class teacher)")
        else:
            print(f"❌ Teacher2 class access failed: should not access any classes")

    async def test_teacher_subject_access(self):
        """Test that teachers can only access subjects they teach"""
        print("\n🧪 Testing teacher subject access...")
        
        # Teacher1 should be able to access subject1 (Math) only
        can_access_subject1 = await check_teacher_can_access_subject(
            self.db, self.teacher1.id, self.subject1.id, self.school.id
        )
        can_access_subject2 = await check_teacher_can_access_subject(
            self.db, self.teacher1.id, self.subject2.id, self.school.id
        )

        if can_access_subject1 and not can_access_subject2:
            print("✅ Teacher1 can access their assigned subject only")
        else:
            print(f"❌ Teacher1 subject access failed: subject1={can_access_subject1}, subject2={can_access_subject2}")

        # Teacher2 should be able to access subject2 (English) only
        can_access_subject1_t2 = await check_teacher_can_access_subject(
            self.db, self.teacher2.id, self.subject1.id, self.school.id
        )
        can_access_subject2_t2 = await check_teacher_can_access_subject(
            self.db, self.teacher2.id, self.subject2.id, self.school.id
        )

        if not can_access_subject1_t2 and can_access_subject2_t2:
            print("✅ Teacher2 can access their assigned subject only")
        else:
            print(f"❌ Teacher2 subject access failed: subject1={can_access_subject1_t2}, subject2={can_access_subject2_t2}")

    async def test_teacher_service_methods(self):
        """Test teacher-specific service methods"""
        print("\n🧪 Testing teacher-specific service methods...")
        
        # Test get_teacher_students
        teacher1_students = await StudentService.get_teacher_students(
            self.db, self.teacher1.id, self.school.id
        )
        
        if len(teacher1_students) == 2:
            print("✅ Teacher1 can see 2 students in their class")
        else:
            print(f"❌ Teacher1 should see 2 students, but sees {len(teacher1_students)}")

        teacher2_students = await StudentService.get_teacher_students(
            self.db, self.teacher2.id, self.school.id
        )
        
        if len(teacher2_students) == 0:
            print("✅ Teacher2 cannot see any students (not a class teacher)")
        else:
            print(f"❌ Teacher2 should see 0 students, but sees {len(teacher2_students)}")

        # Test get_teacher_classes
        teacher1_classes = await AcademicService.get_teacher_classes(
            self.db, self.teacher1.id, self.school.id
        )
        
        if len(teacher1_classes) == 1:
            print("✅ Teacher1 can see 1 class they teach")
        else:
            print(f"❌ Teacher1 should see 1 class, but sees {len(teacher1_classes)}")

        # Test get_teacher_subjects
        teacher1_subjects = await AcademicService.get_teacher_subjects(
            self.db, self.teacher1.id, self.school.id
        )
        
        if len(teacher1_subjects) == 1:
            print("✅ Teacher1 can see 1 subject they teach")
        else:
            print(f"❌ Teacher1 should see 1 subject, but sees {len(teacher1_subjects)}")

    async def run_all_tests(self):
        """Run all teacher access restriction tests"""
        print("🚀 Starting Teacher Access Restriction Tests")
        print("=" * 50)
        
        # Setup test data
        if not await self.setup_test_data():
            return False
        
        # Run tests
        await self.test_teacher_student_access()
        await self.test_teacher_class_access()
        await self.test_teacher_subject_access()
        await self.test_teacher_service_methods()
        
        print("\n" + "=" * 50)
        print("✅ Teacher Access Restriction Tests Completed")
        return True

    async def cleanup(self):
        """Clean up test data"""
        if self.db:
            await self.db.close()


async def main():
    """Main test function"""
    test = TeacherAccessTest()
    try:
        success = await test.run_all_tests()
        if success:
            print("\n🎉 All tests completed successfully!")
        else:
            print("\n❌ Some tests failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed: {e}")
        sys.exit(1)
    finally:
        await test.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
