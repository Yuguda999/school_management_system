from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_platform_admin_user
from app.models.user import User
from app.schemas.platform_admin import (
    SchoolOwnerCreate,
    SchoolOwnerResponse,
    SchoolOwnerUpdate,
    PlatformStatistics,
    SchoolDetailResponse,
    PlatformActivity,
    PlatformDashboardData,
    SchoolStatusUpdate,
    BulkSchoolAction,
    TrialStatistics
)
from app.services.platform_admin_service import PlatformAdminService

router = APIRouter()


@router.get("/dashboard", response_model=PlatformDashboardData)
async def get_platform_dashboard(
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get platform dashboard data"""
    
    # Get platform statistics
    statistics = await PlatformAdminService.get_platform_statistics(db)
    
    # Get recent schools (last 5)
    recent_schools_data = await PlatformAdminService.get_all_schools_with_details(
        db, skip=0, limit=5
    )
    recent_schools = [SchoolDetailResponse(**school) for school in recent_schools_data]
    
    # Get recent activity
    recent_activity_data = await PlatformAdminService.get_recent_platform_activity(db, limit=10)
    recent_activity = [PlatformActivity(**activity) for activity in recent_activity_data]

    # Get trial statistics
    trial_stats_data = await PlatformAdminService.get_trial_statistics(db)
    trial_stats = TrialStatistics(**trial_stats_data)

    return PlatformDashboardData(
        statistics=PlatformStatistics(**statistics),
        recent_schools=recent_schools,
        recent_activity=recent_activity,
        trial_statistics=trial_stats
    )


@router.get("/statistics", response_model=PlatformStatistics)
async def get_platform_statistics(
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get platform statistics"""
    
    stats = await PlatformAdminService.get_platform_statistics(db)
    return PlatformStatistics(**stats)


@router.get("/schools", response_model=List[SchoolDetailResponse])
async def get_all_schools(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all schools with filtering and pagination"""
    
    skip = (page - 1) * size
    schools_data = await PlatformAdminService.get_all_schools_with_details(
        db, skip=skip, limit=size, search=search, status_filter=status
    )
    
    return [SchoolDetailResponse(**school) for school in schools_data]


@router.put("/schools/{school_id}/status")
async def update_school_status(
    school_id: str,
    status_update: SchoolStatusUpdate,
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update school status (activate/deactivate, verify/unverify)"""
    
    from app.services.school_service import SchoolService
    from app.schemas.school import SchoolUpdate
    
    # Build update data
    update_data = {}
    if status_update.is_active is not None:
        update_data["is_active"] = status_update.is_active
    if status_update.is_verified is not None:
        update_data["is_verified"] = status_update.is_verified
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No status updates provided"
        )
    
    # Update school
    updated_school = await SchoolService.update_school(
        db, school_id, SchoolUpdate(**update_data)
    )
    
    if not updated_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    return {"message": "School status updated successfully"}


@router.post("/schools/bulk-action")
async def bulk_school_action(
    bulk_action: BulkSchoolAction,
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Perform bulk actions on schools"""
    
    from app.services.school_service import SchoolService
    from app.schemas.school import SchoolUpdate
    
    # Map actions to update data
    action_map = {
        "activate": {"is_active": True},
        "deactivate": {"is_active": False},
        "verify": {"is_verified": True},
        "unverify": {"is_verified": False}
    }
    
    update_data = action_map.get(bulk_action.action)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action"
        )
    
    # Update all schools
    updated_count = 0
    failed_schools = []
    
    for school_id in bulk_action.school_ids:
        try:
            updated_school = await SchoolService.update_school(
                db, school_id, SchoolUpdate(**update_data)
            )
            if updated_school:
                updated_count += 1
            else:
                failed_schools.append(school_id)
        except Exception as e:
            failed_schools.append(school_id)
    
    return {
        "message": f"Bulk action completed",
        "updated_count": updated_count,
        "failed_count": len(failed_schools),
        "failed_schools": failed_schools
    }


@router.get("/school-owners", response_model=List[SchoolOwnerResponse])
async def get_school_owners(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all school owners"""
    
    skip = (page - 1) * size
    owners = await PlatformAdminService.get_all_school_owners(db, skip=skip, limit=size)
    
    return [SchoolOwnerResponse.from_orm(owner) for owner in owners]


@router.post("/school-owners", response_model=SchoolOwnerResponse)
async def create_school_owner(
    owner_data: SchoolOwnerCreate,
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new school owner"""
    
    owner = await PlatformAdminService.create_school_owner(db, owner_data.dict())
    return SchoolOwnerResponse.from_orm(owner)


@router.put("/school-owners/{owner_id}")
async def update_school_owner(
    owner_id: str,
    owner_update: SchoolOwnerUpdate,
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a school owner"""
    
    from app.services.user_service import UserService
    from app.schemas.user import UserUpdate
    
    # Convert to UserUpdate
    update_data = owner_update.dict(exclude_unset=True)
    user_update = UserUpdate(**update_data)
    
    updated_owner = await UserService.update_user(db, owner_id, user_update)
    if not updated_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School owner not found"
        )
    
    return {"message": "School owner updated successfully"}


@router.delete("/school-owners/{owner_id}")
async def delete_school_owner(
    owner_id: str,
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete (soft delete) a school owner"""
    
    from app.services.user_service import UserService
    
    success = await UserService.delete_user(db, owner_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School owner not found"
        )
    
    return {"message": "School owner deleted successfully"}


@router.get("/trial-statistics", response_model=TrialStatistics)
async def get_trial_statistics(
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get trial statistics for freemium schools"""

    stats = await PlatformAdminService.get_trial_statistics(db)
    return TrialStatistics(**stats)


@router.get("/activity", response_model=List[PlatformActivity])
async def get_platform_activity(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_platform_admin_user()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get recent platform activity"""
    
    activities = await PlatformAdminService.get_recent_platform_activity(db, limit=limit)
    return [PlatformActivity(**activity) for activity in activities]
