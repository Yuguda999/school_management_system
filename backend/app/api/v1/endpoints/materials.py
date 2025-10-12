from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.core.deps import (
    get_db, get_current_active_user, get_current_school, require_teacher_user
)
from app.models.user import User, UserRole
from app.models.school import School
from app.models.teacher_material import MaterialType, ShareType, AccessType
from app.schemas.teacher_material import (
    MaterialCreate, MaterialUpdate, MaterialResponse, MaterialUploadResponse,
    BulkUploadResponse, MaterialShareCreate, BulkShareCreate, MaterialShareResponse,
    MaterialFolderCreate, MaterialFolderUpdate, MaterialFolderResponse,
    MaterialStats, MaterialAnalytics, StorageQuota
)
from app.services.material_service import MaterialService

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# Material CRUD Endpoints
# ============================================================================

@router.post("/upload", response_model=MaterialUploadResponse)
async def upload_material(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    subject_id: Optional[str] = Form(None),
    grade_level: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # JSON string of tags
    is_published: bool = Form(True),
    scheduled_publish_at: Optional[str] = Form(None),
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Upload a new material (Teachers only)"""
    # Parse tags
    import json
    tags_list = []
    if tags:
        try:
            tags_list = json.loads(tags)
        except:
            tags_list = [t.strip() for t in tags.split(',') if t.strip()]
    
    # Parse scheduled_publish_at
    scheduled_publish_at_parsed = None
    if scheduled_publish_at:
        try:
            from datetime import datetime
            scheduled_publish_at_parsed = datetime.fromisoformat(scheduled_publish_at.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid scheduled_publish_at format. Use ISO format."
            )
    
    # Determine material type from file
    material_type = MaterialService._get_material_type(file.filename)
    
    material_data = MaterialCreate(
        title=title,
        description=description,
        material_type=material_type,
        subject_id=subject_id,
        grade_level=grade_level,
        topic=topic,
        tags=tags_list,
        is_published=is_published,
        scheduled_publish_at=scheduled_publish_at_parsed
    )
    
    material = await MaterialService.upload_material(
        db, file, material_data, current_user.id, current_school.id
    )
    
    preview_url = None
    if material.can_preview:
        preview_url = f"/api/v1/materials/{material.id}/preview"
    
    return MaterialUploadResponse(
        message="Material uploaded successfully",
        material_id=material.id,
        file_url=f"/api/v1/materials/{material.id}/download",
        preview_url=preview_url
    )


@router.post("/bulk-upload", response_model=BulkUploadResponse)
async def bulk_upload_materials(
    files: List[UploadFile] = File(...),
    subject_id: Optional[str] = Form(None),
    grade_level: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    is_published: bool = Form(True),
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Bulk upload materials (Teachers only)"""
    import json
    
    # Parse tags
    tags_list = []
    if tags:
        try:
            tags_list = json.loads(tags)
        except:
            tags_list = [t.strip() for t in tags.split(',') if t.strip()]
    
    successful_uploads = []
    failed_uploads = []
    
    for file in files:
        try:
            material_type = MaterialService._get_material_type(file.filename)
            
            material_data = MaterialCreate(
                title=file.filename,
                description=None,
                material_type=material_type,
                subject_id=subject_id,
                grade_level=grade_level,
                topic=topic,
                tags=tags_list,
                is_published=is_published,
                scheduled_publish_at=None
            )
            
            material = await MaterialService.upload_material(
                db, file, material_data, current_user.id, current_school.id
            )
            
            preview_url = None
            if material.can_preview:
                preview_url = f"/api/v1/materials/{material.id}/preview"
            
            successful_uploads.append(MaterialUploadResponse(
                message="Material uploaded successfully",
                material_id=material.id,
                file_url=f"/api/v1/materials/{material.id}/download",
                preview_url=preview_url
            ))
        except Exception as e:
            failed_uploads.append({
                "filename": file.filename,
                "error": str(e)
            })
    
    return BulkUploadResponse(
        message=f"Uploaded {len(successful_uploads)} of {len(files)} files",
        successful_uploads=successful_uploads,
        failed_uploads=failed_uploads,
        total_count=len(files),
        success_count=len(successful_uploads),
        failure_count=len(failed_uploads)
    )


@router.get("/", response_model=List[MaterialResponse])
async def get_materials(
    subject_id: Optional[str] = Query(None),
    grade_level: Optional[str] = Query(None),
    material_type: Optional[MaterialType] = Query(None),
    tags: Optional[str] = Query(None),  # Comma-separated tags
    search: Optional[str] = Query(None),
    is_published: Optional[bool] = Query(None),
    is_favorite: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get materials with filtering (Teachers only - own materials)"""
    # Parse tags
    tags_list = None
    if tags:
        tags_list = [t.strip() for t in tags.split(',') if t.strip()]
    
    materials = await MaterialService.get_materials(
        db,
        school_id=current_school.id,
        teacher_id=current_user.id,  # Only show teacher's own materials
        subject_id=subject_id,
        grade_level=grade_level,
        material_type=material_type,
        tags=tags_list,
        search=search,
        is_published=is_published,
        is_favorite=is_favorite,
        skip=skip,
        limit=limit
    )
    
    return [MaterialResponse.from_orm(material) for material in materials]


# ============================================================================
# Folder Management Endpoints
# ============================================================================

@router.post("/folders", response_model=MaterialFolderResponse)
async def create_folder(
    folder_data: MaterialFolderCreate,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new folder (Teachers only)"""
    folder = await MaterialService.create_folder(
        db, folder_data, current_user.id, current_school.id
    )

    return MaterialFolderResponse.from_orm(folder)


@router.get("/folders", response_model=List[MaterialFolderResponse])
async def get_folders(
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all folders (Teachers only)"""
    folders = await MaterialService.get_folders(
        db, current_user.id, current_school.id
    )

    return [MaterialFolderResponse.from_orm(folder) for folder in folders]


@router.put("/folders/{folder_id}", response_model=MaterialFolderResponse)
async def update_folder(
    folder_id: str,
    folder_data: MaterialFolderUpdate,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update folder (Teachers only)"""
    folder = await MaterialService.update_folder(
        db, folder_id, folder_data, current_user.id, current_school.id
    )
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )

    return MaterialFolderResponse.from_orm(folder)


@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete folder (Teachers only)"""
    success = await MaterialService.delete_folder(
        db, folder_id, current_user.id, current_school.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )

    return {"message": "Folder deleted successfully"}


@router.post("/folders/{folder_id}/materials/{material_id}")
async def add_material_to_folder(
    folder_id: str,
    material_id: str,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Add material to folder (Teachers only)"""
    await MaterialService.add_material_to_folder(
        db, folder_id, material_id, current_user.id, current_school.id
    )

    return {"message": "Material added to folder successfully"}


@router.delete("/folders/{folder_id}/materials/{material_id}")
async def remove_material_from_folder(
    folder_id: str,
    material_id: str,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Remove material from folder (Teachers only)"""
    success = await MaterialService.remove_material_from_folder(
        db, folder_id, material_id, current_user.id, current_school.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found in folder"
        )

    return {"message": "Material removed from folder successfully"}


@router.get("/folders/{folder_id}/materials", response_model=List[MaterialResponse])
async def get_folder_materials(
    folder_id: str,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all materials in a folder (Teachers only)"""
    materials = await MaterialService.get_folder_materials(
        db, folder_id, current_user.id, current_school.id
    )

    return [MaterialResponse.from_orm(material) for material in materials]


# ============================================================================
# Material CRUD Endpoints (with ID parameter)
# ============================================================================

@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get material by ID"""
    material = await MaterialService.get_material_by_id(db, material_id, current_school.id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    # Teachers can view their own materials, students can view shared materials
    if current_user.role == UserRole.TEACHER:
        if material.uploaded_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own materials"
            )
    elif current_user.role == UserRole.STUDENT:
        # Check if material is shared with student
        # This will be implemented in the sharing endpoints
        pass
    
    return MaterialResponse.from_orm(material)


@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: str,
    material_data: MaterialUpdate,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update material metadata (Teachers only - own materials)"""
    material = await MaterialService.update_material(
        db, material_id, material_data, current_user.id, current_school.id
    )
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    return MaterialResponse.from_orm(material)


@router.delete("/{material_id}")
async def delete_material(
    material_id: str,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete material (Teachers only - own materials)"""
    success = await MaterialService.delete_material(
        db, material_id, current_user.id, current_school.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    return {"message": "Material deleted successfully"}


@router.get("/{material_id}/download")
async def download_material(
    material_id: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Download material file"""
    material = await MaterialService.get_material_by_id(db, material_id, current_school.id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )

    # Check permissions
    if current_user.role == UserRole.TEACHER and material.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only download your own materials"
        )

    # Record access
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await MaterialService.record_access(
        db, material_id, current_user.id, current_school.id,
        AccessType.DOWNLOAD, ip_address, user_agent
    )

    import os
    if not os.path.exists(material.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material file not found"
        )

    return FileResponse(
        path=material.file_path,
        filename=material.original_file_name,
        media_type=material.mime_type
    )


@router.get("/{material_id}/preview")
async def preview_material(
    material_id: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Preview material (for supported file types)"""
    material = await MaterialService.get_material_by_id(db, material_id, current_school.id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )

    if not material.can_preview:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This material type cannot be previewed"
        )

    # Record access
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await MaterialService.record_access(
        db, material_id, current_user.id, current_school.id,
        AccessType.PREVIEW, ip_address, user_agent
    )

    import os
    if not os.path.exists(material.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material file not found"
        )

    return FileResponse(
        path=material.file_path,
        media_type=material.mime_type
    )


# ============================================================================
# Version Control Endpoints
# ============================================================================

@router.post("/{material_id}/versions", response_model=MaterialResponse)
async def create_material_version(
    material_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new version of a material (Teachers only - own materials)"""
    material = await MaterialService.create_material_version(
        db, material_id, file, current_user.id, current_school.id
    )

    return MaterialResponse.from_orm(material)


@router.get("/{material_id}/versions", response_model=List[MaterialResponse])
async def get_material_versions(
    material_id: str,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all versions of a material (Teachers only)"""
    versions = await MaterialService.get_material_versions(
        db, material_id, current_school.id
    )

    return [MaterialResponse.from_orm(version) for version in versions]


# ============================================================================
# Sharing Endpoints
# ============================================================================

@router.post("/{material_id}/share", response_model=MaterialShareResponse)
async def share_material(
    material_id: str,
    share_data: MaterialShareCreate,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Share a material (Teachers only - own materials)"""
    # Set material_id from path
    share_data.material_id = material_id

    share = await MaterialService.share_material(
        db, share_data, current_user.id, current_school.id
    )

    return MaterialShareResponse.from_orm(share)


@router.post("/bulk-share", response_model=List[MaterialShareResponse])
async def bulk_share_materials(
    share_data: BulkShareCreate,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Share multiple materials at once (Teachers only)"""
    shares = await MaterialService.bulk_share_materials(
        db, share_data, current_user.id, current_school.id
    )

    return [MaterialShareResponse.from_orm(share) for share in shares]


@router.get("/{material_id}/shares", response_model=List[MaterialShareResponse])
async def get_material_shares(
    material_id: str,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all shares for a material (Teachers only)"""
    shares = await MaterialService.get_material_shares(
        db, material_id, current_school.id
    )

    return [MaterialShareResponse.from_orm(share) for share in shares]


@router.delete("/{material_id}/shares/{share_id}")
async def remove_share(
    material_id: str,
    share_id: str,
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Remove a material share (Teachers only)"""
    success = await MaterialService.remove_share(
        db, share_id, current_user.id, current_school.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )

    return {"message": "Share removed successfully"}


@router.get("/shared/student", response_model=List[MaterialResponse])
async def get_shared_materials_for_student(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get materials shared with current student (Students only)"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for students only"
        )

    materials = await MaterialService.get_shared_materials_for_student(
        db, current_user.id, current_school.id, skip, limit
    )

    return [MaterialResponse.from_orm(material) for material in materials]


# ============================================================================
# Statistics and Analytics Endpoints
# ============================================================================

@router.get("/stats/overview", response_model=MaterialStats)
async def get_material_stats(
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get material statistics (Teachers only - own materials)"""
    stats = await MaterialService.get_material_stats(
        db, current_school.id, current_user.id
    )

    # Convert materials to response format
    stats['recent_uploads'] = [MaterialResponse.from_orm(m) for m in stats['recent_uploads']]
    stats['popular_materials'] = [MaterialResponse.from_orm(m) for m in stats['popular_materials']]

    return MaterialStats(**stats)


@router.get("/stats/quota", response_model=StorageQuota)
async def get_storage_quota(
    current_user: User = Depends(require_teacher_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get storage quota information (Teachers only)"""
    quota_info = await MaterialService.get_storage_quota_info(
        db, current_user.id, current_school.id
    )

    # Convert materials to response format
    quota_info['largest_materials'] = [MaterialResponse.from_orm(m) for m in quota_info['largest_materials']]

    return StorageQuota(**quota_info)

