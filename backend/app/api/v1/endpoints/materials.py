"""
Materials API Endpoints for Materials Management and Smart Resource Library (P3.2)
"""

from typing import Any, Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.deps import require_teacher_or_admin_user, get_current_school
from app.models.user import User
from app.models.school import School
from app.models.teacher_material import MaterialType, DifficultyLevel, AccessType
from app.services.material_service import MaterialService

router = APIRouter()


# ============== Request/Response Models ==============

class MaterialCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    subject_id: Optional[str] = None
    class_id: Optional[str] = None
    term_id: Optional[str] = None
    grade_level: Optional[str] = None
    topic: Optional[str] = None
    tags: List[str] = []
    difficulty_level: Optional[DifficultyLevel] = None
    exam_type: Optional[str] = None
    is_published: bool = False


class MaterialUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    subject_id: Optional[str] = None
    class_id: Optional[str] = None
    term_id: Optional[str] = None
    grade_level: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[List[str]] = None
    difficulty_level: Optional[DifficultyLevel] = None
    exam_type: Optional[str] = None
    is_published: Optional[bool] = None


class TagsRequest(BaseModel):
    tags: List[str]


class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    parent_folder_id: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    subject_id: Optional[str] = None
    class_id: Optional[str] = None
    grade_level: Optional[str] = None
    difficulty_level: Optional[DifficultyLevel] = None
    exam_type: Optional[str] = None
    material_type: Optional[MaterialType] = None
    limit: int = Field(20, ge=1, le=100)


# ============== Material Endpoints ==============

@router.get("")
async def list_materials(
    subject_id: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    term_id: Optional[str] = Query(None),
    material_type: Optional[MaterialType] = Query(None),
    is_published: Optional[bool] = Query(None),
    is_favorite: Optional[bool] = Query(None),
    difficulty_level: Optional[DifficultyLevel] = Query(None),
    exam_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """List materials for the current teacher"""
    materials = await MaterialService.list_materials(
        db, current_school.id, current_user.id,
        subject_id, class_id, term_id, material_type,
        is_published, is_favorite, None, difficulty_level, exam_type,
        limit, offset
    )
    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "material_type": m.material_type.value,
            "file_name": m.file_name,
            "original_file_name": m.original_file_name,
            "file_size": m.file_size,
            "subject_id": m.subject_id,
            "subject_name": m.subject.name if m.subject else None,
            "class_id": m.class_id,
            "class_name": m.class_.name if m.class_ else None,
            "term_id": m.term_id,
            "grade_level": m.grade_level,
            "topic": m.topic,
            "tags": m.tags or [],
            "difficulty_level": m.difficulty_level.value if m.difficulty_level else None,
            "exam_type": m.exam_type,
            "is_published": m.is_published,
            "view_count": m.view_count,
            "download_count": m.download_count,
            "is_favorite": m.is_favorite,
            "created_at": m.created_at.isoformat()
        }
        for m in materials
    ]


