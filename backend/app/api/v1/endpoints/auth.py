from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    verify_token,
    get_password_hash,
    generate_password_reset_token,
    verify_password_reset_token
)
from app.core.deps import get_current_active_user, get_school_context, SchoolContext, get_current_user_id
from app.models.user import User, UserRole
from app.models.school import School
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    SchoolOption,
    SchoolSelectionRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest
)
from app.services.school_ownership_service import SchoolOwnershipService
from app.services.email_service import EmailService
from app.models.student import Student, StudentStatus
from app.schemas.auth import StudentLoginRequest
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from app.models.notification import NotificationType
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Login endpoint - Only for Platform Admins and School Owners"""
    try:
        # Get user by email
        result = await db.execute(
            select(User).where(
                User.email == login_data.email,
                User.is_deleted == False
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"❌ Unexpected error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    # Only Platform Admins and School Owners can use the main login endpoint
    # Teachers, students, and other roles must use their school's login page
    if user.role not in [UserRole.PLATFORM_SUPER_ADMIN, UserRole.SCHOOL_OWNER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please use your school's login page."
        )

    # Handle school owners - all school owners must select a school
    requires_school_selection = False
    available_schools = None
    school_id = user.school_id

    if user.role == UserRole.SCHOOL_OWNER:
        owned_schools = await SchoolOwnershipService.get_owned_schools(db, user.id)
        if len(owned_schools) > 0:
            requires_school_selection = True
            # Get ownership information for each school
            school_ownerships = await SchoolOwnershipService.get_user_ownerships(db, user.id)
            ownership_map = {ownership.school_id: ownership for ownership in school_ownerships}

            available_schools = [
                SchoolOption(
                    id=school.id,
                    name=school.name,
                    code=school.code,
                    logo_url=school.logo_url,
                    is_primary=ownership_map.get(school.id).is_primary_owner if ownership_map.get(school.id) else False
                )
                for school in owned_schools
            ]
            # Don't set school_id for school owners until they select
            school_id = None

    # Create tokens
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role, "school_id": school_id},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id, "email": user.email}
    )

    # Send login notification email
    try:
        from datetime import datetime
        
        # Get school name for email branding
        school_name = "School"
        if user.school_id:
            school_result = await db.execute(
                select(School).where(School.id == user.school_id)
            )
            school = school_result.scalar_one_or_none()
            if school:
                school_name = school.name
        
        html_content, text_content = EmailService.generate_login_notification_email(
            user_name=user.full_name,
            school_name=school_name,
            login_time=datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC"),
            device_info="Web Browser",
            ip_address="Unknown",
            location="Unknown"
        )
        
        await EmailService.send_email(
            to_emails=[user.email],
            subject=f"New Login Detected - {school_name}",
            html_content=html_content,
            text_content=text_content,
            sender_name=school_name
        )
        logger.info(f"Login notification email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send login notification email: {str(e)}")
        # Don't fail login if email fails

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        email=user.email,
        role=user.role,
        school_id=school_id,
        full_name=user.full_name,
        profile_completed=user.profile_completed,
        requires_school_selection=requires_school_selection,
        available_schools=available_schools
    )


@router.post("/school/{school_code}/login", response_model=LoginResponse)
async def school_login(
    school_code: str,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """School-specific login endpoint"""
    import sys
    print(f"🔐 [SCHOOL_LOGIN] Request received for school: {school_code}, email: {login_data.email}", flush=True)
    sys.stdout.flush()
    
    try:
        print(f"🔐 [SCHOOL_LOGIN] Executing database query...", flush=True)
        # First, verify the school exists and is active
        school_result = await db.execute(
            select(School).where(
                and_(
                    School.code == school_code.upper(),
                    School.is_deleted == False,
                    School.is_active == True
                )
            )
        )
        school = school_result.scalar_one_or_none()
        print(f"🔐 [SCHOOL_LOGIN] School query complete. Found: {school is not None}", flush=True)
        
        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found or inactive"
            )
        
        # First check if user exists with this email (regardless of school)
        user_result = await db.execute(
            select(User).where(
                and_(
                    User.email == login_data.email,
                    User.is_deleted == False
                )
            )
        )
        user_exists = user_result.scalar_one_or_none()
        
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Validate school access based on role
        # School owners need to own the school, other roles need to belong to it
        if user_exists.role == UserRole.SCHOOL_OWNER:
            # Check if user owns this school
            owned_schools = await SchoolOwnershipService.get_owned_schools(db, user_exists.id)
            school_ids = [s.id for s in owned_schools]
            if school.id not in school_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not own this school. Please use the correct school login page or contact support."
                )
        elif user_exists.role == UserRole.PLATFORM_SUPER_ADMIN:
            # Platform admins should not use school login pages
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Platform administrators should use the main platform login page."
            )
        else:
            # Teachers, students, and other roles must belong to this specific school
            if user_exists.school_id != school.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not belong to this school. Please use your school's login page or contact your school administrator."
                )
        
        user = user_exists

        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ [SCHOOL_LOGIN] ACTUAL ERROR: {type(e).__name__}: {e}", flush=True)
        print(f"❌ [SCHOOL_LOGIN] TRACEBACK:\n{error_trace}", flush=True)
        logger.exception(f"❌ Unexpected error during school login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )

    # Handle school owners - when logging in via school code, automatically log into that school
    # No school selection required since they explicitly chose this school by using its login page
    requires_school_selection = False
    available_schools = None
    school_id = school.id  # Use the school they're logging into

    # Create tokens with the school context
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role, "school_id": school_id},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id, "email": user.email}
    )

    # Send login notification email
    try:
        from datetime import datetime
        
        html_content, text_content = EmailService.generate_login_notification_email(
            user_name=user.full_name,
            school_name=school.name,
            login_time=datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC"),
            device_info="Web Browser",
            ip_address="Unknown",
            location="Unknown"
        )
        
        await EmailService.send_email(
            to_emails=[user.email],
            subject=f"New Login Detected - {school.name}",
            html_content=html_content,
            text_content=text_content,
            sender_name=school.name
        )
        logger.info(f"Login notification email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send login notification email: {str(e)}")
        # Don't fail login if email fails

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        email=user.email,
        role=user.role,
        school_id=school_id,
        full_name=user.full_name,
        profile_completed=user.profile_completed,
        requires_school_selection=requires_school_selection,
        available_schools=available_schools
    )


@router.post("/school/{school_code}/student/login", response_model=LoginResponse)
async def school_student_login(
    school_code: str,
    login_data: StudentLoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """School-specific student login using admission number and first name."""
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info(f"🔐 Student login attempt for school: {school_code}, admission: {login_data.admission_number}")

        # First, verify the school exists and is active
        school_result = await db.execute(
            select(School).where(
                and_(
                    School.code == school_code.upper(),
                    School.is_deleted == False,
                    School.is_active == True
                )
            )
        )
        school = school_result.scalar_one_or_none()

        if not school:
            logger.warning(f"❌ School not found or inactive: {school_code}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found or inactive"
            )

        # Find student by admission number and school
        result = await db.execute(
            select(Student).where(
                and_(
                    Student.admission_number == login_data.admission_number,
                    Student.school_id == school.id,
                    Student.is_deleted == False,
                    Student.status == StudentStatus.ACTIVE
                )
            )
        )
        student = result.scalar_one_or_none()
        if not student:
            logger.warning(f"❌ Student not found: {login_data.admission_number}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect admission number or first name")

        if (student.first_name or '').strip().lower() != login_data.first_name.strip().lower():
            logger.warning(f"❌ First name mismatch for student: {login_data.admission_number}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect admission number or first name")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error during school student login: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={
            "sub": student.id,
            "email": student.email or "",
            "role": UserRole.STUDENT,
            "school_id": student.school_id
        },
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": student.id, "email": student.email or "", "role": UserRole.STUDENT}
    )

    logger.info(f"✅ Student login successful: {student.full_name} ({student.admission_number})")

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=student.id,
        email=student.email or "",
        role=UserRole.STUDENT,
        school_id=student.school_id,
        full_name=student.full_name,
        profile_completed=True,  # Students are considered profile completed
        requires_school_selection=False,
        available_schools=None
    )


@router.post("/student/login", response_model=LoginResponse)
async def student_login(
    login_data: StudentLoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Student login - Disabled. Students must use school-specific login page."""
    # Students should always use their school's login page for proper school isolation
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Please use your school's login page to access your account. Visit your school's website for the login link."
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Refresh access token"""
    try:
        payload = verify_token(refresh_data.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Try to get user from database
        result = await db.execute(select(User).where(User.id == user_id, User.is_deleted == False))
        user = result.scalar_one_or_none()
        
        if user:
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account is inactive"
                )
            
            # Create new access token for user
            access_token_expires = timedelta(minutes=30)
            access_token = create_access_token(
                data={"sub": user.id, "email": user.email, "role": user.role, "school_id": user.school_id},
                expires_delta=access_token_expires
            )
            
            return RefreshTokenResponse(access_token=access_token)
            
        # If not user, try to get student
        result = await db.execute(select(Student).where(Student.id == user_id, Student.is_deleted == False))
        student = result.scalar_one_or_none()
        
        if student:
            if student.status != StudentStatus.ACTIVE:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Student account is inactive"
                )
                
            # Create new access token for student
            access_token_expires = timedelta(minutes=30)
            access_token = create_access_token(
                data={
                    "sub": student.id, 
                    "email": student.email or "", 
                    "role": UserRole.STUDENT, 
                    "school_id": student.school_id
                },
                expires_delta=access_token_expires
            )
            
            return RefreshTokenResponse(access_token=access_token)
        
        # Neither user nor student found
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/password-reset")
async def request_password_reset(
    reset_data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Request password reset"""
    # Check if user exists
    result = await db.execute(
        select(User).where(
            User.email == reset_data.email,
            User.is_deleted == False
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Get user's school for branding
    school_name = "School"
    school_logo = None
    if user.school_id:
        school_result = await db.execute(
            select(School).where(School.id == user.school_id)
        )
        school = school_result.scalar_one_or_none()
        if school:
            school_name = school.name
            school_logo = school.logo_url
    
    # Generate reset token
    reset_token = generate_password_reset_token(user.email)
    
    # Send email with reset token
    try:
        reset_url = f"{settings.frontend_url}/reset-password?token={reset_token}"
        
        # Build logo HTML if available
        logo_html = ""
        if school_logo:
            logo_html = f'<img src="{school_logo}" alt="{school_name}" style="max-height: 60px; margin-bottom: 15px;">'
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .header img {{ max-height: 60px; margin-bottom: 10px; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }}
                .warning {{ background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    {logo_html}
                    <h1>🔑 Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello {user.first_name},</h2>
                    
                    <p>You have requested to reset your password for your <strong>{school_name}</strong> account.</p>
                    
                    <p>Click the button below to reset your password:</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </div>
                    
                    <div class="warning">
                        <strong>⏰ This link will expire in 24 hours.</strong>
                    </div>
                    
                    <p>If you're unable to click the button, copy and paste this link:</p>
                    <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">{reset_url}</p>
                    
                    <p>If you did not request this password reset, please ignore this email or contact the school administrator.</p>
                    
                    <p>Best regards,<br>
                    The {school_name} Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated security message from {school_name}.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        🔑 Password Reset Request
        
        Hello {user.first_name},
        
        You have requested to reset your password for your {school_name} account.
        
        Click the link below to reset your password:
        {reset_url}
        
        ⏰ This link will expire in 24 hours.
        
        If you did not request this password reset, please ignore this email.
        
        Best regards,
        The {school_name} Team
        """
        
        email_sent = await EmailService.send_email(
            to_emails=[user.email],
            subject=f"Password Reset Request - {school_name}",
            html_content=html_content,
            text_content=text_content,
            sender_name=school_name
        )
        
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send password reset email. Please try again later."
            )
        
        logger.info(f"✅ Password reset email sent to {user.email}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"❌ Error sending password reset email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password reset email. Please try again later."
        )
    
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Confirm password reset"""
    email = verify_password_reset_token(reset_data.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    # Get user by email
    result = await db.execute(
        select(User).where(
            User.email == email,
            User.is_deleted == False
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.password_hash = get_password_hash(reset_data.new_password)
    await db.commit()
    
    # Notify User
    await NotificationService.create_notification(
        db=db,
        school_id=user.school_id,
        notification_data=NotificationCreate(
            user_id=user.id,
            title="Password Reset Successful",
            message="Your password has been successfully reset.",
            type=NotificationType.SUCCESS,
            link="/profile"
        )
    )
    
    return {"message": "Password has been reset successfully"}


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Change user password"""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    await db.commit()
    
    # Get school info for email
    school_name = "School"
    if current_user.school_id:
        school_result = await db.execute(
            select(School).where(School.id == current_user.school_id)
        )
        school = school_result.scalar_one_or_none()
        if school:
            school_name = school.name
    
    # Notify User (in-app)
    await NotificationService.create_notification(
        db=db,
        school_id=current_user.school_id,
        notification_data=NotificationCreate(
            user_id=current_user.id,
            title="Password Changed",
            message="Your password has been changed successfully.",
            type=NotificationType.SUCCESS,
            link="/profile"
        )
    )
    
    # Send password change email notification
    try:
        from datetime import datetime
        html_content, text_content = EmailService.generate_password_changed_email(
            user_name=current_user.full_name,
            school_name=school_name,
            change_time=datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")
        )
        
        await EmailService.send_email(
            to_emails=[current_user.email],
            subject=f"Password Changed - {school_name}",
            html_content=html_content,
            text_content=text_content,
            sender_name=school_name
        )
        logger.info(f"Password change email sent to {current_user.email}")
    except Exception as e:
        logger.error(f"Failed to send password change email: {str(e)}")
        # Don't fail if email fails
    
    return {"message": "Password changed successfully"}


@router.get("/me")
async def get_current_user_info(
    school_context: SchoolContext = Depends(get_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get current user information - handles both User and Student models"""

    # Get user_id from the user object in school_context
    current_user_id = school_context.user.id
    # Get school_id from JWT token (for school owners who switch schools)
    token_school_id = school_context.school_id

    # First try to get as a regular User
    result = await db.execute(
        select(User).where(User.id == current_user_id, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()

    if user:
        # For school owners, use the school_id from the JWT token (current session)
        # For other users, use their default school_id from the database
        effective_school_id = token_school_id if user.role == UserRole.SCHOOL_OWNER and token_school_id else user.school_id

        # Get school information if user has a school_id
        school_data = None
        if effective_school_id:
            school_result = await db.execute(
                select(School).where(School.id == effective_school_id, School.is_deleted == False)
            )
            school = school_result.scalar_one_or_none()
            if school:
                school_data = {
                    "id": school.id,
                    "name": school.name,
                    "code": school.code,
                    "email": school.email,
                    "phone": school.phone,
                    "website": school.website,
                    "address_line1": school.address_line1,
                    "address_line2": school.address_line2,
                    "city": school.city,
                    "state": school.state,
                    "postal_code": school.postal_code,
                    "country": school.country,
                    "description": school.description,
                    "logo_url": school.logo_url,
                    "motto": school.motto,
                    "established_year": school.established_year,
                    "current_session": school.current_session,
                    "current_term": school.current_term,
                    "settings": school.settings,
                    "is_active": school.is_active,
                    "is_verified": school.is_verified,
                    "subscription_plan": school.subscription_plan,
                    "subscription_status": school.subscription_status,
                    "trial_expires_at": school.trial_expires_at.isoformat() if school.trial_expires_at else None,
                    "max_students": school.max_students,
                    "max_teachers": school.max_teachers,
                    "max_classes": school.max_classes,
                    "created_at": school.created_at.isoformat(),
                    "updated_at": school.updated_at.isoformat()
                }
        
        # This is a regular user (teacher, admin, etc.)
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "school_id": effective_school_id,  # Use effective school_id (from token for school owners)
            "school": school_data,
            "school_code": school_data["code"] if school_data else None,  # Direct access to school code
            "school_name": school_data["name"] if school_data else None,  # Direct access to school name
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "profile_completed": user.profile_completed,
            "phone": user.phone,
            "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
            "gender": user.gender,
            "address_line1": user.address_line1,
            "address_line2": user.address_line2,
            "city": user.city,
            "state": user.state,
            "postal_code": user.postal_code,
            "qualification": user.qualification,
            "experience_years": user.experience_years,
            "bio": user.bio,
            "profile_picture_url": user.profile_picture_url,
            "department": user.department,
            "position": user.position
        }
    
    # If not found as User, try as Student
    result = await db.execute(
        select(Student).where(Student.id == current_user_id, Student.is_deleted == False)
    )
    student = result.scalar_one_or_none()
    
    if student:
        # Get school information if student has a school_id
        school_data = None
        if student.school_id:
            school_result = await db.execute(
                select(School).where(School.id == student.school_id, School.is_deleted == False)
            )
            school = school_result.scalar_one_or_none()
            if school:
                school_data = {
                    "id": school.id,
                    "name": school.name,
                    "code": school.code,
                    "email": school.email,
                    "phone": school.phone,
                    "website": school.website,
                    "address_line1": school.address_line1,
                    "address_line2": school.address_line2,
                    "city": school.city,
                    "state": school.state,
                    "postal_code": school.postal_code,
                    "country": school.country,
                    "description": school.description,
                    "logo_url": school.logo_url,
                    "motto": school.motto,
                    "established_year": school.established_year,
                    "current_session": school.current_session,
                    "current_term": school.current_term,
                    "settings": school.settings,
                    "is_active": school.is_active,
                    "is_verified": school.is_verified,
                    "subscription_plan": school.subscription_plan,
                    "subscription_status": school.subscription_status,
                    "trial_expires_at": school.trial_expires_at.isoformat() if school.trial_expires_at else None,
                    "max_students": school.max_students,
                    "max_teachers": school.max_teachers,
                    "max_classes": school.max_classes,
                    "created_at": school.created_at.isoformat(),
                    "updated_at": school.updated_at.isoformat()
                }
        
        # This is a student
        return {
            "id": student.id,
            "email": student.email or "",
            "full_name": student.full_name,
            "role": UserRole.STUDENT,
            "school_id": student.school_id,
            "school": school_data,
            "school_code": school_data["code"] if school_data else None,  # Direct access to school code
            "school_name": school_data["name"] if school_data else None,  # Direct access to school name
            "is_active": student.status == StudentStatus.ACTIVE,
            "is_verified": True,  # Students are considered verified upon login
            "profile_completed": True,  # Students are considered profile completed
            "phone": student.phone,
            "date_of_birth": student.date_of_birth.isoformat() if student.date_of_birth else None,
            "gender": student.gender,
            "address_line1": student.address_line1,
            "address_line2": student.address_line2,
            "city": student.city,
            "state": student.state,
            "postal_code": student.postal_code,
            "qualification": None,  # Not applicable for students
            "experience_years": None,  # Not applicable for students
            "bio": None,  # Not typically used for students
            "profile_picture_url": student.profile_picture_url,
            "department": None,  # Students don't have departments
            "position": None  # Students don't have positions
        }
    
    # If neither User nor Student found, return 404
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )


@router.post("/select-school", response_model=LoginResponse)
async def select_school(
    request: SchoolSelectionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Select a school for a school owner"""

    # Verify user is a school owner
    if current_user.role != UserRole.SCHOOL_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school owners can select schools"
        )

    # Verify user owns the selected school
    ownership = await SchoolOwnershipService.get_ownership_details(
        db, current_user.id, request.school_id
    )
    if not ownership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this school"
        )

    # Get school details
    result = await db.execute(
        select(School).where(
            School.id == request.school_id,
            School.is_deleted == False,
            School.is_active == True
        )
    )
    school = result.scalar_one_or_none()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )

    # Create new tokens with school context
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={
            "sub": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
            "school_id": school.id
        },
        expires_delta=access_token_expires
    )

    refresh_token = create_refresh_token(
        data={"sub": current_user.id, "email": current_user.email}
    )

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        school_id=school.id,
        full_name=current_user.full_name,
        profile_completed=current_user.profile_completed,
        requires_school_selection=False,
        available_schools=None
    )

