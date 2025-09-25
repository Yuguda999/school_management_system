from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_school_admin,
    require_school_admin_user,
    get_current_school,
    SchoolContext
)
from app.models.user import User, UserRole
from app.models.school import School
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse,
    StaffCreate,
    ParentCreate,
    UserStatusUpdate,
    UserRoleUpdate,
    TeacherCreateWithSubjects
)
from app.services.user_service import UserService
import math

router = APIRouter()


@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new user (Admin/Super Admin only)"""
    user = await UserService.create_user(db, user_data, current_school.id)
    return UserResponse.from_orm(user)


@router.post("/staff", response_model=UserResponse)
async def create_staff(
    staff_data: StaffCreate,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new staff member (School Admin only)"""
    user = await UserService.create_user(db, staff_data, current_school.id)
    return UserResponse.from_orm(user)


@router.post("/parents", response_model=UserResponse)
async def create_parent(
    parent_data: ParentCreate,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new parent (School Admin only)"""
    user = await UserService.create_user(db, parent_data, current_school.id)
    return UserResponse.from_orm(user)


@router.post("/teachers", response_model=UserResponse)
async def create_teacher_with_subjects(
    teacher_data: TeacherCreateWithSubjects,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new teacher with subject assignments (School Admin only)"""
    user = await UserService.create_teacher_with_subjects(db, teacher_data, current_school.id)
    return UserResponse.from_orm(user)


@router.get("/", response_model=UserListResponse)
async def get_users(
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name, email, or employee ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get users with filtering and pagination (School Admin only)"""
    skip = (page - 1) * size
    users, total = await UserService.get_users(
        db, current_school.id, role, is_active, search, skip, size
    )
    
    pages = math.ceil(total / size) if total > 0 else 1
    
    return UserListResponse(
        users=[UserResponse.from_orm(user) for user in users],
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/teachers", response_model=list[UserResponse])
async def get_teachers(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all teachers (School Admin only)"""
    skip = (page - 1) * size
    teachers = await UserService.get_teachers(db, current_school.id, skip, size)
    return [UserResponse.from_orm(teacher) for teacher in teachers]


@router.get("/parents", response_model=list[UserResponse])
async def get_parents(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all parents (School Admin only)"""
    skip = (page - 1) * size
    parents = await UserService.get_parents(db, current_school.id, skip, size)
    return [UserResponse.from_orm(parent) for parent in parents]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get user by ID"""
    # Users can view their own profile, admins can view any profile
    if user_id != current_user.id and current_user.role not in [UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PLATFORM_SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = await UserService.get_user_by_id(db, user_id, current_school.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.from_orm(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update user information"""
    # Users can update their own profile, admins can update any profile
    if user_id != current_user.id and current_user.role not in [UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PLATFORM_SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = await UserService.update_user(db, user_id, current_school.id, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.from_orm(user)


@router.put("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: str,
    status_data: UserStatusUpdate,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update user status (School Admin only)"""
    user = await UserService.update_user_status(db, user_id, current_school.id, status_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.from_orm(user)


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    role_data: UserRoleUpdate,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update user role (Super Admin only)"""
    user = await UserService.update_user_role(db, user_id, current_school.id, role_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.from_orm(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete user (School Admin only)"""
    current_user = school_context.user
    
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    success = await UserService.delete_user(db, user_id, current_school.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deleted successfully"}
