#!/usr/bin/env python3
"""
Create a second test school and assign ownership to the test school owner
for testing school switching functionality.
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Add the backend directory to the path
sys.path.append('backend')

from app.core.database import AsyncSessionLocal
from app.models.school import School
from app.models.user import User, UserRole
from app.models.school_ownership import SchoolOwnership


async def create_second_test_school():
    """Create a second test school for the test school owner"""
    async with AsyncSessionLocal() as db:
        try:
            print("🏫 Creating Second Test School")
            print("=" * 40)
            
            # Find the test school owner
            result = await db.execute(
                select(User).where(
                    User.email == "testowner@school.com",
                    User.is_deleted == False
                )
            )
            test_owner = result.scalar_one_or_none()
            
            if not test_owner:
                print("❌ Test school owner not found! Please run create_test_school_owner.py first.")
                return False
            
            print(f"✅ Found test school owner: {test_owner.full_name}")
            
            # Check if second school already exists
            result = await db.execute(
                select(School).where(
                    School.code == "TEST002",
                    School.is_deleted == False
                )
            )
            existing_school = result.scalar_one_or_none()
            
            if existing_school:
                print(f"✅ Second test school already exists: {existing_school.name}")
                
                # Check if ownership exists
                ownership_result = await db.execute(
                    select(SchoolOwnership).where(
                        SchoolOwnership.user_id == test_owner.id,
                        SchoolOwnership.school_id == existing_school.id,
                        SchoolOwnership.is_active == True
                    )
                )
                ownership = ownership_result.scalar_one_or_none()
                
                if ownership:
                    print("✅ Ownership already exists")
                else:
                    print("🔗 Creating ownership...")
                    ownership = SchoolOwnership(
                        user_id=test_owner.id,
                        school_id=existing_school.id,
                        is_primary_owner=False,
                        is_active=True,
                        can_manage_billing=True,
                        can_manage_users=True,
                        can_manage_settings=True
                    )
                    db.add(ownership)
                    await db.commit()
                    print("✅ Ownership created")
                
                return True
            
            # Create second test school
            second_school = School(
                name="Second Test School",
                code="TEST002",
                email="second@testschool.com",
                phone="+1234567891",
                website="https://secondtest.school.com",
                address_line1="456 Second Street",
                address_line2="Building B",
                city="Test City",
                state="Test State",
                postal_code="12346",
                country="Nigeria",
                description="Second test school for multi-school testing",
                motto="Excellence in Education",
                established_year="2024",
                current_session="2024/2025",
                current_term="First Term",
                is_active=True,
                is_verified=True,
                subscription_plan="trial",
                subscription_status="trial",
                trial_days=30
            )
            
            db.add(second_school)
            await db.flush()  # Get the ID
            
            print(f"📚 Created second school: {second_school.name} (ID: {second_school.id})")
            
            # Create ownership for the test school owner
            ownership = SchoolOwnership(
                user_id=test_owner.id,
                school_id=second_school.id,
                is_primary_owner=False,  # Not primary since they already own another school
                is_active=True,
                can_manage_billing=True,
                can_manage_users=True,
                can_manage_settings=True
            )
            
            db.add(ownership)
            await db.commit()
            await db.refresh(second_school)
            
            print(f"\n🎉 SUCCESS! Second test school created!")
            print("=" * 40)
            print(f"School ID: {second_school.id}")
            print(f"School Name: {second_school.name}")
            print(f"School Code: {second_school.code}")
            print(f"Owner: {test_owner.full_name}")
            print(f"Created: {second_school.created_at}")
            
            print(f"\n🔄 Now you can test school switching:")
            print(f"1. Login with testowner@school.com / testpassword123")
            print(f"2. You should see both schools in the selection")
            print(f"3. Switch between schools and verify data isolation")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating second test school: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()


async def main():
    """Main function"""
    try:
        success = await create_second_test_school()
        if success:
            print("\n✅ Second test school setup complete!")
        else:
            print("\n❌ Failed to create second test school")
            return 1
        
    except Exception as e:
        print(f"\n❌ Failed to create second test school: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
