"""
Schemas for public endpoints (no authentication required)
"""
from typing import Optional, Any, Dict, List, Union
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime


class SchoolRegistrationRequest(BaseModel):
    """Schema for school registration request submission"""
    school_name: str
    contact_person: str
    email: EmailStr
    phone: str
    school_type: str
    student_count_estimate: int
    address: str
    city: str
    state: str
    country: str
    website: Optional[str] = None
    message: Optional[str] = None
    
    @validator('school_name')
    def validate_school_name(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('School name must be at least 3 characters long')
        return v.strip()
    
    @validator('contact_person')
    def validate_contact_person(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Contact person name must be at least 2 characters long')
        return v.strip()
    
    @validator('phone')
    def validate_phone(cls, v):
        # Basic phone validation - can be enhanced
        cleaned = ''.join(filter(str.isdigit, v))
        if len(cleaned) < 10:
            raise ValueError('Phone number must contain at least 10 digits')
        return v
    
    @validator('school_type')
    def validate_school_type(cls, v):
        allowed_types = ['nursery', 'primary', 'secondary', 'combined', 'university', 'vocational']
        if v not in allowed_types:
            raise ValueError(f'School type must be one of: {", ".join(allowed_types)}')
        return v
    
    @validator('student_count_estimate')
    def validate_student_count(cls, v):
        if v < 1:
            raise ValueError('Student count estimate must be at least 1')
        if v > 50000:
            raise ValueError('Student count estimate seems too high (max 50,000)')
        return v
    
    @validator('website')
    def validate_website(cls, v):
        if v and v.strip():
            v = v.strip()
            if not v.startswith(('http://', 'https://')):
                v = 'https://' + v
            return v
        return None


class SchoolRegistrationRequestResponse(BaseModel):
    """Response schema for school registration request submission"""
    id: str
    message: str
    status: str


class RegistrationRequestStatus(BaseModel):
    """Schema for registration request status check"""
    id: str
    school_name: str
    status: str  # pending, approved, rejected
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    notes: Optional[str] = None


class PlatformFeature(BaseModel):
    """Schema for platform feature information"""
    title: str
    description: str
    icon: str


class PricingPlan(BaseModel):
    """Schema for pricing plan information"""
    name: str
    price: Union[str, int]
    currency: str
    period: str
    features: List[str]
    student_limit: Optional[int] = None


class PlatformInfo(BaseModel):
    """Schema for platform information (features, pricing, etc.)"""
    features: List[PlatformFeature]
    pricing: Dict[str, PricingPlan]
    trial: Dict[str, Any]


class Testimonial(BaseModel):
    """Schema for customer testimonial"""
    name: str
    position: str
    school: str
    content: str
    rating: int
    image: str


class TestimonialsResponse(BaseModel):
    """Response schema for testimonials"""
    testimonials: List[Testimonial]


class ContactForm(BaseModel):
    """Schema for contact form submission"""
    name: str
    email: EmailStr
    subject: str
    message: str
    phone: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()
    
    @validator('subject')
    def validate_subject(cls, v):
        if len(v.strip()) < 5:
            raise ValueError('Subject must be at least 5 characters long')
        return v.strip()
    
    @validator('message')
    def validate_message(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Message must be at least 10 characters long')
        return v.strip()


class ContactFormResponse(BaseModel):
    """Response schema for contact form submission"""
    message: str
    ticket_id: Optional[str] = None


class NewsletterSubscription(BaseModel):
    """Schema for newsletter subscription"""
    email: EmailStr
    name: Optional[str] = None
    interests: Optional[List[str]] = None  # e.g., ['product_updates', 'educational_content', 'events']


class NewsletterSubscriptionResponse(BaseModel):
    """Response schema for newsletter subscription"""
    message: str
    subscription_id: str


class DemoRequest(BaseModel):
    """Schema for demo request"""
    name: str
    email: EmailStr
    phone: str
    school_name: str
    school_type: str
    student_count: int
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    message: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()
    
    @validator('school_name')
    def validate_school_name(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('School name must be at least 3 characters long')
        return v.strip()
    
    @validator('student_count')
    def validate_student_count(cls, v):
        if v < 1:
            raise ValueError('Student count must be at least 1')
        return v


class DemoRequestResponse(BaseModel):
    """Response schema for demo request"""
    message: str
    demo_id: str
    calendar_link: Optional[str] = None
