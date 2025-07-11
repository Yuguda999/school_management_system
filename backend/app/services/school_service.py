from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.school import School
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import Class, Subject, Term
from app.schemas.school import SchoolCreate, SchoolUpdate, SchoolRegistration
from app.core.security import get_password_hash
import uuid


class SchoolService:
    """Service class for school operations"""
    
    @staticmethod
    async def create_school(db: AsyncSession, school_data: SchoolCreate) -> School:
        """Create a new school"""
        # Check if school code already exists
        result = await db.execute(
            select(School).where(School.code == school_data.code, School.is_deleted == False)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School code already exists"
            )
        
        # Check if email already exists
        result = await db.execute(
            select(School).where(School.email == school_data.email, School.is_deleted == False)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School email already exists"
            )
        
        # Create school
        school = School(**school_data.dict())
        db.add(school)
        await db.commit()
        await db.refresh(school)
        
        return school
    
    @staticmethod
    async def register_school_with_admin(
        db: AsyncSession, 
        registration_data: SchoolRegistration
    ) -> tuple[School, User]:
        """Register a new school with admin user"""
        # Extract school data
        school_data = SchoolCreate(**{
            k: v for k, v in registration_data.dict().items() 
            if not k.startswith('admin_')
        })
        
        # Create school
        school = await SchoolService.create_school(db, school_data)
        
        # Check if admin email already exists
        result = await db.execute(
            select(User).where(User.email == registration_data.admin_email, User.is_deleted == False)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin email already exists"
            )
        
        # Create admin user
        admin_user = User(
            email=registration_data.admin_email,
            password_hash=get_password_hash(registration_data.admin_password),
            first_name=registration_data.admin_first_name,
            last_name=registration_data.admin_last_name,
            phone=registration_data.admin_phone,
            role=UserRole.SUPER_ADMIN,
            school_id=school.id,
            is_active=True,
            is_verified=True
        )
        
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)
        
        return school, admin_user
    
    @staticmethod
    async def get_school_by_id(db: AsyncSession, school_id: str) -> Optional[School]:
        """Get school by ID"""
        result = await db.execute(
            select(School).where(School.id == school_id, School.is_deleted == False)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_school_by_code(db: AsyncSession, school_code: str) -> Optional[School]:
        """Get school by code"""
        result = await db.execute(
            select(School).where(School.code == school_code, School.is_deleted == False)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_school(
        db: AsyncSession, 
        school_id: str, 
        school_data: SchoolUpdate
    ) -> Optional[School]:
        """Update school information"""
        school = await SchoolService.get_school_by_id(db, school_id)
        if not school:
            return None
        
        # Update fields
        update_data = school_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(school, field, value)
        
        await db.commit()
        await db.refresh(school)
        
        return school
    
    @staticmethod
    async def get_school_stats(db: AsyncSession, school_id: str) -> dict:
        """Get school statistics"""
        # Count students
        students_result = await db.execute(
            select(func.count(Student.id)).where(
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        total_students = students_result.scalar()
        
        # Count teachers
        teachers_result = await db.execute(
            select(func.count(User.id)).where(
                User.school_id == school_id,
                User.role == UserRole.TEACHER,
                User.is_deleted == False
            )
        )
        total_teachers = teachers_result.scalar()
        
        # Count classes
        classes_result = await db.execute(
            select(func.count(Class.id)).where(
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        total_classes = classes_result.scalar()
        
        # Count subjects
        subjects_result = await db.execute(
            select(func.count(Subject.id)).where(
                Subject.school_id == school_id,
                Subject.is_deleted == False
            )
        )
        total_subjects = subjects_result.scalar()
        
        # Count active terms
        terms_result = await db.execute(
            select(func.count(Term.id)).where(
                Term.school_id == school_id,
                Term.is_active == True,
                Term.is_deleted == False
            )
        )
        active_terms = terms_result.scalar()
        
        return {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_classes": total_classes,
            "total_subjects": total_subjects,
            "active_terms": active_terms
        }
    
    @staticmethod
    async def deactivate_school(db: AsyncSession, school_id: str) -> bool:
        """Deactivate a school"""
        school = await SchoolService.get_school_by_id(db, school_id)
        if not school:
            return False
        
        school.is_active = False
        await db.commit()
        
        return True
    
    @staticmethod
    async def activate_school(db: AsyncSession, school_id: str) -> bool:
        """Activate a school"""
        school = await SchoolService.get_school_by_id(db, school_id)
        if not school:
            return False
        
        school.is_active = True
        await db.commit()
        
        return True
