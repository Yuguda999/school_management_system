from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_school_admin,
    get_current_school_context,
    SchoolContext
)
from app.models.user import User
from app.schemas.grade_template import (
    GradeTemplateCreate,
    GradeTemplateUpdate,
    GradeTemplateResponse,
    GradeTemplateSummary
)
from app.services.grade_template_service import GradeTemplateService

router = APIRouter()


@router.post("/", response_model=GradeTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_grade_template(
    template_data: GradeTemplateCreate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new grade template (School Owner/Admin only)
    
    The template must include:
    - Assessment components that sum to 100%
    - Grade scales with no overlaps
    - Optional remark templates
    """
    current_school = school_context.school
    current_user = school_context.user
    
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    try:
        template = await GradeTemplateService.create_grade_template(
            db=db,
            template_data=template_data,
            school_id=current_school.id,
            created_by=current_user.id
        )
        return GradeTemplateResponse.from_orm(template)
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating grade template: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[GradeTemplateResponse])
async def get_grade_templates(
    include_inactive: bool = Query(False, description="Include inactive templates"),
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all grade templates for the current school"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    templates = await GradeTemplateService.get_grade_templates(
        db=db,
        school_id=current_school.id,
        include_inactive=include_inactive
    )
    
    return [GradeTemplateResponse.from_orm(template) for template in templates]


@router.get("/default", response_model=Optional[GradeTemplateResponse])
async def get_default_template(
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get the school's default grade template"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    template = await GradeTemplateService.get_default_template(
        db=db,
        school_id=current_school.id
    )
    
    if not template:
        return None
    
    return GradeTemplateResponse.from_orm(template)


@router.get("/{template_id}", response_model=GradeTemplateResponse)
async def get_grade_template(
    template_id: str,
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get a specific grade template by ID"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    try:
        template = await GradeTemplateService.get_grade_template(
            db=db,
            template_id=template_id,
            school_id=current_school.id
        )
        return GradeTemplateResponse.from_orm(template)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/{template_id}", response_model=GradeTemplateResponse)
async def update_grade_template(
    template_id: str,
    template_data: GradeTemplateUpdate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update a grade template (School Owner/Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    try:
        template = await GradeTemplateService.update_grade_template(
            db=db,
            template_id=template_id,
            school_id=current_school.id,
            template_data=template_data
        )
        return GradeTemplateResponse.from_orm(template)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{template_id}")
async def delete_grade_template(
    template_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete a grade template (School Owner/Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    try:
        await GradeTemplateService.delete_grade_template(
            db=db,
            template_id=template_id,
            school_id=current_school.id
        )
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{template_id}/set-default", response_model=GradeTemplateResponse)
async def set_default_template(
    template_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Set a template as the school's default (School Owner/Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    try:
        template = await GradeTemplateService.set_default_template(
            db=db,
            template_id=template_id,
            school_id=current_school.id
        )
        return GradeTemplateResponse.from_orm(template)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
