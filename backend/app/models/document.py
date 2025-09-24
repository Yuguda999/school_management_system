from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import TenantBaseModel


class DocumentType(str, enum.Enum):
    """Document type enumeration"""
    BIRTH_CERTIFICATE = "birth_certificate"
    PASSPORT = "passport"
    NATIONAL_ID = "national_id"
    MEDICAL_RECORD = "medical_record"
    ACADEMIC_TRANSCRIPT = "academic_transcript"
    IMMUNIZATION_RECORD = "immunization_record"
    PHOTO = "photo"
    PARENT_ID = "parent_id"
    PROOF_OF_ADDRESS = "proof_of_address"
    OTHER = "other"


class DocumentStatus(str, enum.Enum):
    """Document status enumeration"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Document(TenantBaseModel):
    """Document model for storing student documents"""
    
    __tablename__ = "documents"
    
    # Basic Information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    document_type = Column(Enum(DocumentType), nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING, nullable=False)
    
    # File Information
    file_name = Column(String(255), nullable=False)
    original_file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    
    # Metadata
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    
    # Verification Information
    verified_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
    
    # Expiry Information (for documents like passports, IDs)
    expires_at = Column(DateTime, nullable=True)
    
    # Additional Information
    tags = Column(Text, nullable=True)  # JSON array of tags
    is_public = Column(Boolean, default=False, nullable=False)  # Whether parents can view
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by])
    verifier = relationship("User", foreign_keys=[verified_by])
    student = relationship("Student", back_populates="documents")
    
    def __repr__(self):
        return f"<Document(id={self.id}, title={self.title}, type={self.document_type}, student_id={self.student_id})>"
    
    @property
    def is_expired(self) -> bool:
        """Check if document is expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    @property
    def file_size_mb(self) -> float:
        """Get file size in MB"""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def is_image(self) -> bool:
        """Check if document is an image"""
        image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        return self.mime_type in image_types
    
    @property
    def is_pdf(self) -> bool:
        """Check if document is a PDF"""
        return self.mime_type == 'application/pdf'
