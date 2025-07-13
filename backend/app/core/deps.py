from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User, UserRole
from app.models.school import School

# Security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    # Get user from database
    result = await db.execute(select(User).where(User.id == user_id, User.is_deleted == False))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_current_school(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> School:
    """Get current user's school"""
    result = await db.execute(
        select(School).where(
            School.id == current_user.school_id,
            School.is_deleted == False
        )
    )
    school = result.scalar_one_or_none()
    
    if school is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    if not school.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School is inactive"
        )
    
    return school


def require_roles(allowed_roles: List[UserRole]):
    """Dependency to check if user has required role"""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker


def require_super_admin():
    """Dependency to require super admin role"""
    return require_roles([UserRole.SUPER_ADMIN])


def require_admin():
    """Dependency to require admin or super admin role"""
    return require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN])


def require_teacher():
    """Dependency to require teacher, admin, or super admin role"""
    return require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER])


def require_teacher_or_admin():
    """Dependency to require teacher, admin, or super admin role (alias for require_teacher)"""
    return require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER])


def require_teacher_only():
    """Dependency to require only teacher role (not admin)"""
    return require_roles([UserRole.TEACHER])


def require_parent():
    """Dependency to require parent role"""
    return require_roles([UserRole.PARENT])


def require_student():
    """Dependency to require student role"""
    return require_roles([UserRole.STUDENT])


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


class TenantFilter:
    """Utility class for tenant-based filtering"""

    def __init__(self, current_user: User = Depends(get_current_active_user)):
        self.current_user = current_user
        self.school_id = current_user.school_id

    def filter_by_school(self, query):
        """Add school filter to query"""
        return query.where(query.column_descriptions[0]['type'].school_id == self.school_id)


async def check_teacher_can_access_student(
    db: AsyncSession,
    teacher_id: str,
    student_id: str,
    school_id: str
) -> bool:
    """Check if a teacher can access a specific student"""
    from sqlalchemy import text

    # Teachers can access students if:
    # 1. They are the class teacher for the student's class
    # 2. They teach a subject that the student is enrolled in
    query = text("""
        SELECT DISTINCT s.id
        FROM students s
        LEFT JOIN classes c ON s.current_class_id = c.id
        LEFT JOIN enrollments e ON s.id = e.student_id
        LEFT JOIN teacher_subjects ts ON e.subject_id = ts.subject_id
        WHERE s.id = :student_id
        AND s.school_id = :school_id
        AND s.is_deleted = false
        AND (
            c.teacher_id = :teacher_id OR
            (ts.teacher_id = :teacher_id AND ts.is_deleted = false AND e.is_active = true)
        )
    """)

    result = await db.execute(query, {
        "student_id": student_id,
        "teacher_id": teacher_id,
        "school_id": school_id
    })

    return result.scalar_one_or_none() is not None


async def check_teacher_can_access_class(
    db: AsyncSession,
    teacher_id: str,
    class_id: str,
    school_id: str
) -> bool:
    """Check if a teacher can access a specific class"""
    from sqlalchemy import text

    # Teachers can access classes if:
    # 1. They are the class teacher
    # 2. They teach a subject in that class
    query = text("""
        SELECT DISTINCT c.id
        FROM classes c
        LEFT JOIN class_subjects cs ON c.id = cs.class_id
        LEFT JOIN teacher_subjects ts ON cs.subject_id = ts.subject_id
        WHERE c.id = :class_id
        AND c.school_id = :school_id
        AND c.is_deleted = false
        AND (
            c.teacher_id = :teacher_id OR
            (ts.teacher_id = :teacher_id AND ts.is_deleted = false)
        )
    """)

    result = await db.execute(query, {
        "class_id": class_id,
        "teacher_id": teacher_id,
        "school_id": school_id
    })

    return result.scalar_one_or_none() is not None


async def check_teacher_can_access_subject(
    db: AsyncSession,
    teacher_id: str,
    subject_id: str,
    school_id: str
) -> bool:
    """Check if a teacher can access a specific subject"""
    from sqlalchemy import text

    # Teachers can access subjects if they are assigned to teach them
    query = text("""
        SELECT ts.id
        FROM teacher_subjects ts
        WHERE ts.teacher_id = :teacher_id
        AND ts.subject_id = :subject_id
        AND ts.school_id = :school_id
        AND ts.is_deleted = false
    """)

    result = await db.execute(query, {
        "teacher_id": teacher_id,
        "subject_id": subject_id,
        "school_id": school_id
    })

    return result.scalar_one_or_none() is not None
