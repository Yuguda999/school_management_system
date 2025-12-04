from typing import Any, Optional, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func, or_
from sqlalchemy.orm import selectinload

from app.models.report_card_template import (
    ReportCardTemplate, 
    ReportCardTemplateField, 
    ReportCardTemplateAssignment
)
from app.models.academic import Class
from app.schemas.report_card_template import (
    ReportCardTemplateCreate,
    ReportCardTemplateUpdate,
    ReportCardTemplateFieldCreate,
    ReportCardTemplateFieldUpdate,
    ReportCardTemplateAssignmentCreate,
    ReportCardTemplateAssignmentUpdate,
    ReportCardTemplateCloneRequest,
    TemplateValidationResult,
    TemplateValidationError
)


class ReportCardTemplateService:
    """Service class for report card template operations"""

    @staticmethod
    async def create_template(
        db: AsyncSession,
        template_data: ReportCardTemplateCreate,
        school_id: str,
        school_owner_id: str
    ) -> ReportCardTemplate:
        """Create a new report card template"""
        
        # Create template
        template_dict = template_data.dict(exclude={'fields'})
        template_dict.update({
            'school_id': school_id,
            'school_owner_id': school_owner_id
        })
        
        template = ReportCardTemplate(**template_dict)
        db.add(template)
        await db.commit()
        await db.refresh(template)
        
        # Create template fields
        if template_data.fields:
            for field_data in template_data.fields:
                field_dict = field_data.dict()
                field_dict.update({
                    'template_id': template.id,
                    'school_id': school_id,
                    'school_owner_id': school_owner_id
                })
                field = ReportCardTemplateField(**field_dict)
                db.add(field)
        
        await db.commit()
        await db.refresh(template)
        
        return template

    @staticmethod
    async def get_template_by_id(
        db: AsyncSession,
        template_id: str,
        school_owner_id: str
    ) -> Optional[ReportCardTemplate]:
        """Get template by ID with fields loaded"""
        
        result = await db.execute(
            select(ReportCardTemplate)
            .options(selectinload(ReportCardTemplate.fields))
            .where(
                and_(
                    ReportCardTemplate.id == template_id,
                    ReportCardTemplate.school_owner_id == school_owner_id,
                    ReportCardTemplate.is_deleted == False
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_templates(
        db: AsyncSession,
        school_owner_id: Optional[str],
        school_id: str,
        is_active: Optional[bool] = None,
        is_published: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[ReportCardTemplate]:
        """Get templates with filtering"""
        
        conditions = [
            ReportCardTemplate.school_id == school_id,
            ReportCardTemplate.is_deleted == False
        ]
        
        # Only filter by owner if specified (for school owners viewing their own templates)
        if school_owner_id:
            conditions.append(ReportCardTemplate.school_owner_id == school_owner_id)
        
        if is_active is not None:
            conditions.append(ReportCardTemplate.is_active == is_active)
        if is_published is not None:
            conditions.append(ReportCardTemplate.is_published == is_published)
        if search:
            conditions.append(
                or_(
                    ReportCardTemplate.name.ilike(f"%{search}%"),
                    ReportCardTemplate.description.ilike(f"%{search}%")
                )
            )
        
        result = await db.execute(
            select(ReportCardTemplate)
            .options(selectinload(ReportCardTemplate.fields))
            .where(and_(*conditions))
            .order_by(desc(ReportCardTemplate.updated_at))
            .offset(skip)
            .limit(limit)
        )
        
        return result.scalars().all()

    @staticmethod
    async def update_template(
        db: AsyncSession,
        template_id: str,
        template_data: ReportCardTemplateUpdate,
        school_owner_id: str
    ) -> Optional[ReportCardTemplate]:
        """Update template"""
        
        result = await db.execute(
            select(ReportCardTemplate)
            .options(selectinload(ReportCardTemplate.fields))
            .where(
                and_(
                    ReportCardTemplate.id == template_id,
                    ReportCardTemplate.school_owner_id == school_owner_id,
                    ReportCardTemplate.is_deleted == False
                )
            )
        )
        template = result.scalar_one_or_none()
        
        if not template:
            return None
        
        # Update template fields
        update_data = template_data.dict(exclude_unset=True)
        fields_data = update_data.pop('fields', None)
        
        for field, value in update_data.items():
            setattr(template, field, value)
            
        # Handle fields synchronization if provided
        if fields_data is not None:
            # Get existing fields map
            existing_fields = {f.id: f for f in template.fields}
            existing_field_ids = set(existing_fields.keys())
            
            # Process incoming fields
            incoming_field_ids = set()
            
            for field_data in fields_data:
                # If field has an ID and exists, update it
                field_id = field_data.get('id')
                
                if field_id and field_id in existing_fields:
                    incoming_field_ids.add(field_id)
                    field_obj = existing_fields[field_id]
                    
                    # Update field attributes
                    for key, value in field_data.items():
                        if key != 'id' and hasattr(field_obj, key):
                            setattr(field_obj, key, value)
                else:
                    # Create new field
                    # Remove id if present to let DB generate it
                    if 'id' in field_data:
                        del field_data['id']
                        
                    field_dict = field_data.copy()
                    field_dict.update({
                        'template_id': template.id,
                        'school_id': template.school_id,
                        'school_owner_id': school_owner_id
                    })
                    
                    new_field = ReportCardTemplateField(**field_dict)
                    db.add(new_field)
            
            # Delete fields that are not in incoming data
            fields_to_delete = existing_field_ids - incoming_field_ids
            for field_id in fields_to_delete:
                await db.delete(existing_fields[field_id])
        
        await db.commit()
        await db.refresh(template)
        
        return template

    @staticmethod
    async def delete_template(
        db: AsyncSession,
        template_id: str,
        school_owner_id: str
    ) -> bool:
        """Soft delete template"""
        
        result = await db.execute(
            select(ReportCardTemplate)
            .where(
                and_(
                    ReportCardTemplate.id == template_id,
                    ReportCardTemplate.school_owner_id == school_owner_id,
                    ReportCardTemplate.is_deleted == False
                )
            )
        )
        template = result.scalar_one_or_none()
        
        if not template:
            return False
        
        # Check if template is assigned to any classes
        assignment_result = await db.execute(
            select(ReportCardTemplateAssignment)
            .where(
                and_(
                    ReportCardTemplateAssignment.template_id == template_id,
                    ReportCardTemplateAssignment.is_active == True,
                    ReportCardTemplateAssignment.is_deleted == False
                )
            )
        )
        assignments = assignment_result.scalars().all()
        
        if assignments:
            # Deactivate assignments instead of deleting template
            for assignment in assignments:
                assignment.is_active = False
        else:
            # Safe to delete template
            template.is_deleted = True
        
        await db.commit()
        return True

    @staticmethod
    async def clone_template(
        db: AsyncSession,
        template_id: str,
        clone_data: ReportCardTemplateCloneRequest,
        school_id: str,
        school_owner_id: str
    ) -> Optional[ReportCardTemplate]:
        """Clone an existing template"""
        
        # Get original template
        original_template = await ReportCardTemplateService.get_template_by_id(
            db, template_id, school_owner_id
        )
        
        if not original_template:
            return None
        
        # Create new template
        template_dict = {
            'name': clone_data.name,
            'description': clone_data.description or original_template.description,
            'version': '1.0',
            'paper_size': original_template.paper_size,
            'orientation': original_template.orientation,
            'page_margin_top': original_template.page_margin_top,
            'page_margin_bottom': original_template.page_margin_bottom,
            'page_margin_left': original_template.page_margin_left,
            'page_margin_right': original_template.page_margin_right,
            'background_color': original_template.background_color,
            'background_image_url': original_template.background_image_url,
            'default_font_family': original_template.default_font_family,
            'default_font_size': original_template.default_font_size,
            'default_text_color': original_template.default_text_color,
            'default_line_height': original_template.default_line_height,
            'is_active': True,
            'is_default': False,
            'is_published': False,
            'school_id': school_id,
            'school_owner_id': school_owner_id
        }
        
        new_template = ReportCardTemplate(**template_dict)
        db.add(new_template)
        await db.commit()
        await db.refresh(new_template)
        
        # Clone fields
        for field in original_template.fields:
            field_dict = {
                'field_id': field.field_id,
                'field_type': field.field_type,
                'label': field.label,
                'x_position': field.x_position,
                'y_position': field.y_position,
                'width': field.width,
                'height': field.height,
                'font_family': field.font_family,
                'font_size': field.font_size,
                'font_weight': field.font_weight,
                'font_style': field.font_style,
                'text_color': field.text_color,
                'background_color': field.background_color,
                'border_color': field.border_color,
                'border_width': field.border_width,
                'border_style': field.border_style,
                'text_align': field.text_align,
                'line_height': field.line_height,
                'is_required': field.is_required,
                'is_visible': field.is_visible,
                'placeholder_text': field.placeholder_text,
                'default_value': field.default_value,
                'properties': field.properties,
                'z_index': field.z_index,
                'template_id': new_template.id,
                'school_id': school_id,
                'school_owner_id': school_owner_id
            }
            
            new_field = ReportCardTemplateField(**field_dict)
            db.add(new_field)
        
        await db.commit()
        await db.refresh(new_template)
        
        return new_template

    @staticmethod
    async def set_default_template(
        db: AsyncSession,
        template_id: str,
        school_owner_id: str
    ) -> bool:
        """Set template as default (only one default per school owner)"""
        
        # Remove default from all other templates
        await db.execute(
            select(ReportCardTemplate)
            .where(
                and_(
                    ReportCardTemplate.school_owner_id == school_owner_id,
                    ReportCardTemplate.is_default == True,
                    ReportCardTemplate.is_deleted == False
                )
            )
        )
        
        # Set new default
        result = await db.execute(
            select(ReportCardTemplate)
            .where(
                and_(
                    ReportCardTemplate.id == template_id,
                    ReportCardTemplate.school_owner_id == school_owner_id,
                    ReportCardTemplate.is_deleted == False
                )
            )
        )
        template = result.scalar_one_or_none()
        
        if not template:
            return False
        
        template.is_default = True
        await db.commit()
        
        return True

    @staticmethod
    async def validate_template(
        template_data: ReportCardTemplateCreate
    ) -> TemplateValidationResult:
        """Validate template configuration"""
        
        errors = []
        warnings = []
        
        # Validate paper size and margins
        # Validate paper size and margins (using 96 DPI pixels)
        paper_widths = {
            'A4': 794,      # 8.27in * 96
            'A3': 1123,     # 11.69in * 96
            'Letter': 816,  # 8.5in * 96
            'Legal': 816,   # 8.5in * 96
            'Tabloid': 1056 # 11in * 96
        }
        
        paper_heights = {
            'A4': 1123,     # 11.69in * 96
            'A3': 1587,     # 16.54in * 96
            'Letter': 1056, # 11in * 96
            'Legal': 1344,  # 14in * 96
            'Tabloid': 1632 # 17in * 96
        }
        
        paper_size = template_data.paper_size
        orientation = template_data.orientation
        
        if orientation.value == 'landscape':
            max_width = paper_heights.get(paper_size.value, 1123)
            max_height = paper_widths.get(paper_size.value, 794)
        else:
            max_width = paper_widths.get(paper_size.value, 794)
            max_height = paper_heights.get(paper_size.value, 1123)
        
        # Check margins
        total_margin_width = template_data.page_margin_left + template_data.page_margin_right
        total_margin_height = template_data.page_margin_top + template_data.page_margin_bottom
        
        if total_margin_width >= max_width:
            errors.append(TemplateValidationError(
                field="margins",
                message="Total horizontal margins exceed page width",
                value=f"{total_margin_width} >= {max_width}"
            ))
        
        if total_margin_height >= max_height:
            errors.append(TemplateValidationError(
                field="margins",
                message="Total vertical margins exceed page height",
                value=f"{total_margin_height} >= {max_height}"
            ))
        
        # Validate fields
        if template_data.fields:
            for i, field in enumerate(template_data.fields):
                # Check field positioning
                if field.x_position + field.width > max_width - template_data.page_margin_left - template_data.page_margin_right:
                    errors.append(TemplateValidationError(
                        field=f"fields[{i}].position",
                        message="Field extends beyond page boundaries",
                        value=f"x: {field.x_position}, width: {field.width}"
                    ))
                
                if field.y_position + field.height > max_height - template_data.page_margin_top - template_data.page_margin_bottom:
                    errors.append(TemplateValidationError(
                        field=f"fields[{i}].position",
                        message="Field extends beyond page boundaries",
                        value=f"y: {field.y_position}, height: {field.height}"
                    ))
                
                # Check field overlap
                for j, other_field in enumerate(template_data.fields):
                    if i != j:
                        if (field.x_position < other_field.x_position + other_field.width and
                            field.x_position + field.width > other_field.x_position and
                            field.y_position < other_field.y_position + other_field.height and
                            field.y_position + field.height > other_field.y_position):
                            warnings.append(TemplateValidationError(
                                field=f"fields[{i}].overlap",
                                message=f"Field overlaps with field {j}",
                                value=f"Field {i} overlaps with field {j}"
                            ))
        
        return TemplateValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

    @staticmethod
    async def get_template_statistics(
        db: AsyncSession,
        school_owner_id: str
    ) -> Dict[str, Any]:
        """Get template usage statistics"""
        
        # Count templates
        total_templates = await db.scalar(
            select(func.count(ReportCardTemplate.id))
            .where(
                and_(
                    ReportCardTemplate.school_owner_id == school_owner_id,
                    ReportCardTemplate.is_deleted == False
                )
            )
        )
        
        active_templates = await db.scalar(
            select(func.count(ReportCardTemplate.id))
            .where(
                and_(
                    ReportCardTemplate.school_owner_id == school_owner_id,
                    ReportCardTemplate.is_active == True,
                    ReportCardTemplate.is_deleted == False
                )
            )
        )
        
        published_templates = await db.scalar(
            select(func.count(ReportCardTemplate.id))
            .where(
                and_(
                    ReportCardTemplate.school_owner_id == school_owner_id,
                    ReportCardTemplate.is_published == True,
                    ReportCardTemplate.is_deleted == False
                )
            )
        )
        
        default_templates = await db.scalar(
            select(func.count(ReportCardTemplate.id))
            .where(
                and_(
                    ReportCardTemplate.school_owner_id == school_owner_id,
                    ReportCardTemplate.is_default == True,
                    ReportCardTemplate.is_deleted == False
                )
            )
        )
        
        # Count assignments
        total_assignments = await db.scalar(
            select(func.count(ReportCardTemplateAssignment.id))
            .where(
                and_(
                    ReportCardTemplateAssignment.school_owner_id == school_owner_id,
                    ReportCardTemplateAssignment.is_deleted == False
                )
            )
        )
        
        active_assignments = await db.scalar(
            select(func.count(ReportCardTemplateAssignment.id))
            .where(
                and_(
                    ReportCardTemplateAssignment.school_owner_id == school_owner_id,
                    ReportCardTemplateAssignment.is_active == True,
                    ReportCardTemplateAssignment.is_deleted == False
                )
            )
        )
        
        # Most used template
        most_used_result = await db.execute(
            select(ReportCardTemplate)
            .where(
                and_(
                    ReportCardTemplate.school_owner_id == school_owner_id,
                    ReportCardTemplate.is_deleted == False
                )
            )
            .order_by(desc(ReportCardTemplate.usage_count))
            .limit(1)
        )
        most_used_template = most_used_result.scalar_one_or_none()
        
        return {
            'total_templates': total_templates or 0,
            'active_templates': active_templates or 0,
            'published_templates': published_templates or 0,
            'default_templates': default_templates or 0,
            'total_assignments': total_assignments or 0,
            'active_assignments': active_assignments or 0,
            'most_used_template': {
                'id': most_used_template.id,
                'name': most_used_template.name,
                'usage_count': most_used_template.usage_count
            } if most_used_template else None
        }


class ReportCardTemplateFieldService:
    """Service class for template field operations"""

    @staticmethod
    async def create_field(
        db: AsyncSession,
        template_id: str,
        field_data: ReportCardTemplateFieldCreate,
        school_owner_id: str
    ) -> Optional[ReportCardTemplateField]:
        """Create a new template field"""
        
        # Verify template exists
        template = await ReportCardTemplateService.get_template_by_id(
            db, template_id, school_owner_id
        )
        if not template:
            return None
        
        field_dict = field_data.dict()
        field_dict.update({
            'template_id': template_id,
            'school_id': template.school_id,
            'school_owner_id': school_owner_id
        })
        
        field = ReportCardTemplateField(**field_dict)
        db.add(field)
        await db.commit()
        await db.refresh(field)
        
        return field

    @staticmethod
    async def update_field(
        db: AsyncSession,
        field_id: str,
        field_data: ReportCardTemplateFieldUpdate,
        school_owner_id: str
    ) -> Optional[ReportCardTemplateField]:
        """Update template field"""
        
        result = await db.execute(
            select(ReportCardTemplateField)
            .where(
                and_(
                    ReportCardTemplateField.id == field_id,
                    ReportCardTemplateField.school_owner_id == school_owner_id,
                    ReportCardTemplateField.is_deleted == False
                )
            )
        )
        field = result.scalar_one_or_none()
        
        if not field:
            return None
        
        update_data = field_data.dict(exclude_unset=True)
        for field_name, value in update_data.items():
            setattr(field, field_name, value)
        
        await db.commit()
        await db.refresh(field)
        
        return field

    @staticmethod
    async def delete_field(
        db: AsyncSession,
        field_id: str,
        school_owner_id: str
    ) -> bool:
        """Delete template field"""
        
        result = await db.execute(
            select(ReportCardTemplateField)
            .where(
                and_(
                    ReportCardTemplateField.id == field_id,
                    ReportCardTemplateField.school_owner_id == school_owner_id,
                    ReportCardTemplateField.is_deleted == False
                )
            )
        )
        field = result.scalar_one_or_none()
        
        if not field:
            return False
        
        field.is_deleted = True
        await db.commit()
        
        return True


class ReportCardTemplateAssignmentService:
    """Service class for template assignment operations"""

    @staticmethod
    async def create_assignment(
        db: AsyncSession,
        assignment_data: ReportCardTemplateAssignmentCreate,
        school_id: str,
        school_owner_id: str,
        assigned_by: str
    ) -> Optional[ReportCardTemplateAssignment]:
        """Create template assignment to class"""
        
        # Verify template exists
        template = await ReportCardTemplateService.get_template_by_id(
            db, assignment_data.template_id, school_owner_id
        )
        if not template:
            return None
        
        # Check if class exists
        class_result = await db.execute(
            select(Class).where(
                and_(
                    Class.id == assignment_data.class_id,
                    Class.school_id == school_id,
                    Class.is_deleted == False
                )
            )
        )
        class_obj = class_result.scalar_one_or_none()
        if not class_obj:
            return None
        
        # Check for existing active assignment
        existing_result = await db.execute(
            select(ReportCardTemplateAssignment)
            .where(
                and_(
                    ReportCardTemplateAssignment.class_id == assignment_data.class_id,
                    ReportCardTemplateAssignment.is_active == True,
                    ReportCardTemplateAssignment.is_deleted == False
                )
            )
        )
        existing_assignment = existing_result.scalar_one_or_none()
        
        if existing_assignment:
            # Deactivate existing assignment
            existing_assignment.is_active = False
        
        # Create new assignment
        assignment_dict = assignment_data.dict()
        assignment_dict.update({
            'school_id': school_id,
            'school_owner_id': school_owner_id,
            'assigned_by': assigned_by
        })
        
        assignment = ReportCardTemplateAssignment(**assignment_dict)
        db.add(assignment)
        await db.commit()
        await db.refresh(assignment)
        
        return assignment

    @staticmethod
    async def get_assignments(
        db: AsyncSession,
        school_owner_id: str,
        template_id: Optional[str] = None,
        class_id: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[ReportCardTemplateAssignment]:
        """Get template assignments with filtering"""
        
        conditions = [
            ReportCardTemplateAssignment.school_owner_id == school_owner_id,
            ReportCardTemplateAssignment.is_deleted == False
        ]
        
        if template_id:
            conditions.append(ReportCardTemplateAssignment.template_id == template_id)
        if class_id:
            conditions.append(ReportCardTemplateAssignment.class_id == class_id)
        if is_active is not None:
            conditions.append(ReportCardTemplateAssignment.is_active == is_active)
        
        result = await db.execute(
            select(ReportCardTemplateAssignment)
            .options(
                selectinload(ReportCardTemplateAssignment.template),
                selectinload(ReportCardTemplateAssignment.class_),
                selectinload(ReportCardTemplateAssignment.assigner)
            )
            .where(and_(*conditions))
            .order_by(desc(ReportCardTemplateAssignment.created_at))
        )
        
        return result.scalars().all()

    @staticmethod
    async def update_assignment(
        db: AsyncSession,
        assignment_id: str,
        assignment_data: ReportCardTemplateAssignmentUpdate,
        school_owner_id: str
    ) -> Optional[ReportCardTemplateAssignment]:
        """Update template assignment"""
        
        result = await db.execute(
            select(ReportCardTemplateAssignment)
            .where(
                and_(
                    ReportCardTemplateAssignment.id == assignment_id,
                    ReportCardTemplateAssignment.school_owner_id == school_owner_id,
                    ReportCardTemplateAssignment.is_deleted == False
                )
            )
        )
        assignment = result.scalar_one_or_none()
        
        if not assignment:
            return None
        
        update_data = assignment_data.dict(exclude_unset=True)
        for field_name, value in update_data.items():
            setattr(assignment, field_name, value)
        
        await db.commit()
        await db.refresh(assignment)
        
        return assignment

    @staticmethod
    async def delete_assignment(
        db: AsyncSession,
        assignment_id: str,
        school_owner_id: str
    ) -> bool:
        """Delete template assignment"""
        
        result = await db.execute(
            select(ReportCardTemplateAssignment)
            .where(
                and_(
                    ReportCardTemplateAssignment.id == assignment_id,
                    ReportCardTemplateAssignment.school_owner_id == school_owner_id,
                    ReportCardTemplateAssignment.is_deleted == False
                )
            )
        )
        assignment = result.scalar_one_or_none()
        
        if not assignment:
            return False
        
        assignment.is_deleted = True
        await db.commit()
        
        return True

