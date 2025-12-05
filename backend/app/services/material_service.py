"""
Material Service for Materials Management and Smart Resource Library (P3.2)
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload

from app.models.teacher_material import (
    TeacherMaterial, MaterialShare, MaterialAccessLog, MaterialFolder, MaterialFolderItem,
    MaterialType, ShareType, AccessType, DifficultyLevel
)
from app.models.academic import Subject, Class, Term
import logging
import uuid

logger = logging.getLogger(__name__)


class MaterialService:
    """Service for material management and smart search"""

    # ============== Material CRUD ==============

    @staticmethod
    async def create_material(
        db: AsyncSession,
        school_id: str,
        user_id: str,
        title: str,
        material_type: MaterialType,
        file_name: str,
        original_file_name: str,
        file_path: str,
        file_size: int,
        mime_type: str,
        description: Optional[str] = None,
        subject_id: Optional[str] = None,
        class_id: Optional[str] = None,
        term_id: Optional[str] = None,
        grade_level: Optional[str] = None,
        topic: Optional[str] = None,
        tags: Optional[List[str]] = None,
        difficulty_level: Optional[DifficultyLevel] = None,
        exam_type: Optional[str] = None,
        is_published: bool = False
    ) -> TeacherMaterial:
        """Create a new material"""
        material = TeacherMaterial(
            id=str(uuid.uuid4()),
            school_id=school_id,
            uploaded_by=user_id,
            title=title,
            description=description,
            material_type=material_type,
            file_name=file_name,
            original_file_name=original_file_name,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            subject_id=subject_id,
            class_id=class_id,
            term_id=term_id,
            grade_level=grade_level,
            topic=topic,
            tags=tags or [],
            difficulty_level=difficulty_level,
            exam_type=exam_type,
            is_published=is_published,
            published_at=datetime.utcnow() if is_published else None
        )
        db.add(material)
        await db.commit()
        await db.refresh(material)
        return material

    @staticmethod
    async def get_material(
        db: AsyncSession,
        school_id: str,
        material_id: str
    ) -> Optional[TeacherMaterial]:
        """Get a specific material"""
        result = await db.execute(
            select(TeacherMaterial).where(
                TeacherMaterial.id == material_id,
                TeacherMaterial.school_id == school_id,
                TeacherMaterial.is_deleted == False
            ).options(
                selectinload(TeacherMaterial.subject),
                selectinload(TeacherMaterial.class_),
                selectinload(TeacherMaterial.term),
                selectinload(TeacherMaterial.uploader)
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_materials(
        db: AsyncSession,
        school_id: str,
        user_id: Optional[str] = None,
        subject_id: Optional[str] = None,
        class_id: Optional[str] = None,
        term_id: Optional[str] = None,
        material_type: Optional[MaterialType] = None,
        is_published: Optional[bool] = None,
        is_favorite: Optional[bool] = None,
        tags: Optional[List[str]] = None,
        difficulty_level: Optional[DifficultyLevel] = None,
        exam_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[TeacherMaterial]:
        """List materials with filters"""
        conditions = [
            TeacherMaterial.school_id == school_id,
            TeacherMaterial.is_deleted == False,
            TeacherMaterial.is_current_version == True
        ]
        
        if user_id:
            conditions.append(TeacherMaterial.uploaded_by == user_id)
        if subject_id:
            conditions.append(TeacherMaterial.subject_id == subject_id)
        if class_id:
            conditions.append(TeacherMaterial.class_id == class_id)
        if term_id:
            conditions.append(TeacherMaterial.term_id == term_id)
        if material_type:
            conditions.append(TeacherMaterial.material_type == material_type)
        if is_published is not None:
            conditions.append(TeacherMaterial.is_published == is_published)
        if is_favorite is not None:
            conditions.append(TeacherMaterial.is_favorite == is_favorite)
        if difficulty_level:
            conditions.append(TeacherMaterial.difficulty_level == difficulty_level)
        if exam_type:
            conditions.append(TeacherMaterial.exam_type == exam_type)
        
        result = await db.execute(
            select(TeacherMaterial).where(
                and_(*conditions)
            ).options(
                selectinload(TeacherMaterial.subject),
                selectinload(TeacherMaterial.class_),
                selectinload(TeacherMaterial.term)
            ).order_by(desc(TeacherMaterial.created_at)).limit(limit).offset(offset)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_material(
        db: AsyncSession,
        school_id: str,
        material_id: str,
        **kwargs
    ) -> Optional[TeacherMaterial]:
        """Update a material"""
        result = await db.execute(
            select(TeacherMaterial).where(
                TeacherMaterial.id == material_id,
                TeacherMaterial.school_id == school_id,
                TeacherMaterial.is_deleted == False
            )
        )
        material = result.scalar_one_or_none()
        if not material:
            return None
        
        for field, value in kwargs.items():
            if hasattr(material, field):
                setattr(material, field, value)

        await db.commit()
        await db.refresh(material)
        return material

    @staticmethod
    async def delete_material(
        db: AsyncSession,
        school_id: str,
        material_id: str
    ) -> bool:
        """Soft delete a material"""
        result = await db.execute(
            select(TeacherMaterial).where(
                TeacherMaterial.id == material_id,
                TeacherMaterial.school_id == school_id,
                TeacherMaterial.is_deleted == False
            )
        )
        material = result.scalar_one_or_none()
        if not material:
            return False

        material.is_deleted = True
        material.deleted_at = datetime.utcnow()
        await db.commit()
        return True

    # ============== Smart Search (P3.2) ==============

    @staticmethod
    async def smart_search(
        db: AsyncSession,
        school_id: str,
        query: str,
        subject_id: Optional[str] = None,
        class_id: Optional[str] = None,
        grade_level: Optional[str] = None,
        difficulty_level: Optional[DifficultyLevel] = None,
        exam_type: Optional[str] = None,
        material_type: Optional[MaterialType] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Smart search for materials using text matching.
        Searches across title, description, topic, tags, and keywords.
        """
        conditions = [
            TeacherMaterial.school_id == school_id,
            TeacherMaterial.is_deleted == False,
            TeacherMaterial.is_current_version == True,
            TeacherMaterial.is_published == True
        ]

        # Text search conditions
        search_term = f"%{query.lower()}%"
        text_conditions = or_(
            func.lower(TeacherMaterial.title).like(search_term),
            func.lower(TeacherMaterial.description).like(search_term),
            func.lower(TeacherMaterial.topic).like(search_term),
            func.lower(TeacherMaterial.grade_level).like(search_term),
            func.lower(TeacherMaterial.exam_type).like(search_term)
        )
        conditions.append(text_conditions)

        # Additional filters
        if subject_id:
            conditions.append(TeacherMaterial.subject_id == subject_id)
        if class_id:
            conditions.append(TeacherMaterial.class_id == class_id)
        if grade_level:
            conditions.append(TeacherMaterial.grade_level == grade_level)
        if difficulty_level:
            conditions.append(TeacherMaterial.difficulty_level == difficulty_level)
        if exam_type:
            conditions.append(TeacherMaterial.exam_type == exam_type)
        if material_type:
            conditions.append(TeacherMaterial.material_type == material_type)

        result = await db.execute(
            select(TeacherMaterial).where(
                and_(*conditions)
            ).options(
                selectinload(TeacherMaterial.subject),
                selectinload(TeacherMaterial.class_),
                selectinload(TeacherMaterial.uploader)
            ).order_by(
                desc(TeacherMaterial.view_count),
                desc(TeacherMaterial.download_count),
                desc(TeacherMaterial.created_at)
            ).limit(limit)
        )
        materials = result.scalars().all()

        # Format results with relevance info
        search_results = []
        for material in materials:
            search_results.append({
                "id": material.id,
                "title": material.title,
                "description": material.description,
                "material_type": material.material_type.value,
                "subject_name": material.subject.name if material.subject else None,
                "class_name": material.class_.name if material.class_ else None,
                "grade_level": material.grade_level,
                "topic": material.topic,
                "tags": material.tags or [],
                "difficulty_level": material.difficulty_level.value if material.difficulty_level else None,
                "exam_type": material.exam_type,
                "view_count": material.view_count,
                "download_count": material.download_count,
                "uploader_name": f"{material.uploader.first_name} {material.uploader.last_name}" if material.uploader else None,
                "created_at": material.created_at.isoformat()
            })

        return search_results

    @staticmethod
    async def get_related_materials(
        db: AsyncSession,
        school_id: str,
        material_id: str,
        limit: int = 5
    ) -> List[TeacherMaterial]:
        """Get related materials based on subject, topic, and tags"""
        # Get the source material
        source = await MaterialService.get_material(db, school_id, material_id)
        if not source:
            return []

        conditions = [
            TeacherMaterial.school_id == school_id,
            TeacherMaterial.is_deleted == False,
            TeacherMaterial.is_current_version == True,
            TeacherMaterial.is_published == True,
            TeacherMaterial.id != material_id
        ]

        # Match by subject or topic
        related_conditions = []
        if source.subject_id:
            related_conditions.append(TeacherMaterial.subject_id == source.subject_id)
        if source.topic:
            related_conditions.append(func.lower(TeacherMaterial.topic).like(f"%{source.topic.lower()}%"))
        if source.grade_level:
            related_conditions.append(TeacherMaterial.grade_level == source.grade_level)

        if related_conditions:
            conditions.append(or_(*related_conditions))

        result = await db.execute(
            select(TeacherMaterial).where(
                and_(*conditions)
            ).options(
                selectinload(TeacherMaterial.subject),
                selectinload(TeacherMaterial.class_)
            ).order_by(
                desc(TeacherMaterial.view_count)
            ).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_suggested_materials_for_lesson(
        db: AsyncSession,
        school_id: str,
        subject_id: str,
        class_id: Optional[str] = None,
        topic: Optional[str] = None,
        limit: int = 10
    ) -> List[TeacherMaterial]:
        """Get suggested materials for lesson planning"""
        conditions = [
            TeacherMaterial.school_id == school_id,
            TeacherMaterial.is_deleted == False,
            TeacherMaterial.is_current_version == True,
            TeacherMaterial.is_published == True,
            TeacherMaterial.subject_id == subject_id
        ]

        if class_id:
            conditions.append(TeacherMaterial.class_id == class_id)
        if topic:
            conditions.append(
                or_(
                    func.lower(TeacherMaterial.topic).like(f"%{topic.lower()}%"),
                    func.lower(TeacherMaterial.title).like(f"%{topic.lower()}%")
                )
            )

        result = await db.execute(
            select(TeacherMaterial).where(
                and_(*conditions)
            ).options(
                selectinload(TeacherMaterial.subject),
                selectinload(TeacherMaterial.uploader)
            ).order_by(
                desc(TeacherMaterial.view_count),
                desc(TeacherMaterial.created_at)
            ).limit(limit)
        )
        return list(result.scalars().all())

    # ============== Tagging ==============

    @staticmethod
    async def add_tags(
        db: AsyncSession,
        school_id: str,
        material_id: str,
        tags: List[str]
    ) -> Optional[TeacherMaterial]:
        """Add tags to a material"""
        result = await db.execute(
            select(TeacherMaterial).where(
                TeacherMaterial.id == material_id,
                TeacherMaterial.school_id == school_id,
                TeacherMaterial.is_deleted == False
            )
        )
        material = result.scalar_one_or_none()
        if not material:
            return None

        existing_tags = material.tags or []
        new_tags = list(set(existing_tags + tags))
        material.tags = new_tags

        await db.commit()
        await db.refresh(material)
        return material

    @staticmethod
    async def remove_tags(
        db: AsyncSession,
        school_id: str,
        material_id: str,
        tags: List[str]
    ) -> Optional[TeacherMaterial]:
        """Remove tags from a material"""
        result = await db.execute(
            select(TeacherMaterial).where(
                TeacherMaterial.id == material_id,
                TeacherMaterial.school_id == school_id,
                TeacherMaterial.is_deleted == False
            )
        )
        material = result.scalar_one_or_none()
        if not material:
            return None

        existing_tags = material.tags or []
        material.tags = [t for t in existing_tags if t not in tags]

        await db.commit()
        await db.refresh(material)
        return material

    @staticmethod
    async def get_all_tags(
        db: AsyncSession,
        school_id: str,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all unique tags with counts"""
        conditions = [
            TeacherMaterial.school_id == school_id,
            TeacherMaterial.is_deleted == False
        ]
        if user_id:
            conditions.append(TeacherMaterial.uploaded_by == user_id)

        result = await db.execute(
            select(TeacherMaterial.tags).where(and_(*conditions))
        )

        tag_counts = {}
        for row in result.scalars().all():
            if row:
                for tag in row:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1

        return [{"tag": tag, "count": count} for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1])]

    # ============== Statistics ==============

    @staticmethod
    async def get_material_statistics(
        db: AsyncSession,
        school_id: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get material statistics"""
        conditions = [
            TeacherMaterial.school_id == school_id,
            TeacherMaterial.is_deleted == False,
            TeacherMaterial.is_current_version == True
        ]
        if user_id:
            conditions.append(TeacherMaterial.uploaded_by == user_id)

        # Total counts
        total_result = await db.execute(
            select(func.count(TeacherMaterial.id)).where(and_(*conditions))
        )
        total_materials = total_result.scalar() or 0

        # Published count
        published_result = await db.execute(
            select(func.count(TeacherMaterial.id)).where(
                and_(*conditions, TeacherMaterial.is_published == True)
            )
        )
        published_materials = published_result.scalar() or 0

        # Total storage
        storage_result = await db.execute(
            select(func.sum(TeacherMaterial.file_size)).where(and_(*conditions))
        )
        total_storage = storage_result.scalar() or 0

        # By type
        type_result = await db.execute(
            select(
                TeacherMaterial.material_type,
                func.count(TeacherMaterial.id)
            ).where(and_(*conditions)).group_by(TeacherMaterial.material_type)
        )
        by_type = {row[0].value: row[1] for row in type_result.all()}

        # Total views and downloads
        views_result = await db.execute(
            select(func.sum(TeacherMaterial.view_count)).where(and_(*conditions))
        )
        total_views = views_result.scalar() or 0

        downloads_result = await db.execute(
            select(func.sum(TeacherMaterial.download_count)).where(and_(*conditions))
        )
        total_downloads = downloads_result.scalar() or 0

        return {
            "total_materials": total_materials,
            "published_materials": published_materials,
            "draft_materials": total_materials - published_materials,
            "total_storage_mb": round(total_storage / (1024 * 1024), 2),
            "materials_by_type": by_type,
            "total_views": total_views,
            "total_downloads": total_downloads
        }

    # ============== Access Tracking ==============

    @staticmethod
    async def log_access(
        db: AsyncSession,
        school_id: str,
        material_id: str,
        user_id: str,
        access_type: AccessType,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> MaterialAccessLog:
        """Log material access"""
        log = MaterialAccessLog(
            id=str(uuid.uuid4()),
            school_id=school_id,
            material_id=material_id,
            user_id=user_id,
            access_type=access_type,
            accessed_at=datetime.utcnow(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log)

        # Update counters
        result = await db.execute(
            select(TeacherMaterial).where(TeacherMaterial.id == material_id)
        )
        material = result.scalar_one_or_none()
        if material:
            if access_type == AccessType.VIEW:
                material.view_count += 1
            elif access_type == AccessType.DOWNLOAD:
                material.download_count += 1

        await db.commit()
        return log

    # ============== Folders ==============

    @staticmethod
    async def create_folder(
        db: AsyncSession,
        school_id: str,
        teacher_id: str,
        name: str,
        description: Optional[str] = None,
        parent_folder_id: Optional[str] = None,
        color: Optional[str] = None,
        icon: Optional[str] = None
    ) -> MaterialFolder:
        """Create a new folder"""
        folder = MaterialFolder(
            id=str(uuid.uuid4()),
            school_id=school_id,
            teacher_id=teacher_id,
            name=name,
            description=description,
            parent_folder_id=parent_folder_id,
            color=color,
            icon=icon
        )
        db.add(folder)
        await db.commit()
        await db.refresh(folder)
        return folder

    @staticmethod
    async def get_folders(
        db: AsyncSession,
        school_id: str,
        teacher_id: str,
        parent_folder_id: Optional[str] = None
    ) -> List[MaterialFolder]:
        """Get folders for a teacher"""
        conditions = [
            MaterialFolder.school_id == school_id,
            MaterialFolder.teacher_id == teacher_id,
            MaterialFolder.is_deleted == False
        ]
        if parent_folder_id:
            conditions.append(MaterialFolder.parent_folder_id == parent_folder_id)
        else:
            conditions.append(MaterialFolder.parent_folder_id == None)

        result = await db.execute(
            select(MaterialFolder).where(
                and_(*conditions)
            ).options(
                selectinload(MaterialFolder.children),
                selectinload(MaterialFolder.folder_items)
            ).order_by(MaterialFolder.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def add_material_to_folder(
        db: AsyncSession,
        school_id: str,
        folder_id: str,
        material_id: str,
        position: int = 0
    ) -> MaterialFolderItem:
        """Add a material to a folder"""
        item = MaterialFolderItem(
            id=str(uuid.uuid4()),
            school_id=school_id,
            folder_id=folder_id,
            material_id=material_id,
            position=position
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item

    @staticmethod
    async def remove_material_from_folder(
        db: AsyncSession,
        school_id: str,
        folder_id: str,
        material_id: str
    ) -> bool:
        """Remove a material from a folder"""
        result = await db.execute(
            select(MaterialFolderItem).where(
                MaterialFolderItem.school_id == school_id,
                MaterialFolderItem.folder_id == folder_id,
                MaterialFolderItem.material_id == material_id,
                MaterialFolderItem.is_deleted == False
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            return False

        item.is_deleted = True
        await db.commit()
        return True
