from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select

from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    get_current_school,
    SchoolContext
)
from app.models.user import User, UserRole
from app.models.school import School
from app.models.school_ownership import SchoolOwnership
from app.models.report_card_template import ReportCardTemplate
from app.schemas.report_card_template import (
    ReportCardTemplateCreate,
    ReportCardTemplateUpdate,
    ReportCardTemplateResponse,
    ReportCardTemplateListResponse,
    ReportCardTemplateFieldCreate,
    ReportCardTemplateFieldUpdate,
    ReportCardTemplateFieldResponse,
    ReportCardTemplateAssignmentCreate,
    ReportCardTemplateAssignmentUpdate,
    ReportCardTemplateAssignmentResponse,
    ReportCardTemplateCloneRequest,
    ReportCardTemplatePreviewRequest,
    ReportCardTemplatePreviewResponse,
    ReportCardTemplateStatistics,
    TemplateValidationResult
)
from app.services.report_card_template_service import (
    ReportCardTemplateService,
    ReportCardTemplateFieldService,
    ReportCardTemplateAssignmentService
)

router = APIRouter()


def require_school_owner():
    """Dependency to require school owner role"""
    async def _require_school_owner(
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        if current_user.role != UserRole.SCHOOL_OWNER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only school owners can manage report card templates"
            )
        
        # Verify school ownership
        ownership_result = await db.execute(
            select(SchoolOwnership).where(
                and_(
                    SchoolOwnership.user_id == current_user.id,
                    SchoolOwnership.is_active == True
                )
            )
        )
        ownership = ownership_result.scalars().first()
        
        if not ownership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a school owner to access this feature"
            )
        
        return current_user
    
    return _require_school_owner


