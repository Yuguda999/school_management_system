#!/usr/bin/env python3
"""
Script to test API responses for students and subjects
"""
import asyncio
import sys
import os
import json

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.services.student_service import StudentService
from app.services.academic_service import AcademicService
from app.models.user import User
from app.models.school import School

async def test_api_responses():
    """Test API responses for students and subjects"""
    async for db in get_db():
        try:
            print("=== TESTING API RESPONSES ===")
            
            # Get the first school
            schools_result = await db.execute(select(School))
            schools = schools_result.scalars().all()
            if not schools:
                print("No schools found!")
                return
                
            school = schools[0]
            print(f"School: {school.name}")
            
            # Get John Teacher who is a class teacher
            teacher_result = await db.execute(
                select(User).where(
                    User.id == '19ac95b3-067f-468c-a564-1bec616e886f',
                    User.school_id == school.id,
                    User.role == 'teacher'
                )
            )
            teacher = teacher_result.scalar_one_or_none()
            
            if not teacher:
                print("Teacher not found!")
                return
                
            print(f"Teacher: {teacher.full_name}")
            
            # Test student API response
            print("\n=== TESTING STUDENT API ===")
            class_id = '3f4272a1-3617-4fa3-8693-c8c0532627e2'  # SS1A-f63c891a
            
            # Test as teacher
            students = await StudentService.get_teacher_students(
                db=db,
                teacher_id=teacher.id,
                school_id=school.id,
                class_id=class_id,
                skip=0,
                limit=100
            )
            
            print(f"Students found for teacher: {len(students)}")
            for student in students:
                print(f"  - {student.first_name} {student.last_name} (ID: {student.id})")
                print(f"    Email: {student.email}")
                print(f"    Admission Number: {student.admission_number}")
                print(f"    Status: {student.status}")
                print(f"    Class ID: {student.current_class_id}")
            
            # Test subject API response
            print("\n=== TESTING SUBJECT API ===")
            from app.services.teacher_subject_service import ClassSubjectService
            class_subjects = await ClassSubjectService.get_class_subjects(
                db=db,
                class_id=class_id,
                school_id=school.id
            )
            
            print(f"Class subjects found: {len(class_subjects)}")
            for cs in class_subjects:
                print(f"  - Class Subject ID: {cs.id}")
                print(f"    Subject ID: {cs.subject_id}")
                print(f"    Subject Name: {cs.subject_name}")
                print(f"    Subject Code: {cs.subject_code}")
                print(f"    Is Core: {cs.is_core}")
                print(f"    Class Name: {cs.class_name}")
                print()
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(test_api_responses())
