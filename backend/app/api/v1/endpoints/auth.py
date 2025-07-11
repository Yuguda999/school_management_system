from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest
)

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
            # In development mode, provide more helpful error messages
            if settings.debug or settings.environment == "development":
                detail = f"Incorrect password for {user.email}. Hint: Check the test credentials in your documentation."
            else:
                detail = "Incorrect email or password"

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=detail
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
    
    # Create tokens
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role, "school_id": user.school_id},
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
        school_id=user.school_id,
        full_name=user.full_name
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
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "school_id": current_user.school_id,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified
    }


@router.get("/dev/test-credentials")
async def get_test_credentials(db: AsyncSession = Depends(get_db)) -> Any:
    """Get test credentials for development (only available in development mode)"""
    if not (settings.debug or settings.environment == "development"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )

    # Get sample users for testing
    result = await db.execute(
        select(User.email, User.first_name, User.last_name, User.role).where(
            User.is_deleted == False,
            User.is_active == True
        ).limit(5)
    )
    users = result.fetchall()

    test_credentials = []
    for user in users:
        # For development, we'll show a hint about the password
        full_name = f"{user.first_name} {user.last_name}".strip()
        test_credentials.append({
            "email": user.email,
            "full_name": full_name,
            "role": user.role,
            "password_hint": "Check your test documentation or memories for the password"
        })

    return {
        "message": "Development test credentials",
        "note": "This endpoint is only available in development mode",
        "credentials": test_credentials,
        "common_test_password": "P@$w0rd (for elemenx93@gmail.com)"
    }
