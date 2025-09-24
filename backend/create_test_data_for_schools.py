#!/usr/bin/env python3
"""
Create test data for both schools to demonstrate data isolation
when switching between schools.
"""

import asyncio
import sys
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.school import School
from app.models.student import Student, StudentStatus, Gender
from app.models.academic import Class, ClassLevel


async def create_test_data():
    """Create test data for both schools"""
    async with AsyncSessionLocal() as db:
        try:
            print("📚 Creating Test Data for Schools")
            print("=" * 50)
            
            # Get both schools
            schools_result = await db.execute(
                select(School).where(
                    School.code.in_(["TEST001", "TEST002"]),
                    School.is_deleted == False
                )
            )
            schools = schools_result.scalars().all()
            
            if len(schools) != 2:
                print(f"❌ Expected 2 schools, found {len(schools)}")
                return False
            
            school1 = next(s for s in schools if s.code == "TEST001")
            school2 = next(s for s in schools if s.code == "TEST002")
            
            print(f"🏫 School 1: {school1.name} (ID: {school1.id})")
            print(f"🏫 School 2: {school2.name} (ID: {school2.id})")
            
            # Create classes for each school
            for school in schools:
                print(f"\n📖 Creating classes for {school.name}...")
                
                # Check if classes already exist
                existing_classes = await db.execute(
                    select(Class).where(
                        Class.school_id == school.id,
                        Class.is_deleted == False
                    )
                )
                if existing_classes.scalars().first():
                    print(f"   Classes already exist for {school.name}")
                    continue
                
                # Create classes
                classes_data = [
                    {"name": "Grade 1A", "level": ClassLevel.PRIMARY_1, "capacity": 30},
                    {"name": "Grade 2A", "level": ClassLevel.PRIMARY_2, "capacity": 30},
                    {"name": "Grade 3A", "level": ClassLevel.PRIMARY_3, "capacity": 30},
                ]
                
                for class_data in classes_data:
                    new_class = Class(
                        name=class_data["name"],
                        level=class_data["level"],
                        capacity=class_data["capacity"],
                        academic_session=school.current_session,
                        is_active=True,
                        school_id=school.id
                    )
                    db.add(new_class)
                    print(f"   Created class: {class_data['name']}")
                
                await db.flush()
            
            # Create students for each school
            for i, school in enumerate(schools, 1):
                print(f"\n👥 Creating students for {school.name}...")
                
                # Check if students already exist
                existing_students = await db.execute(
                    select(Student).where(
                        Student.school_id == school.id,
                        Student.is_deleted == False
                    )
                )
                if existing_students.scalars().first():
                    print(f"   Students already exist for {school.name}")
                    continue
                
                # Get a class for this school
                class_result = await db.execute(
                    select(Class).where(
                        Class.school_id == school.id,
                        Class.is_deleted == False
                    ).limit(1)
                )
                target_class = class_result.scalar_one_or_none()
                
                if not target_class:
                    print(f"   No class found for {school.name}, skipping students")
                    continue
                
                # Create students with different names for each school
                if i == 1:  # First school
                    students_data = [
                        {
                            "admission_number": "SCH1-001",
                            "first_name": "Alice",
                            "last_name": "Johnson",
                            "gender": Gender.FEMALE,
                            "date_of_birth": date(2015, 3, 15),
                        },
                        {
                            "admission_number": "SCH1-002",
                            "first_name": "Bob",
                            "last_name": "Smith",
                            "gender": Gender.MALE,
                            "date_of_birth": date(2015, 7, 22),
                        },
                        {
                            "admission_number": "SCH1-003",
                            "first_name": "Carol",
                            "last_name": "Davis",
                            "gender": Gender.FEMALE,
                            "date_of_birth": date(2015, 11, 8),
                        },
                    ]
                else:  # Second school
                    students_data = [
                        {
                            "admission_number": "SCH2-001",
                            "first_name": "David",
                            "last_name": "Wilson",
                            "gender": Gender.MALE,
                            "date_of_birth": date(2015, 2, 10),
                        },
                        {
                            "admission_number": "SCH2-002",
                            "first_name": "Emma",
                            "last_name": "Brown",
                            "gender": Gender.FEMALE,
                            "date_of_birth": date(2015, 6, 18),
                        },
                        {
                            "admission_number": "SCH2-003",
                            "first_name": "Frank",
                            "last_name": "Miller",
                            "gender": Gender.MALE,
                            "date_of_birth": date(2015, 9, 25),
                        },
                    ]
                
                for student_data in students_data:
                    student = Student(
                        admission_number=student_data["admission_number"],
                        first_name=student_data["first_name"],
                        last_name=student_data["last_name"],
                        gender=student_data["gender"],
                        date_of_birth=student_data["date_of_birth"],
                        admission_date=date(2024, 1, 15),
                        current_class_id=target_class.id,
                        status=StudentStatus.ACTIVE,
                        address_line1="123 Test Street",
                        city="Test City",
                        state="Test State",
                        postal_code="12345",
                        school_id=school.id
                    )
                    db.add(student)
                    print(f"   Created student: {student.first_name} {student.last_name} ({student.admission_number})")
            
            await db.commit()
            
            print(f"\n🎉 SUCCESS! Test data created for both schools!")
            print("=" * 50)
            print("Now you can test school switching and see different data:")
            print("1. Login with testowner@school.com / testpassword123")
            print("2. Switch between schools")
            print("3. Check students list - should show different students for each school")
            print("4. Verify complete data isolation")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating test data: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()


async def main():
    """Main function"""
    try:
        success = await create_test_data()
        if success:
            print("\n✅ Test data creation complete!")
        else:
            print("\n❌ Failed to create test data")
            return 1
        
    except Exception as e:
        print(f"\n❌ Failed to create test data: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
