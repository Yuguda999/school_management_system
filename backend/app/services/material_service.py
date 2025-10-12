import os
import uuid
import aiofiles
import logging
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, UploadFile, status
from datetime import datetime

from app.models.teacher_material import (
    TeacherMaterial, MaterialShare, MaterialAccess, MaterialFolder, 
    MaterialFolderItem, MaterialType, ShareType, AccessType
)
from app.models.user import User
from app.models.academic import Class, Subject
from app.models.student import Student
from app.schemas.teacher_material import (
    MaterialCreate, MaterialUpdate, MaterialShareCreate, BulkShareCreate,
    MaterialFolderCreate, MaterialFolderUpdate
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class MaterialService:
    """Service for managing teacher educational materials"""
    
    # File type mappings
    MIME_TYPE_MAP = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.zip': 'application/zip',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
    }
    
    @staticmethod
    def _get_file_extension(filename: str) -> str:
        """Get file extension from filename"""
        return os.path.splitext(filename)[1].lower()
    
    @staticmethod
    def _get_material_type(filename: str) -> MaterialType:
        """Determine material type from filename"""
        ext = MaterialService._get_file_extension(filename)
        
        if ext == '.pdf':
            return MaterialType.PDF
        elif ext in ['.doc', '.docx', '.txt']:
            return MaterialType.DOCUMENT
        elif ext in ['.ppt', '.pptx']:
            return MaterialType.PRESENTATION
        elif ext in ['.xls', '.xlsx', '.csv']:
            return MaterialType.SPREADSHEET
        elif ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            return MaterialType.IMAGE
        elif ext in ['.mp4']:
            return MaterialType.VIDEO
        elif ext in ['.mp3', '.wav']:
            return MaterialType.AUDIO
        elif ext in ['.zip']:
            return MaterialType.ARCHIVE
        else:
            return MaterialType.OTHER
    
    @staticmethod
    def _validate_file(file: UploadFile) -> None:
        """Validate uploaded file"""
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Check file extension
        ext = MaterialService._get_file_extension(file.filename)
        allowed_types = settings.get_allowed_material_types_list()
        
        if ext.lstrip('.') not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {ext} not allowed. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Check file size
        if file.size and file.size > settings.max_material_size:
            max_size_mb = settings.max_material_size / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size too large. Maximum size is {max_size_mb:.0f}MB"
            )
    
    @staticmethod
    async def check_storage_quota(
        db: AsyncSession,
        teacher_id: str,
        school_id: str,
        additional_size: int = 0
    ) -> Tuple[float, float]:
        """Check teacher's storage quota and return (used_mb, quota_mb)"""
        # Calculate current usage
        result = await db.execute(
            select(func.sum(TeacherMaterial.file_size)).where(
                and_(
                    TeacherMaterial.uploaded_by == teacher_id,
                    TeacherMaterial.school_id == school_id,
                    TeacherMaterial.is_deleted == False
                )
            )
        )
        total_bytes = result.scalar() or 0
        used_mb = (total_bytes + additional_size) / (1024 * 1024)
        quota_mb = settings.teacher_storage_quota_mb
        
        if used_mb > quota_mb:
            raise HTTPException(
                status_code=status.HTTP_507_INSUFFICIENT_STORAGE,
                detail=f"Storage quota exceeded. Used: {used_mb:.2f}MB, Quota: {quota_mb}MB"
            )
        
        return used_mb, quota_mb
    
    @staticmethod
    async def upload_material(
        db: AsyncSession,
        file: UploadFile,
        material_data: MaterialCreate,
        uploaded_by: str,
        school_id: str
    ) -> TeacherMaterial:
        """Upload a new material"""
        # Validate file
        MaterialService._validate_file(file)
        
        # Check storage quota
        file_size = file.size or 0
        await MaterialService.check_storage_quota(db, uploaded_by, school_id, file_size)
        
        # Verify subject exists if provided
        if material_data.subject_id:
            result = await db.execute(
                select(Subject).where(
                    and_(
                        Subject.id == material_data.subject_id,
                        Subject.school_id == school_id,
                        Subject.is_deleted == False
                    )
                )
            )
            subject = result.scalar_one_or_none()
            if not subject:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Subject not found"
                )
        
        # Create upload directory
        upload_dir = os.path.join(settings.material_upload_dir, school_id, uploaded_by)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        ext = MaterialService._get_file_extension(file.filename)
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        try:
            # Save file
            content = await file.read()
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            # Determine material type if not provided
            if not material_data.material_type:
                material_data.material_type = MaterialService._get_material_type(file.filename)
            
            # Get MIME type
            mime_type = file.content_type or MaterialService.MIME_TYPE_MAP.get(ext, 'application/octet-stream')
            
            # Create material record
            material = TeacherMaterial(
                title=material_data.title,
                description=material_data.description,
                material_type=material_data.material_type,
                file_name=unique_filename,
                original_file_name=file.filename,
                file_path=file_path,
                file_size=len(content),
                mime_type=mime_type,
                uploaded_by=uploaded_by,
                school_id=school_id,
                subject_id=material_data.subject_id,
                grade_level=material_data.grade_level,
                topic=material_data.topic,
                tags=material_data.tags or [],
                is_published=material_data.is_published,
                scheduled_publish_at=material_data.scheduled_publish_at,
                published_at=datetime.utcnow() if material_data.is_published else None
            )
            
            db.add(material)
            await db.commit()
            await db.refresh(material)
            
            logger.info(f"Material uploaded: {material.id} by teacher {uploaded_by}")
            return material
            
        except Exception as e:
            # Clean up file if it was created
            if os.path.exists(file_path):
                os.remove(file_path)
            logger.error(f"Failed to upload material: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload material: {str(e)}"
            )
    
    @staticmethod
    async def get_materials(
        db: AsyncSession,
        school_id: str,
        teacher_id: Optional[str] = None,
        subject_id: Optional[str] = None,
        grade_level: Optional[str] = None,
        material_type: Optional[MaterialType] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None,
        is_published: Optional[bool] = None,
        is_favorite: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[TeacherMaterial]:
        """Get materials with filtering"""
        query = select(TeacherMaterial).options(
            selectinload(TeacherMaterial.uploader),
            selectinload(TeacherMaterial.subject),
            selectinload(TeacherMaterial.shares)
        ).where(
            and_(
                TeacherMaterial.school_id == school_id,
                TeacherMaterial.is_deleted == False,
                TeacherMaterial.is_current_version == True
            )
        )
        
        if teacher_id:
            query = query.where(TeacherMaterial.uploaded_by == teacher_id)
        if subject_id:
            query = query.where(TeacherMaterial.subject_id == subject_id)
        if grade_level:
            query = query.where(TeacherMaterial.grade_level == grade_level)
        if material_type:
            query = query.where(TeacherMaterial.material_type == material_type)
        if is_published is not None:
            query = query.where(TeacherMaterial.is_published == is_published)
        if is_favorite is not None:
            query = query.where(TeacherMaterial.is_favorite == is_favorite)
        if tags:
            # Filter by tags (materials must have at least one of the specified tags)
            for tag in tags:
                query = query.where(TeacherMaterial.tags.contains([tag]))
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    TeacherMaterial.title.ilike(search_term),
                    TeacherMaterial.description.ilike(search_term),
                    TeacherMaterial.topic.ilike(search_term)
                )
            )
        
        query = query.order_by(desc(TeacherMaterial.created_at)).offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_material_by_id(
        db: AsyncSession,
        material_id: str,
        school_id: str
    ) -> Optional[TeacherMaterial]:
        """Get material by ID"""
        result = await db.execute(
            select(TeacherMaterial).options(
                selectinload(TeacherMaterial.uploader),
                selectinload(TeacherMaterial.subject),
                selectinload(TeacherMaterial.shares)
            ).where(
                and_(
                    TeacherMaterial.id == material_id,
                    TeacherMaterial.school_id == school_id,
                    TeacherMaterial.is_deleted == False
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_material(
        db: AsyncSession,
        material_id: str,
        material_data: MaterialUpdate,
        teacher_id: str,
        school_id: str
    ) -> Optional[TeacherMaterial]:
        """Update material metadata"""
        material = await MaterialService.get_material_by_id(db, material_id, school_id)
        if not material:
            return None

        # Verify ownership
        if material.uploaded_by != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own materials"
            )

        # Update fields
        for field, value in material_data.dict(exclude_unset=True).items():
            if field == 'is_published' and value and not material.is_published:
                # Publishing the material
                material.published_at = datetime.utcnow()
            setattr(material, field, value)

        material.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(material)

        logger.info(f"Material updated: {material.id} by teacher {teacher_id}")
        return material

    @staticmethod
    async def delete_material(
        db: AsyncSession,
        material_id: str,
        teacher_id: str,
        school_id: str
    ) -> bool:
        """Soft delete material"""
        material = await MaterialService.get_material_by_id(db, material_id, school_id)
        if not material:
            return False

        # Verify ownership
        if material.uploaded_by != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own materials"
            )

        # Soft delete
        material.is_deleted = True
        material.updated_at = datetime.utcnow()

        # Note: Physical file deletion can be handled by a cleanup job
        # to allow for recovery within retention period

        await db.commit()
        logger.info(f"Material deleted: {material.id} by teacher {teacher_id}")
        return True

    @staticmethod
    async def create_material_version(
        db: AsyncSession,
        material_id: str,
        file: UploadFile,
        teacher_id: str,
        school_id: str
    ) -> TeacherMaterial:
        """Create a new version of an existing material"""
        # Get parent material
        parent_material = await MaterialService.get_material_by_id(db, material_id, school_id)
        if not parent_material:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent material not found"
            )

        # Verify ownership
        if parent_material.uploaded_by != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create versions of your own materials"
            )

        # Mark parent as not current version
        parent_material.is_current_version = False

        # Create new version with same metadata
        material_data = MaterialCreate(
            title=parent_material.title,
            description=parent_material.description,
            material_type=parent_material.material_type,
            subject_id=parent_material.subject_id,
            grade_level=parent_material.grade_level,
            topic=parent_material.topic,
            tags=parent_material.tags,
            is_published=parent_material.is_published,
            scheduled_publish_at=parent_material.scheduled_publish_at
        )

        new_material = await MaterialService.upload_material(
            db, file, material_data, teacher_id, school_id
        )

        # Set version information
        new_material.parent_material_id = material_id
        new_material.version_number = parent_material.version_number + 1
        new_material.is_current_version = True

        await db.commit()
        await db.refresh(new_material)

        logger.info(f"New version created: {new_material.id} from {material_id}")
        return new_material

    @staticmethod
    async def get_material_versions(
        db: AsyncSession,
        material_id: str,
        school_id: str
    ) -> List[TeacherMaterial]:
        """Get all versions of a material"""
        # Get the material to find the root
        material = await MaterialService.get_material_by_id(db, material_id, school_id)
        if not material:
            return []

        # Find root material (the one without parent)
        root_id = material.parent_material_id or material.id

        # Get all versions
        result = await db.execute(
            select(TeacherMaterial).options(
                selectinload(TeacherMaterial.uploader)
            ).where(
                and_(
                    or_(
                        TeacherMaterial.id == root_id,
                        TeacherMaterial.parent_material_id == root_id
                    ),
                    TeacherMaterial.school_id == school_id,
                    TeacherMaterial.is_deleted == False
                )
            ).order_by(desc(TeacherMaterial.version_number))
        )
        return result.scalars().all()

    # ============================================================================
    # Sharing Methods
    # ============================================================================

    @staticmethod
    async def share_material(
        db: AsyncSession,
        share_data: MaterialShareCreate,
        teacher_id: str,
        school_id: str
    ) -> MaterialShare:
        """Share a material with classes, students, or teachers"""
        # Verify material exists and teacher owns it
        material = await MaterialService.get_material_by_id(db, share_data.material_id, school_id)
        if not material:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Material not found"
            )

        if material.uploaded_by != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only share your own materials"
            )

        # Verify target exists if specified
        if share_data.target_id:
            if share_data.share_type == ShareType.CLASS:
                result = await db.execute(
                    select(Class).where(
                        and_(
                            Class.id == share_data.target_id,
                            Class.school_id == school_id,
                            Class.is_deleted == False
                        )
                    )
                )
                if not result.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Class not found"
                    )
            elif share_data.share_type == ShareType.INDIVIDUAL_STUDENT:
                result = await db.execute(
                    select(Student).where(
                        and_(
                            Student.id == share_data.target_id,
                            Student.school_id == school_id,
                            Student.is_deleted == False
                        )
                    )
                )
                if not result.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Student not found"
                    )

        # Create share
        share = MaterialShare(
            material_id=share_data.material_id,
            school_id=school_id,
            share_type=share_data.share_type,
            target_id=share_data.target_id,
            can_download=share_data.can_download,
            can_view=share_data.can_view,
            expires_at=share_data.expires_at,
            shared_by=teacher_id
        )

        db.add(share)
        await db.commit()
        await db.refresh(share)

        logger.info(f"Material shared: {share_data.material_id} by teacher {teacher_id}")
        return share

    @staticmethod
    async def bulk_share_materials(
        db: AsyncSession,
        share_data: BulkShareCreate,
        teacher_id: str,
        school_id: str
    ) -> List[MaterialShare]:
        """Share multiple materials at once"""
        shares = []

        for material_id in share_data.material_ids:
            try:
                share_create = MaterialShareCreate(
                    material_id=material_id,
                    share_type=share_data.share_type,
                    target_id=share_data.target_id,
                    can_download=share_data.can_download,
                    can_view=share_data.can_view,
                    expires_at=share_data.expires_at
                )
                share = await MaterialService.share_material(
                    db, share_create, teacher_id, school_id
                )
                shares.append(share)
            except Exception as e:
                logger.warning(f"Failed to share material {material_id}: {str(e)}")
                continue

        return shares

    @staticmethod
    async def get_material_shares(
        db: AsyncSession,
        material_id: str,
        school_id: str
    ) -> List[MaterialShare]:
        """Get all shares for a material"""
        result = await db.execute(
            select(MaterialShare).options(
                selectinload(MaterialShare.sharer)
            ).where(
                and_(
                    MaterialShare.material_id == material_id,
                    MaterialShare.school_id == school_id,
                    MaterialShare.is_deleted == False
                )
            ).order_by(desc(MaterialShare.created_at))
        )
        return result.scalars().all()

    @staticmethod
    async def remove_share(
        db: AsyncSession,
        share_id: str,
        teacher_id: str,
        school_id: str
    ) -> bool:
        """Remove a material share"""
        result = await db.execute(
            select(MaterialShare).where(
                and_(
                    MaterialShare.id == share_id,
                    MaterialShare.school_id == school_id,
                    MaterialShare.is_deleted == False
                )
            )
        )
        share = result.scalar_one_or_none()

        if not share:
            return False

        # Verify ownership
        if share.shared_by != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only remove your own shares"
            )

        share.is_deleted = True
        await db.commit()

        logger.info(f"Share removed: {share_id} by teacher {teacher_id}")
        return True

    @staticmethod
    async def get_shared_materials_for_student(
        db: AsyncSession,
        student_id: str,
        school_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[TeacherMaterial]:
        """Get materials shared with a specific student"""
        # Get student's class
        student_result = await db.execute(
            select(Student).where(
                and_(
                    Student.id == student_id,
                    Student.school_id == school_id,
                    Student.is_deleted == False
                )
            )
        )
        student = student_result.scalar_one_or_none()
        if not student:
            return []

        # Find materials shared with:
        # 1. All students
        # 2. Student's class
        # 3. Individual student
        query = select(TeacherMaterial).join(
            MaterialShare,
            and_(
                MaterialShare.material_id == TeacherMaterial.id,
                MaterialShare.is_deleted == False,
                or_(
                    MaterialShare.share_type == ShareType.ALL_STUDENTS,
                    and_(
                        MaterialShare.share_type == ShareType.CLASS,
                        MaterialShare.target_id == student.current_class_id
                    ),
                    and_(
                        MaterialShare.share_type == ShareType.INDIVIDUAL_STUDENT,
                        MaterialShare.target_id == student_id
                    )
                )
            )
        ).options(
            selectinload(TeacherMaterial.uploader),
            selectinload(TeacherMaterial.subject)
        ).where(
            and_(
                TeacherMaterial.school_id == school_id,
                TeacherMaterial.is_deleted == False,
                TeacherMaterial.is_published == True
            )
        ).order_by(desc(TeacherMaterial.created_at)).offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    # ============================================================================
    # Access Tracking Methods
    # ============================================================================

    @staticmethod
    async def record_access(
        db: AsyncSession,
        material_id: str,
        user_id: str,
        school_id: str,
        access_type: AccessType,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> MaterialAccess:
        """Record material access"""
        # Update material counters
        material = await MaterialService.get_material_by_id(db, material_id, school_id)
        if material:
            if access_type == AccessType.VIEW:
                material.view_count += 1
            elif access_type == AccessType.DOWNLOAD:
                material.download_count += 1

        # Create access log
        access_log = MaterialAccess(
            material_id=material_id,
            user_id=user_id,
            school_id=school_id,
            access_type=access_type,
            ip_address=ip_address,
            user_agent=user_agent
        )

        db.add(access_log)
        await db.commit()

        return access_log

    # ============================================================================
    # Statistics Methods
    # ============================================================================

    @staticmethod
    async def get_material_stats(
        db: AsyncSession,
        school_id: str,
        teacher_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get material statistics"""
        # Base filter conditions
        base_conditions = [
            TeacherMaterial.school_id == school_id,
            TeacherMaterial.is_deleted == False,
            TeacherMaterial.is_current_version == True
        ]

        if teacher_id:
            base_conditions.append(TeacherMaterial.uploaded_by == teacher_id)

        # Total materials
        total_result = await db.execute(
            select(func.count(TeacherMaterial.id)).where(and_(*base_conditions))
        )
        total_materials = total_result.scalar() or 0

        # Published vs draft
        published_result = await db.execute(
            select(func.count(TeacherMaterial.id)).where(
                and_(*base_conditions, TeacherMaterial.is_published == True)
            )
        )
        published_materials = published_result.scalar() or 0
        draft_materials = total_materials - published_materials

        # Total storage
        storage_result = await db.execute(
            select(func.sum(TeacherMaterial.file_size)).where(and_(*base_conditions))
        )
        total_bytes = storage_result.scalar() or 0
        total_storage_mb = total_bytes / (1024 * 1024)

        # Materials by type
        type_result = await db.execute(
            select(TeacherMaterial.material_type, func.count(TeacherMaterial.id))
            .where(and_(*base_conditions))
            .group_by(TeacherMaterial.material_type)
        )
        materials_by_type = {str(k): v for k, v in type_result.all()}

        # Materials by subject
        subject_conditions = base_conditions.copy()
        subject_result = await db.execute(
            select(Subject.name, func.count(TeacherMaterial.id))
            .join(TeacherMaterial, TeacherMaterial.subject_id == Subject.id)
            .where(and_(*subject_conditions))
            .group_by(Subject.name)
        )
        materials_by_subject = dict(subject_result.all())

        # Recent uploads
        recent_result = await db.execute(
            select(TeacherMaterial).options(
                selectinload(TeacherMaterial.uploader),
                selectinload(TeacherMaterial.subject)
            ).where(and_(*base_conditions))
            .order_by(desc(TeacherMaterial.created_at))
            .limit(5)
        )
        recent_uploads = recent_result.scalars().all()

        # Popular materials
        popular_result = await db.execute(
            select(TeacherMaterial).options(
                selectinload(TeacherMaterial.uploader),
                selectinload(TeacherMaterial.subject)
            ).where(and_(*base_conditions))
            .order_by(desc(TeacherMaterial.view_count + TeacherMaterial.download_count))
            .limit(5)
        )
        popular_materials = popular_result.scalars().all()

        # Total views and downloads
        views_result = await db.execute(
            select(func.sum(TeacherMaterial.view_count)).where(and_(*base_conditions))
        )
        total_views = views_result.scalar() or 0

        downloads_result = await db.execute(
            select(func.sum(TeacherMaterial.download_count)).where(and_(*base_conditions))
        )
        total_downloads = downloads_result.scalar() or 0

        return {
            'total_materials': total_materials,
            'published_materials': published_materials,
            'draft_materials': draft_materials,
            'total_storage_mb': round(total_storage_mb, 2),
            'materials_by_type': materials_by_type,
            'materials_by_subject': materials_by_subject,
            'recent_uploads': recent_uploads,
            'popular_materials': popular_materials,
            'total_views': total_views,
            'total_downloads': total_downloads
        }

    @staticmethod
    async def get_storage_quota_info(
        db: AsyncSession,
        teacher_id: str,
        school_id: str
    ) -> Dict[str, Any]:
        """Get storage quota information for a teacher"""
        # Calculate current usage
        result = await db.execute(
            select(func.sum(TeacherMaterial.file_size), func.count(TeacherMaterial.id)).where(
                and_(
                    TeacherMaterial.uploaded_by == teacher_id,
                    TeacherMaterial.school_id == school_id,
                    TeacherMaterial.is_deleted == False
                )
            )
        )
        total_bytes, material_count = result.one()
        total_bytes = total_bytes or 0
        material_count = material_count or 0

        used_mb = total_bytes / (1024 * 1024)
        quota_mb = settings.teacher_storage_quota_mb
        percentage_used = (used_mb / quota_mb * 100) if quota_mb > 0 else 0
        remaining_mb = quota_mb - used_mb

        # Get largest materials
        largest_query = select(TeacherMaterial).options(
            selectinload(TeacherMaterial.subject)
        ).where(
            and_(
                TeacherMaterial.uploaded_by == teacher_id,
                TeacherMaterial.school_id == school_id,
                TeacherMaterial.is_deleted == False
            )
        ).order_by(desc(TeacherMaterial.file_size)).limit(10)

        largest_result = await db.execute(largest_query)
        largest_materials = largest_result.scalars().all()

        return {
            'used_mb': round(used_mb, 2),
            'quota_mb': quota_mb,
            'percentage_used': round(percentage_used, 2),
            'remaining_mb': round(remaining_mb, 2),
            'material_count': material_count,
            'largest_materials': largest_materials
        }

    # ============================================================================
    # Folder Management Methods
    # ============================================================================

    @staticmethod
    async def create_folder(
        db: AsyncSession,
        folder_data: MaterialFolderCreate,
        teacher_id: str,
        school_id: str
    ) -> MaterialFolder:
        """Create a new folder"""
        # Verify parent folder exists if specified
        if folder_data.parent_folder_id:
            parent_result = await db.execute(
                select(MaterialFolder).where(
                    and_(
                        MaterialFolder.id == folder_data.parent_folder_id,
                        MaterialFolder.teacher_id == teacher_id,
                        MaterialFolder.school_id == school_id,
                        MaterialFolder.is_deleted == False
                    )
                )
            )
            if not parent_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent folder not found"
                )

        folder = MaterialFolder(
            name=folder_data.name,
            description=folder_data.description,
            parent_folder_id=folder_data.parent_folder_id,
            teacher_id=teacher_id,
            school_id=school_id,
            color=folder_data.color,
            icon=folder_data.icon
        )

        db.add(folder)
        await db.commit()
        await db.refresh(folder)

        logger.info(f"Folder created: {folder.id} by teacher {teacher_id}")
        return folder

    @staticmethod
    async def get_folders(
        db: AsyncSession,
        teacher_id: str,
        school_id: str
    ) -> List[MaterialFolder]:
        """Get all folders for a teacher"""
        result = await db.execute(
            select(MaterialFolder).options(
                selectinload(MaterialFolder.children),
                selectinload(MaterialFolder.folder_items)
            ).where(
                and_(
                    MaterialFolder.teacher_id == teacher_id,
                    MaterialFolder.school_id == school_id,
                    MaterialFolder.is_deleted == False
                )
            ).order_by(MaterialFolder.name)
        )
        return result.scalars().all()

    @staticmethod
    async def update_folder(
        db: AsyncSession,
        folder_id: str,
        folder_data: MaterialFolderUpdate,
        teacher_id: str,
        school_id: str
    ) -> Optional[MaterialFolder]:
        """Update folder"""
        result = await db.execute(
            select(MaterialFolder).where(
                and_(
                    MaterialFolder.id == folder_id,
                    MaterialFolder.teacher_id == teacher_id,
                    MaterialFolder.school_id == school_id,
                    MaterialFolder.is_deleted == False
                )
            )
        )
        folder = result.scalar_one_or_none()

        if not folder:
            return None

        # Update fields
        for field, value in folder_data.dict(exclude_unset=True).items():
            setattr(folder, field, value)

        folder.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(folder)

        return folder

    @staticmethod
    async def delete_folder(
        db: AsyncSession,
        folder_id: str,
        teacher_id: str,
        school_id: str
    ) -> bool:
        """Delete folder"""
        result = await db.execute(
            select(MaterialFolder).where(
                and_(
                    MaterialFolder.id == folder_id,
                    MaterialFolder.teacher_id == teacher_id,
                    MaterialFolder.school_id == school_id,
                    MaterialFolder.is_deleted == False
                )
            )
        )
        folder = result.scalar_one_or_none()

        if not folder:
            return False

        folder.is_deleted = True
        folder.updated_at = datetime.utcnow()
        await db.commit()

        return True

    @staticmethod
    async def add_material_to_folder(
        db: AsyncSession,
        folder_id: str,
        material_id: str,
        teacher_id: str,
        school_id: str
    ) -> MaterialFolderItem:
        """Add material to folder"""
        # Verify folder exists and belongs to teacher
        folder_result = await db.execute(
            select(MaterialFolder).where(
                and_(
                    MaterialFolder.id == folder_id,
                    MaterialFolder.teacher_id == teacher_id,
                    MaterialFolder.school_id == school_id,
                    MaterialFolder.is_deleted == False
                )
            )
        )
        if not folder_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )

        # Verify material exists and belongs to teacher
        material = await MaterialService.get_material_by_id(db, material_id, school_id)
        if not material or material.uploaded_by != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Material not found"
            )

        # Check if already in folder
        existing_result = await db.execute(
            select(MaterialFolderItem).where(
                and_(
                    MaterialFolderItem.folder_id == folder_id,
                    MaterialFolderItem.material_id == material_id,
                    MaterialFolderItem.is_deleted == False
                )
            )
        )
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Material already in folder"
            )

        # Get max position
        position_result = await db.execute(
            select(func.max(MaterialFolderItem.position)).where(
                and_(
                    MaterialFolderItem.folder_id == folder_id,
                    MaterialFolderItem.is_deleted == False
                )
            )
        )
        max_position = position_result.scalar() or 0

        folder_item = MaterialFolderItem(
            folder_id=folder_id,
            material_id=material_id,
            school_id=school_id,
            position=max_position + 1
        )

        db.add(folder_item)
        await db.commit()
        await db.refresh(folder_item)

        return folder_item

    @staticmethod
    async def remove_material_from_folder(
        db: AsyncSession,
        folder_id: str,
        material_id: str,
        teacher_id: str,
        school_id: str
    ) -> bool:
        """Remove material from folder"""
        # Verify folder belongs to teacher
        folder_result = await db.execute(
            select(MaterialFolder).where(
                and_(
                    MaterialFolder.id == folder_id,
                    MaterialFolder.teacher_id == teacher_id,
                    MaterialFolder.school_id == school_id,
                    MaterialFolder.is_deleted == False
                )
            )
        )
        if not folder_result.scalar_one_or_none():
            return False

        # Find and delete folder item
        item_result = await db.execute(
            select(MaterialFolderItem).where(
                and_(
                    MaterialFolderItem.folder_id == folder_id,
                    MaterialFolderItem.material_id == material_id,
                    MaterialFolderItem.is_deleted == False
                )
            )
        )
        item = item_result.scalar_one_or_none()

        if not item:
            return False

        item.is_deleted = True
        await db.commit()

        return True

    @staticmethod
    async def get_folder_materials(
        db: AsyncSession,
        folder_id: str,
        teacher_id: str,
        school_id: str
    ) -> List[TeacherMaterial]:
        """Get all materials in a folder"""
        # Verify folder belongs to teacher
        folder_result = await db.execute(
            select(MaterialFolder).where(
                and_(
                    MaterialFolder.id == folder_id,
                    MaterialFolder.teacher_id == teacher_id,
                    MaterialFolder.school_id == school_id,
                    MaterialFolder.is_deleted == False
                )
            )
        )
        if not folder_result.scalar_one_or_none():
            return []

        # Get materials
        result = await db.execute(
            select(TeacherMaterial).join(
                MaterialFolderItem,
                and_(
                    MaterialFolderItem.material_id == TeacherMaterial.id,
                    MaterialFolderItem.folder_id == folder_id,
                    MaterialFolderItem.is_deleted == False
                )
            ).options(
                selectinload(TeacherMaterial.uploader),
                selectinload(TeacherMaterial.subject)
            ).where(
                and_(
                    TeacherMaterial.school_id == school_id,
                    TeacherMaterial.is_deleted == False
                )
            ).order_by(MaterialFolderItem.position)
        )
        return result.scalars().all()

