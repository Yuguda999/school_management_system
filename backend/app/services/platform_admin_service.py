from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
import uuid
import string

from app.models.school import School
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import Class, Subject, Term
from app.schemas.user import UserCreate
from app.core.security import get_password_hash


class PlatformAdminService:
    """Service class for platform admin operations"""
    
    @staticmethod
    async def get_platform_statistics(db: AsyncSession) -> Dict[str, Any]:
        """Get comprehensive platform statistics"""
        
        # Total schools
        total_schools_result = await db.execute(
            select(func.count(School.id)).where(School.is_deleted == False)
        )
        total_schools = total_schools_result.scalar() or 0
        
        # Active schools
        active_schools_result = await db.execute(
            select(func.count(School.id)).where(
                and_(School.is_deleted == False, School.is_active == True)
            )
        )
        active_schools = active_schools_result.scalar() or 0
        
        # Total school owners
        school_owners_result = await db.execute(
            select(func.count(User.id)).where(
                and_(
                    User.is_deleted == False,
                    User.role == UserRole.SCHOOL_OWNER
                )
            )
        )
        total_school_owners = school_owners_result.scalar() or 0
        
        # Trial schools count
        trial_schools_result = await db.execute(
            select(func.count(School.id)).where(
                and_(
                    School.subscription_plan == "trial",
                    School.is_deleted == False
                )
            )
        )
        total_trial_schools = trial_schools_result.scalar() or 0
        
        # Schools created this month
        current_month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        schools_this_month_result = await db.execute(
            select(func.count(School.id)).where(
                and_(
                    School.is_deleted == False,
                    School.created_at >= current_month_start
                )
            )
        )
        schools_this_month = schools_this_month_result.scalar() or 0
        
        # Calculate growth percentages (mock for now - would need historical data)
        schools_growth = "+15%" if schools_this_month > 0 else "0%"
        school_owners_growth = "+10%"
        trial_schools_growth = "+25%"
        monthly_growth = "+12%"

        return {
            "total_schools": total_schools,
            "active_schools": active_schools,
            "total_school_owners": total_school_owners,
            "schools_this_month": schools_this_month,
            "growth_metrics": {
                "schools": schools_growth,
                "school_owners": school_owners_growth,
                "trial_schools": trial_schools_growth,
                "monthly_growth": monthly_growth
            }
        }
    
    @staticmethod
    async def get_all_schools_with_details(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all schools with detailed information"""
        
        query = select(School).options(
            selectinload(School.users)
        ).where(School.is_deleted == False)
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.where(
                School.name.ilike(search_term) |
                School.code.ilike(search_term) |
                School.email.ilike(search_term)
            )
        
        # Apply status filter
        if status_filter == "active":
            query = query.where(School.is_active == True)
        elif status_filter == "inactive":
            query = query.where(School.is_active == False)
        elif status_filter == "verified":
            query = query.where(School.is_verified == True)
        elif status_filter == "unverified":
            query = query.where(School.is_verified == False)
        
        query = query.order_by(desc(School.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        schools = result.scalars().all()
        
        schools_data = []
        for school in schools:
            # Get school owner
            owner = next((user for user in school.users if user.role == UserRole.SCHOOL_OWNER), None)
            
            # Get student count
            student_count_result = await db.execute(
                select(func.count(Student.id)).where(
                    and_(Student.school_id == school.id, Student.is_deleted == False)
                )
            )
            student_count = student_count_result.scalar() or 0
            
            # Get teacher count
            teacher_count_result = await db.execute(
                select(func.count(User.id)).where(
                    and_(
                        User.school_id == school.id,
                        User.role == UserRole.TEACHER,
                        User.is_deleted == False
                    )
                )
            )
            teacher_count = teacher_count_result.scalar() or 0
            
            # Build address string from individual fields
            address_parts = [school.address_line1]
            if school.address_line2:
                address_parts.append(school.address_line2)
            address_parts.extend([school.city, school.state, school.postal_code])
            address = ", ".join(filter(None, address_parts))

            schools_data.append({
                "id": school.id,
                "name": school.name,
                "code": school.code,
                "email": school.email,
                "phone": school.phone,
                "address": address,
                "owner_name": owner.full_name if owner else "No Owner",
                "owner_email": owner.email if owner else "",
                "is_active": school.is_active,
                "is_verified": school.is_verified,
                "created_at": school.created_at.isoformat(),
                "student_count": student_count,
                "teacher_count": teacher_count,
                "last_activity": school.updated_at.isoformat() if school.updated_at else None
            })
        
        return schools_data
    
    @staticmethod
    async def create_school_owner(
        db: AsyncSession,
        owner_data: Dict[str, Any]
    ) -> User:
        """Create a new school owner"""
        
        # Check if email already exists
        result = await db.execute(
            select(User).where(
                and_(User.email == owner_data["email"], User.is_deleted == False)
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        
        # Generate a temporary password
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        # Create school owner
        school_owner = User(
            email=owner_data["email"],
            password_hash=get_password_hash(temp_password),
            first_name=owner_data["first_name"],
            last_name=owner_data["last_name"],
            phone=owner_data.get("phone"),
            role=UserRole.SCHOOL_OWNER,
            school_id=None,  # School owners don't belong to a school initially
            is_active=True,
            is_verified=False  # They need to verify their email
        )
        
        db.add(school_owner)
        await db.commit()
        await db.refresh(school_owner)
        
        # Store the temporary password for return (in real app, send via email)
        school_owner.temp_password = temp_password
        
        return school_owner
    
    @staticmethod
    async def get_all_school_owners(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Get all school owners"""
        
        result = await db.execute(
            select(User).where(
                and_(
                    User.role == UserRole.SCHOOL_OWNER,
                    User.is_deleted == False
                )
            ).order_by(desc(User.created_at)).offset(skip).limit(limit)
        )
        
        return result.scalars().all()
    
    @staticmethod
    async def get_recent_platform_activity(
        db: AsyncSession,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent platform activity"""
        
        activities = []
        
        # Recent school registrations
        recent_schools_result = await db.execute(
            select(School).where(School.is_deleted == False)
            .order_by(desc(School.created_at)).limit(5)
        )
        recent_schools = recent_schools_result.scalars().all()
        
        for school in recent_schools:
            activities.append({
                "type": "school_registered",
                "title": f"New school registered: {school.name}",
                "description": f"School code: {school.code}",
                "timestamp": school.created_at.isoformat(),
                "icon": "building"
            })
        
        # Recent school owner creations
        recent_owners_result = await db.execute(
            select(User).where(
                and_(
                    User.role == UserRole.SCHOOL_OWNER,
                    User.is_deleted == False
                )
            ).order_by(desc(User.created_at)).limit(5)
        )
        recent_owners = recent_owners_result.scalars().all()
        
        for owner in recent_owners:
            activities.append({
                "type": "owner_created",
                "title": f"New school owner: {owner.full_name}",
                "description": f"Email: {owner.email}",
                "timestamp": owner.created_at.isoformat(),
                "icon": "user"
            })
        
        # Sort by timestamp and limit
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities[:limit]

    @staticmethod
    async def get_trial_statistics(db: AsyncSession) -> Dict[str, Any]:
        """Get trial statistics for freemium schools"""

        # Total trial schools
        total_trial_result = await db.execute(
            select(func.count(School.id)).where(
                and_(
                    School.subscription_plan == "trial",
                    School.is_deleted == False
                )
            )
        )
        total_trial_schools = total_trial_result.scalar() or 0

        # Active trials (not expired)
        active_trials_result = await db.execute(
            select(func.count(School.id)).where(
                and_(
                    School.subscription_plan == "trial",
                    School.subscription_status == "trial",
                    School.trial_expires_at > datetime.now(timezone.utc),
                    School.is_deleted == False
                )
            )
        )
        active_trials = active_trials_result.scalar() or 0

        # Expired trials
        expired_trials_result = await db.execute(
            select(func.count(School.id)).where(
                and_(
                    School.subscription_plan == "trial",
                    School.trial_expires_at <= datetime.now(timezone.utc),
                    School.is_deleted == False
                )
            )
        )
        expired_trials = expired_trials_result.scalar() or 0

        # Converted trials (upgraded to paid plans)
        converted_trials_result = await db.execute(
            select(func.count(School.id)).where(
                and_(
                    School.subscription_plan.in_(["starter", "professional", "enterprise"]),
                    School.trial_started_at.isnot(None),  # Had a trial
                    School.is_deleted == False
                )
            )
        )
        converted_trials = converted_trials_result.scalar() or 0

        # Trials expiring soon (next 7 days)
        expiring_soon_date = datetime.now(timezone.utc) + timedelta(days=7)
        expiring_soon_result = await db.execute(
            select(func.count(School.id)).where(
                and_(
                    School.subscription_plan == "trial",
                    School.subscription_status == "trial",
                    School.trial_expires_at <= expiring_soon_date,
                    School.trial_expires_at > datetime.now(timezone.utc),
                    School.is_deleted == False
                )
            )
        )
        trials_expiring_soon = expiring_soon_result.scalar() or 0

        # Calculate conversion rate
        total_trials_ever = total_trial_schools + converted_trials
        trial_conversion_rate = (converted_trials / total_trials_ever * 100) if total_trials_ever > 0 else 0.0

        # Calculate average trial duration for converted schools
        avg_duration_result = await db.execute(
            select(func.avg(
                func.extract('epoch', School.updated_at) - func.extract('epoch', School.trial_started_at)
            ) / 86400).where(  # Convert seconds to days
                and_(
                    School.subscription_plan.in_(["starter", "professional", "enterprise"]),
                    School.trial_started_at.isnot(None),
                    School.is_deleted == False
                )
            )
        )
        average_trial_duration = avg_duration_result.scalar() or 0.0

        return {
            "total_trial_schools": total_trial_schools,
            "active_trials": active_trials,
            "expired_trials": expired_trials,
            "converted_trials": converted_trials,
            "trial_conversion_rate": round(trial_conversion_rate, 2),
            "average_trial_duration": round(average_trial_duration, 1),
            "trials_expiring_soon": trials_expiring_soon
        }
