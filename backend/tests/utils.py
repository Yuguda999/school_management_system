"""
Test utility functions for creating test data.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from uuid import uuid4

from app.models.user import User, UserRole
from app.models.school import School
from app.models.academic import Term
from app.core.security import get_password_hash


async def create_test_school(db: AsyncSession, **kwargs) -> School:
    """Create a test school."""
    defaults = {
        "name": f"Test School {uuid4().hex[:8]}",
        "code": f"TST{uuid4().hex[:6].upper()}",
        "address": "123 Test Street",
        "phone": "1234567890",
        "email": f"school_{uuid4().hex[:8]}@test.com",
        "current_session": "2024/2025",
        "is_active": True
    }
    defaults.update(kwargs)
    
    school = School(**defaults)
    db.add(school)
    await db.commit()
    await db.refresh(school)
    return school


async def create_test_user(
    db: AsyncSession,
    email: str = None,
    password: str = "testpassword",
    role: UserRole = UserRole.SCHOOL_ADMIN,
    school_id: str = None,
    **kwargs
) -> User:
    """Create a test user."""
    if email is None:
        email = f"user_{uuid4().hex[:8]}@test.com"
    
    defaults = {
        "email": email,
        "password_hash": get_password_hash(password),
        "first_name": "Test",
        "last_name": "User",
        "role": role,
        "school_id": school_id,
        "is_active": True,
        "is_verified": True
    }
    defaults.update(kwargs)
    
    user = User(**defaults)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def create_test_term(
    db: AsyncSession,
    school_id: str,
    name: str = "First Term",
    academic_session: str = "2024/2025",
    start_date: date = None,
    end_date: date = None,
    is_current: bool = True,
    **kwargs
) -> Term:
    """Create a test term."""
    if start_date is None:
        start_date = date(2024, 1, 1)
    if end_date is None:
        end_date = date(2024, 3, 31)
    
    defaults = {
        "name": name,
        "school_id": school_id,
        "academic_session": academic_session,
        "start_date": start_date,
        "end_date": end_date,
        "is_current": is_current
    }
    defaults.update(kwargs)
    
    term = Term(**defaults)
    db.add(term)
    await db.commit()
    await db.refresh(term)
    return term

