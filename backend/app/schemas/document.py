from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import datetime
from app.models.document import DocumentType, DocumentStatus


class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    document_type: DocumentType
    expires_at: Optional[datetime] = None
    tags: Optional[str] = None  # JSON string of tags
    is_public: bool = False


class DocumentCreate(DocumentBase):
    student_id: str
    
    @validator('title')
    def validate_title(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Title must be at least 2 characters long')
        return v.strip()


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[DocumentType] = None
    expires_at: Optional[datetime] = None
    tags: Optional[str] = None
    is_public: Optional[bool] = None
    status: Optional[DocumentStatus] = None
    verification_notes: Optional[str] = None
    
    @validator('title')
    def validate_title(cls, v):
        if v is not None and (not v or len(v.strip()) < 2):
            raise ValueError('Title must be at least 2 characters long')
        return v.strip() if v else v


class DocumentResponse(DocumentBase):
    id: str
    status: DocumentStatus
    file_name: str
    original_file_name: str
    file_size: int
    mime_type: str
    uploaded_by: str
    student_id: str
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None
    school_id: str
    created_at: datetime
    updated_at: datetime
    
    # Computed properties
    file_size_mb: Optional[float] = None
    is_expired: Optional[bool] = None
    is_image: Optional[bool] = None
    is_pdf: Optional[bool] = None
    
    # Related data
    uploader_name: Optional[str] = None
    verifier_name: Optional[str] = None
    student_name: Optional[str] = None
    
    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        data = {
            'id': obj.id,
            'title': obj.title,
            'description': obj.description,
            'document_type': obj.document_type,
            'status': obj.status,
            'file_name': obj.file_name,
            'original_file_name': obj.original_file_name,
            'file_size': obj.file_size,
            'mime_type': obj.mime_type,
            'uploaded_by': obj.uploaded_by,
            'student_id': obj.student_id,
            'verified_by': obj.verified_by,
            'verified_at': obj.verified_at,
            'verification_notes': obj.verification_notes,
            'expires_at': obj.expires_at,
            'tags': obj.tags,
            'is_public': obj.is_public,
            'school_id': obj.school_id,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
            'file_size_mb': obj.file_size_mb,
            'is_expired': obj.is_expired,
            'is_image': obj.is_image,
            'is_pdf': obj.is_pdf,
        }
        
        # Add related data if available
        if hasattr(obj, 'uploader') and obj.uploader:
            data['uploader_name'] = obj.uploader.full_name
        if hasattr(obj, 'verifier') and obj.verifier:
            data['verifier_name'] = obj.verifier.full_name
        if hasattr(obj, 'student') and obj.student:
            data['student_name'] = obj.student.full_name
            
        return cls(**data)


class DocumentVerification(BaseModel):
    status: DocumentStatus
    verification_notes: Optional[str] = None
    
    @validator('verification_notes')
    def validate_notes(cls, v, values):
        if values.get('status') == DocumentStatus.REJECTED and not v:
            raise ValueError('Verification notes are required when rejecting a document')
        return v


class DocumentUploadResponse(BaseModel):
    message: str
    document_id: str
    file_url: str


class DocumentStats(BaseModel):
    total_documents: int
    pending_documents: int
    approved_documents: int
    rejected_documents: int
    expired_documents: int
    documents_by_type: dict
    recent_uploads: List[DocumentResponse]
