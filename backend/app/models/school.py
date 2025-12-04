from sqlalchemy import Column, String, Text, Boolean, JSON, DateTime, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta, timezone
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
    default_template_id = Column(String(36), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Subscription & Trial Management
    subscription_plan = Column(String(50), default="trial", nullable=False)  # trial, starter, professional, enterprise
    subscription_status = Column(String(20), default="trial", nullable=False)  # trial, active, suspended, cancelled
    trial_started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    trial_expires_at = Column(DateTime(timezone=True), nullable=True)
    trial_days = Column(Integer, default=30, nullable=False)

    # Billing Information
    billing_email = Column(String(255), nullable=True)
    last_payment_at = Column(DateTime(timezone=True), nullable=True)
    next_billing_date = Column(DateTime(timezone=True), nullable=True)

    # Usage Limits
    max_students = Column(Integer, nullable=True)  # None for unlimited
    max_teachers = Column(Integer, nullable=True)  # None for unlimited
    max_classes = Column(Integer, nullable=True)   # None for unlimited
    
    # Relationships
    users = relationship("User", back_populates="school", cascade="all, delete-orphan")
    owners = relationship("SchoolOwnership", back_populates="school", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="school", cascade="all, delete-orphan")
    classes = relationship("Class", back_populates="school", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="school", cascade="all, delete-orphan")
    terms = relationship("Term", back_populates="school", cascade="all, delete-orphan")
    fee_structures = relationship("FeeStructure", back_populates="school", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="school", cascade="all, delete-orphan")
    grade_templates = relationship("GradeTemplate", back_populates="school", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<School(id={self.id}, name={self.name}, code={self.code})>"

    @property
    def is_trial(self) -> bool:
        """Check if school is on trial"""
        return self.subscription_plan == "trial"

    @property
    def trial_days_remaining(self) -> int:
        """Get remaining trial days"""
        if not self.is_trial or not self.trial_expires_at:
            return 0

        remaining = (self.trial_expires_at - datetime.now(timezone.utc)).days
        return max(0, remaining)

    @property
    def trial_expired(self) -> bool:
        """Check if trial has expired"""
        if not self.is_trial or not self.trial_expires_at:
            return False

        return datetime.now(timezone.utc) > self.trial_expires_at

    def start_trial(self, days: int = 30):
        """Start a trial period"""
        self.subscription_plan = "trial"
        self.subscription_status = "trial"
        self.trial_started_at = datetime.now(timezone.utc)
        self.trial_expires_at = datetime.now(timezone.utc) + timedelta(days=days)
        self.trial_days = days

        # Set trial limits
        self.max_students = 100  # Trial limit
        self.max_teachers = 10   # Trial limit
        self.max_classes = 20    # Trial limit

    def upgrade_to_plan(self, plan: str):
        """Upgrade to a paid plan"""
        self.subscription_plan = plan
        self.subscription_status = "active"
        self.trial_expires_at = None

        # Set plan limits
        if plan == "starter":
            self.max_students = 100
            self.max_teachers = 10
            self.max_classes = 20
        elif plan == "professional":
            self.max_students = 500
            self.max_teachers = 50
            self.max_classes = 100
        elif plan == "enterprise":
            self.max_students = None  # Unlimited
            self.max_teachers = None  # Unlimited
            self.max_classes = None   # Unlimited

    def suspend_subscription(self):
        """Suspend the subscription"""
        self.subscription_status = "suspended"
        self.is_active = False

    def cancel_subscription(self):
        """Cancel the subscription"""
        self.subscription_status = "cancelled"
        self.is_active = False
