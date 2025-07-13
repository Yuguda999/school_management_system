from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
import logging
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_admin,
    require_super_admin,
    get_current_school
)
from app.models.user import User
from app.models.school import School
from app.models.teacher_invitation import TeacherInvitation, InvitationStatus
from app.schemas.teacher_invitation import (
    TeacherInvitationCreate,
    TeacherInvitationResponse,
    TeacherInvitationListResponse,
    InvitationAcceptRequest,
    InvitationAcceptResponse,
    InvitationStatusUpdate,
    InvitationResendRequest,
    InvitationValidationResponse
)
from app.services.teacher_invitation_service import TeacherInvitationService
import math

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=TeacherInvitationResponse)
async def create_teacher_invitation(
    invitation_data: TeacherInvitationCreate,
    request: Request,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create and send a teacher invitation (Admin/Super Admin only)"""
    
    # Get frontend base URL from request
    frontend_base_url = f"{request.url.scheme}://{request.url.hostname}"
    if request.url.port and request.url.port not in [80, 443]:
        frontend_base_url += f":{request.url.port}"
    
    # For development, use localhost:3000
    if "localhost" in str(request.url.hostname) or "127.0.0.1" in str(request.url.hostname):
        frontend_base_url = "http://localhost:3000"
    
    invitation = await TeacherInvitationService.create_invitation(
        db=db,
        invitation_data=invitation_data,
        school_id=current_school.id,
        invited_by_user_id=current_user.id,
        frontend_base_url=frontend_base_url
    )
    
    return TeacherInvitationResponse.from_orm(invitation)


@router.get("/", response_model=TeacherInvitationListResponse)
async def get_teacher_invitations(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[InvitationStatus] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get teacher invitations with pagination and filtering (Admin/Super Admin only)"""
    
    skip = (page - 1) * size
    
    # Build query
    query = select(TeacherInvitation).where(
        and_(
            TeacherInvitation.school_id == current_school.id,
            TeacherInvitation.is_deleted == False
        )
    )
    
    # Add status filter
    if status:
        query = query.where(TeacherInvitation.status == status)
    
    # Add search filter
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                TeacherInvitation.first_name.ilike(search_filter),
                TeacherInvitation.last_name.ilike(search_filter),
                TeacherInvitation.email.ilike(search_filter),
                TeacherInvitation.department.ilike(search_filter)
            )
        )
    
    # Get total count
    count_query = select(func.count(TeacherInvitation.id)).where(
        and_(
            TeacherInvitation.school_id == current_school.id,
            TeacherInvitation.is_deleted == False
        )
    )
    if status:
        count_query = count_query.where(TeacherInvitation.status == status)
    if search:
        search_filter = f"%{search}%"
        count_query = count_query.where(
            or_(
                TeacherInvitation.first_name.ilike(search_filter),
                TeacherInvitation.last_name.ilike(search_filter),
                TeacherInvitation.email.ilike(search_filter),
                TeacherInvitation.department.ilike(search_filter)
            )
        )
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get invitations
    query = query.order_by(TeacherInvitation.invited_at.desc()).offset(skip).limit(size)
    result = await db.execute(query)
    invitations = result.scalars().all()
    
    pages = math.ceil(total / size) if total > 0 else 1
    
    return TeacherInvitationListResponse(
        invitations=[TeacherInvitationResponse.from_orm(inv) for inv in invitations],
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{invitation_id}", response_model=TeacherInvitationResponse)
async def get_teacher_invitation(
    invitation_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific teacher invitation (Admin/Super Admin only)"""
    
    result = await db.execute(
        select(TeacherInvitation).where(
            and_(
                TeacherInvitation.id == invitation_id,
                TeacherInvitation.school_id == current_school.id,
                TeacherInvitation.is_deleted == False
            )
        )
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher invitation not found"
        )
    
    return TeacherInvitationResponse.from_orm(invitation)


@router.put("/{invitation_id}/status", response_model=TeacherInvitationResponse)
async def update_invitation_status(
    invitation_id: str,
    status_data: InvitationStatusUpdate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update teacher invitation status (Admin/Super Admin only)"""
    
    result = await db.execute(
        select(TeacherInvitation).where(
            and_(
                TeacherInvitation.id == invitation_id,
                TeacherInvitation.school_id == current_school.id,
                TeacherInvitation.is_deleted == False
            )
        )
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher invitation not found"
        )
    
    invitation.status = status_data.status
    await db.commit()
    await db.refresh(invitation)
    
    return TeacherInvitationResponse.from_orm(invitation)


@router.post("/resend", response_model=TeacherInvitationResponse)
async def resend_teacher_invitation(
    resend_data: InvitationResendRequest,
    request: Request,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Resend a teacher invitation (Admin/Super Admin only)"""
    
    result = await db.execute(
        select(TeacherInvitation).where(
            and_(
                TeacherInvitation.id == resend_data.invitation_id,
                TeacherInvitation.school_id == current_school.id,
                TeacherInvitation.is_deleted == False
            )
        )
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher invitation not found"
        )
    
    if invitation.status == InvitationStatus.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot resend an accepted invitation"
        )
    
    # Update invitation with new token and expiry
    invitation.invitation_token = TeacherInvitation.create_invitation_token()
    invitation.expires_at = TeacherInvitation.get_expiry_time(resend_data.new_expiry_hours)
    invitation.status = InvitationStatus.PENDING

    await db.commit()
    await db.refresh(invitation)

    # Get school information for email
    school_result = await db.execute(
        select(School).where(School.id == current_school.id)
    )
    school = school_result.scalar_one_or_none()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )

    # Get inviter information
    inviter_result = await db.execute(
        select(User).where(User.id == current_user.id)
    )
    inviter = inviter_result.scalar_one_or_none()
    if not inviter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inviter not found"
        )

    # Send resend invitation email
    frontend_base_url = f"{request.url.scheme}://{request.url.hostname}"
    if request.url.port and request.url.port not in [80, 443]:
        frontend_base_url += f":{request.url.port}"

    # For development, use localhost:3000
    if "localhost" in str(request.url.hostname) or "127.0.0.1" in str(request.url.hostname):
        frontend_base_url = "http://localhost:3000"

    invitation_link = f"{frontend_base_url}/teacher/accept-invitation?token={invitation.invitation_token}"

    logger.info(f"About to send resend invitation email to {invitation.email}")
    logger.info(f"Invitation link: {invitation_link}")

    try:
        logger.info("Starting email sending process for resend invitation")
        from app.services.email_service import EmailService
        logger.info("EmailService imported successfully")

        html_content, text_content = EmailService.generate_teacher_invitation_email(
            teacher_name=invitation.full_name,
            school_name=school.name,
            invitation_link=invitation_link,
            invited_by_name=inviter.full_name,
            expires_hours=resend_data.new_expiry_hours
        )
        logger.info("Email content generated successfully")

        email_sent = await EmailService.send_email(
            to_emails=[invitation.email],
            subject=f"Invitation Resent - Join {school.name} as a Teacher",
            html_content=html_content,
            text_content=text_content
        )
        logger.info(f"Email sending completed. Result: {email_sent}")

        if not email_sent:
            logger.warning(f"Failed to send resend invitation email to {invitation.email}")
            # Don't fail the resend if email fails, but log it
        else:
            logger.info(f"Resend invitation email sent successfully to {invitation.email}")

    except Exception as e:
        logger.error(f"Error sending resend invitation email: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Don't fail the resend if email fails, but log it

    return TeacherInvitationResponse.from_orm(invitation)


@router.delete("/{invitation_id}")
async def delete_teacher_invitation(
    invitation_id: str,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete (soft delete) a teacher invitation (Admin/Super Admin only)"""
    
    result = await db.execute(
        select(TeacherInvitation).where(
            and_(
                TeacherInvitation.id == invitation_id,
                TeacherInvitation.school_id == current_school.id,
                TeacherInvitation.is_deleted == False
            )
        )
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher invitation not found"
        )
    
    invitation.is_deleted = True
    await db.commit()
    
    return {"message": "Teacher invitation deleted successfully"}


# Public endpoints for invitation acceptance (no authentication required)

@router.get("/public/validate/{token}", response_model=InvitationValidationResponse)
async def validate_invitation_token(
    token: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Validate invitation token (public endpoint)"""
    
    is_valid, invitation, message = await TeacherInvitationService.validate_invitation_token(
        db, token
    )
    
    return InvitationValidationResponse(
        valid=is_valid,
        invitation=TeacherInvitationResponse.from_orm(invitation) if invitation else None,
        message=message
    )


@router.post("/public/accept", response_model=InvitationAcceptResponse)
async def accept_teacher_invitation(
    accept_data: InvitationAcceptRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Accept teacher invitation and create account (public endpoint)"""
    
    user, access_token, refresh_token = await TeacherInvitationService.accept_invitation(
        db, accept_data
    )
    
    return InvitationAcceptResponse(
        message="Invitation accepted successfully. Welcome to the team!",
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        user_email=user.email,
        user_role=user.role,
        school_id=user.school_id,
        full_name=user.full_name,
        profile_completed=user.profile_completed
    )
