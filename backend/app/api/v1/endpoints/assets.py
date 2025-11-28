from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_school_admin, get_current_school_context, SchoolContext
from app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    AssetStats,
    AssetCategory,
    AssetCondition
)
from app.services.asset_service import AssetService

router = APIRouter()


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_data: AssetCreate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new asset (School Admin only)"""
    asset = await AssetService.create_asset(db, asset_data, school_context.school_id)
    return asset


@router.get("/", response_model=List[AssetResponse])
async def get_assets(
    category: Optional[AssetCategory] = Query(None, description="Filter by category"),
    condition: Optional[AssetCondition] = Query(None, description="Filter by condition"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in name, description, location, serial number"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all assets with optional filters"""
    skip = (page - 1) * size
    assets = await AssetService.get_assets(
        db,
        school_context.school_id,
        category=category,
        condition=condition,
        is_active=is_active,
        search=search,
        skip=skip,
        limit=size
    )
    return assets


@router.get("/stats", response_model=AssetStats)
async def get_asset_stats(
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get asset statistics"""
    stats = await AssetService.get_asset_stats(db, school_context.school_id)
    return stats


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: str,
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get asset by ID"""
    asset = await AssetService.get_asset_by_id(db, asset_id, school_context.school_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str,
    asset_data: AssetUpdate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update asset (School Admin only)"""
    asset = await AssetService.update_asset(
        db, asset_id, school_context.school_id, asset_data
    )
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Delete asset (School Admin only)"""
    success = await AssetService.delete_asset(db, asset_id, school_context.school_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
