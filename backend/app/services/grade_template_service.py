from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, Session
from sqlalchemy import select, and_
from decimal import Decimal
from datetime import date as date_type
from fastapi import HTTPException, status

from app.models.grade_template import (
    GradeTemplate,
    AssessmentComponent,
    GradeScale,
    RemarkTemplate
)
from app.schemas.grade_template import (
    GradeTemplateCreate,
    GradeTemplateUpdate,
    AssessmentComponentCreate,
    GradeScaleCreate,
    RemarkTemplateCreate
)
import uuid


class GradeTemplateService:
    """Service for managing grade templates"""

    @staticmethod
    async def create_grade_template(
        db: AsyncSession,
        template_data: GradeTemplateCreate,
        school_id: str,
        created_by: str
    ) -> GradeTemplate:
        """Create a new grade template with components, scales, and remarks"""
        
        # If this is set to be default, unset any existing default
        if hasattr(template_data, 'is_default') and template_data.is_default:
            await GradeTemplateService._unset_default_templates(db, school_id)
        
        # Create the main template
        template = GradeTemplate(
            id=str(uuid.uuid4()),
            school_id=school_id,
            created_by=created_by,
            name=template_data.name,
            description=template_data.description,
            total_marks=template_data.total_marks,
            is_default=False,  # Will be set separately if needed
            is_active=True
        )
        db.add(template)
        await db.flush()  # Flush to get the template ID
        
        # Create assessment components
        for component_data in template_data.assessment_components:
            component = AssessmentComponent(
                id=str(uuid.uuid4()),
                template_id=template.id,
                school_id=school_id,
                name=component_data.name,
                weight=component_data.weight,
                is_required=component_data.is_required,
                order=component_data.order
            )
            db.add(component)
        
        # Create grade scales
        for scale_data in template_data.grade_scales:
            scale = GradeScale(
                id=str(uuid.uuid4()),
                template_id=template.id,
                school_id=school_id,
                grade=scale_data.grade,
                min_score=scale_data.min_score,
                max_score=scale_data.max_score,
                remark=scale_data.remark,
                color=scale_data.color,
                order=scale_data.order
            )
            db.add(scale)
        
        # Create remark templates if provided
        if template_data.remark_templates:
            for remark_data in template_data.remark_templates:
                remark = RemarkTemplate(
                    id=str(uuid.uuid4()),
                    template_id=template.id,
                    school_id=school_id,
                    min_percentage=remark_data.min_percentage,
                    max_percentage=remark_data.max_percentage,
                    remark_text=remark_data.remark_text,
                    order=remark_data.order
                )
                db.add(remark)
        
        await db.commit()
        
        # Eagerly load the template with all relationships to avoid MissingGreenlet errors
        query = select(GradeTemplate).where(
            GradeTemplate.id == template.id
        ).options(
            selectinload(GradeTemplate.assessment_components),
            selectinload(GradeTemplate.grade_scales),
            selectinload(GradeTemplate.remark_templates)
        )
        result = await db.execute(query)
        template = result.scalar_one()
        
        return template

    @staticmethod
    async def get_grade_templates(
        db: AsyncSession,
        school_id: str,
        include_inactive: bool = False
    ) -> List[GradeTemplate]:
        """Get all grade templates for a school"""
        query = select(GradeTemplate).where(
            GradeTemplate.school_id == school_id,
            GradeTemplate.is_deleted == False
        )
        
        if not include_inactive:
            query = query.where(GradeTemplate.is_active == True)
        
        query = query.options(
            selectinload(GradeTemplate.assessment_components),
            selectinload(GradeTemplate.grade_scales),
            selectinload(GradeTemplate.remark_templates)
        ).order_by(GradeTemplate.is_default.desc(), GradeTemplate.created_at.desc())
        
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_grade_template(
        db: AsyncSession,
        template_id: str,
        school_id: str
    ) -> GradeTemplate:
        """Get a specific grade template"""
        query = select(GradeTemplate).where(
            GradeTemplate.id == template_id,
            GradeTemplate.school_id == school_id,
            GradeTemplate.is_deleted == False
        ).options(
            selectinload(GradeTemplate.assessment_components),
            selectinload(GradeTemplate.grade_scales),
            selectinload(GradeTemplate.remark_templates)
        )
        
        result = await db.execute(query)
        template = result.scalar_one_or_none()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Grade template with ID {template_id} not found"
            )
        
        return template

    @staticmethod
    async def update_grade_template(
        db: AsyncSession,
        template_id: str,
        school_id: str,
        template_data: GradeTemplateUpdate
    ) -> GradeTemplate:
        """Update a grade template"""
        template = await GradeTemplateService.get_grade_template(db, template_id, school_id)
        
        # Update basic fields
        update_data = template_data.dict(exclude_unset=True, exclude={'assessment_components', 'grade_scales', 'remark_templates'})
        for field, value in update_data.items():
            setattr(template, field, value)
        
        # Update assessment components if provided
        if template_data.assessment_components is not None:
            # Delete existing components
            from sqlalchemy import delete
            await db.execute(
                delete(AssessmentComponent).where(
                    AssessmentComponent.template_id == template_id
                )
            )
            
            # Add new components
            for component_data in template_data.assessment_components:
                component = AssessmentComponent(
                    id=str(uuid.uuid4()),
                    template_id=template.id,
                    school_id=school_id,
                    name=component_data.name,
                    weight=component_data.weight,
                    is_required=component_data.is_required,
                    order=component_data.order
                )
                db.add(component)
        
        # Update grade scales if provided
        if template_data.grade_scales is not None:
            # Delete existing scales
            from sqlalchemy import delete
            await db.execute(
                delete(GradeScale).where(
                    GradeScale.template_id == template_id
                )
            )
            
            # Add new scales
            for scale_data in template_data.grade_scales:
                scale = GradeScale(
                    id=str(uuid.uuid4()),
                    template_id=template.id,
                    school_id=school_id,
                    grade=scale_data.grade,
                    min_score=scale_data.min_score,
                    max_score=scale_data.max_score,
                    remark=scale_data.remark,
                    color=scale_data.color,
                    order=scale_data.order
                )
                db.add(scale)
        
        # Update remark templates if provided
        if template_data.remark_templates is not None:
            # Delete existing remarks
            from sqlalchemy import delete
            await db.execute(
                delete(RemarkTemplate).where(
                    RemarkTemplate.template_id == template_id
                )
            )
            
            # Add new remarks
            for remark_data in template_data.remark_templates:
                remark = RemarkTemplate(
                    id=str(uuid.uuid4()),
                    template_id=template.id,
                    school_id=school_id,
                    min_percentage=remark_data.min_percentage,
                    max_percentage=remark_data.max_percentage,
                    remark_text=remark_data.remark_text,
                    order=remark_data.order
                )
                db.add(remark)
        
        await db.commit()
        
        # Eagerly load the template with all relationships
        query = select(GradeTemplate).where(
            GradeTemplate.id == template.id
        ).options(
            selectinload(GradeTemplate.assessment_components),
            selectinload(GradeTemplate.grade_scales),
            selectinload(GradeTemplate.remark_templates)
        )
        result = await db.execute(query)
        template = result.scalar_one()
        
        return template

    @staticmethod
    async def delete_grade_template(
        db: AsyncSession,
        template_id: str,
        school_id: str
    ) -> None:
        """Soft delete a grade template"""
        template = await GradeTemplateService.get_grade_template(db, template_id, school_id)
        
        # Cannot delete default template
        if template.is_default:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the default grade template. Please set another template as default first."
            )
        
        template.is_deleted = True
        await db.commit()

    @staticmethod
    async def set_default_template(
        db: AsyncSession,
        template_id: str,
        school_id: str
    ) -> GradeTemplate:
        """Set a template as the school's default"""
        template = await GradeTemplateService.get_grade_template(db, template_id, school_id)
        
        # Unset any existing default
        await GradeTemplateService._unset_default_templates(db, school_id)
        
        # Set this template as default
        template.is_default = True
        await db.commit()
        
        # Eagerly load the template with all relationships
        query = select(GradeTemplate).where(
            GradeTemplate.id == template.id
        ).options(
            selectinload(GradeTemplate.assessment_components),
            selectinload(GradeTemplate.grade_scales),
            selectinload(GradeTemplate.remark_templates)
        )
        result = await db.execute(query)
        template = result.scalar_one()
        
        return template

    @staticmethod
    async def get_default_template(
        db: AsyncSession,
        school_id: str
    ) -> Optional[GradeTemplate]:
        """Get the school's default grade template"""
        query = select(GradeTemplate).where(
            GradeTemplate.school_id == school_id,
            GradeTemplate.is_default == True,
            GradeTemplate.is_deleted == False,
            GradeTemplate.is_active == True
        ).options(
            selectinload(GradeTemplate.assessment_components),
            selectinload(GradeTemplate.grade_scales),
            selectinload(GradeTemplate.remark_templates)
        )
        
        result = await db.execute(query)
        template = result.scalar_one_or_none()
        
        return template

    @staticmethod
    async def _unset_default_templates(db: AsyncSession, school_id: str) -> None:
        """Unset all default templates for a school"""
        from sqlalchemy import update
        await db.execute(
            update(GradeTemplate).where(
                GradeTemplate.school_id == school_id,
                GradeTemplate.is_default == True
            ).values(is_default=False)
        )
        await db.flush()

    @staticmethod
    def calculate_grade(
        template: GradeTemplate,
        component_scores: Dict[str, float]
        ) -> Dict[str, Any]:
        """
        Calculate final grade based on template and component scores
        
        Args:
            template: The grade template to use
            component_scores: Dict mapping component names to scores
            
        Returns:
            Dict containing final_score, percentage, grade, and remark
        """
        total_score = Decimal('0')
        total_weight = Decimal('0')
        
        # Calculate weighted score
        for component in template.assessment_components:
            if component.name in component_scores:
                score = Decimal(str(component_scores[component.name]))
                weight = component.weight / Decimal('100')  # Convert percentage to decimal
                total_score += score * weight
                total_weight += component.weight
            elif component.is_required:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Required component '{component.name}' is missing"
                )
        
        # Calculate percentage
        percentage = (total_score / template.total_marks) * Decimal('100')
        
        # Find matching grade scale
        grade = None
        grade_remark = None
        for scale in sorted(template.grade_scales, key=lambda x: x.max_score, reverse=True):
            if scale.min_score <= total_score <= scale.max_score:
                grade = scale.grade
                grade_remark = scale.remark
                break
        
        # Find matching remark template
        remark_text = None
        for remark in sorted(template.remark_templates, key=lambda x: x.max_percentage, reverse=True):
            if remark.min_percentage <= percentage <= remark.max_percentage:
                remark_text = remark.remark_text
                break
        
        return {
            "final_score": float(total_score),
            "percentage": float(percentage),
            "grade": grade,
            "grade_remark": grade_remark,
            "remark_text": remark_text
        }
