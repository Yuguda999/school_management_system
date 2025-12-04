from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum

from app.models.report_card_template import (
    PaperSize, Orientation, FieldType, Alignment, FontWeight, FontStyle
)


# Base schemas for template fields
class ReportCardTemplateFieldBase(BaseModel):
    field_id: str = Field(..., description="Unique identifier for the field within template")
    field_type: FieldType
    label: Optional[str] = Field(None, description="Display label for the field")
    
    # Position and Size (in inches)
    x_position: float = Field(..., ge=0, description="X position in pixels from left")
    y_position: float = Field(..., ge=0, description="Y position in pixels from top")
    width: float = Field(..., gt=0, description="Width in pixels")
    height: float = Field(..., gt=0, description="Height in pixels")
    
    # Styling
    font_family: Optional[str] = Field(None, description="Font family name")
    font_size: Optional[int] = Field(None, ge=6, le=72, description="Font size in points")
    font_weight: FontWeight = FontWeight.NORMAL
    font_style: FontStyle = FontStyle.NORMAL
    text_color: Optional[str] = Field(None, description="Text color")
    background_color: Optional[str] = Field(None, description="Background color")
    border_color: Optional[str] = Field(None, description="Border color")
    border_width: float = Field(0.0, ge=0, description="Border width in points")
    border_style: str = Field("solid", description="Border style")
    
    # Text Properties
    text_align: Alignment = Alignment.LEFT
    line_height: Optional[float] = Field(None, gt=0, description="Line height multiplier")
    
    # Field Configuration
    is_required: bool = False
    is_visible: bool = True
    placeholder_text: Optional[str] = Field(None, max_length=200)
    default_value: Optional[str] = None
    
    # Advanced Properties
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    # Display Order
    z_index: int = Field(0, description="Z-index for layering")


class ReportCardTemplateFieldCreate(ReportCardTemplateFieldBase):
    pass


class ReportCardTemplateFieldUpdate(BaseModel):
    field_id: Optional[str] = None
    field_type: Optional[FieldType] = None
    label: Optional[str] = None
    
    # Position and Size
    x_position: Optional[float] = Field(None, ge=0)
    y_position: Optional[float] = Field(None, ge=0)
    width: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    
    # Styling
    font_family: Optional[str] = None
    font_size: Optional[int] = Field(None, ge=6, le=72)
    font_weight: Optional[FontWeight] = None
    font_style: Optional[FontStyle] = None
    text_color: Optional[str] = Field(None)
    background_color: Optional[str] = Field(None)
    border_color: Optional[str] = Field(None)
    border_width: Optional[float] = Field(None, ge=0)
    border_style: Optional[str] = None
    
    # Text Properties
    text_align: Optional[Alignment] = None
    line_height: Optional[float] = Field(None, gt=0)
    
    # Field Configuration
    is_required: Optional[bool] = None
    is_visible: Optional[bool] = None
    placeholder_text: Optional[str] = Field(None, max_length=200)
    default_value: Optional[str] = None
    
    # Advanced Properties
    properties: Optional[Dict[str, Any]] = None
    
    # Display Order
    z_index: Optional[int] = None


class ReportCardTemplateFieldResponse(ReportCardTemplateFieldBase):
    id: str
    template_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Base schemas for templates
class ReportCardTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    version: str = Field("1.0", description="Template version")
    
    # Design Settings
    paper_size: PaperSize = PaperSize.A4
    orientation: Orientation = Orientation.PORTRAIT
    page_margin_top: float = Field(1.0, ge=0, description="Top margin in pixels")
    page_margin_bottom: float = Field(1.0, ge=0, description="Bottom margin in pixels")
    page_margin_left: float = Field(1.0, ge=0, description="Left margin in pixels")
    page_margin_right: float = Field(1.0, ge=0, description="Right margin in pixels")
    
    # Template Configuration
    background_color: str = Field("#FFFFFF", description="Background color")
    background_image_url: Optional[str] = Field(None, max_length=500, description="Background image URL")
    
    # Default Styles
    default_font_family: str = Field("Arial", max_length=50, description="Default font family")
    default_font_size: int = Field(12, ge=6, le=72, description="Default font size")
    default_text_color: str = Field("#000000", description="Default text color")
    default_line_height: float = Field(1.2, gt=0, le=3, description="Default line height")
    
    # Template Status
    is_active: bool = True
    is_default: bool = False
    is_published: bool = False


