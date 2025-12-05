"""
Teacher Material Models for Materials Management and Smart Resource Library (P3.2)
"""

from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Enum as SQLEnum, Integer, DateTime, JSON
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class MaterialType(str, enum.Enum):
    """Type of material"""
    DOCUMENT = "DOCUMENT"
    PDF = "PDF"
    PRESENTATION = "PRESENTATION"
    SPREADSHEET = "SPREADSHEET"
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    AUDIO = "AUDIO"
    ARCHIVE = "ARCHIVE"
    OTHER = "OTHER"


class ShareType(str, enum.Enum):
    """Type of sharing"""
    CLASS = "CLASS"
    STUDENT_GROUP = "STUDENT_GROUP"
    INDIVIDUAL_STUDENT = "INDIVIDUAL_STUDENT"
    TEACHER = "TEACHER"
    ALL_STUDENTS = "ALL_STUDENTS"


class AccessType(str, enum.Enum):
    """Type of access"""
    VIEW = "VIEW"
    DOWNLOAD = "DOWNLOAD"
    PREVIEW = "PREVIEW"


class DifficultyLevel(str, enum.Enum):
    """Difficulty level for materials"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class TeacherMaterial(TenantBaseModel):
    """Model for teacher educational materials"""
    
    __tablename__ = "teacher_materials"
    
    # Basic info
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    material_type = Column(SQLEnum(MaterialType), nullable=False)
    
    # File info
    file_name = Column(String(255), nullable=False)
    original_file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    
    # Categorization
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True, index=True)
    grade_level = Column(String(50), nullable=True)  # e.g., "JSS1", "SS2"
    topic = Column(String(255), nullable=True)
    tags = Column(JSON, nullable=True, default=[])  # List of tags
    
    # Enhanced tagging for Smart Resource Library (P3.2)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=True, index=True)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=True, index=True)
    difficulty_level = Column(SQLEnum(DifficultyLevel), nullable=True)
    exam_type = Column(String(100), nullable=True)  # e.g., "WAEC", "NECO", "JAMB"
    keywords = Column(JSON, nullable=True, default=[])  # AI-extracted keywords
    content_summary = Column(Text, nullable=True)  # AI-generated summary
    
    # Ownership
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Publishing
    is_published = Column(Boolean, default=False, nullable=False)
    published_at = Column(DateTime, nullable=True)
    scheduled_publish_at = Column(DateTime, nullable=True)
    
    # Versioning
    version_number = Column(Integer, default=1, nullable=False)
    parent_material_id = Column(String(36), ForeignKey("teacher_materials.id"), nullable=True)
    is_current_version = Column(Boolean, default=True, nullable=False)
    
    # Statistics
    view_count = Column(Integer, default=0, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    is_favorite = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    subject = relationship("Subject")
    class_ = relationship("Class")
    term = relationship("Term")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    parent_material = relationship("TeacherMaterial", remote_side="TeacherMaterial.id")
    shares = relationship("MaterialShare", back_populates="material")
    access_logs = relationship("MaterialAccessLog", back_populates="material")
    folder_items = relationship("MaterialFolderItem", back_populates="material")
    
    def __repr__(self):
        return f"<TeacherMaterial {self.title}>"


class MaterialShare(TenantBaseModel):
    """Model for material sharing"""
    
    __tablename__ = "material_shares"
    
    material_id = Column(String(36), ForeignKey("teacher_materials.id"), nullable=False, index=True)
    share_type = Column(SQLEnum(ShareType), nullable=False)
    target_id = Column(String(36), nullable=True)  # Class ID, Student ID, etc.
    can_download = Column(Boolean, default=True, nullable=False)
    can_view = Column(Boolean, default=True, nullable=False)
    shared_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    shared_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    material = relationship("TeacherMaterial", back_populates="shares")
    sharer = relationship("User")
    
    def __repr__(self):
        return f"<MaterialShare {self.material_id} -> {self.share_type.value}>"


class MaterialAccessLog(TenantBaseModel):
    """Model for tracking material access"""
    
    __tablename__ = "material_access_logs"
    
    material_id = Column(String(36), ForeignKey("teacher_materials.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    access_type = Column(SQLEnum(AccessType), nullable=False)
    accessed_at = Column(DateTime, nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Relationships
    material = relationship("TeacherMaterial", back_populates="access_logs")
    user = relationship("User")
    
    def __repr__(self):
        return f"<MaterialAccessLog {self.material_id} by {self.user_id}>"


class MaterialFolder(TenantBaseModel):
    """Model for organizing materials into folders"""
    
    __tablename__ = "material_folders"
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    parent_folder_id = Column(String(36), ForeignKey("material_folders.id"), nullable=True)
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    color = Column(String(7), nullable=True)  # Hex color
    icon = Column(String(50), nullable=True)
    
    # Relationships
    parent_folder = relationship("MaterialFolder", remote_side="MaterialFolder.id", backref="children")
    teacher = relationship("User")
    folder_items = relationship("MaterialFolderItem", back_populates="folder")
    
    def __repr__(self):
        return f"<MaterialFolder {self.name}>"


class MaterialFolderItem(TenantBaseModel):
    """Junction table for materials in folders"""

    __tablename__ = "material_folder_items"

    folder_id = Column(String(36), ForeignKey("material_folders.id"), nullable=False, index=True)
    material_id = Column(String(36), ForeignKey("teacher_materials.id"), nullable=False, index=True)
    position = Column(Integer, default=0, nullable=False)

    # Relationships
    folder = relationship("MaterialFolder", back_populates="folder_items")
    material = relationship("TeacherMaterial", back_populates="folder_items")

    def __repr__(self):
        return f"<MaterialFolderItem folder={self.folder_id} material={self.material_id}>"

