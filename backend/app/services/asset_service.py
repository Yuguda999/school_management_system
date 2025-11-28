from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from sqlalchemy.orm import selectinload
from app.models.asset import Asset, AssetCategory, AssetCondition
from app.schemas.asset import AssetCreate, AssetUpdate, AssetStats


class AssetService:
    @staticmethod
    async def create_asset(
        db: AsyncSession,
        asset_data: AssetCreate,
        school_id: str
    ) -> Asset:
        """Create a new asset"""
        asset = Asset(
            school_id=school_id,
            **asset_data.model_dump()
        )
        db.add(asset)
        await db.commit()
        await db.refresh(asset)
        return asset

    @staticmethod
    async def get_assets(
        db: AsyncSession,
        school_id: str,
        category: Optional[AssetCategory] = None,
        condition: Optional[AssetCondition] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Asset]:
        """Get all assets with optional filters"""
        query = select(Asset).where(
            Asset.school_id == school_id,
            Asset.is_deleted == False
        )

        if category:
            query = query.where(Asset.category == category)
        
        if condition:
            query = query.where(Asset.condition == condition)
        
        if is_active is not None:
            query = query.where(Asset.is_active == is_active)
        
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                (Asset.name.ilike(search_filter)) |
                (Asset.description.ilike(search_filter)) |
                (Asset.location.ilike(search_filter)) |
                (Asset.serial_number.ilike(search_filter))
            )

        query = query.offset(skip).limit(limit).order_by(Asset.created_at.desc())
        
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_asset_by_id(
        db: AsyncSession,
        asset_id: str,
        school_id: str
    ) -> Optional[Asset]:
        """Get asset by ID"""
        result = await db.execute(
            select(Asset).where(
                Asset.id == asset_id,
                Asset.school_id == school_id,
                Asset.is_deleted == False
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_asset(
        db: AsyncSession,
        asset_id: str,
        school_id: str,
        asset_data: AssetUpdate
    ) -> Optional[Asset]:
        """Update an asset"""
        asset = await AssetService.get_asset_by_id(db, asset_id, school_id)
        if not asset:
            return None

        update_data = asset_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(asset, field, value)

        await db.commit()
        await db.refresh(asset)
        return asset

    @staticmethod
    async def delete_asset(
        db: AsyncSession,
        asset_id: str,
        school_id: str
    ) -> bool:
        """Soft delete an asset"""
        asset = await AssetService.get_asset_by_id(db, asset_id, school_id)
        if not asset:
            return False

        asset.is_deleted = True
        await db.commit()
        return True

    @staticmethod
    async def get_asset_stats(
        db: AsyncSession,
        school_id: str
    ) -> AssetStats:
        """Get asset statistics for a school"""
        # Total assets
        total_result = await db.execute(
            select(func.count(Asset.id)).where(
                Asset.school_id == school_id,
                Asset.is_deleted == False
            )
        )
        total_assets = total_result.scalar() or 0

        # Total value
        value_result = await db.execute(
            select(func.sum(Asset.purchase_price * Asset.quantity)).where(
                Asset.school_id == school_id,
                Asset.is_deleted == False,
                Asset.purchase_price.isnot(None)
            )
        )
        total_value = value_result.scalar() or 0.0

        # By category
        category_result = await db.execute(
            select(
                Asset.category,
                func.count(Asset.id)
            ).where(
                Asset.school_id == school_id,
                Asset.is_deleted == False
            ).group_by(Asset.category)
        )
        by_category = {cat: count for cat, count in category_result.all()}

        # By condition
        condition_result = await db.execute(
            select(
                Asset.condition,
                func.count(Asset.id)
            ).where(
                Asset.school_id == school_id,
                Asset.is_deleted == False
            ).group_by(Asset.condition)
        )
        by_condition = {cond: count for cond, count in condition_result.all()}

        # Active/Inactive counts
        active_result = await db.execute(
            select(func.count(Asset.id)).where(
                Asset.school_id == school_id,
                Asset.is_deleted == False,
                Asset.is_active == True
            )
        )
        active_assets = active_result.scalar() or 0

        inactive_result = await db.execute(
            select(func.count(Asset.id)).where(
                Asset.school_id == school_id,
                Asset.is_deleted == False,
                Asset.is_active == False
            )
        )
        inactive_assets = inactive_result.scalar() or 0

        return AssetStats(
            total_assets=total_assets,
            total_value=total_value,
            by_category=by_category,
            by_condition=by_condition,
            active_assets=active_assets,
            inactive_assets=inactive_assets
        )
