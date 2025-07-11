from sqlalchemy import Column, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class School(BaseModel):
    """School model - represents a tenant in the multitenant system"""
    
    __tablename__ = "schools"
    
    # Basic Information
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)
    
    # Address
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), nullable=False, default="Nigeria")
    
    # School Details
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    motto = Column(String(255), nullable=True)
    established_year = Column(String(4), nullable=True)
    
    # Academic Configuration
    current_session = Column(String(20), nullable=False)  # e.g., "2023/2024"
    current_term = Column(String(20), nullable=False)     # e.g., "First Term"
    
    # Settings
    settings = Column(JSON, nullable=True, default={})
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="school", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="school", cascade="all, delete-orphan")
    classes = relationship("Class", back_populates="school", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="school", cascade="all, delete-orphan")
    terms = relationship("Term", back_populates="school", cascade="all, delete-orphan")
    fee_structures = relationship("FeeStructure", back_populates="school", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<School(id={self.id}, name={self.name}, code={self.code})>"
