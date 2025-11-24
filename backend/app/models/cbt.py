"""Computer-Based Testing (CBT) models"""
import enum
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, Numeric, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import TenantBaseModel


class TestStatus(str, enum.Enum):
    """Test status enumeration"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class SubmissionStatus(str, enum.Enum):
    """Submission status enumeration"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"


class CBTTest(TenantBaseModel):
    """CBT Test model"""
    
    __tablename__ = "cbt_tests"
    
    # Basic Information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    
    # Academic Details
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    grade_level = Column(String(50), nullable=True)  # e.g., "Primary 1", "JSS 2"
    
    # Test Configuration
    duration_minutes = Column(Integer, nullable=False)  # Total test duration
    total_points = Column(Numeric(10, 2), nullable=False, default=0)
    pass_percentage = Column(Numeric(5, 2), nullable=True, default=50.0)
    
    # Test Settings
    randomize_questions = Column(Boolean, default=False, nullable=False)
    randomize_options = Column(Boolean, default=False, nullable=False)
    allow_multiple_attempts = Column(Boolean, default=False, nullable=False)
    max_attempts = Column(Integer, nullable=True, default=1)
    show_results_immediately = Column(Boolean, default=True, nullable=False)
    show_correct_answers = Column(Boolean, default=False, nullable=False)
    
    # Status
    status = Column(Enum(TestStatus), default=TestStatus.DRAFT, nullable=False)
    
    # Metadata
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    subject = relationship("Subject")
    creator = relationship("User", foreign_keys=[created_by])
    questions = relationship("CBTQuestion", back_populates="test", cascade="all, delete-orphan")
    schedules = relationship("CBTTestSchedule", back_populates="test", cascade="all, delete-orphan")
    submissions = relationship("CBTSubmission", back_populates="test", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CBTTest(id={self.id}, title={self.title}, status={self.status})>"


class CBTQuestion(TenantBaseModel):
    """CBT Question model"""
    
    __tablename__ = "cbt_questions"
    
    # Question Details
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="multiple_choice", nullable=False)  # For future expansion
    points = Column(Numeric(10, 2), nullable=False, default=1.0)
    order_number = Column(Integer, nullable=False)  # Question order in test
    
    # Media
    image_url = Column(String(500), nullable=True)
    media_url = Column(String(500), nullable=True)
    
    # Foreign Keys
    test_id = Column(String(36), ForeignKey("cbt_tests.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    test = relationship("CBTTest", back_populates="questions")
    options = relationship("CBTQuestionOption", back_populates="question", cascade="all, delete-orphan")
    answers = relationship("CBTAnswer", back_populates="question", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CBTQuestion(id={self.id}, test_id={self.test_id}, order={self.order_number})>"


class CBTQuestionOption(TenantBaseModel):
    """CBT Question Option model"""
    
    __tablename__ = "cbt_question_options"
    
    # Option Details
    option_label = Column(String(10), nullable=False)  # A, B, C, D
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    order_number = Column(Integer, nullable=False)
    
    # Foreign Keys
    question_id = Column(String(36), ForeignKey("cbt_questions.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    question = relationship("CBTQuestion", back_populates="options")
    
    def __repr__(self):
        return f"<CBTQuestionOption(id={self.id}, label={self.option_label}, is_correct={self.is_correct})>"


class CBTTestSchedule(TenantBaseModel):
    """CBT Test Schedule model - assigns tests to classes/students"""
    
    __tablename__ = "cbt_test_schedules"
    
    # Schedule Details
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    
    # Assignment
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=True)  # If assigned to entire class
    student_ids = Column(JSON, nullable=True)  # If assigned to specific students (list of IDs)
    
    # Foreign Keys
    test_id = Column(String(36), ForeignKey("cbt_tests.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    test = relationship("CBTTest", back_populates="schedules")
    class_ = relationship("Class")
    creator = relationship("User", foreign_keys=[created_by])
    submissions = relationship("CBTSubmission", back_populates="schedule", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CBTTestSchedule(id={self.id}, test_id={self.test_id}, class_id={self.class_id})>"


class CBTSubmission(TenantBaseModel):
    """CBT Submission model - student's test attempt"""

    __tablename__ = "cbt_submissions"

    # Submission Details
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.NOT_STARTED, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    time_spent_seconds = Column(Integer, nullable=True)  # Actual time spent

    # Scoring
    total_score = Column(Numeric(10, 2), nullable=True, default=0)
    total_possible = Column(Numeric(10, 2), nullable=True)
    percentage = Column(Numeric(5, 2), nullable=True)
    passed = Column(Boolean, nullable=True)

    # Attempt tracking
    attempt_number = Column(Integer, default=1, nullable=False)

    # Foreign Keys
    test_id = Column(String(36), ForeignKey("cbt_tests.id"), nullable=False)
    schedule_id = Column(String(36), ForeignKey("cbt_test_schedules.id"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)

    # Relationships
    test = relationship("CBTTest", back_populates="submissions")
    schedule = relationship("CBTTestSchedule", back_populates="submissions")
    student = relationship("Student")
    answers = relationship("CBTAnswer", back_populates="submission", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CBTSubmission(id={self.id}, student_id={self.student_id}, status={self.status})>"


class CBTAnswer(TenantBaseModel):
    """CBT Answer model - student's answer to a question"""

    __tablename__ = "cbt_answers"

    # Answer Details
    selected_option_id = Column(String(36), ForeignKey("cbt_question_options.id"), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    points_earned = Column(Numeric(10, 2), nullable=True, default=0)

    # Timing
    answered_at = Column(DateTime(timezone=True), nullable=True)
    time_spent_seconds = Column(Integer, nullable=True)

    # Foreign Keys
    submission_id = Column(String(36), ForeignKey("cbt_submissions.id"), nullable=False)
    question_id = Column(String(36), ForeignKey("cbt_questions.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)

    # Relationships
    submission = relationship("CBTSubmission", back_populates="answers")
    question = relationship("CBTQuestion", back_populates="answers")
    selected_option = relationship("CBTQuestionOption")

    def __repr__(self):
        return f"<CBTAnswer(id={self.id}, question_id={self.question_id}, is_correct={self.is_correct})>"

