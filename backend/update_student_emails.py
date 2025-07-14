#!/usr/bin/env python3
"""
Script to update student emails
"""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import get_db
from app.models.student import Student
from app.models.school import School

async def update_student_emails():
    """Update student emails"""
    async for db in get_db():
        try:
            print("=== UPDATING STUDENT EMAILS ===")
            
            # Get the first school
            schools_result = await db.execute(select(School))
            schools = schools_result.scalars().all()
            if not schools:
                print("No schools found!")
                return
                
            school = schools[0]
            print(f"School: {school.name}")
            
            # Get students in the test class
            class_id = '3f4272a1-3617-4fa3-8693-c8c0532627e2'  # SS1A-f63c891a
            students_result = await db.execute(
                select(Student).where(
                    Student.current_class_id == class_id,
                    Student.school_id == school.id,
                    Student.is_deleted == False
                )
            )
            students = students_result.scalars().all()
            
            print(f"Found {len(students)} students to update")
            
            # Update emails
            email_updates = {
                'STU001': 'alice.johnson@student.school.com',
                'STU002': 'bob.smith@student.school.com', 
                'STU003': 'carol.davis@student.school.com'
            }
            
            for student in students:
                if student.admission_number in email_updates:
                    new_email = email_updates[student.admission_number]
                    await db.execute(
                        update(Student)
                        .where(Student.id == student.id)
                        .values(email=new_email)
                    )
                    print(f"Updated {student.first_name} {student.last_name} email to {new_email}")
            
            await db.commit()
            print("Successfully updated student emails!")
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(update_student_emails())
