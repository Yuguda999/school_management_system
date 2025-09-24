import os
import uuid
import aiofiles
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, UploadFile, status
from datetime import datetime

from app.models.document import Document, DocumentType, DocumentStatus
from app.models.student import Student
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentVerification
from app.core.config import settings


class DocumentService:
    """Service for managing student documents"""
    
    ALLOWED_EXTENSIONS = {
        '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.txt'
    }
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @staticmethod
    def _get_file_extension(filename: str) -> str:
        """Get file extension from filename"""
        return os.path.splitext(filename)[1].lower()
    
    @staticmethod
    def _validate_file(file: UploadFile) -> None:
        """Validate uploaded file"""
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Check file extension
        ext = DocumentService._get_file_extension(file.filename)
        if ext not in DocumentService.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {ext} not allowed. Allowed types: {', '.join(DocumentService.ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        if file.size and file.size > DocumentService.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size too large. Maximum size is {DocumentService.MAX_FILE_SIZE // (1024*1024)}MB"
            )
    
    @staticmethod
    async def upload_document(
        db: AsyncSession,
        file: UploadFile,
        document_data: DocumentCreate,
        uploaded_by: str,
        school_id: str
    ) -> Document:
        """Upload a new document"""
        # Validate file
        DocumentService._validate_file(file)
        
        # Verify student exists and belongs to school
        result = await db.execute(
            select(Student).where(
                and_(
                    Student.id == document_data.student_id,
                    Student.school_id == school_id,
                    Student.is_deleted == False
                )
            )
        )
        student = result.scalar_one_or_none()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Create upload directory
        upload_dir = os.path.join(settings.upload_dir, "documents", school_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        ext = DocumentService._get_file_extension(file.filename)
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        try:
            # Save file
            content = await file.read()
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            # Create document record
            document = Document(
                title=document_data.title,
                description=document_data.description,
                document_type=document_data.document_type,
                file_name=unique_filename,
                original_file_name=file.filename,
                file_path=file_path,
                file_size=len(content),
                mime_type=file.content_type or 'application/octet-stream',
                uploaded_by=uploaded_by,
                student_id=document_data.student_id,
                expires_at=document_data.expires_at,
                tags=document_data.tags,
                is_public=document_data.is_public,
                school_id=school_id
            )
            
            db.add(document)
            await db.commit()
            await db.refresh(document)
            
            return document
            
        except Exception as e:
            # Clean up file if it was created
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload document: {str(e)}"
            )
    
    @staticmethod
    async def get_documents(
        db: AsyncSession,
        school_id: str,
        student_id: Optional[str] = None,
        document_type: Optional[DocumentType] = None,
        status: Optional[DocumentStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Document]:
        """Get documents with filtering"""
        query = select(Document).options(
            selectinload(Document.uploader),
            selectinload(Document.verifier),
            selectinload(Document.student)
        ).where(
            and_(
                Document.school_id == school_id,
                Document.is_deleted == False
            )
        )
        
        if student_id:
            query = query.where(Document.student_id == student_id)
        if document_type:
            query = query.where(Document.document_type == document_type)
        if status:
            query = query.where(Document.status == status)
        
        query = query.order_by(desc(Document.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_document_by_id(
        db: AsyncSession,
        document_id: str,
        school_id: str
    ) -> Optional[Document]:
        """Get document by ID"""
        result = await db.execute(
            select(Document).options(
                selectinload(Document.uploader),
                selectinload(Document.verifier),
                selectinload(Document.student)
            ).where(
                and_(
                    Document.id == document_id,
                    Document.school_id == school_id,
                    Document.is_deleted == False
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_document(
        db: AsyncSession,
        document_id: str,
        document_data: DocumentUpdate,
        school_id: str
    ) -> Optional[Document]:
        """Update document metadata"""
        document = await DocumentService.get_document_by_id(db, document_id, school_id)
        if not document:
            return None
        
        # Update fields
        for field, value in document_data.dict(exclude_unset=True).items():
            setattr(document, field, value)
        
        document.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(document)
        
        return document
    
    @staticmethod
    async def verify_document(
        db: AsyncSession,
        document_id: str,
        verification_data: DocumentVerification,
        verified_by: str,
        school_id: str
    ) -> Optional[Document]:
        """Verify or reject a document"""
        document = await DocumentService.get_document_by_id(db, document_id, school_id)
        if not document:
            return None
        
        document.status = verification_data.status
        document.verification_notes = verification_data.verification_notes
        document.verified_by = verified_by
        document.verified_at = datetime.utcnow()
        document.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(document)
        
        return document
    
    @staticmethod
    async def delete_document(
        db: AsyncSession,
        document_id: str,
        school_id: str
    ) -> bool:
        """Soft delete document"""
        document = await DocumentService.get_document_by_id(db, document_id, school_id)
        if not document:
            return False
        
        # Soft delete
        document.is_deleted = True
        document.updated_at = datetime.utcnow()
        
        # Optionally delete physical file
        try:
            if os.path.exists(document.file_path):
                os.remove(document.file_path)
        except Exception:
            pass  # Don't fail if file deletion fails
        
        await db.commit()
        return True
    
    @staticmethod
    async def get_document_stats(
        db: AsyncSession,
        school_id: str,
        student_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get document statistics"""
        base_query = select(Document).where(
            and_(
                Document.school_id == school_id,
                Document.is_deleted == False
            )
        )
        
        if student_id:
            base_query = base_query.where(Document.student_id == student_id)
        
        # Total documents
        total_result = await db.execute(
            select(func.count(Document.id)).select_from(base_query.subquery())
        )
        total_documents = total_result.scalar() or 0
        
        # Documents by status
        status_result = await db.execute(
            select(Document.status, func.count(Document.id))
            .select_from(base_query.subquery())
            .group_by(Document.status)
        )
        status_counts = dict(status_result.all())
        
        # Documents by type
        type_result = await db.execute(
            select(Document.document_type, func.count(Document.id))
            .select_from(base_query.subquery())
            .group_by(Document.document_type)
        )
        type_counts = dict(type_result.all())
        
        # Recent uploads
        recent_result = await db.execute(
            base_query.options(
                selectinload(Document.uploader),
                selectinload(Document.student)
            ).order_by(desc(Document.created_at)).limit(5)
        )
        recent_documents = recent_result.scalars().all()
        
        return {
            'total_documents': total_documents,
            'pending_documents': status_counts.get(DocumentStatus.PENDING, 0),
            'approved_documents': status_counts.get(DocumentStatus.APPROVED, 0),
            'rejected_documents': status_counts.get(DocumentStatus.REJECTED, 0),
            'expired_documents': status_counts.get(DocumentStatus.EXPIRED, 0),
            'documents_by_type': type_counts,
            'recent_uploads': recent_documents
        }
