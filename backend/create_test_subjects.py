#!/usr/bin/env python3
"""
Script to create test subjects and assign them to classes
"""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.academic import Subject, Class, class_subject_association
from app.models.school import School

async def create_test_subjects():
    """Create test subjects and assign them to classes"""
    async for db in get_db():
        try:
            print("=== CREATING TEST SUBJECTS ===")
            
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
                
            target_class = classes_with_teachers[0]
            print(f"Creating subjects for class: {target_class.name}")
            
            # Test subject data
            test_subjects = [
                {
                    "name": "Mathematics",
                    "code": "MATH101",
                    "description": "Basic mathematics including algebra and geometry",
                    "is_core": True,
                    "credit_units": 3,
                    "is_active": True,
                    "school_id": school.id
                },
                {
                    "name": "English Language",
                    "code": "ENG101", 
                    "description": "English language and literature",
                    "is_core": True,
                    "credit_units": 3,
                    "is_active": True,
                    "school_id": school.id
                },
                {
                    "name": "Science",
                    "code": "SCI101",
                    "description": "General science including physics, chemistry, and biology",
                    "is_core": True,
                    "credit_units": 4,
                    "is_active": True,
                    "school_id": school.id
                },
                {
                    "name": "Social Studies",
                    "code": "SOC101",
                    "description": "History, geography, and civic education",
                    "is_core": True,
                    "credit_units": 2,
                    "is_active": True,
                    "school_id": school.id
                },
                {
                    "name": "Physical Education",
                    "code": "PE101",
                    "description": "Physical fitness and sports activities",
                    "is_core": False,
                    "credit_units": 1,
                    "is_active": True,
                    "school_id": school.id
                }
            ]
            
            created_subjects = []
            for subject_data in test_subjects:
                # Check if subject already exists
                existing_result = await db.execute(
                    select(Subject).where(
                        Subject.code == subject_data["code"],
                        Subject.school_id == school.id,
                        Subject.is_deleted == False
                    )
                )
                existing_subject = existing_result.scalar_one_or_none()
                
                if existing_subject:
                    print(f"Subject {subject_data['code']} already exists, using existing...")
                    created_subjects.append(existing_subject)
                    continue
                
                # Create new subject
                subject = Subject(**subject_data)
                db.add(subject)
                await db.flush()  # Flush to get the ID
                created_subjects.append(subject)
                print(f"Created subject: {subject.name} ({subject.code})")
            
            # Assign subjects to the class
            print(f"\nAssigning subjects to class: {target_class.name}")
            for subject in created_subjects:
                # Check if class-subject assignment already exists
                existing_assignment_result = await db.execute(
                    select(class_subject_association).where(
                        class_subject_association.c.class_id == target_class.id,
                        class_subject_association.c.subject_id == subject.id,
                        class_subject_association.c.is_deleted == False
                    )
                )
                existing_assignment = existing_assignment_result.fetchone()

                if existing_assignment:
                    print(f"  - {subject.name} already assigned to class, skipping...")
                    continue

                # Create class-subject assignment
                import uuid
                import datetime
                assignment_id = str(uuid.uuid4())
                now = datetime.datetime.utcnow().isoformat()

                await db.execute(
                    class_subject_association.insert().values(
                        id=assignment_id,
                        class_id=target_class.id,
                        subject_id=subject.id,
                        school_id=school.id,
                        is_core=subject.is_core,
                        created_at=now,
                        updated_at=now,
                        is_deleted=False
                    )
                )
                print(f"  - Assigned {subject.name} to class")
            
            await db.commit()
            print(f"\nSuccessfully created and assigned subjects!")
            
            # Verify assignments
            verification_result = await db.execute(
                select(class_subject_association).where(
                    class_subject_association.c.class_id == target_class.id,
                    class_subject_association.c.is_deleted == False
                )
            )
            class_subjects = verification_result.fetchall()
            print(f"Total subjects now assigned to class {target_class.name}: {len(class_subjects)}")
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(create_test_subjects())
