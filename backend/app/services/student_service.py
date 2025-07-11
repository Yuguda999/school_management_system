from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import date

from app.models.student import Student
from app.models.user import User, UserRole
from app.models.academic import Class
from app.schemas.student import StudentCreate, StudentUpdate


class StudentService:
    """Service class for student operations"""
    
    @staticmethod
    async def create_student(
        db: AsyncSession,
        student_data: StudentCreate,
        school_id: str
    ) -> Student:
        """Create a new student"""
        # Check if admission number already exists
        result = await db.execute(
            select(Student).where(
                Student.admission_number == student_data.admission_number,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student with this admission number already exists"
            )
        
        # Verify class exists
        if student_data.class_id:
            class_result = await db.execute(
                select(Class).where(
                    Class.id == student_data.class_id,
                    Class.school_id == school_id,
                    Class.is_deleted == False
                )
            )
            if not class_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Class not found"
                )
        
        # Create student
        student_dict = student_data.dict()
        student_dict['school_id'] = school_id
        
        student = Student(**student_dict)
        db.add(student)
        await db.commit()
        await db.refresh(student)
        
        return student
    
    @staticmethod
    async def get_students(
        db: AsyncSession,
        school_id: str,
        class_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Student]:
        """Get students with filtering"""
        query = select(Student).options(
            selectinload(Student.class_),
            selectinload(Student.parent),
            selectinload(Student.user)
        ).where(
            Student.school_id == school_id,
            Student.is_deleted == False
        )
        
        if class_id:
            query = query.where(Student.class_id == class_id)
        if is_active is not None:
            query = query.where(Student.is_active == is_active)
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Student.first_name.ilike(search_term),
                    Student.last_name.ilike(search_term),
                    Student.admission_number.ilike(search_term)
                )
            )
        
        query = query.order_by(Student.first_name, Student.last_name).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_student_by_id(
        db: AsyncSession,
        student_id: str,
        school_id: str
    ) -> Optional[Student]:
        """Get student by ID"""
        result = await db.execute(
            select(Student).options(
                selectinload(Student.class_),
                selectinload(Student.parent),
                selectinload(Student.user),
                selectinload(Student.grades),
                selectinload(Student.fee_assignments)
            ).where(
                Student.id == student_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_student_by_admission_number(
        db: AsyncSession,
        admission_number: str,
        school_id: str
    ) -> Optional[Student]:
        """Get student by admission number"""
        result = await db.execute(
            select(Student).options(
                selectinload(Student.class_),
                selectinload(Student.parent),
                selectinload(Student.user)
            ).where(
                Student.admission_number == admission_number,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_student(
        db: AsyncSession,
        student_id: str,
        student_data: StudentUpdate,
        school_id: str
    ) -> Optional[Student]:
        """Update student"""
        student = await StudentService.get_student_by_id(db, student_id, school_id)
        if not student:
            return None
        
        # Check if new admission number conflicts
        if student_data.admission_number and student_data.admission_number != student.admission_number:
            result = await db.execute(
                select(Student).where(
                    Student.admission_number == student_data.admission_number,
                    Student.school_id == school_id,
                    Student.id != student_id,
                    Student.is_deleted == False
                )
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student with this admission number already exists"
                )
        
        # Verify new class exists if provided
        if student_data.class_id:
            class_result = await db.execute(
                select(Class).where(
                    Class.id == student_data.class_id,
                    Class.school_id == school_id,
                    Class.is_deleted == False
                )
            )
            if not class_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Class not found"
                )
        
        # Update fields
        update_data = student_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(student, field, value)
        
        await db.commit()
        await db.refresh(student)
        
        return student
    
    @staticmethod
    async def delete_student(
        db: AsyncSession,
        student_id: str,
        school_id: str
    ) -> bool:
        """Soft delete student"""
        student = await StudentService.get_student_by_id(db, student_id, school_id)
        if not student:
            return False
        
        student.is_deleted = True
        await db.commit()
        
        return True
    
    @staticmethod
    async def get_students_count(
        db: AsyncSession,
        school_id: str,
        class_id: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> int:
        """Get total count of students"""
        query = select(func.count(Student.id)).where(
            Student.school_id == school_id,
            Student.is_deleted == False
        )
        
        if class_id:
            query = query.where(Student.class_id == class_id)
        if is_active is not None:
            query = query.where(Student.is_active == is_active)
        
        result = await db.execute(query)
        return result.scalar() or 0
