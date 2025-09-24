from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_school_admin_user, get_current_active_user, get_current_school
from app.models.user import User
from app.models.school import School
from app.models.document import DocumentType, DocumentStatus
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentVerification,
    DocumentUploadResponse,
    DocumentStats
)
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    student_id: str = Form(...),
    document_type: DocumentType = Form(...),
    description: Optional[str] = Form(None),
    expires_at: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    is_public: bool = Form(False),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Upload a document for a student"""
    # Parse expires_at if provided
    expires_at_parsed = None
    if expires_at:
        try:
            from datetime import datetime
            expires_at_parsed = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid expires_at format. Use ISO format."
            )
    
    document_data = DocumentCreate(
        title=title,
        student_id=student_id,
        document_type=document_type,
        description=description,
        expires_at=expires_at_parsed,
        tags=tags,
        is_public=is_public
    )
    
    document = await DocumentService.upload_document(
        db, file, document_data, current_user.id, current_school.id
    )
    
    return DocumentUploadResponse(
        message="Document uploaded successfully",
        document_id=document.id,
        file_url=f"/api/v1/documents/{document.id}/download"
    )


@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    student_id: Optional[str] = Query(None),
    document_type: Optional[DocumentType] = Query(None),
    status: Optional[DocumentStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get documents with filtering"""
    documents = await DocumentService.get_documents(
        db, current_school.id, student_id, document_type, status, skip, limit
    )
    
    return [DocumentResponse.from_orm(doc) for doc in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get document by ID"""
    document = await DocumentService.get_document_by_id(db, document_id, current_school.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return DocumentResponse.from_orm(document)


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Download document file"""
    document = await DocumentService.get_document_by_id(db, document_id, current_school.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    import os
    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found"
        )
    
    return FileResponse(
        path=document.file_path,
        filename=document.original_file_name,
        media_type=document.mime_type
    )


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_data: DocumentUpdate,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update document metadata (Admin only)"""
    document = await DocumentService.update_document(
        db, document_id, document_data, current_school.id
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return DocumentResponse.from_orm(document)


@router.post("/{document_id}/verify", response_model=DocumentResponse)
async def verify_document(
    document_id: str,
    verification_data: DocumentVerification,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Verify or reject a document (Admin only)"""
    document = await DocumentService.verify_document(
        db, document_id, verification_data, current_user.id, current_school.id
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return DocumentResponse.from_orm(document)


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(require_school_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete document (Admin only)"""
    success = await DocumentService.delete_document(db, document_id, current_school.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return {"message": "Document deleted successfully"}


@router.get("/stats/overview", response_model=DocumentStats)
async def get_document_stats(
    student_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get document statistics"""
    stats = await DocumentService.get_document_stats(db, current_school.id, student_id)
    
    # Convert recent uploads to response format
    recent_uploads = [DocumentResponse.from_orm(doc) for doc in stats['recent_uploads']]
    stats['recent_uploads'] = recent_uploads
    
    return DocumentStats(**stats)


@router.get("/student/{student_id}", response_model=List[DocumentResponse])
async def get_student_documents(
    student_id: str,
    document_type: Optional[DocumentType] = Query(None),
    status: Optional[DocumentStatus] = Query(None),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all documents for a specific student"""
    documents = await DocumentService.get_documents(
        db, current_school.id, student_id, document_type, status
    )
    
    return [DocumentResponse.from_orm(doc) for doc in documents]
