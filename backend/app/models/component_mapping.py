from sqlalchemy import Column, String, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel


class ComponentMapping(TenantBaseModel):
    """
    Maps teacher's exam types to grade template components.
    
    Allows teachers to consolidate their custom exam types (Quiz, Assignment, etc.)
    to standardized template components (First C.A, Second C.A, Exam, etc.)
    for automated grade calculation.
    """
    __tablename__ = "component_mappings"
    
    # Relationships
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    term_id = Column(String, ForeignKey("terms.id"), nullable=False)
    component_id = Column(String, ForeignKey("assessment_components.id"), nullable=False)
    
    # Exam type name (e.g., "Quiz", "Assignment", "Test")
    exam_type_name = Column(String(100), nullable=False)
    
    # Whether to include this mapping in grade calculations
    include_in_calculation = Column(Boolean, default=True, nullable=False)
    
    # SQLAlchemy relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    subject = relationship("Subject", foreign_keys=[subject_id])
    term = relationship("Term", foreign_keys=[term_id])
    component = relationship("AssessmentComponent", foreign_keys=[component_id])
    
    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_component_mapping_teacher_subject_term', 
              'teacher_id', 'subject_id', 'term_id'),
        Index('idx_component_mapping_teacher_subject_term_exam_type',
              'teacher_id', 'subject_id', 'term_id', 'exam_type_name'),
    )
    
    def __repr__(self):
        return f"<ComponentMapping(exam_type='{self.exam_type_name}', component_id='{self.component_id}')>"
