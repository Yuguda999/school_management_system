from sqlalchemy import Column, Integer, DateTime, String, Boolean
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class TimestampMixin:
    """Mixin to add timestamp fields to models"""
    
    @declared_attr
    def created_at(cls):
        return Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    @declared_attr
    def updated_at(cls):
        return Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class SoftDeleteMixin:
    """Mixin to add soft delete functionality"""
    
    @declared_attr
    def is_deleted(cls):
        return Column(Boolean, default=False, nullable=False)
    
    @declared_attr
    def deleted_at(cls):
        return Column(DateTime(timezone=True), nullable=True)


class TenantMixin:
    """Mixin to add tenant isolation for multitenancy"""
    
    @declared_attr
    def school_id(cls):
        return Column(String(36), nullable=False, index=True)


class BaseModel(Base, TimestampMixin, SoftDeleteMixin):
    """Base model class with common fields"""
    
    __abstract__ = True
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))


class TenantBaseModel(BaseModel, TenantMixin):
    """Base model class for tenant-specific entities"""
    
    __abstract__ = True
