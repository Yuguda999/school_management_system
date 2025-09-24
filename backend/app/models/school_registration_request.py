"""
School Registration Request Model
Stores requests from potential customers who want to register their schools
"""
from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import BaseModel


class SchoolRegistrationRequest(BaseModel):
    """Model for school registration requests from potential customers"""
    
    __tablename__ = "school_registration_requests"
    
    # School Information
    school_name = Column(String(255), nullable=False, index=True)
    school_type = Column(String(50), nullable=False)  # nursery, primary, secondary, etc.
    student_count_estimate = Column(Integer, nullable=False)
    website = Column(String(255), nullable=True)
    
    # Contact Information
    contact_person = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    
    # Location Information
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False, default="Nigeria")
    
    # Additional Information
    message = Column(Text, nullable=True)
    
    # Request Status and Processing
    status = Column(String(20), nullable=False, default="pending", index=True)
    # Status options: pending, approved, rejected, contacted, converted
    
    # Admin Review Information
    reviewed_by = Column(String, nullable=True)  # Admin user ID who reviewed
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Follow-up Information
    contacted_at = Column(DateTime(timezone=True), nullable=True)
    demo_scheduled_at = Column(DateTime(timezone=True), nullable=True)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    converted_school_id = Column(String, nullable=True)  # If converted to actual school
    
    # Marketing Information
    source = Column(String(100), nullable=True)  # How they found us: website, referral, ads, etc.
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<SchoolRegistrationRequest(id={self.id}, school_name='{self.school_name}', status='{self.status}')>"
    
    @property
    def full_address(self):
        """Get formatted full address"""
        return f"{self.address}, {self.city}, {self.state}, {self.country}"
    
    @property
    def is_pending(self):
        """Check if request is still pending"""
        return self.status == "pending"
    
    @property
    def is_approved(self):
        """Check if request has been approved"""
        return self.status == "approved"
    
    @property
    def is_rejected(self):
        """Check if request has been rejected"""
        return self.status == "rejected"
    
    @property
    def is_converted(self):
        """Check if request has been converted to actual school"""
        return self.status == "converted" and self.converted_school_id is not None
    
    def approve(self, admin_id: str, notes: str = None):
        """Approve the registration request"""
        self.status = "approved"
        self.reviewed_by = admin_id
        self.reviewed_at = func.now()
        if notes:
            self.admin_notes = notes
    
    def reject(self, admin_id: str, notes: str = None):
        """Reject the registration request"""
        self.status = "rejected"
        self.reviewed_by = admin_id
        self.reviewed_at = func.now()
        if notes:
            self.admin_notes = notes
    
    def mark_contacted(self):
        """Mark as contacted"""
        self.status = "contacted"
        self.contacted_at = func.now()
    
    def mark_converted(self, school_id: str):
        """Mark as converted to actual school"""
        self.status = "converted"
        self.converted_school_id = school_id
        self.converted_at = func.now()
    
    def schedule_demo(self, demo_datetime):
        """Schedule a demo for this request"""
        self.demo_scheduled_at = demo_datetime
        if self.status == "pending":
            self.status = "contacted"
