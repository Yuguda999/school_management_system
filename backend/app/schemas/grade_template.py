from typing import Optional, List
from pydantic import BaseModel, Field, validator
from datetime import datetime
from decimal import Decimal


# ============================================================================
# Assessment Component Schemas
# ============================================================================

class AssessmentComponentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name of the assessment component")
    weight: Decimal = Field(..., ge=0, le=100, description="Weight percentage (0-100)")
    is_required: bool = Field(default=True, description="Whether this component is mandatory")
    order: int = Field(default=0, ge=0, description="Display order")


class AssessmentComponentCreate(AssessmentComponentBase):
    pass


class AssessmentComponentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    weight: Optional[Decimal] = Field(None, ge=0, le=100)
    is_required: Optional[bool] = None
    order: Optional[int] = Field(None, ge=0)


class AssessmentComponentResponse(AssessmentComponentBase):
    id: str
    template_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Grade Scale Schemas
# ============================================================================

class GradeScaleBase(BaseModel):
    grade: str = Field(..., min_length=1, max_length=10, description="Grade letter/name (e.g., A+, B, Pass)")
    min_score: Decimal = Field(..., ge=0, description="Minimum score for this grade")
    max_score: Decimal = Field(..., ge=0, description="Maximum score for this grade")
    remark: Optional[str] = Field(None, max_length=100, description="Short remark (e.g., Excellent, Good)")
    color: Optional[str] = Field(None, max_length=20, description="Color code for visual distinction")
    order: int = Field(default=0, ge=0, description="Display order")
    
    @validator('max_score')
    def validate_max_greater_than_min(cls, v, values):
        if 'min_score' in values and v < values['min_score']:
            raise ValueError('max_score must be greater than or equal to min_score')
        return v


class GradeScaleCreate(GradeScaleBase):
    pass


class GradeScaleUpdate(BaseModel):
    grade: Optional[str] = Field(None, min_length=1, max_length=10)
    min_score: Optional[Decimal] = Field(None, ge=0)
    max_score: Optional[Decimal] = Field(None, ge=0)
    remark: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=20)
    order: Optional[int] = Field(None, ge=0)


class GradeScaleResponse(GradeScaleBase):
    id: str
    template_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Remark Template Schemas
# ============================================================================

class RemarkTemplateBase(BaseModel):
    min_percentage: Decimal = Field(..., ge=0, le=100, description="Minimum percentage for this remark")
    max_percentage: Decimal = Field(..., ge=0, le=100, description="Maximum percentage for this remark")
    remark_text: str = Field(..., min_length=1, description="Remark text (supports placeholders)")
    order: int = Field(default=0, ge=0, description="Display order")
    
    @validator('max_percentage')
    def validate_max_greater_than_min(cls, v, values):
        if 'min_percentage' in values and v < values['min_percentage']:
            raise ValueError('max_percentage must be greater than or equal to min_percentage')
        return v


class RemarkTemplateCreate(RemarkTemplateBase):
    pass


class RemarkTemplateUpdate(BaseModel):
    min_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    max_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    remark_text: Optional[str] = Field(None, min_length=1)
    order: Optional[int] = Field(None, ge=0)


class RemarkTemplateResponse(RemarkTemplateBase):
    id: str
    template_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Grade Template Schemas
# ============================================================================

class GradeTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    total_marks: Decimal = Field(default=100, ge=0, description="Total marks for the grading system")


class GradeTemplateCreate(GradeTemplateBase):
    assessment_components: List[AssessmentComponentCreate] = Field(..., min_items=1, description="Assessment components")
    grade_scales: List[GradeScaleCreate] = Field(..., min_items=1, description="Grade scales")
    remark_templates: Optional[List[RemarkTemplateCreate]] = Field(default=[], description="Remark templates")
    
    @validator('assessment_components')
    def validate_total_weight(cls, v):
        """Ensure total weight of assessment components equals 100%"""
        if not v:
            raise ValueError('At least one assessment component is required')
        
        total_weight = sum(component.weight for component in v)
        # Allow small tolerance for Decimal comparison (0.01 = 1 cent/1%)
        if abs(total_weight - 100) > Decimal('0.01'):
            raise ValueError(f'Total weight of assessment components must equal 100%, got {total_weight}%')
        
        return v
    
    @validator('grade_scales')
    def validate_grade_scales(cls, v, values):
        """Validate grade scales have no overlaps"""
        if not v:
            raise ValueError('At least one grade scale is required')
        
        # Sort by min_score for easier validation
        sorted_scales = sorted(v, key=lambda x: x.min_score)
        
        # Check for overlaps
        for i in range(len(sorted_scales) - 1):
            current = sorted_scales[i]
            next_scale = sorted_scales[i + 1]
            
            if current.max_score >= next_scale.min_score:
                raise ValueError(
                    f'Grade scale overlap detected: {current.grade} ({current.min_score}-{current.max_score}) '
                    f'overlaps with {next_scale.grade} ({next_scale.min_score}-{next_scale.max_score})'
                )
        
        return v


class GradeTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    total_marks: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None
    assessment_components: Optional[List[AssessmentComponentCreate]] = None
    grade_scales: Optional[List[GradeScaleCreate]] = None
    remark_templates: Optional[List[RemarkTemplateCreate]] = None
    
    @validator('assessment_components')
    def validate_total_weight(cls, v):
        """Ensure total weight of assessment components equals 100%"""
        if v is not None and len(v) > 0:
            total_weight = sum(component.weight for component in v)
            # Allow small tolerance for Decimal comparison
            if abs(total_weight - 100) > Decimal('0.01'):
                raise ValueError(f'Total weight of assessment components must equal 100%, got {total_weight}%')
        
        return v


class GradeTemplateResponse(GradeTemplateBase):
    id: str
    is_default: bool
    is_active: bool
    school_id: str
    created_by: str
    assessment_components: List[AssessmentComponentResponse]
    grade_scales: List[GradeScaleResponse]
    remark_templates: List[RemarkTemplateResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GradeTemplateSummary(BaseModel):
    """Lightweight version for listing templates"""
    id: str
    name: str
    description: Optional[str]
    is_default: bool
    is_active: bool
    total_marks: Decimal
    component_count: int
    scale_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
