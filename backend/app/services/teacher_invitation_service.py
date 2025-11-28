from typing import Optional, List
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from fastapi import HTTPException, status
from app.models.teacher_invitation import TeacherInvitation, InvitationStatus
from app.models.user import User, UserRole
from app.models.school import School
from app.schemas.teacher_invitation import (
    TeacherInvitationCreate,
    InvitationAcceptRequest,
    InvitationStatusUpdate
)
from app.services.email_service import EmailService
from app.services.user_service import UserService
from app.core.security import get_password_hash, create_access_token, create_refresh_token
from app.core.config import settings
import logging
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from app.models.notification import NotificationType

logger = logging.getLogger(__name__)


class TeacherInvitationService:
    """Service for managing teacher invitations"""
    
    @staticmethod
    async def create_invitation(
        db: AsyncSession,
        invitation_data: TeacherInvitationCreate,
        school_id: str,
        invited_by_user_id: str,
        frontend_base_url: str = "http://localhost:3000"
    ) -> TeacherInvitation:
        """Create and send a teacher invitation"""
        
        # Check if email already exists as a user in this school
        existing_user = await db.execute(
            select(User).where(
                and_(
                    User.email == invitation_data.email,
                    User.school_id == school_id,
                    User.is_deleted == False
                )
            )
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists in this school"
            )
        
        # Check if there's already a pending invitation for this email
        existing_invitation = await db.execute(
            select(TeacherInvitation).where(
                and_(
                    TeacherInvitation.email == invitation_data.email,
                    TeacherInvitation.school_id == school_id,
                    TeacherInvitation.status == InvitationStatus.PENDING,
                    TeacherInvitation.is_deleted == False
                )
            )
        )
        if existing_invitation.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A pending invitation already exists for this email"
            )
        
        # Get school information for email
        school_result = await db.execute(
            select(School).where(School.id == school_id)
        )
        school = school_result.scalar_one_or_none()
        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found"
            )
        
        # Get inviter information
        inviter_result = await db.execute(
            select(User).where(User.id == invited_by_user_id)
        )
        inviter = inviter_result.scalar_one_or_none()
        if not inviter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inviter not found"
            )
        
        # Create invitation
        invitation_token = TeacherInvitation.create_invitation_token()
        expires_at = TeacherInvitation.get_expiry_time(72)  # 72 hours
        
        invitation = TeacherInvitation(
            email=invitation_data.email,
            first_name=invitation_data.first_name,
            last_name=invitation_data.last_name,
            department=invitation_data.department,
            position=invitation_data.position,
            invitation_message=invitation_data.invitation_message,
            invitation_token=invitation_token,
            expires_at=expires_at,
            invited_by=invited_by_user_id,
            school_id=school_id
        )
        
        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)
        
        # Send invitation email
        invitation_link = f"{frontend_base_url}/teacher/accept-invitation?token={invitation_token}"
        
        try:
            html_content, text_content = EmailService.generate_teacher_invitation_email(
                teacher_name=invitation.full_name,
                school_name=school.name,
                invitation_link=invitation_link,
                invited_by_name=inviter.full_name,
                expires_hours=72
            )
            
            email_sent = await EmailService.send_email(
                to_emails=[invitation.email],
                subject=f"Invitation to Join {school.name} as a Teacher",
                html_content=html_content,
                text_content=text_content
            )
            
            if not email_sent:
                logger.warning(f"Failed to send invitation email to {invitation.email}")
                # Don't fail the invitation creation if email fails
                
        except Exception as e:
            logger.error(f"Error sending invitation email: {str(e)}")
            # Don't fail the invitation creation if email fails
        
        return invitation
    
    @staticmethod
    async def get_invitation_by_token(
        db: AsyncSession,
        token: str
    ) -> Optional[TeacherInvitation]:
        """Get invitation by token"""
        result = await db.execute(
            select(TeacherInvitation).where(
                and_(
                    TeacherInvitation.invitation_token == token,
                    TeacherInvitation.is_deleted == False
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def validate_invitation_token(
        db: AsyncSession,
        token: str
    ) -> tuple[bool, Optional[TeacherInvitation], str]:
        """
        Validate invitation token
        
        Returns:
            tuple: (is_valid, invitation, message)
        """
        invitation = await TeacherInvitationService.get_invitation_by_token(db, token)
        
        if not invitation:
            return False, None, "Invalid invitation token"
        
        if invitation.status != InvitationStatus.PENDING:
            return False, invitation, f"Invitation has already been {invitation.status.value}"
        
        if invitation.is_expired:
            # Update status to expired
            invitation.status = InvitationStatus.EXPIRED
            await db.commit()
            return False, invitation, "Invitation has expired"
        
        return True, invitation, "Invitation is valid"
    
    @staticmethod
    async def accept_invitation(
        db: AsyncSession,
        accept_data: InvitationAcceptRequest
    ) -> tuple[User, str, str]:
        """
        Accept teacher invitation and create user account
        
        Returns:
            tuple: (user, access_token, refresh_token)
        """
        # Validate invitation
        is_valid, invitation, message = await TeacherInvitationService.validate_invitation_token(
            db, accept_data.invitation_token
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        logger.info(f"Invitation validated successfully: {invitation.id}, email: {invitation.email}, first_name: {invitation.first_name}, last_name: {invitation.last_name}")
        
        # Validate invitation email
        if not invitation.email or invitation.email.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid invitation: email not provided"
            )
        
        # Check if user already exists (shouldn't happen, but safety check)
        existing_user = await db.execute(
            select(User).where(
                and_(
                    User.email == invitation.email,
                    User.school_id == invitation.school_id,
                    User.is_deleted == False
                )
            )
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account already exists for this email"
            )
        
        # Create user account
        logger.info(f"Creating user account for invitation: {invitation.id}, email: {invitation.email}")
        user_data = {
            'first_name': invitation.first_name,
            'last_name': invitation.last_name,
            'email': invitation.email,
            'password_hash': get_password_hash(accept_data.password),
            'role': UserRole.TEACHER,
            'is_active': True,
            'school_id': invitation.school_id,
            'phone': accept_data.phone,
            'date_of_birth': datetime.strptime(accept_data.date_of_birth, '%Y-%m-%d').date() if accept_data.date_of_birth else None,
            'gender': accept_data.gender,
            'qualification': accept_data.qualification,
            'experience_years': accept_data.experience_years,
            'bio': accept_data.bio,
            'address_line1': accept_data.address_line1,
            'address_line2': accept_data.address_line2,
            'city': accept_data.city,
            'state': accept_data.state,
            'postal_code': accept_data.postal_code,
            'department': invitation.department,
            'position': invitation.position
        }
        
        # Remove None values
        user_data = {k: v for k, v in user_data.items() if v is not None}
        
        logger.info(f"Creating user with data: {user_data}")
        try:
            user = User(**user_data)
            db.add(user)

            # Update profile completion status
            user.update_profile_completion_status()

            # Update invitation status
            invitation.status = InvitationStatus.ACCEPTED
            invitation.accepted_at = datetime.utcnow()

            await db.commit()
            await db.refresh(user)

            # Notify the inviter
            if invitation.invited_by:
                await NotificationService.create_notification(
                    db=db,
                    school_id=invitation.school_id,
                    notification_data=NotificationCreate(
                        user_id=invitation.invited_by,
                        title="Invitation Accepted",
                        message=f"{user.first_name} {user.last_name} has accepted your invitation to join as a teacher.",
                        type=NotificationType.SUCCESS,
                        link=f"/teachers/{user.id}"
                    )
                )

        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user account: {str(e)}"
            )
        
        # Create tokens
        from datetime import timedelta
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role, "school_id": user.school_id},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        refresh_token = create_refresh_token(
            data={"sub": user.id, "email": user.email}
        )
        
        return user, access_token, refresh_token
