from sqlalchemy import Column, String, Boolean, Integer, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel


class GradeTemplate(TenantBaseModel):
    """Grade template model for defining school-specific grading structures"""
    
    __tablename__ = "grade_templates"
    
    # Basic information
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    total_marks = Column(Numeric(5, 2), nullable=False, default=100)
    
    # Status
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    school = relationship("School", back_populates="grade_templates")
    creator = relationship("User")
    assessment_components = relationship("AssessmentComponent", back_populates="template", cascade="all, delete-orphan")
    grade_scales = relationship("GradeScale", back_populates="template", cascade="all, delete-orphan")
    remark_templates = relationship("RemarkTemplate", back_populates="template", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<GradeTemplate(id={self.id}, name={self.name}, is_default={self.is_default})>"


class AssessmentComponent(TenantBaseModel):
    """Assessment components that make up a grade (e.g., C.A 1, C.A 2, Exam)"""
    
    __tablename__ = "assessment_components"
    
    # Component details
    name = Column(String(100), nullable=False)  # e.g., "First C.A", "Second C.A", "Exam"
    weight = Column(Numeric(5, 2), nullable=False)  # Percentage weight (e.g., 20, 30, 60)
    is_required = Column(Boolean, default=True, nullable=False)  # Whether this component is mandatory
    order = Column(Integer, nullable=False, default=0)  # Display order
    
    # Foreign Keys
    template_id = Column(String(36), ForeignKey("grade_templates.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    template = relationship("GradeTemplate", back_populates="assessment_components")
    
    def __repr__(self):
        return f"<AssessmentComponent(id={self.id}, name={self.name}, weight={self.weight})>"


class GradeScale(TenantBaseModel):
    """Grade scale definitions with ranges (e.g., A: 90-100, B: 80-89)"""
    
    __tablename__ = "grade_scales"
    
    # Scale details
    grade = Column(String(10), nullable=False)  # e.g., "A+", "A", "B", "Pass"
    min_score = Column(Numeric(5, 2), nullable=False)  # Minimum score for this grade
    max_score = Column(Numeric(5, 2), nullable=False)  # Maximum score for this grade
    remark = Column(String(100), nullable=True)  # Short remark (e.g., "Excellent", "Good")
    color = Column(String(20), nullable=True)  # Color code for visual distinction
    order = Column(Integer, nullable=False, default=0)  # Display order
    
    # Foreign Keys
    template_id = Column(String(36), ForeignKey("grade_templates.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    template = relationship("GradeTemplate", back_populates="grade_scales")
    
    def __repr__(self):
        return f"<GradeScale(id={self.id}, grade={self.grade}, range={self.min_score}-{self.max_score})>"


class RemarkTemplate(TenantBaseModel):
    """Remark templates for auto-generating student remarks based on performance"""
    
    __tablename__ = "remark_templates"
    
    # Remark details
    min_percentage = Column(Numeric(5, 2), nullable=False)  # Minimum percentage for this remark
    max_percentage = Column(Numeric(5, 2), nullable=False)  # Maximum percentage for this remark
    remark_text = Column(Text, nullable=False)  # Remark text (supports placeholders)
    order = Column(Integer, nullable=False, default=0)  # Display order
    
    # Foreign Keys
    template_id = Column(String(36), ForeignKey("grade_templates.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    template = relationship("GradeTemplate", back_populates="remark_templates")
    
    def __repr__(self):
        return f"<RemarkTemplate(id={self.id}, range={self.min_percentage}-{self.max_percentage})>"
