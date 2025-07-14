#!/usr/bin/env python3
"""
Debug script to check student and class data
"""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.student import Student
from app.models.academic import Class
from app.models.user import User
from app.models.school import School

async def debug_students_and_classes():
    """Debug function to check students and classes"""
    async for db in get_db():
        try:
            print("=== DEBUGGING STUDENTS AND CLASSES ===")
            
            # Get all schools
            schools_result = await db.execute(select(School))
            schools = schools_result.scalars().all()
            print(f"\nFound {len(schools)} schools:")
            for school in schools:
                print(f"  - {school.name} (ID: {school.id})")
            
            if not schools:
                print("No schools found!")
                return
                
            school = schools[0]  # Use first school
            print(f"\nUsing school: {school.name}")
            
            # Get all classes in this school
            classes_result = await db.execute(
                select(Class).where(
                    Class.school_id == school.id,
                    Class.is_deleted == False
                )
            )
            classes = classes_result.scalars().all()
            print(f"\nFound {len(classes)} classes:")
            for cls in classes:
                print(f"  - {cls.name} (ID: {cls.id}, Teacher ID: {cls.teacher_id})")
                
                # Get students in this class
                students_result = await db.execute(
                    select(Student).where(
                        Student.current_class_id == cls.id,
                        Student.is_deleted == False
                    )
                )
                students = students_result.scalars().all()
                print(f"    Students in class: {len(students)}")
                for student in students:
                    print(f"      - {student.first_name} {student.last_name} (ID: {student.id})")
            
            # Get all teachers
            teachers_result = await db.execute(
                select(User).where(
                    User.school_id == school.id,
                    User.role == 'teacher',
                    User.is_deleted == False
                )
            )
            teachers = teachers_result.scalars().all()
            print(f"\nFound {len(teachers)} teachers:")
            for teacher in teachers:
                print(f"  - {teacher.full_name} (ID: {teacher.id})")
                
                # Check which classes this teacher teaches
                teacher_classes_result = await db.execute(
                    select(Class).where(
                        Class.teacher_id == teacher.id,
                        Class.school_id == school.id,
                        Class.is_deleted == False
                    )
                )
                teacher_classes = teacher_classes_result.scalars().all()
                print(f"    Classes as class teacher: {len(teacher_classes)}")
                for cls in teacher_classes:
                    print(f"      - {cls.name}")
            
            # Get all students
            all_students_result = await db.execute(
                select(Student).where(
                    Student.school_id == school.id,
                    Student.is_deleted == False
                )
            )
            all_students = all_students_result.scalars().all()
            print(f"\nTotal students in school: {len(all_students)}")
            for student in all_students:
                print(f"  - {student.first_name} {student.last_name} (Class ID: {student.current_class_id})")
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(debug_students_and_classes())
