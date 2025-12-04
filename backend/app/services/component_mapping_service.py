from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, distinct
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.component_mapping import ComponentMapping
from app.models.grade import Exam, Grade
from app.models.grade_template import AssessmentComponent
from app.schemas.component_mapping import (
    ComponentMappingCreate,
    ComponentMappingUpdate,
    ExamTypeInfo,
    MappingPreview
)
import uuid


class ComponentMappingService:
    """Service for managing exam type to grade component mappings"""

    @staticmethod
    async def create_mapping(
        db: AsyncSession,
        mapping_data: ComponentMappingCreate,
        school_id: str
    ) -> ComponentMapping:
        """Create a new component mapping"""
        
        # Check if this exam type is already mapped for this teacher/subject/term
        existing = await db.execute(
            select(ComponentMapping).where(
                and_(
                    ComponentMapping.teacher_id == mapping_data.teacher_id,
                    ComponentMapping.subject_id == mapping_data.subject_id,
                    ComponentMapping.term_id == mapping_data.term_id,
                    ComponentMapping.exam_type_name == mapping_data.exam_type_name,
                    ComponentMapping.school_id == school_id,
                    ComponentMapping.is_deleted == False
                )
            )
        )
        
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Exam type '{mapping_data.exam_type_name}' is already mapped for this subject and term"
            )
        
        # Create the mapping
        mapping = ComponentMapping(
            id=str(uuid.uuid4()),
            school_id=school_id,
            **mapping_data.dict()
        )
        
        db.add(mapping)
        await db.commit()
        
        # Reload with relationships
        query = select(ComponentMapping).where(
            ComponentMapping.id == mapping.id
        ).options(
            selectinload(ComponentMapping.component)
        )
        result = await db.execute(query)
        return result.scalar_one()

    @staticmethod
    async def get_teacher_mappings(
        db: AsyncSession,
        teacher_id: str,
        subject_id: str,
        term_id: str,
        school_id: str
    ) -> List[ComponentMapping]:
        """Get all mappings for a teacher/subject/term"""
        query = select(ComponentMapping).where(
            and_(
                ComponentMapping.teacher_id == teacher_id,
                ComponentMapping.subject_id == subject_id,
                ComponentMapping.term_id == term_id,
                ComponentMapping.school_id == school_id,
                ComponentMapping.is_deleted == False
            )
        ).options(
            selectinload(ComponentMapping.component)
        ).order_by(ComponentMapping.created_at)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_mapping(
        db: AsyncSession,
        mapping_id: str,
        mapping_data: ComponentMappingUpdate,
        school_id: str
    ) -> ComponentMapping:
        """Update a component mapping"""
        query = select(ComponentMapping).where(
            and_(
                ComponentMapping.id == mapping_id,
                ComponentMapping.school_id == school_id,
                ComponentMapping.is_deleted == False
            )
        )
        result = await db.execute(query)
        mapping = result.scalar_one_or_none()
        
        if not mapping:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Component mapping not found"
            )
        
        # Update fields
        update_data = mapping_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(mapping, field, value)
        
        await db.commit()
        
        # Reload with relationships
        query = select(ComponentMapping).where(
            ComponentMapping.id == mapping.id
        ).options(
            selectinload(ComponentMapping.component)
        )
        result = await db.execute(query)
        return result.scalar_one()

    @staticmethod
    async def delete_mapping(
        db: AsyncSession,
        mapping_id: str,
        school_id: str
    ) -> None:
        """Delete a component mapping"""
        query = select(ComponentMapping).where(
            and_(
                ComponentMapping.id == mapping_id,
                ComponentMapping.school_id == school_id,
                ComponentMapping.is_deleted == False
            )
        )
        result = await db.execute(query)
        mapping = result.scalar_one_or_none()
        
        if not mapping:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Component mapping not found"
            )
        
        mapping.is_deleted = True
        await db.commit()

    @staticmethod
    async def get_available_exam_types(
        db: AsyncSession,
        teacher_id: str,
        subject_id: str,
        term_id: str,
        school_id: str
    ) -> List[ExamTypeInfo]:
        """Get unique exam types from teacher's exams with mapping status"""
        
        # Get distinct exam types from teacher's exams
        exam_types_query = select(distinct(Exam.exam_type)).where(
            and_(
                Exam.created_by == teacher_id,
                Exam.subject_id == subject_id,
                Exam.term_id == term_id,
                Exam.school_id == school_id,
                Exam.is_deleted == False
            )
        )
        exam_types_result = await db.execute(exam_types_query)
        exam_types = [et for et in exam_types_result.scalars().all() if et]
        
        # Get existing mappings
        mappings = await ComponentMappingService.get_teacher_mappings(
            db, teacher_id, subject_id, term_id, school_id
        )
        mapping_dict = {m.exam_type_name: m for m in mappings}
        
        # Build exam type info list
        exam_type_infos = []
        for exam_type in exam_types:
            # Count exams of this type
            count_query = select(func.count(Exam.id)).where(
                and_(
                    Exam.created_by == teacher_id,
                    Exam.subject_id == subject_id,
                    Exam.term_id == term_id,
                    Exam.exam_type == exam_type,
                    Exam.school_id == school_id,
                    Exam.is_deleted == False
                )
            )
            count_result = await db.execute(count_query)
            count = count_result.scalar()
            
            mapping = mapping_dict.get(exam_type)
            exam_type_infos.append(ExamTypeInfo(
                exam_type_name=exam_type,
                exam_count=count or 0,
                mapped=mapping is not None,
                mapped_to_component=mapping.component.name if mapping and mapping.component else None
            ))
        
        return exam_type_infos

    @staticmethod
    async def get_mapping_preview(
        db: AsyncSession,
        teacher_id: str,
        subject_id: str,
        term_id: str,
        template_id: str,
        school_id: str
    ) -> List[MappingPreview]:
        """Preview how grades will be calculated with current mappings"""
        
        # Get template components
        components_query = select(AssessmentComponent).where(
            and_(
                AssessmentComponent.template_id == template_id,
                AssessmentComponent.school_id == school_id,
                AssessmentComponent.is_deleted == False
            )
        ).order_by(AssessmentComponent.order)
        
        components_result = await db.execute(components_query)
        components = list(components_result.scalars().all())
        
        # Get mappings
        mappings = await ComponentMappingService.get_teacher_mappings(
            db, teacher_id, subject_id, term_id, school_id
        )
        
        # Group mappings by component
        mappings_by_component: Dict[str, List[ComponentMapping]] = {}
        for mapping in mappings:
            if mapping.component_id not in mappings_by_component:
                mappings_by_component[mapping.component_id] = []
            mappings_by_component[mapping.component_id].append(mapping)
        
        # Build preview for each component
        previews = []
        for component in components:
            component_mappings = mappings_by_component.get(component.id, [])
            mapped_types = [m.exam_type_name for m in component_mappings if m.include_in_calculation]
            
            # Count total exams mapped to this component
            total_exams = 0
            for mapping in component_mappings:
                if mapping.include_in_calculation:
                    count_query = select(func.count(Exam.id)).where(
                        and_(
                            Exam.created_by == teacher_id,
                            Exam.subject_id == subject_id,
                            Exam.term_id == term_id,
                            Exam.exam_type == mapping.exam_type_name,
                            Exam.school_id == school_id,
                            Exam.is_deleted == False
                        )
                    )
                    count_result = await db.execute(count_query)
                    total_exams += count_result.scalar() or 0
            
            previews.append(MappingPreview(
                component_id=component.id,
                component_name=component.name,
                component_weight=float(component.weight),
                mapped_exam_types=mapped_types,
                exam_count=total_exams
            ))
        
        return previews
