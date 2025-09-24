from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.school import School
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import Class, Subject, Term
from app.schemas.school import SchoolCreate, SchoolUpdate, SchoolRegistration, FreemiumRegistration
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
        
        # Create school owner as admin user
        admin_user = User(
            email=registration_data.admin_email,
            password_hash=get_password_hash(registration_data.admin_password),
            first_name=registration_data.admin_first_name,
            last_name=registration_data.admin_last_name,
            phone=registration_data.admin_phone,
            role=UserRole.SCHOOL_OWNER,
            school_id=school.id,
            is_active=True,
            is_verified=True
        )
        
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)
        
        return school, admin_user

    @staticmethod
    async def register_school_with_freemium_trial(
        db: AsyncSession,
        registration_data: FreemiumRegistration
    ) -> tuple[School, User]:
        """Register a new school with freemium trial access"""
        # Transform freemium registration data to school create data
        school_data = SchoolCreate(
            name=registration_data.school_name,
            code=registration_data.school_code,
            email=registration_data.email,
            phone=registration_data.phone,
            address_line1=registration_data.address,
            city=registration_data.city,
            state=registration_data.state,
            country=registration_data.country,
            postal_code=registration_data.postal_code or "00000",
            current_session=registration_data.current_session or "2024/2025",
            current_term=registration_data.current_term or "First Term"
        )

        # Check if school code already exists
        result = await db.execute(
            select(School).where(School.code == school_data.code, School.is_deleted == False)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School code already exists"
            )

        # Check if school email already exists
        result = await db.execute(
            select(School).where(School.email == school_data.email, School.is_deleted == False)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School email already exists"
            )

        # Check if admin email already exists
        result = await db.execute(
            select(User).where(User.email == registration_data.admin_email, User.is_deleted == False)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin email already exists"
            )

        # Create school with trial settings
        school = School(**school_data.dict())
        school.start_trial(days=30)  # Start 30-day trial
        school.billing_email = registration_data.admin_email

        db.add(school)
        await db.flush()  # Get the school ID

        # Create school owner as admin user
        # Split admin_name into first and last name
        name_parts = registration_data.admin_name.strip().split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        admin_user = User(
            email=registration_data.admin_email,
            password_hash=get_password_hash(registration_data.admin_password),
            first_name=first_name,
            last_name=last_name,
            phone=registration_data.phone,  # Use school phone as fallback
            role=UserRole.SCHOOL_OWNER,
            school_id=school.id,
            is_active=True,
            is_verified=True
        )

        db.add(admin_user)
        await db.commit()
        await db.refresh(school)
        await db.refresh(admin_user)

        # Send welcome email with trial information
        await SchoolService._send_trial_welcome_email(school, admin_user)

        return school, admin_user

    @staticmethod
    async def create_school_for_existing_owner(
        db: AsyncSession,
        school_data: SchoolCreate,
        owner_id: str
    ) -> School:
        """Create a new school for an existing school owner"""
        # Create school with trial settings
        school = School(**school_data.dict())
        school.start_trial(days=30)  # Start 30-day trial

        db.add(school)
        await db.flush()  # Get the school ID
        await db.commit()
        await db.refresh(school)

        return school

    @staticmethod
    async def _send_trial_welcome_email(school: School, admin_user: User):
        """Send welcome email for trial users"""
        try:
            from app.core.email import send_email

            subject = f"Welcome to School Management Platform - Your 30-Day Trial Starts Now!"

            html_content = f"""
            <h2>Welcome to School Management Platform!</h2>

            <p>Dear {admin_user.first_name},</p>

            <p>Congratulations! Your school <strong>{school.name}</strong> has been successfully registered on our platform.</p>

            <h3>🎉 Your Free Trial Details:</h3>
            <ul>
                <li><strong>Trial Duration:</strong> 30 days</li>
                <li><strong>Trial Expires:</strong> {school.trial_expires_at.strftime('%B %d, %Y')}</li>
                <li><strong>Students Limit:</strong> Up to {school.max_students} students</li>
                <li><strong>Teachers Limit:</strong> Up to {school.max_teachers} teachers</li>
                <li><strong>Classes Limit:</strong> Up to {school.max_classes} classes</li>
            </ul>

            <h3>🚀 What's Next?</h3>
            <ol>
                <li><strong>Login to your dashboard</strong> using your credentials</li>
                <li><strong>Complete your school setup</strong> - Add academic sessions, terms, and classes</li>
                <li><strong>Invite teachers</strong> to join your school</li>
                <li><strong>Add students</strong> and start managing your school</li>
                <li><strong>Explore all features</strong> during your free trial</li>
            </ol>

            <h3>📚 Full Access Features:</h3>
            <ul>
                <li>Student Management & Enrollment</li>
                <li>Teacher Portal & Class Management</li>
                <li>Fee Management & Payment Tracking</li>
                <li>Grade & Report Card Generation</li>
                <li>Communication Tools (SMS & Email)</li>
                <li>Comprehensive Reports & Analytics</li>
                <li>Mobile-Responsive Access</li>
            </ul>

            <p><strong>Login Details:</strong></p>
            <ul>
                <li><strong>Email:</strong> {admin_user.email}</li>
                <li><strong>School Code:</strong> {school.code}</li>
            </ul>

            <p>
                <a href="https://yourplatform.com/login"
                   style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">
                    Login to Your Dashboard
                </a>
            </p>

            <p>Need help getting started? Our support team is here to assist you at support@yourplatform.com</p>

            <p>Best regards,<br>
            The School Management Platform Team</p>
            """

            await send_email(
                to_email=admin_user.email,
                subject=subject,
                html_content=html_content
            )

        except Exception as e:
            # Log error but don't fail registration
            print(f"Failed to send welcome email: {e}")

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
