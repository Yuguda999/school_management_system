#!/usr/bin/env python3

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import verify_password, get_password_hash
from sqlalchemy import select

async def test_password():
    async with AsyncSessionLocal() as db:
        # Get user by email
        result = await db.execute(
            select(User).where(
                User.email == 'elemenx93@gmail.com',
                User.is_deleted == False
            )
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ User not found")
            return
        
        print(f"✅ User found: {user.email}")
        print(f"📧 Full name: {user.first_name} {user.last_name}")
        print(f"🔑 Password hash: {user.password_hash[:50]}...")
        print(f"📏 Hash length: {len(user.password_hash)}")
        
        # Test password verification
        test_password = "P@$w0rd"
        print(f"\n🧪 Testing password: '{test_password}'")
        
        try:
            is_valid = verify_password(test_password, user.password_hash)
            if is_valid:
                print("✅ Password verification: SUCCESS")
            else:
                print("❌ Password verification: FAILED")
                
                # Let's try to create a new hash and see if it works
                print("\n🔧 Creating new hash for comparison...")
                new_hash = get_password_hash(test_password)
                print(f"🆕 New hash: {new_hash[:50]}...")
                
                # Test the new hash
                is_new_valid = verify_password(test_password, new_hash)
                print(f"🧪 New hash verification: {'SUCCESS' if is_new_valid else 'FAILED'}")
                
        except Exception as e:
            print(f"❌ Error during password verification: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_password())
