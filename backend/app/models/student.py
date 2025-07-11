from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Text, Date, JSON
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
from app.models.user import Gender
import enum


class StudentStatus(str, enum.Enum):
    ACTIVE = "active"
    GRADUATED = "graduated"
    TRANSFERRED = "transferred"
    SUSPENDED = "suspended"
    EXPELLED = "expelled"


class Student(TenantBaseModel):
    """Student model"""
    
    __tablename__ = "students"
    
    # Basic Information
    admission_number = Column(String(50), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    
    # Contact Information
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Address
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    
    # Academic Information
    admission_date = Column(Date, nullable=False)
    current_class_id = Column(String(36), ForeignKey("classes.id"), nullable=True)
    status = Column(Enum(StudentStatus), default=StudentStatus.ACTIVE, nullable=False)
    
    # Parent/Guardian Information
    parent_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    guardian_name = Column(String(200), nullable=True)
    guardian_phone = Column(String(20), nullable=True)
    guardian_email = Column(String(255), nullable=True)
    guardian_relationship = Column(String(50), nullable=True)
    
    # Emergency Contact
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_contact_relationship = Column(String(50), nullable=True)
    
    # Medical Information
    medical_conditions = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    blood_group = Column(String(10), nullable=True)
    
    # Additional Information
    profile_picture_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    additional_data = Column(JSON, nullable=True, default={})
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    school = relationship("School", back_populates="students")
    current_class = relationship("Class", back_populates="students")
    parent = relationship("User", back_populates="children")
    enrollments = relationship("Enrollment", back_populates="student")
    attendances = relationship("Attendance", back_populates="student")
    grades = relationship("Grade", back_populates="student")
    fee_payments = relationship("FeePayment", back_populates="student")
    fee_assignments = relationship("FeeAssignment", back_populates="student")
    
    def __repr__(self):
        return f"<Student(id={self.id}, admission_number={self.admission_number}, name={self.full_name})>"
    
    @property
    def full_name(self):
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
