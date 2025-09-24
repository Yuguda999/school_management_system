#!/usr/bin/env python3
"""
Create Platform Super Admin - ONE TIME ONLY
This script creates the platform owner who can oversee the entire platform.
Should only be run ONCE during initial platform setup.

Usage:
  cd backend
  python ../create_platform_admin.py
"""

import asyncio
import sys
import os
from getpass import getpass

# Add the current directory to Python path (should be run from backend/)
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


async def check_platform_admin_exists(db: AsyncSession) -> bool:
    """Check if platform super admin already exists"""
    result = await db.execute(
        select(User).where(
            User.role == UserRole.PLATFORM_SUPER_ADMIN,
            User.is_deleted == False
        )
    )
    return result.scalar_one_or_none() is not None


async def create_platform_super_admin(db: AsyncSession):
    """Create the platform super admin (one time only)"""
    print("🚀 Platform Super Admin Setup")
    print("=" * 50)
    print("⚠️  WARNING: This should only be run ONCE during initial setup!")
    print("⚠️  The Platform Super Admin oversees the entire platform.")
    print()
    
    # Check if platform admin already exists
    if await check_platform_admin_exists(db):
        print("❌ Platform Super Admin already exists!")
        print("Only ONE Platform Super Admin is allowed per platform.")
        
        # Show existing admin
        result = await db.execute(
            select(User).where(
                User.role == UserRole.PLATFORM_SUPER_ADMIN,
                User.is_deleted == False
            )
        )
        existing_admin = result.scalar_one()
        print(f"\nExisting Platform Admin:")
        print(f"Name: {existing_admin.full_name}")
        print(f"Email: {existing_admin.email}")
        print(f"Created: {existing_admin.created_at}")
        return False
    
    print("✅ No Platform Super Admin found. Proceeding with creation...")
    print()
    
    # Get platform admin details
    print("👤 Platform Super Admin Details:")
    print("(This person will have full control over the entire platform)")
    print()
    
    first_name = input("First Name: ").strip()
    if not first_name:
        print("❌ First name is required")
        return False
    
    last_name = input("Last Name: ").strip()
    if not last_name:
        print("❌ Last name is required")
        return False
    
    email = input("Email: ").strip().lower()
    if not email or '@' not in email:
        print("❌ Valid email is required")
        return False
    
    # Check if email already exists (any role)
    result = await db.execute(
        select(User).where(
            User.email == email,
            User.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        print(f"❌ Email {email} already exists in the system")
        return False
    
    phone = input("Phone (optional): ").strip() or None
    
    # Get password
    while True:
        password = getpass("Password (min 8 characters): ")
        if len(password) >= 8:
            confirm_password = getpass("Confirm Password: ")
            if password == confirm_password:
                break
            else:
                print("❌ Passwords don't match. Try again.")
        else:
            print("❌ Password must be at least 8 characters long")
    
    # Final confirmation
    print(f"\n📋 Platform Super Admin Summary:")
    print(f"Name: {first_name} {last_name}")
    print(f"Email: {email}")
    print(f"Phone: {phone or 'Not provided'}")
    print(f"Role: Platform Super Admin (FULL PLATFORM CONTROL)")
    print()
    print("🔥 IMPORTANT:")
    print("- This user will have FULL control over the entire platform")
    print("- They can create school owners and manage all schools")
    print("- This can only be done ONCE")
    print("- Make sure the details are correct!")
    print()
    
    confirm = input("✅ Create Platform Super Admin? (type 'YES' to confirm): ").strip()
    if confirm != 'YES':
        print("❌ Platform Super Admin creation cancelled")
        return False
    
    try:
        # Create the platform super admin
        platform_admin = User(
            email=email,
            password_hash=get_password_hash(password),
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=UserRole.PLATFORM_SUPER_ADMIN,
            school_id=None,  # Platform admin is not tied to any school
            is_active=True,
            is_verified=True
        )
        
        db.add(platform_admin)
        await db.commit()
        await db.refresh(platform_admin)
        
        print(f"\n🎉 SUCCESS! Platform Super Admin created!")
        print("=" * 50)
        print(f"User ID: {platform_admin.id}")
        print(f"Email: {platform_admin.email}")
        print(f"Role: {platform_admin.role.value}")
        print(f"Created: {platform_admin.created_at}")
        
        print(f"\n🔑 Login Credentials:")
        print(f"Email: {email}")
        print(f"Password: [The password you entered]")
        print(f"API Login URL: http://localhost:8000/api/v1/auth/login")
        
        print(f"\n🎯 Next Steps:")
        print("1. Start the backend server: cd backend && python start_server.py")
        print("2. Start the frontend: cd frontend && npm run dev")
        print("3. Login to the frontend with these credentials")
        print("4. Use the admin panel to manage school owners and platform")
        print("5. School owners will register and manage their schools via frontend")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating Platform Super Admin: {str(e)}")
        await db.rollback()
        return False


async def main():
    """Main function"""
    print("🏫 School Management Platform - Initial Setup")
    print("=" * 60)
    
    try:
        async with AsyncSessionLocal() as db:
            success = await create_platform_super_admin(db)
            if success:
                print("\n✅ Platform setup complete!")
                print("You can now start managing the platform.")
            else:
                print("\n❌ Platform setup failed or cancelled")
            
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
        print("Make sure the backend database is accessible")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
