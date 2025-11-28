from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


class AssetCategory(str, Enum):
    FURNITURE = "furniture"
    BUILDING = "building"
    EQUIPMENT = "equipment"
    ELECTRONICS = "electronics"
    VEHICLES = "vehicles"
    SPORTS = "sports"
    LABORATORY = "laboratory"
    OTHER = "other"


class AssetCondition(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    DAMAGED = "damaged"


class AssetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: AssetCategory
    description: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    condition: AssetCondition = AssetCondition.GOOD
    location: Optional[str] = Field(None, max_length=255)
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    serial_number: Optional[str] = Field(None, max_length=255)
    warranty_expiry: Optional[date] = None
    is_active: bool = True


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[AssetCategory] = None
    description: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=1)
    condition: Optional[AssetCondition] = None
    location: Optional[str] = Field(None, max_length=255)
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    serial_number: Optional[str] = Field(None, max_length=255)
    warranty_expiry: Optional[date] = None
    is_active: Optional[bool] = None


class AssetResponse(AssetBase):
    id: str
    school_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssetStats(BaseModel):
    total_assets: int
    total_value: float
    by_category: dict[str, int]
    by_condition: dict[str, int]
    active_assets: int
    inactive_assets: int
