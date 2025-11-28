from sqlalchemy import Column, String, Integer, Float, Date, Boolean, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


class AssetCategory(str, enum.Enum):
    FURNITURE = "furniture"
    BUILDING = "building"
    EQUIPMENT = "equipment"
    ELECTRONICS = "electronics"
    VEHICLES = "vehicles"
    SPORTS = "sports"
    LABORATORY = "laboratory"
    OTHER = "other"


class AssetCondition(str, enum.Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    DAMAGED = "damaged"


class Asset(BaseModel):
    __tablename__ = "assets"

    school_id = Column(String, ForeignKey("schools.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(Enum(AssetCategory, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    condition = Column(Enum(AssetCondition, values_callable=lambda x: [e.value for e in x]), nullable=False, default=AssetCondition.GOOD)
    location = Column(String(255), nullable=True)
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Float, nullable=True)
    serial_number = Column(String(255), nullable=True)
    warranty_expiry = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    school = relationship("School", back_populates="assets")

    def __repr__(self):
        return f"<Asset {self.name} - {self.category}>"
