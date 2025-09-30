from sqlalchemy import Column, String, Boolean, Text, Integer, JSON, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class PaperSize(str, enum.Enum):
    A4 = "A4"
    A3 = "A3"
    LETTER = "Letter"
    LEGAL = "Legal"
    TABLOID = "Tabloid"


class Orientation(str, enum.Enum):
    PORTRAIT = "portrait"
    LANDSCAPE = "landscape"


class FieldType(str, enum.Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    IMAGE = "image"
    TABLE = "table"
    SIGNATURE = "signature"
    BARCODE = "barcode"
    STUDENT_INFO = "student_info"
    GRADE_TABLE = "grade_table"
    ATTENDANCE = "attendance"
    COMMENTS = "comments"
    SCHOOL_HEADER = "school_header"
    PERFORMANCE_SUMMARY = "performance_summary"


class Alignment(str, enum.Enum):
    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"
    JUSTIFY = "justify"


class FontWeight(str, enum.Enum):
    NORMAL = "normal"
    BOLD = "bold"
    LIGHTER = "lighter"
    BOLDER = "bolder"


class FontStyle(str, enum.Enum):
    NORMAL = "normal"
    ITALIC = "italic"
    OBLIQUE = "oblique"


class ReportCardTemplate(TenantBaseModel):
    """Report card template model for designing custom report cards - now stored in school settings"""
    
    __tablename__ = "report_card_templates"
    
    # Basic Information
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String(10), default="1.0", nullable=False)
    
    # Design Settings
    paper_size = Column(Enum(PaperSize), default=PaperSize.A4, nullable=False)
    orientation = Column(Enum(Orientation), default=Orientation.PORTRAIT, nullable=False)
    page_margin_top = Column(Numeric(5, 2), default=1.0, nullable=False)  # in inches
    page_margin_bottom = Column(Numeric(5, 2), default=1.0, nullable=False)
    page_margin_left = Column(Numeric(5, 2), default=1.0, nullable=False)
    page_margin_right = Column(Numeric(5, 2), default=1.0, nullable=False)
    
    # Template Configuration
    background_color = Column(String(7), default="#FFFFFF", nullable=False)  # Hex color
    background_image_url = Column(String(500), nullable=True)
    
    # Default Styles
    default_font_family = Column(String(50), default="Arial", nullable=False)
    default_font_size = Column(Integer, default=12, nullable=False)
    default_text_color = Column(String(7), default="#000000", nullable=False)
    default_line_height = Column(Numeric(3, 2), default=1.2, nullable=False)
    
    # Template Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    
    # Usage Statistics
    usage_count = Column(Integer, default=0, nullable=False)
    last_used = Column(String(50), nullable=True)
    
    # Foreign Keys - Now associated with school owner instead of school directly
    school_owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)  # Keep for reference
    
    # Relationships
    school_owner = relationship("User", foreign_keys=[school_owner_id])
    school = relationship("School")
    fields = relationship("ReportCardTemplateField", back_populates="template", cascade="all, delete-orphan")
    assignments = relationship("ReportCardTemplateAssignment", back_populates="template", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ReportCardTemplate(id={self.id}, name={self.name}, school_id={self.school_id})>"


class ReportCardTemplateField(TenantBaseModel):
    """Individual field/element in a report card template"""
    
    __tablename__ = "report_card_template_fields"
    
    # Field Identification
    field_id = Column(String(50), nullable=False)  # Unique within template
    field_type = Column(Enum(FieldType), nullable=False)
    label = Column(String(100), nullable=True)
    
    # Position and Size (in inches)
    x_position = Column(Numeric(8, 3), nullable=False)
    y_position = Column(Numeric(8, 3), nullable=False)
    width = Column(Numeric(8, 3), nullable=False)
    height = Column(Numeric(8, 3), nullable=False)
    
    # Styling
    font_family = Column(String(50), nullable=True)
    font_size = Column(Integer, nullable=True)
    font_weight = Column(Enum(FontWeight), default=FontWeight.NORMAL, nullable=False)
    font_style = Column(Enum(FontStyle), default=FontStyle.NORMAL, nullable=False)
    text_color = Column(String(7), nullable=True)
    background_color = Column(String(7), nullable=True)
    border_color = Column(String(7), nullable=True)
    border_width = Column(Numeric(3, 2), default=0.0, nullable=False)
    border_style = Column(String(20), default="solid", nullable=False)
    
    # Text Properties
    text_align = Column(Enum(Alignment), default=Alignment.LEFT, nullable=False)
    line_height = Column(Numeric(3, 2), nullable=True)
    
    # Field Configuration
    is_required = Column(Boolean, default=False, nullable=False)
    is_visible = Column(Boolean, default=True, nullable=False)
    placeholder_text = Column(String(200), nullable=True)
    default_value = Column(Text, nullable=True)
    
    # Advanced Properties (JSON for flexible configuration)
    properties = Column(JSON, nullable=True, default={})
    
    # Display Order
    z_index = Column(Integer, default=0, nullable=False)
    
    # Foreign Keys
    template_id = Column(String(36), ForeignKey("report_card_templates.id"), nullable=False)
    school_owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)  # For direct access
    
    # Relationships
    template = relationship("ReportCardTemplate", back_populates="fields")
    school_owner = relationship("User", foreign_keys=[school_owner_id])
    
    def __repr__(self):
        return f"<ReportCardTemplateField(id={self.id}, field_id={self.field_id}, type={self.field_type})>"


class ReportCardTemplateAssignment(TenantBaseModel):
    """Assignment of templates to classes"""
    
    __tablename__ = "report_card_template_assignments"
    
    # Assignment Details
    is_active = Column(Boolean, default=True, nullable=False)
    effective_from = Column(String(50), nullable=True)  # Date when assignment becomes effective
    effective_until = Column(String(50), nullable=True)  # Date when assignment expires
    
    # Usage Configuration
    auto_generate = Column(Boolean, default=True, nullable=False)
    require_approval = Column(Boolean, default=False, nullable=False)
    
    # Foreign Keys
    template_id = Column(String(36), ForeignKey("report_card_templates.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    school_owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)  # Template owner
    assigned_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    template = relationship("ReportCardTemplate", back_populates="assignments")
    class_ = relationship("Class")
    school = relationship("School")
    school_owner = relationship("User", foreign_keys=[school_owner_id])
    assigner = relationship("User", foreign_keys=[assigned_by])
    
    def __repr__(self):
        return f"<ReportCardTemplateAssignment(id={self.id}, template_id={self.template_id}, class_id={self.class_id})>"