# Template Management Endpoints
@router.post("/", response_model=ReportCardTemplateResponse)
async def create_template(
    template_data: ReportCardTemplateCreate,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new report card template (School Owner only)"""
    
    # Validate template configuration
    validation_result = await ReportCardTemplateService.validate_template(template_data)
    if not validation_result.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Template validation failed",
                "errors": [error.dict() for error in validation_result.errors],
                "warnings": [warning.dict() for warning in validation_result.warnings]
            }
        )
    
    template = await ReportCardTemplateService.create_template(
        db, template_data, school.id, current_user.id
    )
    
    # Reload template with relationships
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(ReportCardTemplate)
        .options(
            selectinload(ReportCardTemplate.fields),
            selectinload(ReportCardTemplate.school_owner)
        )
        .where(ReportCardTemplate.id == template.id)
    )
    template = result.scalar_one()
    
    # Manually construct response to handle created_by field
    response_data = {
        **template_data.dict(exclude={'fields'}),
        'id': template.id,
        'school_id': template.school_id,
        'created_by': template.school_owner_id,
        'usage_count': template.usage_count,
        'last_used': template.last_used,
        'created_at': template.created_at,
        'updated_at': template.updated_at,
        'creator_name': template.school_owner.full_name if template.school_owner else None,
        'fields': [ReportCardTemplateFieldResponse.from_orm(field) for field in template.fields],
        'assignments_count': 0
    }
    
    return ReportCardTemplateResponse(**response_data)



@router.get("/", response_model=List[ReportCardTemplateListResponse])
async def get_templates(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get report card templates with filtering"""
    
    # Only school owners can see all templates, others see only published ones
    if current_user.role != UserRole.SCHOOL_OWNER:
        is_published = True
    
    # Pass owner_id only for school owners, None for others (to see school templates)
    owner_id = current_user.id if current_user.role == UserRole.SCHOOL_OWNER else None
    
    skip = (page - 1) * size
    templates = await ReportCardTemplateService.get_templates(
        db, owner_id, school.id, is_active, is_published, search, skip, size
    )
    
    response_templates = []
    for template in templates:
        template_response = ReportCardTemplateListResponse.from_orm(template)
        if template.school_owner:
            template_response.creator_name = template.school_owner.full_name
        
        # Count assignments
        assignments = await ReportCardTemplateAssignmentService.get_assignments(
            db, current_user.id, template_id=template.id
        )
        template_response.assignments_count = len(assignments)
        
        response_templates.append(template_response)
    
    return response_templates


@router.get("/{template_id}", response_model=ReportCardTemplateResponse)
async def get_template(
    template_id: str,
    current_user: User = Depends(get_current_active_user),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get template by ID with full details"""
    
    # Load template with relationships
    from sqlalchemy.orm import selectinload
    
    # Build query based on user role
    if current_user.role == UserRole.SCHOOL_OWNER:
        # School owners can see their own templates
        query = select(ReportCardTemplate).options(
            selectinload(ReportCardTemplate.fields),
            selectinload(ReportCardTemplate.school_owner)
        ).where(
            and_(
                ReportCardTemplate.id == template_id,
                ReportCardTemplate.school_owner_id == current_user.id,
                ReportCardTemplate.is_deleted == False
            )
        )
    else:
        # Teachers can see any template from their school (for class-assigned templates)
        query = select(ReportCardTemplate).options(
            selectinload(ReportCardTemplate.fields),
            selectinload(ReportCardTemplate.school_owner)
        ).where(
            and_(
                ReportCardTemplate.id == template_id,
                ReportCardTemplate.school_id == school.id,
                ReportCardTemplate.is_deleted == False
            )
        )
    
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Count assignments
    assignments = await ReportCardTemplateAssignmentService.get_assignments(
        db, current_user.id, template_id=template.id
    )
    
    # Manually construct response
    response_data = {
        'id': template.id,
        'name': template.name,
        'description': template.description,
        'version': template.version,
        'paper_size': template.paper_size,
        'orientation': template.orientation,
        'page_margin_top': template.page_margin_top,
        'page_margin_bottom': template.page_margin_bottom,
        'page_margin_left': template.page_margin_left,
        'page_margin_right': template.page_margin_right,
        'background_color': template.background_color,
        'background_image_url': template.background_image_url,
        'default_font_family': template.default_font_family,
        'default_font_size': template.default_font_size,
        'default_text_color': template.default_text_color,
        'default_line_height': template.default_line_height,
        'is_active': template.is_active,
        'is_default': template.is_default,
        'is_published': template.is_published,
        'school_id': template.school_id,
        'created_by': template.school_owner_id,
        'usage_count': template.usage_count,
        'last_used': template.last_used,
        'created_at': template.created_at,
        'updated_at': template.updated_at,
        'creator_name': template.school_owner.full_name if template.school_owner else None,
        'fields': [ReportCardTemplateFieldResponse.from_orm(field) for field in template.fields],
        'assignments_count': len(assignments)
    }
    
    return ReportCardTemplateResponse(**response_data)


@router.put("/{template_id}", response_model=ReportCardTemplateResponse)
async def update_template(
    template_id: str,
    template_data: ReportCardTemplateUpdate,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update template (School Owner only)"""
    
    template = await ReportCardTemplateService.update_template(
        db, template_id, template_data, current_user.id
    )
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Reload template with relationships
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(ReportCardTemplate)
        .options(
            selectinload(ReportCardTemplate.fields),
            selectinload(ReportCardTemplate.school_owner)
        )
        .where(ReportCardTemplate.id == template.id)
    )
    template = result.scalar_one()
    
    # Count assignments
    assignments = await ReportCardTemplateAssignmentService.get_assignments(
        db, current_user.id, template_id=template.id
    )
    
    # Manually construct response
    response_data = {
        'id': template.id,
        'name': template.name,
        'description': template.description,
        'version': template.version,
        'paper_size': template.paper_size,
        'orientation': template.orientation,
        'page_margin_top': template.page_margin_top,
        'page_margin_bottom': template.page_margin_bottom,
        'page_margin_left': template.page_margin_left,
        'page_margin_right': template.page_margin_right,
        'background_color': template.background_color,
        'background_image_url': template.background_image_url,
        'default_font_family': template.default_font_family,
        'default_font_size': template.default_font_size,
        'default_text_color': template.default_text_color,
        'default_line_height': template.default_line_height,
        'is_active': template.is_active,
        'is_default': template.is_default,
        'is_published': template.is_published,
        'school_id': template.school_id,
        'created_by': template.school_owner_id,
        'usage_count': template.usage_count,
        'last_used': template.last_used,
        'created_at': template.created_at,
        'updated_at': template.updated_at,
        'creator_name': template.school_owner.full_name if template.school_owner else None,
        'fields': [ReportCardTemplateFieldResponse.from_orm(field) for field in template.fields],
        'assignments_count': len(assignments)
    }
    
    return ReportCardTemplateResponse(**response_data)


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete template (School Owner only)"""
    
    success = await ReportCardTemplateService.delete_template(
        db, template_id, current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"message": "Template deleted successfully"}


@router.post("/{template_id}/clone", response_model=ReportCardTemplateResponse)
async def clone_template(
    template_id: str,
    clone_data: ReportCardTemplateCloneRequest,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Clone an existing template (School Owner only)"""
    
    template = await ReportCardTemplateService.clone_template(
        db, template_id, clone_data, school.id, current_user.id
    )
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    response = ReportCardTemplateResponse.from_orm(template)
    if template.school_owner:
        response.creator_name = template.school_owner.full_name
    
    # Convert fields to response format
    response.fields = [
        ReportCardTemplateFieldResponse.from_orm(field) for field in template.fields
    ]
    
    return response


@router.post("/{template_id}/set-default")
async def set_default_template(
    template_id: str,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Set template as default (School Owner only)"""
    
    success = await ReportCardTemplateService.set_default_template(
        db, template_id, current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"message": "Template set as default successfully"}


@router.post("/validate", response_model=TemplateValidationResult)
async def validate_template(
    template_data: ReportCardTemplateCreate,
    current_user: User = Depends(require_school_owner()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Validate template configuration (School Owner only)"""
    
    return await ReportCardTemplateService.validate_template(template_data)


@router.get("/statistics", response_model=ReportCardTemplateStatistics)
async def get_template_statistics(
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get template usage statistics (School Owner only)"""
    
    stats = await ReportCardTemplateService.get_template_statistics(
        db, current_user.id
    )
    
    return ReportCardTemplateStatistics(**stats)


# Template Field Management Endpoints
@router.post("/{template_id}/fields", response_model=ReportCardTemplateFieldResponse)
async def create_template_field(
    template_id: str,
    field_data: ReportCardTemplateFieldCreate,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new template field (School Owner only)"""
    
    field = await ReportCardTemplateFieldService.create_field(
        db, template_id, field_data, current_user.id
    )
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return ReportCardTemplateFieldResponse.from_orm(field)


@router.put("/fields/{field_id}", response_model=ReportCardTemplateFieldResponse)
async def update_template_field(
    field_id: str,
    field_data: ReportCardTemplateFieldUpdate,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update template field (School Owner only)"""
    
    field = await ReportCardTemplateFieldService.update_field(
        db, field_id, field_data, current_user.id
    )
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    return ReportCardTemplateFieldResponse.from_orm(field)


@router.delete("/fields/{field_id}")
async def delete_template_field(
    field_id: str,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete template field (School Owner only)"""
    
    success = await ReportCardTemplateFieldService.delete_field(
        db, field_id, current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    return {"message": "Field deleted successfully"}


# Template Assignment Management Endpoints
@router.post("/assignments", response_model=ReportCardTemplateAssignmentResponse)
async def create_template_assignment(
    assignment_data: ReportCardTemplateAssignmentCreate,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Assign template to class (School Owner only)"""
    
    assignment = await ReportCardTemplateAssignmentService.create_assignment(
        db, assignment_data, school.id, current_user.id, current_user.id
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template or class not found"
        )
    
    response = ReportCardTemplateAssignmentResponse.from_orm(assignment)
    if assignment.template:
        response.template_name = assignment.template.name
    if assignment.class_:
        response.class_name = assignment.class_.name
    if assignment.assigner:
        response.assigner_name = assignment.assigner.full_name
    
    return response


@router.get("/assignments", response_model=List[ReportCardTemplateAssignmentResponse])
async def get_template_assignments(
    template_id: Optional[str] = Query(None, description="Filter by template"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get template assignments (School Owner only)"""
    
    assignments = await ReportCardTemplateAssignmentService.get_assignments(
        db, current_user.id, template_id, class_id, is_active
    )
    
    response_assignments = []
    for assignment in assignments:
        response = ReportCardTemplateAssignmentResponse.from_orm(assignment)
        if assignment.template:
            response.template_name = assignment.template.name
        if assignment.class_:
            response.class_name = assignment.class_.name
        if assignment.assigner:
            response.assigner_name = assignment.assigner.full_name
        
        response_assignments.append(response)
    
    return response_assignments


@router.put("/assignments/{assignment_id}", response_model=ReportCardTemplateAssignmentResponse)
async def update_template_assignment(
    assignment_id: str,
    assignment_data: ReportCardTemplateAssignmentUpdate,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update template assignment (School Owner only)"""
    
    assignment = await ReportCardTemplateAssignmentService.update_assignment(
        db, assignment_id, assignment_data, current_user.id
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    response = ReportCardTemplateAssignmentResponse.from_orm(assignment)
    if assignment.template:
        response.template_name = assignment.template.name
    if assignment.class_:
        response.class_name = assignment.class_.name
    if assignment.assigner:
        response.assigner_name = assignment.assigner.full_name
    
    return response


@router.delete("/assignments/{assignment_id}")
async def delete_template_assignment(
    assignment_id: str,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete template assignment (School Owner only)"""
    
    success = await ReportCardTemplateAssignmentService.delete_assignment(
        db, assignment_id, current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    return {"message": "Assignment deleted successfully"}


# Preview and Export Endpoints
@router.post("/{template_id}/preview", response_model=ReportCardTemplatePreviewResponse)
async def preview_template(
    template_id: str,
    preview_data: ReportCardTemplatePreviewRequest,
    current_user: User = Depends(require_school_owner()),
    school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Generate template preview (School Owner only)"""
    
    template = await ReportCardTemplateService.get_template_by_id(
        db, template_id, current_user.id
    )
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # TODO: Implement preview generation
    # This would generate HTML/CSS preview of the template with sample data
    preview_html = f"<div>Preview for template: {template.name}</div>"
    preview_css = "/* Template styles would be generated here */"
    preview_data_dict = {"template_id": template_id, "preview_mode": True}
    
    return ReportCardTemplatePreviewResponse(
        preview_html=preview_html,
        preview_css=preview_css,
        preview_data=preview_data_dict
    )

