from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, validator
from datetime import date, datetime
from app.models.student import StudentStatus, ClassHistoryStatus
from app.models.user import Gender
from app.models.grade import GradeScale


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


# Student Class History Schemas
class StudentClassHistoryBase(BaseModel):
    student_id: str
    class_id: str
    term_id: str
    academic_session: str
    enrollment_date: date
    completion_date: Optional[date] = None
    is_current: bool = False
    status: ClassHistoryStatus
    promoted_to_class_id: Optional[str] = None
    promotion_date: Optional[date] = None
    remarks: Optional[str] = None


class StudentClassHistoryCreate(StudentClassHistoryBase):
    pass


class StudentClassHistoryUpdate(BaseModel):
    completion_date: Optional[date] = None
    is_current: Optional[bool] = None
    status: Optional[ClassHistoryStatus] = None
    promoted_to_class_id: Optional[str] = None
    promotion_date: Optional[date] = None
    remarks: Optional[str] = None


class StudentClassHistoryResponse(StudentClassHistoryBase):
    id: str
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    term_name: Optional[str] = None
    promoted_to_class_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Student-specific schemas for portal access
class StudentProfileResponse(BaseModel):
    """Complete student profile for student portal"""
    id: str
    admission_number: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    full_name: str
    date_of_birth: date
    age: int
    gender: Gender
    email: Optional[str] = None
    phone: Optional[str] = None
    profile_picture_url: Optional[str] = None

    # Current academic info
    current_class_id: Optional[str] = None
    current_class_name: Optional[str] = None
    status: StudentStatus
    admission_date: date

    # Parent/Guardian info (limited)
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None

    class Config:
        from_attributes = True


class PerformanceTrendsResponse(BaseModel):
    """Performance trends across multiple terms"""
    student_id: str
    student_name: str
    terms: List[Dict[str, Any]]  # List of term data with averages, positions, etc.
    overall_average: float
    best_term: Optional[Dict[str, Any]] = None
    improvement_trend: str  # "improving", "declining", "stable"
    subject_performance: List[Dict[str, Any]]  # Performance by subject across terms

    class Config:
        from_attributes = True
