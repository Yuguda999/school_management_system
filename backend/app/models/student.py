from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Text, Date, JSON, Numeric
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
from app.models.user import Gender, UserRole
import enum


class StudentStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    GRADUATED = "graduated"
    TRANSFERRED = "transferred"
    SUSPENDED = "suspended"
    EXPELLED = "expelled"


class ClassHistoryStatus(str, enum.Enum):
    ACTIVE = "active"           # Currently in this class
    COMPLETED = "completed"     # Completed the term
    PROMOTED = "promoted"       # Promoted to next class
    REPEATED = "repeated"       # Repeating the class
    TRANSFERRED = "transferred" # Transferred to another class/school


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
    current_class_id = Column(String(36), ForeignKey("classes.id"), nullable=True, index=True)
    status = Column(Enum(StudentStatus), default=StudentStatus.ACTIVE, nullable=False, index=True)

    # User Account Link (for students with portal access)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, unique=True)

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
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False, index=True)
    
    # Relationships
    school = relationship("School", back_populates="students")
    current_class = relationship("Class", foreign_keys=[current_class_id], back_populates="students")
    user = relationship("User", foreign_keys=[user_id], back_populates="student", uselist=False)
    parent = relationship("User", foreign_keys=[parent_id], back_populates="children")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    grades = relationship("Grade", back_populates="student", cascade="all, delete-orphan")
    fee_payments = relationship("FeePayment", back_populates="student", cascade="all, delete-orphan")
    fee_assignments = relationship("FeeAssignment", back_populates="student")
    documents = relationship("Document", back_populates="student")
    class_history = relationship("StudentClassHistory", back_populates="student")
    goals = relationship("StudentGoal", back_populates="student")
    certificates = relationship("TransferCertificate", back_populates="student")
    
    # Edix Verifiable Credentials
    credentials = relationship("VerifiableCredential", back_populates="student", cascade="all, delete-orphan")
    
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

    @property
    def current_class_name(self):
        return self.current_class.name if self.current_class else None

    @property
    def role(self):
        return UserRole.STUDENT


class StudentClassHistory(TenantBaseModel):
    """Student class history tracking for progression and historical data"""

    __tablename__ = "student_class_history"

    # Foreign Keys
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)

    # Academic session - kept for backward compatibility
    academic_session = Column(String(20), nullable=False)  # e.g., "2023/2024"
    # Link to AcademicSession model (nullable for backward compatibility)
    academic_session_id = Column(String(36), ForeignKey("academic_sessions.id"), nullable=True)

    # Enrollment details
    enrollment_date = Column(Date, nullable=False)
    completion_date = Column(Date, nullable=True)

    # Status
    is_current = Column(Boolean, default=False, nullable=False)
    status = Column(Enum(ClassHistoryStatus), nullable=False, default=ClassHistoryStatus.ACTIVE)

    # Promotion/progression info
    promoted_to_class_id = Column(String(36), ForeignKey("classes.id"), nullable=True)
    promotion_date = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    
    # Enhanced promotion tracking
    final_average = Column(Numeric(5, 2), nullable=True)  # Average score at end of session
    promotion_eligible = Column(Boolean, default=True, nullable=False)  # Eligible for promotion
    promotion_decision = Column(String(20), nullable=True)  # "promoted", "repeated", "graduated", "transferred"
    decided_by = Column(String(36), ForeignKey("users.id"), nullable=True)  # Who made the decision
    decision_date = Column(Date, nullable=True)  # When the decision was made

    # Relationships
    student = relationship("Student", back_populates="class_history")
    class_ = relationship("Class", foreign_keys=[class_id])
    promoted_to_class = relationship("Class", foreign_keys=[promoted_to_class_id])
    term = relationship("Term")
    academic_session_rel = relationship("AcademicSession", back_populates="class_history")
    decision_maker = relationship("User", foreign_keys=[decided_by])

    def __repr__(self):
        return f"<StudentClassHistory(student_id={self.student_id}, class_id={self.class_id}, term_id={self.term_id}, status={self.status})>"