@router.get("/{material_id}")
async def get_material(
    material_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific material"""
    material = await MaterialService.get_material(db, current_school.id, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    # Log view access
    await MaterialService.log_access(
        db, current_school.id, material_id, current_user.id, AccessType.VIEW
    )
    
    return {
        "id": material.id,
        "title": material.title,
        "description": material.description,
        "material_type": material.material_type.value,
        "file_name": material.file_name,
        "original_file_name": material.original_file_name,
        "file_path": material.file_path,
        "file_size": material.file_size,
        "mime_type": material.mime_type,
        "subject_id": material.subject_id,
        "subject_name": material.subject.name if material.subject else None,
        "class_id": material.class_id,
        "class_name": material.class_.name if material.class_ else None,
        "term_id": material.term_id,
        "grade_level": material.grade_level,
        "topic": material.topic,
        "tags": material.tags or [],
        "difficulty_level": material.difficulty_level.value if material.difficulty_level else None,
        "exam_type": material.exam_type,
        "is_published": material.is_published,
        "view_count": material.view_count,
        "download_count": material.download_count,
        "is_favorite": material.is_favorite,
        "created_at": material.created_at.isoformat()
    }


@router.put("/{material_id}")
async def update_material(
    material_id: str,
    data: MaterialUpdate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a material"""
    update_data = data.model_dump(exclude_unset=True)
    material = await MaterialService.update_material(
        db, current_school.id, material_id, **update_data
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material updated successfully", "id": material.id}


@router.delete("/{material_id}")
async def delete_material(
    material_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete a material"""
    success = await MaterialService.delete_material(db, current_school.id, material_id)
    if not success:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted successfully"}


# ============== Smart Search Endpoints (P3.2) ==============

@router.post("/search")
async def smart_search(
    data: SearchRequest,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Smart search for materials"""
    results = await MaterialService.smart_search(
        db, current_school.id, data.query,
        data.subject_id, data.class_id, data.grade_level,
        data.difficulty_level, data.exam_type, data.material_type,
        data.limit
    )
    return {"results": results, "count": len(results)}


@router.get("/{material_id}/related")
async def get_related_materials(
    material_id: str,
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get related materials"""
    materials = await MaterialService.get_related_materials(
        db, current_school.id, material_id, limit
    )
    return [
        {
            "id": m.id,
            "title": m.title,
            "material_type": m.material_type.value,
            "subject_name": m.subject.name if m.subject else None,
            "grade_level": m.grade_level,
            "view_count": m.view_count
        }
        for m in materials
    ]


@router.get("/suggestions/lesson")
async def get_lesson_suggestions(
    subject_id: str = Query(...),
    class_id: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get suggested materials for lesson planning"""
    materials = await MaterialService.get_suggested_materials_for_lesson(
        db, current_school.id, subject_id, class_id, topic, limit
    )
    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "material_type": m.material_type.value,
            "subject_name": m.subject.name if m.subject else None,
            "topic": m.topic,
            "view_count": m.view_count
        }
        for m in materials
    ]


# ============== Tagging Endpoints ==============

@router.post("/{material_id}/tags")
async def add_tags(
    material_id: str,
    data: TagsRequest,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Add tags to a material"""
    material = await MaterialService.add_tags(
        db, current_school.id, material_id, data.tags
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Tags added successfully", "tags": material.tags}


@router.delete("/{material_id}/tags")
async def remove_tags(
    material_id: str,
    data: TagsRequest,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Remove tags from a material"""
    material = await MaterialService.remove_tags(
        db, current_school.id, material_id, data.tags
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Tags removed successfully", "tags": material.tags}


@router.get("/tags/all")
async def get_all_tags(
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all unique tags with counts"""
    tags = await MaterialService.get_all_tags(db, current_school.id, current_user.id)
    return {"tags": tags}


# ============== Statistics Endpoint ==============

@router.get("/stats/summary")
async def get_statistics(
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get material statistics"""
    return await MaterialService.get_material_statistics(
        db, current_school.id, current_user.id
    )


# ============== Folder Endpoints ==============

@router.get("/folders")
async def list_folders(
    parent_folder_id: Optional[str] = Query(None),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """List folders for the current teacher"""
    folders = await MaterialService.get_folders(
        db, current_school.id, current_user.id, parent_folder_id
    )
    return [
        {
            "id": f.id,
            "name": f.name,
            "description": f.description,
            "parent_folder_id": f.parent_folder_id,
            "color": f.color,
            "icon": f.icon,
            "material_count": len(f.folder_items) if f.folder_items else 0,
            "subfolder_count": len(f.children) if f.children else 0,
            "created_at": f.created_at.isoformat()
        }
        for f in folders
    ]


@router.post("/folders")
async def create_folder(
    data: FolderCreate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new folder"""
    folder = await MaterialService.create_folder(
        db, current_school.id, current_user.id,
        data.name, data.description, data.parent_folder_id,
        data.color, data.icon
    )
    return {
        "id": folder.id,
        "name": folder.name,
        "message": "Folder created successfully"
    }


@router.post("/folders/{folder_id}/materials/{material_id}")
async def add_material_to_folder(
    folder_id: str,
    material_id: str,
    position: int = Query(0),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Add a material to a folder"""
    item = await MaterialService.add_material_to_folder(
        db, current_school.id, folder_id, material_id, position
    )
    return {"message": "Material added to folder", "id": item.id}


@router.delete("/folders/{folder_id}/materials/{material_id}")
async def remove_material_from_folder(
    folder_id: str,
    material_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Remove a material from a folder"""
    success = await MaterialService.remove_material_from_folder(
        db, current_school.id, folder_id, material_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Material not found in folder")
    return {"message": "Material removed from folder"}

