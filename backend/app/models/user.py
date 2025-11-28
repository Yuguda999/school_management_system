from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class UserRole(str, enum.Enum):
    PLATFORM_SUPER_ADMIN = "platform_super_admin"  # Platform owner (CLI only, once)
    SCHOOL_OWNER = "school_owner"                   # School owner (can register school)
    SCHOOL_ADMIN = "school_admin"                   # School admin staff
    TEACHER = "teacher"                             # Teaching staff
    PARENT = "parent"                               # Parent/Guardian
    STUDENT = "student"                             # Student (for login access)


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class User(TenantBaseModel):
    """User model for all system users (staff, parents, students with login access)"""
    
    __tablename__ = "users"
    
    # Authentication
    email = Column(String(255), nullable=False, index=True)
    username = Column(String(100), nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Personal Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(Enum(Gender), nullable=True)
    
    # Address
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    
    # Professional Information (for staff)
    employee_id = Column(String(50), nullable=True, index=True)
    department = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    qualification = Column(Text, nullable=True)
    experience_years = Column(String(10), nullable=True)
    
    # System Information
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    profile_completed = Column(Boolean, default=False, nullable=False)
    last_login = Column(String(50), nullable=True)
    
    # Profile
    profile_picture_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Foreign Keys (nullable for platform super admin)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=True)
    
    # Relationships
    school = relationship("School", back_populates="users")
    owned_schools = relationship("SchoolOwnership", foreign_keys="SchoolOwnership.user_id", back_populates="user")
    taught_classes = relationship("Class", back_populates="teacher")
    student = relationship("Student", foreign_keys="Student.user_id", back_populates="user", uselist=False)
    children = relationship("Student", foreign_keys="Student.parent_id", back_populates="parent")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.recipient_id", back_populates="recipient")
    subjects = relationship("Subject", secondary="teacher_subjects", back_populates="teachers")

    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
    
    @property
    def full_name(self):
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    def is_teacher_profile_complete(self) -> bool:
        """Check if teacher profile has all required fields completed"""
        if self.role != UserRole.TEACHER:
            return True  # Only check for teachers

        required_fields = [
            self.phone,
            self.date_of_birth,
            self.gender,
            self.qualification,
            self.experience_years,
            self.address_line1,
            self.city,
            self.state,
            self.postal_code
        ]

        return all(field is not None and str(field).strip() != '' for field in required_fields)

    def update_profile_completion_status(self):
        """Update the profile_completed field based on current profile data"""
        self.profile_completed = self.is_teacher_profile_complete()
