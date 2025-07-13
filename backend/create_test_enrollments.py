"""
Script to create test enrollments for students in subjects.
This will help demonstrate the teacher-subject-student relationship.
"""

import asyncio
import sys
import os
from datetime import date

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.core.database import AsyncSessionLocal
from app.models.student import Student
from app.models.academic import Subject, Term, Enrollment
from app.models.user import User, UserRole


async def create_test_enrollments():
    """Create test enrollments for students in subjects"""
    async with AsyncSessionLocal() as db:
        try:
            print("🚀 Creating test enrollments...")
            
            # Get the first school
            school_result = await db.execute(
                text("SELECT id FROM schools WHERE is_deleted = false LIMIT 1")
            )
            school_id = school_result.scalar_one_or_none()
            
            if not school_id:
                print("❌ No school found")
                return
            
            print(f"✅ Using school: {school_id}")
            
            # Get current term
            term_result = await db.execute(
                text("SELECT id FROM terms WHERE school_id = :school_id AND is_current = true LIMIT 1"),
                {"school_id": school_id}
            )
            term_id = term_result.scalar_one_or_none()
            
            if not term_id:
                # Create a default term
                term_id = "default-term-id"
                await db.execute(
                    text("""
                        INSERT INTO terms (id, name, type, academic_session, start_date, end_date,
                                         is_current, is_active, school_id, is_deleted, created_at, updated_at)
                        VALUES (:id, :name, :type, :session, :start_date, :end_date,
                               :is_current, :is_active, :school_id, :is_deleted, :created_at, :updated_at)
                    """),
                    {
                        "id": term_id,
                        "name": "First Term",
                        "type": "first_term",
                        "session": "2024-2025",
                        "start_date": "2024-09-01",
                        "end_date": "2024-12-15",
                        "is_current": True,
                        "is_active": True,
                        "school_id": school_id,
                        "is_deleted": False,
                        "created_at": "2024-01-01T00:00:00",
                        "updated_at": "2024-01-01T00:00:00"
                    }
                )
                print(f"✅ Created default term: {term_id}")
            
            # Get all students
            students_result = await db.execute(
                text("SELECT id, current_class_id FROM students WHERE school_id = :school_id AND is_deleted = false"),
                {"school_id": school_id}
            )
            students = students_result.fetchall()
            
            if not students:
                print("❌ No students found")
                return
            
            print(f"✅ Found {len(students)} students")
            
            # Get all subjects
            subjects_result = await db.execute(
                text("SELECT id, name FROM subjects WHERE school_id = :school_id AND is_deleted = false"),
                {"school_id": school_id}
            )
            subjects = subjects_result.fetchall()
            
            if not subjects:
                print("❌ No subjects found")
                return
            
            print(f"✅ Found {len(subjects)} subjects")
            
            # Create enrollments for each student in each subject
            enrollment_count = 0
            for student in students:
                for subject in subjects:
                    # Check if enrollment already exists
                    existing_result = await db.execute(
                        text("""
                            SELECT id FROM enrollments 
                            WHERE student_id = :student_id 
                            AND subject_id = :subject_id 
                            AND term_id = :term_id
                            AND school_id = :school_id
                        """),
                        {
                            "student_id": student.id,
                            "subject_id": subject.id,
                            "term_id": term_id,
                            "school_id": school_id
                        }
                    )
                    
                    if existing_result.scalar_one_or_none():
                        continue  # Skip if enrollment already exists
                    
                    # Create enrollment
                    enrollment_id = f"enroll-{student.id[:8]}-{subject.id[:8]}"
                    await db.execute(
                        text("""
                            INSERT INTO enrollments (id, student_id, class_id, subject_id, term_id, 
                                                   school_id, enrollment_date, is_active, 
                                                   created_at, updated_at, is_deleted)
                            VALUES (:id, :student_id, :class_id, :subject_id, :term_id, 
                                   :school_id, :enrollment_date, :is_active, 
                                   :created_at, :updated_at, :is_deleted)
                        """),
                        {
                            "id": enrollment_id,
                            "student_id": student.id,
                            "class_id": student.current_class_id,
                            "subject_id": subject.id,
                            "term_id": term_id,
                            "school_id": school_id,
                            "enrollment_date": "2024-09-01",
                            "is_active": True,
                            "created_at": "2024-01-01T00:00:00",
                            "updated_at": "2024-01-01T00:00:00",
                            "is_deleted": False
                        }
                    )
                    enrollment_count += 1
            
            await db.commit()
            print(f"✅ Created {enrollment_count} enrollments")
            
            # Show summary
            print("\n📊 Summary:")
            for subject in subjects:
                count_result = await db.execute(
                    text("""
                        SELECT COUNT(*) FROM enrollments 
                        WHERE subject_id = :subject_id 
                        AND school_id = :school_id 
                        AND is_active = true
                    """),
                    {"subject_id": subject.id, "school_id": school_id}
                )
                count = count_result.scalar() or 0
                print(f"  📚 {subject.name}: {count} students enrolled")
            
            print("\n🎉 Test enrollments created successfully!")
            
        except Exception as e:
            print(f"❌ Error creating test enrollments: {e}")
            await db.rollback()
        finally:
            await db.close()


if __name__ == "__main__":
    asyncio.run(create_test_enrollments())
