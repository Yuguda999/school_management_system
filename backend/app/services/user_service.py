from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate, UserRoleUpdate, TeacherCreateWithSubjects
from app.core.security import get_password_hash
import uuid


class UserService:
    """Service class for user operations"""
    
    @staticmethod
    async def create_user(
        db: AsyncSession, 
        user_data: UserCreate, 
        school_id: str
    ) -> User:
        """Create a new user"""
        # Check if email already exists in the school
        result = await db.execute(
            select(User).where(
                User.email == user_data.email,
                User.school_id == school_id,
                User.is_deleted == False
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists in this school"
            )
        
        # Check if username already exists (if provided)
        if user_data.username:
            result = await db.execute(
                select(User).where(
                    User.username == user_data.username,
                    User.school_id == school_id,
                    User.is_deleted == False
                )
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists in this school"
                )
        
        # Check if employee_id already exists (for staff)
        if user_data.employee_id:
            result = await db.execute(
                select(User).where(
                    User.employee_id == user_data.employee_id,
                    User.school_id == school_id,
                    User.is_deleted == False
                )
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Employee ID already exists in this school"
                )
        
        # Create user
        user_dict = user_data.dict()
        user_dict.pop('password')
        user_dict['password_hash'] = get_password_hash(user_data.password)
        user_dict['school_id'] = school_id
        
        user = User(**user_dict)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def get_user_by_id(
        db: AsyncSession, 
        user_id: str, 
        school_id: str
    ) -> Optional[User]:
        """Get user by ID within school"""
        result = await db.execute(
            select(User).where(
                User.id == user_id,
                User.school_id == school_id,
                User.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_email(
        db: AsyncSession, 
        email: str, 
        school_id: str
    ) -> Optional[User]:
        """Get user by email within school"""
        result = await db.execute(
            select(User).where(
                User.email == email,
                User.school_id == school_id,
                User.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_users(
        db: AsyncSession,
        school_id: str,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[User], int]:
        """Get users with filtering and pagination"""
        query = select(User).where(
            User.school_id == school_id,
            User.is_deleted == False
        )
        
        # Apply filters
        if role:
            query = query.where(User.role == role)
        
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        
        if search:
            search_filter = or_(
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.employee_id.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        users = result.scalars().all()
        
        return list(users), total
    
    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: str,
        school_id: str,
        user_data: UserUpdate
    ) -> Optional[User]:
        """Update user information"""
        user = await UserService.get_user_by_id(db, user_id, school_id)
        if not user:
            return None
        
        # Check email uniqueness if being updated
        if user_data.email and user_data.email != user.email:
            result = await db.execute(
                select(User).where(
                    User.email == user_data.email,
                    User.school_id == school_id,
                    User.id != user_id,
                    User.is_deleted == False
                )
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists in this school"
                )
        
        # Check username uniqueness if being updated
        if user_data.username and user_data.username != user.username:
            result = await db.execute(
                select(User).where(
                    User.username == user_data.username,
                    User.school_id == school_id,
                    User.id != user_id,
                    User.is_deleted == False
                )
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists in this school"
                )
        
        # Check employee_id uniqueness if being updated
        if user_data.employee_id and user_data.employee_id != user.employee_id:
            result = await db.execute(
                select(User).where(
                    User.employee_id == user_data.employee_id,
                    User.school_id == school_id,
                    User.id != user_id,
                    User.is_deleted == False
                )
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Employee ID already exists in this school"
                )
        
        # Update fields
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        # Update profile completion status for teachers
        if user.role == UserRole.TEACHER:
            user.update_profile_completion_status()

        await db.commit()
        await db.refresh(user)

        return user
    
    @staticmethod
    async def update_user_status(
        db: AsyncSession,
        user_id: str,
        school_id: str,
        status_data: UserStatusUpdate
    ) -> Optional[User]:
        """Update user status"""
        user = await UserService.get_user_by_id(db, user_id, school_id)
        if not user:
            return None
        
        # Update status fields
        if status_data.is_active is not None:
            user.is_active = status_data.is_active
        
        if status_data.is_verified is not None:
            user.is_verified = status_data.is_verified
        
        await db.commit()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def update_user_role(
        db: AsyncSession,
        user_id: str,
        school_id: str,
        role_data: UserRoleUpdate
    ) -> Optional[User]:
        """Update user role"""
        user = await UserService.get_user_by_id(db, user_id, school_id)
        if not user:
            return None
        
        user.role = role_data.role
        await db.commit()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def delete_user(
        db: AsyncSession,
        user_id: str,
        school_id: str
    ) -> bool:
        """Soft delete user"""
        user = await UserService.get_user_by_id(db, user_id, school_id)
        if not user:
            return False
        
        user.is_deleted = True
        await db.commit()
        
        return True
    
    @staticmethod
    async def get_teachers(
        db: AsyncSession,
        school_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Get all teachers in a school"""
        result = await db.execute(
            select(User).where(
                User.school_id == school_id,
                User.role == UserRole.TEACHER,
                User.is_active == True,
                User.is_deleted == False
            ).offset(skip).limit(limit)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_parents(
        db: AsyncSession,
        school_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Get all parents in a school"""
        result = await db.execute(
            select(User).where(
                User.school_id == school_id,
                User.role == UserRole.PARENT,
                User.is_active == True,
                User.is_deleted == False
            ).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create_teacher_with_subjects(
        db: AsyncSession,
        teacher_data: TeacherCreateWithSubjects,
        school_id: str
    ) -> User:
        """Create a new teacher with subject assignments"""
        # First create the teacher user
        user = await UserService.create_user(db, teacher_data, school_id)

        # If subjects are provided, assign them
        if teacher_data.subject_ids:
            from app.services.teacher_subject_service import TeacherSubjectService
            from app.schemas.academic import BulkTeacherSubjectAssignment

            assignment_data = BulkTeacherSubjectAssignment(
                teacher_id=user.id,
                subject_ids=teacher_data.subject_ids,
                head_of_subject_id=teacher_data.head_of_subject_id
            )

            await TeacherSubjectService.bulk_assign_subjects_to_teacher(
                db, assignment_data, school_id
            )

        return user
