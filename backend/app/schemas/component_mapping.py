from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


# ============================================================================
# Component Mapping Schemas
# ============================================================================

class ComponentMappingBase(BaseModel):
    exam_type_name: str = Field(..., min_length=1, max_length=100, description="Exam type name (e.g., Quiz, Assignment)")
    component_id: str = Field(..., description="ID of the grade template component")
    include_in_calculation: bool = Field(default=True, description="Whether to include in grade calculations")


class ComponentMappingCreate(ComponentMappingBase):
    teacher_id: str = Field(..., description="Teacher ID")
    subject_id: str = Field(..., description="Subject ID")
    term_id: str = Field(..., description="Term ID")


class ComponentMappingUpdate(BaseModel):
    exam_type_name: Optional[str] = Field(None, min_length=1, max_length=100)
    component_id: Optional[str] = None
    include_in_calculation: Optional[bool] = None


class ComponentMappingResponse(ComponentMappingBase):
    id: str
    teacher_id: str
    subject_id: str
    term_id: str
    school_id: str
    created_at: datetime
    updated_at: datetime
    
    # Nested data for convenience
    component_name: Optional[str] = None
    component_weight: Optional[float] = None
    
    class Config:
        from_attributes = True


class ExamTypeInfo(BaseModel):
    """Info about an exam type available for mapping"""
    exam_type_name: str
    exam_count: int
    mapped: bool
    mapped_to_component: Optional[str] = None


class MappingPreview(BaseModel):
    """Preview of how grades will be calculated with current mappings"""
    component_id: str
    component_name: str
    component_weight: float
    mapped_exam_types: list[str]
    exam_count: int
    sample_score: Optional[float] = None
    weighted_score: Optional[float] = None
