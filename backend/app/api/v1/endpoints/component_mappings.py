from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_teacher, SchoolContext
from app.schemas.component_mapping import (
    ComponentMappingCreate,
    ComponentMappingUpdate,
    ComponentMappingResponse,
    ExamTypeInfo,
    MappingPreview
)
from app.services.component_mapping_service import ComponentMappingService

router = APIRouter()


@router.post("/", response_model=ComponentMappingResponse, status_code=status.HTTP_201_CREATED)
async def create_component_mapping(
    mapping_data: ComponentMappingCreate,
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new component mapping (Teacher only)
    
    Map an exam type to a grade template component for automated calculation.
    """
    current_school = school_context.school
    current_user = school_context.user
    
    # Verify teacher is mapping their own exams
    if mapping_data.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create mappings for your own exams"
        )
    
    mapping = await ComponentMappingService.create_mapping(
        db=db,
        mapping_data=mapping_data,
        school_id=current_school.id
    )
    
    response = ComponentMappingResponse.from_orm(mapping)
    if mapping.component:
        response.component_name = mapping.component.name
        response.component_weight = float(mapping.component.weight)
    
    return response


@router.get("/", response_model=List[ComponentMappingResponse])
async def get_component_mappings(
    subject_id: str = Query(..., description="Subject ID"),
    term_id: str = Query(..., description="Term ID"),
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all component mappings for the current teacher's subject/term
    """
    current_school = school_context.school
    current_user = school_context.user
    
    mappings = await ComponentMappingService.get_teacher_mappings(
        db=db,
        teacher_id=current_user.id,
        subject_id=subject_id,
        term_id=term_id,
        school_id=current_school.id
    )
    
    responses = []
    for mapping in mappings:
        response = ComponentMappingResponse.from_orm(mapping)
        if mapping.component:
            response.component_name = mapping.component.name
            response.component_weight = float(mapping.component.weight)
        responses.append(response)
    
    return responses


@router.put("/{mapping_id}", response_model=ComponentMappingResponse)
async def update_component_mapping(
    mapping_id: str,
    mapping_data: ComponentMappingUpdate,
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a component mapping
    """
    current_school = school_context.school
    
    mapping = await ComponentMappingService.update_mapping(
        db=db,
        mapping_id=mapping_id,
        mapping_data=mapping_data,
        school_id=current_school.id
    )
    
    response = ComponentMappingResponse.from_orm(mapping)
    if mapping.component:
        response.component_name = mapping.component.name
        response.component_weight = float(mapping.component.weight)
    
    return response


@router.delete("/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_component_mapping(
    mapping_id: str,
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a component mapping
    """
    current_school = school_context.school
    
    await ComponentMappingService.delete_mapping(
        db=db,
        mapping_id=mapping_id,
        school_id=current_school.id
    )
    
    return None


@router.get("/exam-types", response_model=List[ExamTypeInfo])
async def get_available_exam_types(
    subject_id: str = Query(..., description="Subject ID"),
    term_id: str = Query(..., description="Term ID"),
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get available exam types with their mapping status
    
    Returns unique exam types from teacher's exams indicating which are already mapped.
    """
    current_school = school_context.school
    current_user = school_context.user
    
    exam_types = await ComponentMappingService.get_available_exam_types(
        db=db,
        teacher_id=current_user.id,
        subject_id=subject_id,
        term_id=term_id,
        school_id=current_school.id
    )
    
    return exam_types


@router.get("/preview", response_model=List[MappingPreview])
async def get_mapping_preview(
    subject_id: str = Query(..., description="Subject ID"),
    term_id: str = Query(..., description="Term ID"),
    template_id: str = Query(..., description="Grade Template ID"),
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """
    Preview how grades will be calculated with current mappings
    
    Shows each template component with mapped exam types and counts.
    """
    current_school = school_context.school
    current_user = school_context.user
    
    preview = await ComponentMappingService.get_mapping_preview(
        db=db,
        teacher_id=current_user.id,
        subject_id=subject_id,
        term_id=term_id,
        template_id=template_id,
        school_id=current_school.id
    )
    
    return preview
