from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Text, Date, Time, Integer, JSON, Table
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class ClassLevel(str, enum.Enum):
    NURSERY_1 = "nursery_1"
    NURSERY_2 = "nursery_2"
    PRIMARY_1 = "primary_1"
    PRIMARY_2 = "primary_2"
    PRIMARY_3 = "primary_3"
    PRIMARY_4 = "primary_4"
    PRIMARY_5 = "primary_5"
    PRIMARY_6 = "primary_6"
    JSS_1 = "jss_1"
    JSS_2 = "jss_2"
    JSS_3 = "jss_3"
    SS_1 = "ss_1"
    SS_2 = "ss_2"
    SS_3 = "ss_3"


class TermType(str, enum.Enum):
    FIRST_TERM = "first_term"
    SECOND_TERM = "second_term"
    THIRD_TERM = "third_term"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"


# Association tables for many-to-many relationships
teacher_subject_association = Table(
    'teacher_subjects',
    TenantBaseModel.metadata,
    Column('id', String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4())),
    Column('teacher_id', String(36), ForeignKey('users.id'), nullable=False),
    Column('subject_id', String(36), ForeignKey('subjects.id'), nullable=False),
    Column('school_id', String(36), ForeignKey('schools.id'), nullable=False),
    Column('is_head_of_subject', Boolean, default=False, nullable=False),
    Column('created_at', String(50), nullable=False, default=lambda: __import__('datetime').datetime.utcnow().isoformat()),
    Column('updated_at', String(50), nullable=False, default=lambda: __import__('datetime').datetime.utcnow().isoformat()),
    Column('is_deleted', Boolean, default=False, nullable=False)
)

class_subject_association = Table(
    'class_subjects',
    TenantBaseModel.metadata,
    Column('id', String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4())),
    Column('class_id', String(36), ForeignKey('classes.id'), nullable=False),
    Column('subject_id', String(36), ForeignKey('subjects.id'), nullable=False),
    Column('school_id', String(36), ForeignKey('schools.id'), nullable=False),
    Column('is_core', Boolean, default=False, nullable=False),  # Override subject's is_core for this class
    Column('created_at', String(50), nullable=False, default=lambda: __import__('datetime').datetime.utcnow().isoformat()),
    Column('updated_at', String(50), nullable=False, default=lambda: __import__('datetime').datetime.utcnow().isoformat()),
    Column('is_deleted', Boolean, default=False, nullable=False)
)


class Class(TenantBaseModel):
    """Class/Grade model"""
    
    __tablename__ = "classes"
    
    name = Column(String(100), nullable=False)  # e.g., "Primary 1A", "JSS 2B"
    level = Column(Enum(ClassLevel), nullable=False)
    section = Column(String(10), nullable=True)  # e.g., "A", "B", "C"
    capacity = Column(Integer, default=30, nullable=False)
    
    # Teacher assignment
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    # Academic session
    academic_session = Column(String(20), nullable=False)  # e.g., "2023/2024"
    
    # Additional information
    description = Column(Text, nullable=True)
    report_card_template_id = Column(String(36), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    school = relationship("School", back_populates="classes")
    teacher = relationship("User", back_populates="taught_classes")
    students = relationship("Student", back_populates="current_class")
    enrollments = relationship("Enrollment", back_populates="class_")
    timetable_entries = relationship("TimetableEntry", back_populates="class_")
    attendances = relationship("Attendance", back_populates="class_")
    subjects = relationship("Subject", secondary=class_subject_association, back_populates="classes")
    
    def __repr__(self):
        return f"<Class(id={self.id}, name={self.name}, level={self.level})>"


class Subject(TenantBaseModel):
    """Subject model"""
    
    __tablename__ = "subjects"
    
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    
    # Subject configuration
    is_core = Column(Boolean, default=False, nullable=False)  # Core vs Elective
    credit_units = Column(Integer, default=1, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    school = relationship("School", back_populates="subjects")
    enrollments = relationship("Enrollment", back_populates="subject")
    timetable_entries = relationship("TimetableEntry", back_populates="subject")
    grades = relationship("Grade", back_populates="subject")
    teachers = relationship("User", secondary=teacher_subject_association, back_populates="subjects")
    classes = relationship("Class", secondary=class_subject_association, back_populates="subjects")

    
    def __repr__(self):
        return f"<Subject(id={self.id}, name={self.name}, code={self.code})>"


class Term(TenantBaseModel):
    """Academic term/semester model"""
    
    __tablename__ = "terms"
    
    name = Column(String(50), nullable=False)  # e.g., "First Term"
    type = Column(Enum(TermType), nullable=False)
    academic_session = Column(String(20), nullable=False)  # e.g., "2023/2024"
    
    # Term dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Status
    is_current = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    school = relationship("School", back_populates="terms")
    enrollments = relationship("Enrollment", back_populates="term")
    attendances = relationship("Attendance", back_populates="term")
    grades = relationship("Grade", back_populates="term")
    
    def __repr__(self):
        return f"<Term(id={self.id}, name={self.name}, session={self.academic_session})>"


class Enrollment(TenantBaseModel):
    """Student enrollment in subjects for a specific term"""
    
    __tablename__ = "enrollments"
    
    # Foreign Keys
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Enrollment details
    enrollment_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    student = relationship("Student", back_populates="enrollments")
    class_ = relationship("Class", back_populates="enrollments")
    subject = relationship("Subject", back_populates="enrollments")
    term = relationship("Term", back_populates="enrollments")
    
    def __repr__(self):
        return f"<Enrollment(student_id={self.student_id}, subject_id={self.subject_id})>"


class TimetableEntry(TenantBaseModel):
    """Timetable/Schedule entry"""
    
    __tablename__ = "timetable_entries"
    
    # Schedule details
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Foreign Keys
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Additional information
    room = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    class_ = relationship("Class", back_populates="timetable_entries")
    subject = relationship("Subject", back_populates="timetable_entries")
    teacher = relationship("User")
    term = relationship("Term")
    
    def __repr__(self):
        return f"<TimetableEntry(class_id={self.class_id}, subject_id={self.subject_id}, day={self.day_of_week})>"


class Attendance(TenantBaseModel):
    """Student attendance tracking - supports both class and subject attendance"""
    
    __tablename__ = "attendances"
    
    # Attendance details
    date = Column(Date, nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False)
    
    # Foreign Keys
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True)  # NULL for class attendance, set for subject attendance
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Additional information
    marked_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="attendances")
    class_ = relationship("Class", back_populates="attendances")
    subject = relationship("Subject")
    term = relationship("Term", back_populates="attendances")
    marker = relationship("User")
    
    def __repr__(self):
        attendance_type = "subject" if self.subject_id else "class"
        return f"<Attendance({attendance_type}, student_id={self.student_id}, date={self.date}, status={self.status})>"
