"""
Curriculum Model for Curriculum Coverage & Lesson Plan Tracker (P2.3)
"""

from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Enum as SQLEnum, Integer, Date, JSON
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class CoverageStatus(str, enum.Enum):
    """Status of curriculum coverage"""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class CurriculumUnit(TenantBaseModel):
    """Model for curriculum units/topics"""
    
    __tablename__ = "curriculum_units"
    
    # Unit details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0, nullable=False)
    
    # Academic context
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False, index=True)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False, index=True)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=False, index=True)
    
    # Coverage tracking
    coverage_status = Column(SQLEnum(CoverageStatus), default=CoverageStatus.PLANNED, nullable=False)
    estimated_hours = Column(Integer, nullable=True)  # Estimated teaching hours
    actual_hours = Column(Integer, nullable=True)  # Actual hours spent
    
    # Dates
    planned_start_date = Column(Date, nullable=True)
    planned_end_date = Column(Date, nullable=True)
    actual_start_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)
    
    # Additional info
    learning_objectives = Column(JSON, nullable=True, default=[])  # List of objectives
    resources = Column(JSON, nullable=True, default=[])  # List of resources
    notes = Column(Text, nullable=True)
    
    # Creator
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    subject = relationship("Subject")
    class_ = relationship("Class")
    term = relationship("Term")
    creator = relationship("User")
    lesson_plans = relationship("LessonPlanItem", back_populates="curriculum_unit")
    
    def __repr__(self):
        return f"<CurriculumUnit {self.name} - {self.coverage_status.value}>"


class LessonPlanItem(TenantBaseModel):
    """Model for individual lesson plan items"""
    
    __tablename__ = "lesson_plan_items"
    
    # Lesson details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Link to curriculum
    curriculum_unit_id = Column(String(36), ForeignKey("curriculum_units.id"), nullable=True, index=True)
    
    # Academic context
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False, index=True)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False, index=True)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=False, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Lesson timing
    scheduled_date = Column(Date, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Status
    is_delivered = Column(Boolean, default=False, nullable=False)
    delivered_date = Column(Date, nullable=True)
    
    # Content
    learning_objectives = Column(JSON, nullable=True, default=[])
    activities = Column(JSON, nullable=True, default=[])  # List of activities
    materials = Column(JSON, nullable=True, default=[])  # Required materials
    assessment_methods = Column(JSON, nullable=True, default=[])
    
    # AI-generated content
    ai_generated_content = Column(Text, nullable=True)  # Full AI-generated lesson plan
    
    # Reflection
    reflection_notes = Column(Text, nullable=True)
    student_engagement_rating = Column(Integer, nullable=True)  # 1-5 rating
    
    # Relationships
    curriculum_unit = relationship("CurriculumUnit", back_populates="lesson_plans")
    subject = relationship("Subject")
    class_ = relationship("Class")
    term = relationship("Term")
    teacher = relationship("User")
    
    def __repr__(self):
        return f"<LessonPlanItem {self.title} - delivered={self.is_delivered}>"

