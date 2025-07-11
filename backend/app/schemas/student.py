from typing import Optional, List
from pydantic import BaseModel, EmailStr, validator
from datetime import date, datetime
from app.models.student import StudentStatus
from app.models.user import Gender


class StudentBase(BaseModel):
    admission_number: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    date_of_birth: date
    gender: Gender
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    admission_date: date
    current_class_id: Optional[str] = None


class StudentCreate(StudentBase):
    # Parent/Guardian Information
    parent_id: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[EmailStr] = None
    guardian_relationship: Optional[str] = None
    
    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    
    # Medical Information
    medical_conditions: Optional[str] = None
    allergies: Optional[str] = None
    blood_group: Optional[str] = None
    
    # Additional Information
    notes: Optional[str] = None


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    current_class_id: Optional[str] = None
    status: Optional[StudentStatus] = None
    
    # Parent/Guardian Information
    parent_id: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[EmailStr] = None
    guardian_relationship: Optional[str] = None
    
    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    
    # Medical Information
    medical_conditions: Optional[str] = None
    allergies: Optional[str] = None
    blood_group: Optional[str] = None
    
    # Additional Information
    profile_picture_url: Optional[str] = None
    notes: Optional[str] = None


class StudentResponse(StudentBase):
    id: str
    status: StudentStatus
    
    # Parent/Guardian Information
    parent_id: Optional[str] = None
    parent_name: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[str] = None
    guardian_relationship: Optional[str] = None
    
    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    
    # Medical Information
    medical_conditions: Optional[str] = None
    allergies: Optional[str] = None
    blood_group: Optional[str] = None
    
    # Additional Information
    profile_picture_url: Optional[str] = None
    notes: Optional[str] = None
    
    # Class Information
    current_class_name: Optional[str] = None
    
    # Computed fields
    age: Optional[int] = None
    full_name: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class StudentListResponse(BaseModel):
    items: list[StudentResponse]
    total: int
    page: int
    size: int
    pages: int


class StudentStatusUpdate(BaseModel):
    status: StudentStatus


class StudentClassUpdate(BaseModel):
    current_class_id: str


class BulkStudentCreate(BaseModel):
    """Schema for bulk student creation"""
    students: List[StudentCreate]


class StudentImportError(BaseModel):
    """Schema for student import error"""
    row: int
    field: str
    value: str
    error: str


class StudentImportResult(BaseModel):
    """Schema for student import result"""
    total_rows: int
    successful_imports: int
    failed_imports: int
    errors: List[StudentImportError]
    created_students: List[StudentResponse]


class CSVStudentRow(BaseModel):
    """Schema for validating CSV student row data"""
    admission_number: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    date_of_birth: str  # Will be parsed to date
    gender: str  # Will be validated against Gender enum
    phone: Optional[str] = None
    email: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    admission_date: str  # Will be parsed to date
    current_class_name: Optional[str] = None  # Class name, will be resolved to ID

    # Parent/Guardian Information
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[str] = None
    guardian_relationship: Optional[str] = None

    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None

    # Medical Information
    medical_conditions: Optional[str] = None
    allergies: Optional[str] = None
    blood_group: Optional[str] = None

    # Additional Information
    notes: Optional[str] = None
