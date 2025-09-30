from typing import Optional, List, Tuple
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User, UserRole
from app.models.school import School
from app.models.school_ownership import SchoolOwnership
from dataclasses import dataclass

# Security scheme
security = HTTPBearer()


@dataclass
class SchoolContext:
    """Context object that holds current school information from JWT token"""
    school_id: str
    user: User
    school: Optional[School] = None


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Get current authenticated user ID from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    return user_id


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


async def get_school_context(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> SchoolContext:
    """Get current school context from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)

    user_id: str = payload.get("sub")
    school_id: str = payload.get("school_id")

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

    # Use school_id from JWT token if available, otherwise fall back to user's school_id
    current_school_id = school_id or user.school_id

    if not current_school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No school context available",
        )

    # For school owners, verify they have access to the school in the JWT
    if user.role == UserRole.SCHOOL_OWNER and school_id and school_id != user.school_id:
        # Verify ownership
        ownership_result = await db.execute(
            select(SchoolOwnership).where(
                and_(
                    SchoolOwnership.user_id == user.id,
                    SchoolOwnership.school_id == school_id,
                    SchoolOwnership.is_active == True
                )
            )
        )
        ownership = ownership_result.scalar_one_or_none()

        if not ownership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this school",
            )

    return SchoolContext(school_id=current_school_id, user=user)


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


async def get_current_school_context(
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> SchoolContext:
    """Get current school context with school details loaded"""
    if school_context.school is None:
        # Load school details
        result = await db.execute(
            select(School).where(
                School.id == school_context.school_id,
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

        school_context.school = school

    return school_context


async def get_current_school(
    school_context: SchoolContext = Depends(get_current_school_context)
) -> School:
    """Get current school from context"""
    if school_context.school is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="School context not properly loaded"
        )
    return school_context.school


def require_roles(allowed_roles: List[UserRole]):
    """Dependency to check if user has required role"""
    def role_checker(school_context: SchoolContext = Depends(get_current_school_context)) -> SchoolContext:
        if school_context.user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return school_context
    return role_checker


def require_roles_user_only(allowed_roles: List[UserRole]):
    """Dependency to check if user has required role - returns user only"""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker


def require_platform_admin():
    """Dependency to require platform super admin role - returns SchoolContext"""
    return require_roles([UserRole.PLATFORM_SUPER_ADMIN])


def require_school_owner():
    """Dependency to require school owner or platform admin role - returns SchoolContext"""
    return require_roles([UserRole.PLATFORM_SUPER_ADMIN, UserRole.SCHOOL_OWNER])


def require_school_admin():
    """Dependency to require school admin, school owner, or platform admin role - returns SchoolContext"""
    return require_roles([UserRole.PLATFORM_SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.SCHOOL_ADMIN])


def require_teacher():
    """Dependency to require teacher or higher role - returns SchoolContext"""
    return require_roles([UserRole.PLATFORM_SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.SCHOOL_ADMIN, UserRole.TEACHER])


def require_teacher_or_admin():
    """Dependency to require teacher or admin role - returns SchoolContext"""
    return require_roles([UserRole.PLATFORM_SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.SCHOOL_ADMIN, UserRole.TEACHER])


def require_teacher_only():
    """Dependency to require only teacher role - returns SchoolContext"""
    return require_roles([UserRole.TEACHER])


def require_parent():
    """Dependency to require parent role - returns SchoolContext"""
    return require_roles([UserRole.PARENT])


def require_student():
    """Dependency to require student role - returns SchoolContext"""
    return require_roles([UserRole.STUDENT])


# User-only versions for backward compatibility
def require_platform_admin_user():
    """Dependency to require platform super admin role - returns User only"""
    return require_roles_user_only([UserRole.PLATFORM_SUPER_ADMIN])


def require_school_owner_user():
    """Dependency to require school owner or platform admin role - returns User only"""
    return require_roles_user_only([UserRole.PLATFORM_SUPER_ADMIN, UserRole.SCHOOL_OWNER])


def require_school_admin_user():
    """Dependency to require school admin, school owner, or platform admin role - returns User only"""
    return require_roles_user_only([UserRole.PLATFORM_SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.SCHOOL_ADMIN])


def require_teacher_user():
    """Dependency to require teacher or higher role - returns User only"""
    return require_roles_user_only([UserRole.PLATFORM_SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.SCHOOL_ADMIN, UserRole.TEACHER])


def require_teacher_or_admin_user():
    """Dependency to require teacher or admin role - returns User only"""
    return require_roles_user_only([UserRole.PLATFORM_SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.SCHOOL_ADMIN, UserRole.TEACHER])


def require_teacher_only_user():
    """Dependency to require only teacher role - returns User only"""
    return require_roles_user_only([UserRole.TEACHER])


def require_parent_user():
    """Dependency to require parent role - returns User only"""
    return require_roles_user_only([UserRole.PARENT])


def require_student_user():
    """Dependency to require student role - returns User only"""
    return require_roles_user_only([UserRole.STUDENT])


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
    """Utility class for tenant-based filtering and validation"""

    def __init__(self, school_context: SchoolContext = Depends(get_school_context)):
        self.school_context = school_context
        self.school_id = school_context.school_id
        self.user = school_context.user

    def filter_by_school(self, query, model_class=None):
        """Add school filter to query"""
        if model_class and hasattr(model_class, 'school_id'):
            return query.where(model_class.school_id == self.school_id)
        elif hasattr(query.column_descriptions[0]['type'], 'school_id'):
            return query.where(query.column_descriptions[0]['type'].school_id == self.school_id)
        else:
            # For raw queries, we need to ensure school_id is manually added
            raise ValueError("Cannot automatically filter query by school_id. Please add school_id filter manually.")

    def validate_school_access(self, entity_school_id: str) -> bool:
        """Validate that the entity belongs to the current school"""
        if entity_school_id != self.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Entity does not belong to your school"
            )
        return True

    def validate_school_ownership(self, entity_school_id: str) -> bool:
        """Validate that the user owns or has access to the school"""
        if entity_school_id != self.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You don't have access to this school"
            )
        return True

    def get_school_filter(self, model_class):
        """Get school filter condition for a model"""
        if hasattr(model_class, 'school_id'):
            return model_class.school_id == self.school_id
        else:
            raise ValueError(f"Model {model_class.__name__} does not have school_id field")


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

    # Teachers can access subjects if:
    # 1. They are directly assigned to teach the subject
    # 2. They are a class teacher and the subject is assigned to their class
    query = text("""
        SELECT 1
        FROM teacher_subjects ts
        WHERE ts.teacher_id = :teacher_id
        AND ts.subject_id = :subject_id
        AND ts.school_id = :school_id
        AND ts.is_deleted = false

        UNION

        SELECT 1
        FROM class_subjects cs
        JOIN classes c ON cs.class_id = c.id
        WHERE c.teacher_id = :teacher_id
        AND cs.subject_id = :subject_id
        AND cs.school_id = :school_id
        AND cs.is_deleted = false
        AND c.is_deleted = false

        LIMIT 1
    """)

    result = await db.execute(query, {
        "teacher_id": teacher_id,
        "subject_id": subject_id,
        "school_id": school_id
    })

    return result.scalar_one_or_none() is not None


# School isolation validation functions
async def validate_entity_belongs_to_school(
    db: AsyncSession,
    entity_id: str,
    entity_model,
    school_id: str,
    error_message: str = "Entity not found or does not belong to your school"
) -> bool:
    """Validate that an entity belongs to the specified school"""
    result = await db.execute(
        select(entity_model).where(
            and_(
                entity_model.id == entity_id,
                entity_model.school_id == school_id,
                entity_model.is_deleted == False
            )
        )
    )
    entity = result.scalar_one_or_none()
    
    if entity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_message
        )
    
    return True


async def validate_multiple_entities_belong_to_school(
    db: AsyncSession,
    entity_ids: List[str],
    entity_model,
    school_id: str,
    error_message: str = "One or more entities do not belong to your school"
) -> List[str]:
    """Validate that multiple entities belong to the specified school and return valid IDs"""
    if not entity_ids:
        return []
    
    result = await db.execute(
        select(entity_model.id).where(
            and_(
                entity_model.id.in_(entity_ids),
                entity_model.school_id == school_id,
                entity_model.is_deleted == False
            )
        )
    )
    valid_ids = [row[0] for row in result.fetchall()]
    
    if len(valid_ids) != len(entity_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    return valid_ids


def create_tenant_aware_query(model_class, school_id: str, base_query=None):
    """Create a query that automatically includes school filtering"""
    if base_query is None:
        base_query = select(model_class)
    
    if hasattr(model_class, 'school_id'):
        return base_query.where(
            and_(
                model_class.school_id == school_id,
                model_class.is_deleted == False
            )
        )
    else:
        raise ValueError(f"Model {model_class.__name__} does not support tenant isolation")


# Decorator for ensuring school isolation in service methods
def ensure_school_isolation(func):
    """Decorator to ensure service methods properly filter by school_id"""
    async def wrapper(*args, **kwargs):
        # Extract school_id from arguments
        school_id = None
        for arg in args:
            if isinstance(arg, str) and len(arg) == 36:  # UUID-like string
                # Check if this might be a school_id by looking at the function signature
                import inspect
                sig = inspect.signature(func)
                param_names = list(sig.parameters.keys())
                if 'school_id' in param_names:
                    school_id_idx = param_names.index('school_id')
                    if len(args) > school_id_idx:
                        school_id = args[school_id_idx]
                        break
        
        if 'school_id' in kwargs:
            school_id = kwargs['school_id']
        
        if not school_id:
            raise ValueError(f"Service method {func.__name__} must include school_id parameter for tenant isolation")
        
        return await func(*args, **kwargs)
    
    return wrapper
