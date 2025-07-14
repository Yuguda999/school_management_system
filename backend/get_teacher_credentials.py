#!/usr/bin/env python3
"""
Script to get teacher credentials for testing
"""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.models.school import School

async def get_teacher_credentials():
    """Get teacher credentials for testing"""
    async for db in get_db():
        try:
            print("=== TEACHER CREDENTIALS ===")
            
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
            
            if teacher:
                print(f"\nClass Teacher: {teacher.full_name}")
                print(f"Email: {teacher.email}")
                print(f"ID: {teacher.id}")
                print(f"Role: {teacher.role}")
                print(f"Is Active: {teacher.is_active}")
                print(f"Profile Completed: {teacher.profile_completed}")
                
                # Note: We can't see the actual password as it's hashed
                # But based on the user's memory, teachers use their email and firstname as password
                print(f"\nSuggested login credentials:")
                print(f"Email: {teacher.email}")
                print(f"Password: {teacher.first_name} (based on user's memory)")
            else:
                print("Teacher not found!")
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(get_teacher_credentials())
