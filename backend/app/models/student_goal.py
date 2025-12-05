"""
Student Goal Model for Goal Setting & Progress Tracker (P2.5)
"""

from sqlalchemy import Column, String, Text, Float, Boolean, ForeignKey, Enum as SQLEnum, Date
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class GoalCategory(str, enum.Enum):
    """Categories for student goals"""
    ACADEMIC = "academic"
    ATTENDANCE = "attendance"
    BEHAVIOR = "behavior"
    EXTRACURRICULAR = "extracurricular"
    PERSONAL = "personal"


class GoalStatus(str, enum.Enum):
    """Status of a goal"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class StudentGoal(TenantBaseModel):
    """Model for student goals and progress tracking"""
    
    __tablename__ = "student_goals"
    
    # Student reference
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False, index=True)
    
    # Goal details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(GoalCategory), default=GoalCategory.ACADEMIC, nullable=False)
    
    # Target and progress
    target_value = Column(Float, nullable=True)  # e.g., target grade of 80%
    current_value = Column(Float, nullable=True)  # e.g., current grade of 65%
    target_unit = Column(String(50), nullable=True)  # e.g., "percentage", "count"
    
    # Dates
    start_date = Column(Date, nullable=True)
    target_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    
    # Status
    status = Column(SQLEnum(GoalStatus), default=GoalStatus.NOT_STARTED, nullable=False)
    progress_percentage = Column(Float, default=0.0)  # 0-100
    
    # Optional subject/class association
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="goals")
    subject = relationship("Subject", backref="student_goals")
    term = relationship("Term", backref="student_goals")
    
    def __repr__(self):
        return f"<StudentGoal {self.title} - {self.status.value}>"
    
    def calculate_progress(self):
        """Calculate progress percentage based on target and current values"""
        if self.target_value and self.current_value:
            progress = (self.current_value / self.target_value) * 100
            self.progress_percentage = min(progress, 100.0)
        return self.progress_percentage


class GoalMilestone(TenantBaseModel):
    """Milestones for tracking goal progress"""
    
    __tablename__ = "goal_milestones"
    
    goal_id = Column(String(36), ForeignKey("student_goals.id"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False)
    order = Column(Float, default=0)  # For ordering milestones
    
    # Relationship
    goal = relationship("StudentGoal", backref="milestones")
    
    def __repr__(self):
        return f"<GoalMilestone {self.title} - {'Completed' if self.is_completed else 'Pending'}>"

