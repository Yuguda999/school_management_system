#!/usr/bin/env python3
"""
Script to create test students for the classroom functionality
"""
import asyncio
import sys
import os
from datetime import date, datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.student import Student, StudentStatus
from app.models.academic import Class
from app.models.user import User, Gender
from app.models.school import School

async def create_test_students():
    """Create test students for the first school"""
    async for db in get_db():
        try:
            print("=== CREATING TEST STUDENTS ===")
            
            # Get the first school
            schools_result = await db.execute(select(School))
            schools = schools_result.scalars().all()
            if not schools:
                print("No schools found!")
                return
                
            school = schools[0]
            print(f"Using school: {school.name} (ID: {school.id})")
            
            # Get classes with assigned teachers
            classes_result = await db.execute(
                select(Class).where(
                    Class.school_id == school.id,
                    Class.teacher_id.isnot(None),
                    Class.is_deleted == False
                )
            )
            classes_with_teachers = classes_result.scalars().all()
            
            if not classes_with_teachers:
                print("No classes with assigned teachers found!")
                return
                
            print(f"Found {len(classes_with_teachers)} classes with teachers:")
            for cls in classes_with_teachers:
                print(f"  - {cls.name} (ID: {cls.id}, Teacher ID: {cls.teacher_id})")
            
            # Create test students for the first class with a teacher
            target_class = classes_with_teachers[0]
            print(f"\nCreating students for class: {target_class.name}")
            
            # Test student data
            test_students = [
                {
                    "admission_number": "STU001",
                    "first_name": "Alice",
                    "last_name": "Johnson",
                    "middle_name": "Marie",
                    "date_of_birth": date(2010, 5, 15),
                    "gender": Gender.FEMALE,
                    "phone": "+1234567890",
                    "email": "alice.johnson@student.school.com",
                    "address_line1": "123 Main Street",
                    "address_line2": "Apt 4B",
                    "city": "Springfield",
                    "state": "Illinois",
                    "postal_code": "62701",
                    "admission_date": date(2024, 1, 15),
                    "current_class_id": target_class.id,
                    "status": StudentStatus.ACTIVE,
                    "guardian_name": "Mary Johnson",
                    "guardian_phone": "+1234567891",
                    "guardian_email": "mary.johnson@email.com",
                    "guardian_relationship": "Mother",
                    "emergency_contact_name": "John Johnson",
                    "emergency_contact_phone": "+1234567892",
                    "emergency_contact_relationship": "Father",
                    "medical_conditions": "None",
                    "allergies": "Peanuts",
                    "blood_group": "A+",
                    "school_id": school.id
                },
                {
                    "admission_number": "STU002",
                    "first_name": "Bob",
                    "last_name": "Smith",
                    "middle_name": "William",
                    "date_of_birth": date(2010, 8, 22),
                    "gender": Gender.MALE,
                    "phone": "+1234567893",
                    "email": "bob.smith@student.school.com",
                    "address_line1": "456 Oak Avenue",
                    "city": "Springfield",
                    "state": "Illinois",
                    "postal_code": "62702",
                    "admission_date": date(2024, 1, 20),
                    "current_class_id": target_class.id,
                    "status": StudentStatus.ACTIVE,
                    "guardian_name": "Sarah Smith",
                    "guardian_phone": "+1234567894",
                    "guardian_email": "sarah.smith@email.com",
                    "guardian_relationship": "Mother",
                    "emergency_contact_name": "David Smith",
                    "emergency_contact_phone": "+1234567895",
                    "emergency_contact_relationship": "Father",
                    "medical_conditions": "Asthma",
                    "allergies": "None",
                    "blood_group": "B+",
                    "school_id": school.id
                },
                {
                    "admission_number": "STU003",
                    "first_name": "Carol",
                    "last_name": "Davis",
                    "date_of_birth": date(2010, 12, 3),
                    "gender": Gender.FEMALE,
                    "phone": "+1234567896",
                    "email": "carol.davis@student.school.com",
                    "address_line1": "789 Pine Road",
                    "city": "Springfield",
                    "state": "Illinois",
                    "postal_code": "62703",
                    "admission_date": date(2024, 2, 1),
                    "current_class_id": target_class.id,
                    "status": StudentStatus.ACTIVE,
                    "guardian_name": "Linda Davis",
                    "guardian_phone": "+1234567897",
                    "guardian_email": "linda.davis@email.com",
                    "guardian_relationship": "Mother",
                    "emergency_contact_name": "Robert Davis",
                    "emergency_contact_phone": "+1234567898",
                    "emergency_contact_relationship": "Father",
                    "medical_conditions": "None",
                    "allergies": "Shellfish",
                    "blood_group": "O+",
                    "school_id": school.id
                }
            ]
            
            created_students = []
            for student_data in test_students:
                # Check if student already exists
                existing_result = await db.execute(
                    select(Student).where(
                        Student.admission_number == student_data["admission_number"],
                        Student.school_id == school.id,
                        Student.is_deleted == False
                    )
                )
                existing_student = existing_result.scalar_one_or_none()
                
                if existing_student:
                    print(f"Student {student_data['admission_number']} already exists, skipping...")
                    continue
                
                # Create new student
                student = Student(**student_data)
                db.add(student)
                created_students.append(student)
                print(f"Created student: {student.first_name} {student.last_name} ({student.admission_number})")
            
            if created_students:
                await db.commit()
                print(f"\nSuccessfully created {len(created_students)} students!")
                
                # Verify creation
                verification_result = await db.execute(
                    select(Student).where(
                        Student.current_class_id == target_class.id,
                        Student.is_deleted == False
                    )
                )
                students_in_class = verification_result.scalars().all()
                print(f"Total students now in class {target_class.name}: {len(students_in_class)}")
            else:
                print("No new students were created (all already exist)")
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(create_test_students())
