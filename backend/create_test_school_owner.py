#!/usr/bin/env python3
"""
Create a test school owner for testing the multi-school functionality
"""

import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.school import School
from app.models.school_ownership import SchoolOwnership
from app.core.security import get_password_hash


async def create_test_school_owner():
    """Create a test school owner with known credentials"""
    async with AsyncSessionLocal() as db:
        try:
            print("🏫 Creating Test School Owner")
            print("=" * 40)
            
            # Check if test user already exists
            result = await db.execute(
                select(User).where(
                    User.email == "testowner@school.com",
                    User.is_deleted == False
                )
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"✅ Test school owner already exists!")
                print(f"Email: testowner@school.com")
                print(f"Password: testpassword123")
                print(f"Role: {existing_user.role}")
                return
            
            # Get first school for testing
            schools_result = await db.execute(
                select(School).where(School.is_deleted == False).limit(1)
            )
            school = schools_result.scalar_one_or_none()
            
            if not school:
                print("❌ No schools found! Please create a school first.")
                return
            
            print(f"📚 Using school: {school.name} (ID: {school.id})")
            
            # Create test school owner
            test_owner = User(
                email="testowner@school.com",
                password_hash=get_password_hash("testpassword123"),
                first_name="Test",
                last_name="Owner",
                phone="+1234567890",
                role=UserRole.SCHOOL_OWNER,
                school_id=school.id,  # Set initial school
                is_active=True,
                is_verified=True,
                profile_completed=True
            )
            
            db.add(test_owner)
            await db.flush()  # Get the user ID
            
            # Create school ownership record
            ownership = SchoolOwnership(
                user_id=test_owner.id,
                school_id=school.id,
                is_primary_owner=True,
                is_active=True,
                can_manage_billing=True,
                can_manage_users=True,
                can_manage_settings=True,
                granted_by=test_owner.id  # Self-granted for test
            )
            
            db.add(ownership)
            await db.commit()
            await db.refresh(test_owner)
            
            print(f"\n🎉 SUCCESS! Test school owner created!")
            print("=" * 40)
            print(f"User ID: {test_owner.id}")
            print(f"Email: testowner@school.com")
            print(f"Password: testpassword123")
            print(f"Role: {test_owner.role}")
            print(f"School: {school.name}")
            print(f"Created: {test_owner.created_at}")
            
            print(f"\n🔑 Login Credentials:")
            print(f"Email: testowner@school.com")
            print(f"Password: testpassword123")
            print(f"API Login URL: http://localhost:8000/api/v1/auth/login")
            print(f"Frontend URL: http://localhost:3001/login")
            
        except Exception as e:
            print(f"❌ Error creating test school owner: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()


async def main():
    """Main function"""
    try:
        await create_test_school_owner()
        print("\n✅ Test school owner setup complete!")
        print("\nYou can now test the multi-school functionality:")
        print("1. Login with testowner@school.com / testpassword123")
        print("2. You should see the school selection modal")
        print("3. Test adding additional schools from settings")
        
    except Exception as e:
        print(f"\n❌ Failed to create test school owner: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
