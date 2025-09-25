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
from app.core.deps import get_current_active_user, get_school_context, SchoolContext
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

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Login endpoint"""
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
            # In development mode, provide more helpful error messages
            if settings.debug or settings.environment == "development":
                # Get a sample of available users for development
                sample_result = await db.execute(
                    select(User.email, User.first_name, User.last_name).where(User.is_deleted == False).limit(3)
                )
                sample_users = sample_result.fetchall()
                sample_emails = [f"{row.email} ({row.first_name} {row.last_name})" for row in sample_users]

                detail = f"User not found with email: {login_data.email}. Available test users: {', '.join(sample_emails)}"
            else:
                detail = "Incorrect email or password"

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=detail
            )

        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
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
    try:
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found or inactive"
            )
        
        # Get user by email and school_id
        result = await db.execute(
            select(User).where(
                and_(
                    User.email == login_data.email,
                    User.school_id == school.id,
                    User.is_deleted == False
                )
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
        print(f"❌ Unexpected error during school login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
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
        
        # Get user from database
        result = await db.execute(select(User).where(User.id == user_id, User.is_deleted == False))
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new access token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role, "school_id": user.school_id},
            expires_delta=access_token_expires
        )
        
        return RefreshTokenResponse(access_token=access_token)
        
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
    
    # Generate reset token
    reset_token = generate_password_reset_token(user.email)
    
    # TODO: Send email with reset token
    # For now, just return success message
    
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
    
    return {"message": "Password changed successfully"}


@router.get("/me")
async def get_current_user_info(
    school_context: SchoolContext = Depends(get_school_context)
) -> Any:
    """Get current user information with current school context"""
    current_user = school_context.user
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "school_id": school_context.school_id,  # Use school_id from JWT context
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "profile_completed": current_user.profile_completed,
        "phone": current_user.phone,
        "date_of_birth": current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,
        "gender": current_user.gender,
        "address_line1": current_user.address_line1,
        "address_line2": current_user.address_line2,
        "city": current_user.city,
        "state": current_user.state,
        "postal_code": current_user.postal_code,
        "qualification": current_user.qualification,
        "experience_years": current_user.experience_years,
        "bio": current_user.bio,
        "profile_picture_url": current_user.profile_picture_url,
        "department": current_user.department,
        "position": current_user.position
    }


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