class ReportCardTemplateCreate(ReportCardTemplateBase):
    fields: Optional[List[ReportCardTemplateFieldCreate]] = Field(default_factory=list)


class ReportCardTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    version: Optional[str] = None
    
    # Design Settings
    paper_size: Optional[PaperSize] = None
    orientation: Optional[Orientation] = None
    page_margin_top: Optional[float] = Field(None, ge=0)
    page_margin_bottom: Optional[float] = Field(None, ge=0)
    page_margin_left: Optional[float] = Field(None, ge=0)
    page_margin_right: Optional[float] = Field(None, ge=0)
    
    # Template Configuration
    background_color: Optional[str] = Field(None)
    background_image_url: Optional[str] = Field(None, max_length=500)
    
    # Default Styles
    default_font_family: Optional[str] = Field(None, max_length=50)
    default_font_size: Optional[int] = Field(None, ge=6, le=72)
    default_text_color: Optional[str] = Field(None)
    default_line_height: Optional[float] = Field(None, gt=0, le=3)
    
    # Template Status
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    is_published: Optional[bool] = None
    
    # Fields
    fields: Optional[List[Dict[str, Any]]] = None


class ReportCardTemplateResponse(ReportCardTemplateBase):
    id: str
    school_id: str
    created_by: str
    usage_count: int
    last_used: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Related data
    creator_name: Optional[str] = None
    fields: List[ReportCardTemplateFieldResponse] = Field(default_factory=list)
    assignments_count: int = Field(0, description="Number of class assignments")
    
    class Config:
        from_attributes = True


class ReportCardTemplateListResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    version: str
    paper_size: PaperSize
    orientation: Orientation
    is_active: bool
    is_default: bool
    is_published: bool
    usage_count: int
    last_used: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    creator_name: Optional[str] = None
    assignments_count: int = 0
    
    class Config:
        from_attributes = True


# Template Assignment schemas
class ReportCardTemplateAssignmentBase(BaseModel):
    is_active: bool = True
    effective_from: Optional[str] = Field(None, description="Effective from date (YYYY-MM-DD)")
    effective_until: Optional[str] = Field(None, description="Effective until date (YYYY-MM-DD)")
    auto_generate: bool = True
    require_approval: bool = False


class ReportCardTemplateAssignmentCreate(ReportCardTemplateAssignmentBase):
    template_id: str = Field(..., description="Template ID to assign")
    class_id: str = Field(..., description="Class ID to assign template to")


class ReportCardTemplateAssignmentUpdate(BaseModel):
    is_active: Optional[bool] = None
    effective_from: Optional[str] = None
    effective_until: Optional[str] = None
    auto_generate: Optional[bool] = None
    require_approval: Optional[bool] = None


class ReportCardTemplateAssignmentResponse(ReportCardTemplateAssignmentBase):
    id: str
    template_id: str
    class_id: str
    school_id: str
    assigned_by: str
    created_at: datetime
    updated_at: datetime
    
    # Related data
    template_name: Optional[str] = None
    class_name: Optional[str] = None
    assigner_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# Template cloning and preview schemas
class ReportCardTemplateCloneRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class ReportCardTemplatePreviewRequest(BaseModel):
    student_id: Optional[str] = Field(None, description="Student ID for preview data")
    class_id: Optional[str] = Field(None, description="Class ID for preview data")
    term_id: Optional[str] = Field(None, description="Term ID for preview data")


class ReportCardTemplatePreviewResponse(BaseModel):
    preview_html: str = Field(..., description="Generated HTML preview")
    preview_css: str = Field(..., description="Generated CSS styles")
    preview_data: Dict[str, Any] = Field(..., description="Preview data used")


# Template statistics
class ReportCardTemplateStatistics(BaseModel):
    total_templates: int
    active_templates: int
    published_templates: int
    default_templates: int
    total_assignments: int
    active_assignments: int
    most_used_template: Optional[Dict[str, Any]] = None
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)


# Validation helpers
class TemplateValidationError(BaseModel):
    field: str
    message: str
    value: Optional[Any] = None


class TemplateValidationResult(BaseModel):
    is_valid: bool
    errors: List[TemplateValidationError] = Field(default_factory=list)
    warnings: List[TemplateValidationError] = Field(default_factory=list)

