from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, Enum, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import TenantBaseModel


class MaterialType(str, enum.Enum):
    """Material type enumeration"""
    DOCUMENT = "document"
    PDF = "pdf"
    PRESENTATION = "presentation"
    SPREADSHEET = "spreadsheet"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    ARCHIVE = "archive"
    OTHER = "other"


class ShareType(str, enum.Enum):
    """Share type enumeration"""
    CLASS = "class"
    STUDENT_GROUP = "student_group"
    INDIVIDUAL_STUDENT = "individual_student"
    TEACHER = "teacher"
    ALL_STUDENTS = "all_students"


class AccessType(str, enum.Enum):
    """Access type enumeration"""
    VIEW = "view"
    DOWNLOAD = "download"
    PREVIEW = "preview"


class TeacherMaterial(TenantBaseModel):
    """Model for teacher educational materials"""
    
    __tablename__ = "teacher_materials"
    
    # Basic Information
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    material_type = Column(Enum(MaterialType), nullable=False)
    
    # File Information
    file_name = Column(String(255), nullable=False)
    original_file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    
    # Categorization
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True)
    grade_level = Column(String(50), nullable=True)  # e.g., "Primary 1", "JSS 2"
    topic = Column(String(255), nullable=True)
    tags = Column(JSON, nullable=True, default=list)  # Array of tags
    
    # Ownership
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False, index=True)
    
    # Publishing
    is_published = Column(Boolean, default=True, nullable=False)
    published_at = Column(DateTime, nullable=True)
    scheduled_publish_at = Column(DateTime, nullable=True)
    
    # Version Control
    version_number = Column(Integer, default=1, nullable=False)
    parent_material_id = Column(String(36), ForeignKey("teacher_materials.id"), nullable=True)
    is_current_version = Column(Boolean, default=True, nullable=False)
    
    # Analytics
    view_count = Column(Integer, default=0, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    
    # Organization
    is_favorite = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by], back_populates="uploaded_materials")
    subject = relationship("Subject", back_populates="materials")
    parent_material = relationship("TeacherMaterial", remote_side="TeacherMaterial.id", foreign_keys=[parent_material_id])
    shares = relationship("MaterialShare", back_populates="material", cascade="all, delete-orphan")
    access_logs = relationship("MaterialAccess", back_populates="material", cascade="all, delete-orphan")
    folder_items = relationship("MaterialFolderItem", back_populates="material", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<TeacherMaterial(id={self.id}, title={self.title}, type={self.material_type})>"
    
    @property
    def file_size_mb(self) -> float:
        """Get file size in MB"""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def is_image(self) -> bool:
        """Check if material is an image"""
        image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        return self.mime_type in image_types
    
    @property
    def is_pdf(self) -> bool:
        """Check if material is a PDF"""
        return self.mime_type == 'application/pdf'
    
    @property
    def is_video(self) -> bool:
        """Check if material is a video"""
        return self.mime_type.startswith('video/')
    
    @property
    def is_audio(self) -> bool:
        """Check if material is audio"""
        return self.mime_type.startswith('audio/')
    
    @property
    def can_preview(self) -> bool:
        """Check if material can be previewed"""
        previewable_types = [
            'application/pdf',
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'text/plain', 'text/html', 'text/markdown'
        ]
        return self.mime_type in previewable_types or self.is_video or self.is_audio


class MaterialShare(TenantBaseModel):
    """Model for material sharing and distribution"""
    
    __tablename__ = "material_shares"
    
    # Basic Information
    material_id = Column(String(36), ForeignKey("teacher_materials.id"), nullable=False, index=True)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False, index=True)
    
    # Share Configuration
    share_type = Column(Enum(ShareType), nullable=False)
    target_id = Column(String(36), nullable=True)  # class_id, student_id, or teacher_id
    
    # Permissions
    can_download = Column(Boolean, default=True, nullable=False)
    can_view = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    shared_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    shared_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    material = relationship("TeacherMaterial", back_populates="shares")
    sharer = relationship("User", foreign_keys=[shared_by])
    
    def __repr__(self):
        return f"<MaterialShare(id={self.id}, material_id={self.material_id}, type={self.share_type})>"
    
    @property
    def is_expired(self) -> bool:
        """Check if share is expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at


class MaterialAccess(TenantBaseModel):
    """Model for tracking material access"""
    
    __tablename__ = "material_access_logs"
    
    # Basic Information
    material_id = Column(String(36), ForeignKey("teacher_materials.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False, index=True)
    
    # Access Details
    access_type = Column(Enum(AccessType), nullable=False)
    accessed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(String(500), nullable=True)
    
    # Relationships
    material = relationship("TeacherMaterial", back_populates="access_logs")
    user = relationship("User")
    
    def __repr__(self):
        return f"<MaterialAccess(id={self.id}, material_id={self.material_id}, type={self.access_type})>"


class MaterialFolder(TenantBaseModel):
    """Model for organizing materials into folders"""
    
    __tablename__ = "material_folders"
    
    # Basic Information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Hierarchy
    parent_folder_id = Column(String(36), ForeignKey("material_folders.id"), nullable=True)
    
    # Ownership
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False, index=True)
    
    # Customization
    color = Column(String(7), nullable=True)  # Hex color code
    icon = Column(String(50), nullable=True)  # Icon name/identifier
    
    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    parent_folder = relationship("MaterialFolder", remote_side="MaterialFolder.id", foreign_keys=[parent_folder_id], backref="children")
    folder_items = relationship("MaterialFolderItem", back_populates="folder", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<MaterialFolder(id={self.id}, name={self.name}, teacher_id={self.teacher_id})>"


class MaterialFolderItem(TenantBaseModel):
    """Junction table for materials in folders"""
    
    __tablename__ = "material_folder_items"
    
    # Relationships
    folder_id = Column(String(36), ForeignKey("material_folders.id"), nullable=False, index=True)
    material_id = Column(String(36), ForeignKey("teacher_materials.id"), nullable=False, index=True)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False, index=True)
    
    # Organization
    position = Column(Integer, default=0, nullable=False)  # For custom ordering
    
    # Relationships
    folder = relationship("MaterialFolder", back_populates="folder_items")
    material = relationship("TeacherMaterial", back_populates="folder_items")
    
    def __repr__(self):
        return f"<MaterialFolderItem(folder_id={self.folder_id}, material_id={self.material_id})>"

