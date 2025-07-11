from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Text, Date, Numeric, Integer, JSON
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class ExamType(str, enum.Enum):
    CONTINUOUS_ASSESSMENT = "continuous_assessment"
    MID_TERM = "mid_term"
    FINAL_EXAM = "final_exam"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"
    PROJECT = "project"
    PRACTICAL = "practical"
    ORAL = "oral"


class GradeScale(str, enum.Enum):
    A_PLUS = "A+"
    A = "A"
    B_PLUS = "B+"
    B = "B"
    C_PLUS = "C+"
    C = "C"
    D_PLUS = "D+"
    D = "D"
    E = "E"
    F = "F"


class Exam(TenantBaseModel):
    """Exam/Assessment model"""
    
    __tablename__ = "exams"
    
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    exam_type = Column(Enum(ExamType), nullable=False)
    
    # Exam details
    exam_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=True)  # e.g., "09:00"
    duration_minutes = Column(Integer, nullable=True)
    total_marks = Column(Numeric(5, 2), nullable=False)
    pass_marks = Column(Numeric(5, 2), nullable=False)
    
    # Academic details
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=False)
    
    # Exam configuration
    is_published = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Additional information
    instructions = Column(Text, nullable=True)
    venue = Column(String(100), nullable=True)
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    subject = relationship("Subject")
    class_ = relationship("Class")
    term = relationship("Term")
    creator = relationship("User")
    grades = relationship("Grade", back_populates="exam")
    
    def __repr__(self):
        return f"<Exam(id={self.id}, name={self.name}, type={self.exam_type})>"


class Grade(TenantBaseModel):
    """Student grades/results model"""
    
    __tablename__ = "grades"
    
    # Score details
    score = Column(Numeric(5, 2), nullable=False)
    total_marks = Column(Numeric(5, 2), nullable=False)
    percentage = Column(Numeric(5, 2), nullable=False)
    grade = Column(Enum(GradeScale), nullable=True)
    
    # Foreign Keys
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=False)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Grading details
    graded_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    graded_date = Column(Date, nullable=False)
    
    # Additional information
    remarks = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    student = relationship("Student", back_populates="grades")
    subject = relationship("Subject", back_populates="grades")
    exam = relationship("Exam", back_populates="grades")
    term = relationship("Term", back_populates="grades")
    grader = relationship("User")
    
    def __repr__(self):
        return f"<Grade(student_id={self.student_id}, subject_id={self.subject_id}, score={self.score})>"


class ReportCard(TenantBaseModel):
    """Student report card model"""
    
    __tablename__ = "report_cards"
    
    # Report details
    academic_session = Column(String(20), nullable=False)
    term_name = Column(String(50), nullable=False)
    
    # Academic performance
    total_subjects = Column(Integer, nullable=False)
    total_score = Column(Numeric(8, 2), nullable=False)
    average_score = Column(Numeric(5, 2), nullable=False)
    position = Column(Integer, nullable=True)
    total_students = Column(Integer, nullable=True)
    
    # Attendance
    days_present = Column(Integer, default=0, nullable=False)
    days_absent = Column(Integer, default=0, nullable=False)
    total_school_days = Column(Integer, nullable=False)
    
    # Foreign Keys
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Report generation
    generated_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    generated_date = Column(Date, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    
    # Additional information
    teacher_comment = Column(Text, nullable=True)
    principal_comment = Column(Text, nullable=True)
    next_term_begins = Column(Date, nullable=True)
    
    # Behavioral assessment
    conduct_grade = Column(String(10), nullable=True)
    sports_grade = Column(String(10), nullable=True)
    
    # Additional data
    additional_data = Column(JSON, nullable=True, default={})
    
    # Relationships
    student = relationship("Student")
    class_ = relationship("Class")
    term = relationship("Term")
    generator = relationship("User")
    
    def __repr__(self):
        return f"<ReportCard(student_id={self.student_id}, term={self.term_name}, average={self.average_score})>"
