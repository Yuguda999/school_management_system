from typing import Optional, List, Dict, Any
from pydantic import BaseModel, validator, Field
from datetime import datetime
from app.models.teacher_material import MaterialType, ShareType, AccessType


# ============================================================================
# Material Schemas
# ============================================================================

class MaterialBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    material_type: MaterialType
    subject_id: Optional[str] = None
    grade_level: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[List[str]] = []
    is_published: bool = True
    scheduled_publish_at: Optional[datetime] = None
    
    @validator('title')
    def validate_title(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Title must be at least 2 characters long')
        return v.strip()
    
    @validator('tags')
    def validate_tags(cls, v):
        if v is None:
            return []
        # Ensure tags are unique and trimmed
        return list(set([tag.strip() for tag in v if tag.strip()]))


class MaterialCreate(MaterialBase):
    """Schema for creating a new material"""
    pass


class MaterialUpdate(BaseModel):
    """Schema for updating material metadata"""
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    material_type: Optional[MaterialType] = None
    subject_id: Optional[str] = None
    grade_level: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None
    scheduled_publish_at: Optional[datetime] = None
    is_favorite: Optional[bool] = None
    
    @validator('title')
    def validate_title(cls, v):
        if v is not None and (not v or len(v.strip()) < 2):
            raise ValueError('Title must be at least 2 characters long')
        return v.strip() if v else v


class MaterialResponse(MaterialBase):
    """Schema for material response"""
    id: str
    file_name: str
    original_file_name: str
    file_size: int
    mime_type: str
    uploaded_by: str
    school_id: str
    published_at: Optional[datetime] = None
    version_number: int
    parent_material_id: Optional[str] = None
    is_current_version: bool
    view_count: int
    download_count: int
    is_favorite: bool
    created_at: datetime
    updated_at: datetime
    
    # Computed properties
    file_size_mb: Optional[float] = None
    is_image: Optional[bool] = None
    is_pdf: Optional[bool] = None
    is_video: Optional[bool] = None
    is_audio: Optional[bool] = None
    can_preview: Optional[bool] = None
    
    # Related data
    uploader_name: Optional[str] = None
    subject_name: Optional[str] = None
    share_count: Optional[int] = None
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        data = {
            'id': obj.id,
            'title': obj.title,
            'description': obj.description,
            'material_type': obj.material_type,
            'subject_id': obj.subject_id,
            'grade_level': obj.grade_level,
            'topic': obj.topic,
            'tags': obj.tags or [],
            'is_published': obj.is_published,
            'scheduled_publish_at': obj.scheduled_publish_at,
            'file_name': obj.file_name,
            'original_file_name': obj.original_file_name,
            'file_size': obj.file_size,
            'mime_type': obj.mime_type,
            'uploaded_by': obj.uploaded_by,
            'school_id': obj.school_id,
            'published_at': obj.published_at,
            'version_number': obj.version_number,
            'parent_material_id': obj.parent_material_id,
            'is_current_version': obj.is_current_version,
            'view_count': obj.view_count,
            'download_count': obj.download_count,
            'is_favorite': obj.is_favorite,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
            'file_size_mb': obj.file_size_mb,
            'is_image': obj.is_image,
            'is_pdf': obj.is_pdf,
            'is_video': obj.is_video,
            'is_audio': obj.is_audio,
            'can_preview': obj.can_preview,
        }
        
        # Add related data if available (check if loaded to avoid lazy loading)
        # Check if relationship is in the object's __dict__ (meaning it's already loaded)
        obj_dict = obj.__dict__

        # Check if uploader is loaded
        if 'uploader' in obj_dict and obj_dict['uploader'] is not None:
            data['uploader_name'] = obj_dict['uploader'].full_name

        # Check if subject is loaded
        if 'subject' in obj_dict and obj_dict['subject'] is not None:
            data['subject_name'] = obj_dict['subject'].name

        # Check if shares is loaded
        if 'shares' in obj_dict:
            data['share_count'] = len([s for s in obj_dict['shares'] if not s.is_deleted])

        return cls(**data)


class MaterialUploadResponse(BaseModel):
    """Response after uploading a material"""
    message: str
    material_id: str
    file_url: str
    preview_url: Optional[str] = None


class BulkUploadResponse(BaseModel):
    """Response after bulk upload"""
    message: str
    successful_uploads: List[MaterialUploadResponse]
    failed_uploads: List[Dict[str, str]]
    total_count: int
    success_count: int
    failure_count: int


# ============================================================================
# Share Schemas
# ============================================================================

class MaterialShareBase(BaseModel):
    share_type: ShareType
    target_id: Optional[str] = None
    can_download: bool = True
    can_view: bool = True
    expires_at: Optional[datetime] = None
    
    @validator('target_id')
    def validate_target_id(cls, v, values):
        share_type = values.get('share_type')
        if share_type in [ShareType.CLASS, ShareType.INDIVIDUAL_STUDENT, ShareType.TEACHER] and not v:
            raise ValueError(f'target_id is required for {share_type} share type')
        return v


class MaterialShareCreate(MaterialShareBase):
    """Schema for creating a material share"""
    material_id: str


class BulkShareCreate(BaseModel):
    """Schema for bulk sharing materials"""
    material_ids: List[str] = Field(..., min_items=1)
    share_type: ShareType
    target_id: Optional[str] = None
    can_download: bool = True
    can_view: bool = True
    expires_at: Optional[datetime] = None


class MaterialShareResponse(MaterialShareBase):
    """Schema for material share response"""
    id: str
    material_id: str
    school_id: str
    shared_by: str
    shared_at: datetime
    created_at: datetime
    
    # Computed properties
    is_expired: Optional[bool] = None
    
    # Related data
    sharer_name: Optional[str] = None
    target_name: Optional[str] = None
    material_title: Optional[str] = None
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        data = {
            'id': obj.id,
            'material_id': obj.material_id,
            'school_id': obj.school_id,
            'share_type': obj.share_type,
            'target_id': obj.target_id,
            'can_download': obj.can_download,
            'can_view': obj.can_view,
            'expires_at': obj.expires_at,
            'shared_by': obj.shared_by,
            'shared_at': obj.shared_at,
            'created_at': obj.created_at,
            'is_expired': obj.is_expired,
        }
        
        # Add related data if available (check if loaded to avoid lazy loading)
        obj_dict = obj.__dict__

        if 'sharer' in obj_dict and obj_dict['sharer'] is not None:
            data['sharer_name'] = obj_dict['sharer'].full_name
        if 'material' in obj_dict and obj_dict['material'] is not None:
            data['material_title'] = obj_dict['material'].title

        return cls(**data)


# ============================================================================
# Folder Schemas
# ============================================================================

class MaterialFolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    parent_folder_id: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 1:
            raise ValueError('Folder name is required')
        return v.strip()
    
    @validator('color')
    def validate_color(cls, v):
        if v and not v.startswith('#'):
            raise ValueError('Color must be a hex code starting with #')
        return v


class MaterialFolderCreate(MaterialFolderBase):
    """Schema for creating a folder"""
    pass


class MaterialFolderUpdate(BaseModel):
    """Schema for updating a folder"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    parent_folder_id: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class MaterialFolderResponse(MaterialFolderBase):
    """Schema for folder response"""
    id: str
    teacher_id: str
    school_id: str
    created_at: datetime
    updated_at: datetime

    # Related data
    material_count: Optional[int] = None
    subfolder_count: Optional[int] = None
    children: Optional[List['MaterialFolderResponse']] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to handle lazy-loaded relationships"""
        data = {
            'id': obj.id,
            'name': obj.name,
            'description': obj.description,
            'parent_folder_id': obj.parent_folder_id,
            'color': obj.color,
            'icon': obj.icon,
            'teacher_id': obj.teacher_id,
            'school_id': obj.school_id,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
        }

        # Check if relationships are loaded using __dict__
        obj_dict = obj.__dict__

        # Add children if loaded
        if 'children' in obj_dict and obj_dict['children'] is not None:
            data['children'] = [cls.from_orm(child) for child in obj_dict['children']]

        # Calculate material count if folder_items is loaded
        if 'folder_items' in obj_dict:
            data['material_count'] = len([item for item in obj_dict['folder_items'] if not item.is_deleted])

        # Calculate subfolder count if children is loaded
        if 'children' in obj_dict:
            data['subfolder_count'] = len([child for child in obj_dict['children'] if not child.is_deleted])

        return cls(**data)


# Update forward reference for recursive type
MaterialFolderResponse.model_rebuild()


# ============================================================================
# Statistics Schemas
# ============================================================================

class MaterialStats(BaseModel):
    """Schema for material statistics"""
    total_materials: int
    published_materials: int
    draft_materials: int
    total_storage_mb: float
    materials_by_type: Dict[str, int]
    materials_by_subject: Dict[str, int]
    recent_uploads: List[MaterialResponse]
    popular_materials: List[MaterialResponse]
    total_views: int
    total_downloads: int


class MaterialAnalytics(BaseModel):
    """Schema for individual material analytics"""
    material_id: str
    view_count: int
    download_count: int
    share_count: int
    unique_viewers: int
    recent_access: List[Dict[str, Any]]
    access_by_date: Dict[str, int]


class StorageQuota(BaseModel):
    """Schema for storage quota information"""
    used_mb: float
    quota_mb: float
    percentage_used: float
    remaining_mb: float
    material_count: int
    largest_materials: List[MaterialResponse]

