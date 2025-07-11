#!/usr/bin/env python3
"""
Script to create test classes for the school management system.
This script will help populate the database with sample classes for testing.
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.academic import Class, ClassLevel
from app.models.school import School
from app.schemas.academic import ClassCreate
from app.services.academic_service import AcademicService


async def create_test_classes():
    """Create test classes for the school management system."""
    print("Creating test classes...")

    async with AsyncSessionLocal() as db:
        try:
            # Get the first school (assuming there's at least one school)
            from sqlalchemy import select
            result = await db.execute(select(School).where(School.is_deleted == False))
            school = result.scalars().first()
            
            if not school:
                print("❌ No school found. Please create a school first.")
                return False
            
            print(f"✓ Found school: {school.name}")
            
            # Define test classes
            test_classes = [
                {
                    "name": "Nursery 1",
                    "level": ClassLevel.NURSERY_1,
                    "section": "A",
                    "capacity": 20,
                    "academic_session": "2023/2024",
                    "description": "Nursery 1 - Section A"
                },
                {
                    "name": "Nursery 2",
                    "level": ClassLevel.NURSERY_2,
                    "section": "A",
                    "capacity": 20,
                    "academic_session": "2023/2024",
                    "description": "Nursery 2 - Section A"
                },
                {
                    "name": "Primary 1",
                    "level": ClassLevel.PRIMARY_1,
                    "section": "A",
                    "capacity": 25,
                    "academic_session": "2023/2024",
                    "description": "Primary 1 - Section A"
                },
                {
                    "name": "Primary 2",
                    "level": ClassLevel.PRIMARY_2,
                    "section": "A",
                    "capacity": 25,
                    "academic_session": "2023/2024",
                    "description": "Primary 2 - Section A"
                },
                {
                    "name": "Primary 3",
                    "level": ClassLevel.PRIMARY_3,
                    "section": "A",
                    "capacity": 30,
                    "academic_session": "2023/2024",
                    "description": "Primary 3 - Section A"
                },
                {
                    "name": "Primary 4",
                    "level": ClassLevel.PRIMARY_4,
                    "section": "A",
                    "capacity": 30,
                    "academic_session": "2023/2024",
                    "description": "Primary 4 - Section A"
                },
                {
                    "name": "Primary 5",
                    "level": ClassLevel.PRIMARY_5,
                    "section": "A",
                    "capacity": 30,
                    "academic_session": "2023/2024",
                    "description": "Primary 5 - Section A"
                },
                {
                    "name": "Primary 6",
                    "level": ClassLevel.PRIMARY_6,
                    "section": "A",
                    "capacity": 30,
                    "academic_session": "2023/2024",
                    "description": "Primary 6 - Section A"
                },
                {
                    "name": "JSS 1",
                    "level": ClassLevel.JSS_1,
                    "section": "A",
                    "capacity": 35,
                    "academic_session": "2023/2024",
                    "description": "Junior Secondary School 1 - Section A"
                },
                {
                    "name": "JSS 2",
                    "level": ClassLevel.JSS_2,
                    "section": "A",
                    "capacity": 35,
                    "academic_session": "2023/2024",
                    "description": "Junior Secondary School 2 - Section A"
                },
                {
                    "name": "JSS 3",
                    "level": ClassLevel.JSS_3,
                    "section": "A",
                    "capacity": 35,
                    "academic_session": "2023/2024",
                    "description": "Junior Secondary School 3 - Section A"
                },
                {
                    "name": "SS 1",
                    "level": ClassLevel.SS_1,
                    "section": "A",
                    "capacity": 40,
                    "academic_session": "2023/2024",
                    "description": "Senior Secondary School 1 - Section A"
                },
                {
                    "name": "SS 2",
                    "level": ClassLevel.SS_2,
                    "section": "A",
                    "capacity": 40,
                    "academic_session": "2023/2024",
                    "description": "Senior Secondary School 2 - Section A"
                },
                {
                    "name": "SS 3",
                    "level": ClassLevel.SS_3,
                    "section": "A",
                    "capacity": 40,
                    "academic_session": "2023/2024",
                    "description": "Senior Secondary School 3 - Section A"
                }
            ]
            
            created_count = 0
            
            for class_data in test_classes:
                try:
                    # Check if class already exists
                    existing_result = await db.execute(
                        select(Class).where(
                            Class.name == class_data["name"],
                            Class.academic_session == class_data["academic_session"],
                            Class.school_id == school.id,
                            Class.is_deleted == False
                        )
                    )
                    
                    if existing_result.scalar_one_or_none():
                        print(f"⚠️  Class '{class_data['name']}' already exists, skipping...")
                        continue
                    
                    # Create the class using the service
                    class_create = ClassCreate(**class_data)
                    new_class = await AcademicService.create_class(db, class_create, school.id)
                    
                    print(f"✓ Created class: {new_class.name}")
                    created_count += 1
                    
                except Exception as e:
                    print(f"❌ Failed to create class '{class_data['name']}': {e}")
                    continue
            
            print(f"\n🎉 Successfully created {created_count} classes!")
            return True
            
        except Exception as e:
            print(f"❌ Error creating test classes: {e}")
            return False


async def main():
    """Main function."""
    print("🏫 School Management System - Test Classes Creator")
    print("=" * 60)
    
    success = await create_test_classes()
    
    if success:
        print("\n✅ Test classes created successfully!")
        print("You can now use the fee management system with these classes.")
    else:
        print("\n❌ Failed to create test classes.")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
