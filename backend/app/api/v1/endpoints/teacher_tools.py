"""
Teacher Tools API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import tempfile
import os

from app.core.database import get_db
from app.core.deps import require_teacher, SchoolContext
from app.services.ai_service_factory import get_ai_service
from app.services.material_service import MaterialService
from app.models.teacher_material import MaterialType
from app.schemas.teacher_material import MaterialCreate

logger = logging.getLogger(__name__)

router = APIRouter()


class LessonPlanRequest(BaseModel):
    """Request model for lesson plan generation"""
    subject: str = Field(..., min_length=1, max_length=100, description="Subject name")
    grade_level: str = Field(..., min_length=1, max_length=50, description="Grade level")
    topic: str = Field(..., min_length=1, max_length=200, description="Lesson topic")
    duration: int = Field(..., ge=15, le=240, description="Lesson duration in minutes")
    learning_objectives: str = Field(..., min_length=10, max_length=2000, description="Learning objectives")
    additional_context: Optional[str] = Field(None, max_length=2000, description="Additional context or requirements")
    standards: Optional[str] = Field(None, max_length=1000, description="Educational standards to align with")


class AssignmentRequest(BaseModel):
    """Request model for assignment generation"""
    subject: str = Field(..., min_length=1, max_length=100, description="Subject name")
    grade_level: str = Field(..., min_length=1, max_length=50, description="Grade level")
    topic: str = Field(..., min_length=1, max_length=200, description="Assignment topic")
    assignment_type: str = Field(..., description="Type: essay, project, worksheet, quiz, homework")
    difficulty_level: str = Field(..., description="Difficulty: easy, medium, hard, challenging")
    duration: str = Field(..., min_length=1, max_length=100, description="Duration or length")
    learning_objectives: str = Field(..., min_length=10, max_length=2000, description="Learning objectives")
    additional_context: Optional[str] = Field(None, max_length=2000, description="Additional context")
    standards: Optional[str] = Field(None, max_length=1000, description="Educational standards")


class RubricRequest(BaseModel):
    """Request model for rubric generation"""
    assignment_title: str = Field(..., min_length=1, max_length=200, description="Assignment title")
    subject: str = Field(..., min_length=1, max_length=100, description="Subject name")
    grade_level: str = Field(..., min_length=1, max_length=50, description="Grade level")
    rubric_type: str = Field(..., description="Type: analytic, holistic, single-point")
    criteria_count: int = Field(..., ge=3, le=10, description="Number of criteria")
    performance_levels: int = Field(..., ge=3, le=5, description="Number of performance levels")
    learning_objectives: str = Field(..., min_length=10, max_length=2000, description="Learning objectives")
    additional_context: Optional[str] = Field(None, max_length=2000, description="Additional context")
    
    class Config:
        json_schema_extra = {
            "example": {
                "subject": "Mathematics",
                "grade_level": "Grade 5",
                "topic": "Introduction to Fractions",
                "duration": 45,
                "learning_objectives": "Students will be able to:\n- Understand what fractions represent\n- Identify numerator and denominator\n- Compare simple fractions",
                "additional_context": "Students have basic understanding of division. Include hands-on activities.",
                "standards": "CCSS.MATH.CONTENT.5.NF.A.1"
            }
        }


@router.post("/lesson-planner/generate")
async def generate_lesson_plan(
    subject: str = Form(...),
    grade_level: str = Form(...),
    topic: str = Form(...),
    duration: int = Form(...),
    learning_objectives: str = Form(...),
    additional_context: Optional[str] = Form(None),
    standards: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a lesson plan using AI (Teachers only)

    This endpoint streams the AI-generated lesson plan in real-time.
    Supports optional file uploads for reference materials.
    """
    temp_files = []
    try:
        logger.info(
            f"Teacher {school_context.user.id} generating lesson plan for "
            f"{subject} - {topic} ({grade_level})"
        )

        # Get AI service
        ai_service = get_ai_service()

        # Upload files to AI service if any
        uploaded_file_uris = []
        if files:
            for file in files:
                # Save to temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
                    content = await file.read()
                    temp_file.write(content)
                    temp_file_path = temp_file.name
                    temp_files.append(temp_file_path)

                # Upload to AI service
                try:
                    file_uri = ai_service.upload_file(temp_file_path)
                    uploaded_file_uris.append(file_uri)
                    logger.info(f"Uploaded file {file.filename} to AI service: {file_uri}")
                except Exception as e:
                    logger.error(f"Error uploading file {file.filename}: {str(e)}")

        # Create async generator for streaming
        async def generate():
            try:
                async for chunk in ai_service.generate_lesson_plan_stream(
                    subject=subject,
                    grade_level=grade_level,
                    topic=topic,
                    duration=duration,
                    learning_objectives=learning_objectives,
                    additional_context=additional_context,
                    standards=standards,
                    uploaded_files=uploaded_file_uris if uploaded_file_uris else None
                ):
                    # Send each chunk as it's generated
                    yield chunk
            except Exception as e:
                logger.error(f"Error in streaming: {str(e)}")
                yield f"\n\n[Error: {str(e)}]"

        # Return streaming response
        return StreamingResponse(
            generate(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",  # Disable buffering in nginx
            }
        )

    except Exception as e:
        logger.error(f"Error generating lesson plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate lesson plan: {str(e)}"
        )
    finally:
        # Clean up temporary files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
                logger.info(f"Deleted temporary file: {temp_file}")
            except Exception as e:
                logger.error(f"Error deleting temporary file {temp_file}: {str(e)}")


@router.get("/lesson-planner/health")
async def check_lesson_planner_health(
    school_context: SchoolContext = Depends(require_teacher())
):
    """
    Check if the lesson planner service is available
    """
    try:
        ai_service = get_ai_service()
        return {
            "status": "healthy",
            "service": "lesson_planner",
            "model": ai_service.model
        }
    except Exception as e:
        logger.error(f"Lesson planner health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Lesson planner service unavailable: {str(e)}"
        )


@router.post("/lesson-planner/save")
async def save_lesson_plan(
    title: str = Form(...),
    content: str = Form(...),
    subject: str = Form(...),
    grade_level: str = Form(...),
    topic: str = Form(...),
    folder_id: Optional[str] = Form(None),
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """
    Save a generated lesson plan as a material

    This endpoint saves a lesson plan (markdown content) as a DOCX document material
    and optionally adds it to a specified folder.
    """
    from app.utils.document_converter import markdown_to_docx

    try:
        # Create temporary DOCX file from markdown content
        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as temp_file:
            temp_file_path = temp_file.name

        try:
            # Convert markdown to DOCX
            docx_title = f"{title} - Lesson Plan"
            markdown_to_docx(content, temp_file_path, title=docx_title)

            # Read the DOCX file
            with open(temp_file_path, 'rb') as f:
                file_content = f.read()

            # Create a simple file-like object
            from io import BytesIO
            file_obj = BytesIO(file_content)
            file_obj.name = f"{title}.docx"

            # Create UploadFile manually
            from fastapi import UploadFile as FastAPIUploadFile
            upload_file = FastAPIUploadFile(
                filename=f"{title}.docx",
                file=file_obj
            )

            # Prepare material data
            material_data = MaterialCreate(
                title=title,
                description=f"AI-generated lesson plan for {subject} - {topic}",
                material_type=MaterialType.DOCUMENT,
                subject_id=None,  # Could be enhanced to link to subject
                grade_level=grade_level,
                topic=topic,
                tags=["lesson-plan", "ai-generated", subject.lower()],
                is_published=True
            )

            # Upload the material
            material = await MaterialService.upload_material(
                db,
                upload_file,
                material_data,
                school_context.user.id,
                school_context.school.id
            )

            # Add to folder if specified
            if folder_id:
                await MaterialService.add_material_to_folder(
                    db,
                    folder_id,
                    material.id,
                    school_context.user.id,
                    school_context.school.id
                )

            logger.info(f"Lesson plan saved as material: {material.id} by user {school_context.user.id}")

            return {
                "message": "Lesson plan saved successfully",
                "material_id": material.id,
                "folder_id": folder_id if folder_id else None
            }

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    except Exception as e:
        logger.error(f"Error saving lesson plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save lesson plan: {str(e)}"
        )


# ============================================================================
# Assignment Generator Endpoints
# ============================================================================

@router.post("/assignment-generator/generate")
async def generate_assignment(
    subject: str = Form(...),
    grade_level: str = Form(...),
    topic: str = Form(...),
    assignment_type: str = Form(...),
    difficulty_level: str = Form(...),
    duration: str = Form(...),
    learning_objectives: str = Form(...),
    number_of_questions: Optional[int] = Form(None),
    additional_context: Optional[str] = Form(None),
    standards: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate an assignment using AI with streaming response

    Supports file uploads for reference materials.
    Optionally specify number_of_questions for quizzes, worksheets, etc.
    """
    uploaded_file_uris = []
    temp_files = []

    try:
        # Handle file uploads if any
        if files and len(files) > 0 and files[0].filename:
            ai_service = get_ai_service()

            for file in files:
                # Save to temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
                    content = await file.read()
                    temp_file.write(content)
                    temp_file_path = temp_file.name
                    temp_files.append(temp_file_path)

                # Upload to AI service
                file_uri = ai_service.upload_file(temp_file_path)
                uploaded_file_uris.append(file_uri)
                logger.info(f"Uploaded file to AI service: {file.filename} -> {file_uri}")

        # Generate assignment with streaming
        ai_service = get_ai_service()

        async def generate():
            try:
                async for chunk in ai_service.generate_assignment_stream(
                    subject=subject,
                    grade_level=grade_level,
                    topic=topic,
                    assignment_type=assignment_type,
                    difficulty_level=difficulty_level,
                    duration=duration,
                    learning_objectives=learning_objectives,
                    number_of_questions=number_of_questions,
                    additional_context=additional_context,
                    standards=standards,
                    uploaded_files=uploaded_file_uris if uploaded_file_uris else None
                ):
                    yield chunk
            finally:
                # Clean up temporary files
                for temp_file_path in temp_files:
                    try:
                        if os.path.exists(temp_file_path):
                            os.remove(temp_file_path)
                    except Exception as e:
                        logger.warning(f"Failed to delete temp file {temp_file_path}: {str(e)}")

        return StreamingResponse(
            generate(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no"
            }
        )

    except Exception as e:
        # Clean up on error
        for temp_file_path in temp_files:
            try:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
            except:
                pass

        logger.error(f"Error generating assignment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate assignment: {str(e)}"
        )


@router.get("/assignment-generator/health")
async def assignment_generator_health():
    """Health check for assignment generator"""
    try:
        ai_service = get_ai_service()
        return {
            "status": "healthy",
            "service": "assignment_generator",
            "model": ai_service.model
        }
    except Exception as e:
        logger.error(f"Assignment generator health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Assignment generator service unavailable: {str(e)}"
        )


@router.post("/assignment-generator/save")
async def save_assignment(
    title: str = Form(...),
    content: str = Form(...),
    subject: str = Form(...),
    grade_level: str = Form(...),
    topic: str = Form(...),
    assignment_type: str = Form(...),
    folder_id: Optional[str] = Form(None),
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """Save a generated assignment as a material"""
    from app.utils.document_converter import markdown_to_docx

    try:
        # Create temporary DOCX file from markdown content
        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as temp_file:
            temp_file_path = temp_file.name

        try:
            # Convert markdown to DOCX
            docx_title = f"{title} - {assignment_type.title()} Assignment"
            markdown_to_docx(content, temp_file_path, title=docx_title)

            # Read the DOCX file
            with open(temp_file_path, 'rb') as f:
                file_content = f.read()

            from io import BytesIO
            file_obj = BytesIO(file_content)
            file_obj.name = f"{title}.docx"

            from fastapi import UploadFile as FastAPIUploadFile
            upload_file = FastAPIUploadFile(
                filename=f"{title}.docx",
                file=file_obj
            )

            # Prepare material data
            material_data = MaterialCreate(
                title=title,
                description=f"AI-generated {assignment_type} assignment for {subject} - {topic}",
                material_type=MaterialType.DOCUMENT,
                subject_id=None,
                grade_level=grade_level,
                topic=topic,
                tags=["assignment", "ai-generated", assignment_type.lower(), subject.lower()],
                is_published=True
            )

            # Upload material
            material = await MaterialService.upload_material(
                db,
                upload_file,
                material_data,
                school_context.user.id,
                school_context.school.id
            )

            # Add to folder if specified
            if folder_id:
                await MaterialService.add_material_to_folder(
                    db,
                    folder_id,
                    material.id,
                    school_context.user.id,
                    school_context.school.id
                )

            logger.info(f"Assignment saved as material: {material.id} by user {school_context.user.id}")

            return {
                "message": "Assignment saved successfully",
                "material_id": material.id,
                "folder_id": folder_id if folder_id else None
            }

        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    except Exception as e:
        logger.error(f"Error saving assignment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save assignment: {str(e)}"
        )


# ============================================================================
# Rubric Builder Endpoints
# ============================================================================

@router.post("/rubric-builder/generate")
async def generate_rubric(
    assignment_title: str = Form(...),
    subject: str = Form(...),
    grade_level: str = Form(...),
    rubric_type: str = Form(...),
    criteria_count: int = Form(...),
    performance_levels: int = Form(...),
    learning_objectives: str = Form(...),
    additional_context: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a rubric using Gemini AI with streaming response

    Supports file uploads for assignment descriptions.
    """
    uploaded_file_uris = []
    temp_files = []

    try:
        # Handle file uploads if any
        if files and len(files) > 0 and files[0].filename:
            ai_service = get_ai_service()

            for file in files:
                # Save to temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
                    content = await file.read()
                    temp_file.write(content)
                    temp_file_path = temp_file.name
                    temp_files.append(temp_file_path)

                # Upload to AI service
                file_uri = ai_service.upload_file(temp_file_path)
                uploaded_file_uris.append(file_uri)
                logger.info(f"Uploaded file to AI service: {file.filename} -> {file_uri}")

        # Generate rubric with streaming
        ai_service = get_ai_service()

        async def generate():
            try:
                async for chunk in ai_service.generate_rubric_stream(
                    assignment_title=assignment_title,
                    subject=subject,
                    grade_level=grade_level,
                    rubric_type=rubric_type,
                    criteria_count=criteria_count,
                    performance_levels=performance_levels,
                    learning_objectives=learning_objectives,
                    additional_context=additional_context,
                    uploaded_files=uploaded_file_uris if uploaded_file_uris else None
                ):
                    yield chunk
            finally:
                # Clean up temporary files
                for temp_file_path in temp_files:
                    try:
                        if os.path.exists(temp_file_path):
                            os.remove(temp_file_path)
                    except Exception as e:
                        logger.warning(f"Failed to delete temp file {temp_file_path}: {str(e)}")

        return StreamingResponse(
            generate(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no"
            }
        )

    except Exception as e:
        # Clean up on error
        for temp_file_path in temp_files:
            try:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
            except:
                pass

        logger.error(f"Error generating rubric: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate rubric: {str(e)}"
        )


@router.get("/rubric-builder/health")
async def rubric_builder_health():
    """Health check for rubric builder"""
    try:
        ai_service = get_ai_service()
        return {
            "status": "healthy",
            "service": "rubric_builder",
            "model": ai_service.model
        }
    except Exception as e:
        logger.error(f"Rubric builder health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Rubric builder service unavailable: {str(e)}"
        )


@router.post("/rubric-builder/save")
async def save_rubric(
    title: str = Form(...),
    content: str = Form(...),
    assignment_title: str = Form(...),
    subject: str = Form(...),
    grade_level: str = Form(...),
    rubric_type: str = Form(...),
    folder_id: Optional[str] = Form(None),
    school_context: SchoolContext = Depends(require_teacher()),
    db: AsyncSession = Depends(get_db)
):
    """Save a generated rubric as a material"""
    from app.utils.document_converter import markdown_to_docx

    try:
        # Create temporary DOCX file from markdown content
        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as temp_file:
            temp_file_path = temp_file.name

        try:
            # Convert markdown to DOCX
            docx_title = f"{title} - {rubric_type.title()} Rubric"
            markdown_to_docx(content, temp_file_path, title=docx_title)

            # Read the DOCX file
            with open(temp_file_path, 'rb') as f:
                file_content = f.read()

            from io import BytesIO
            file_obj = BytesIO(file_content)
            file_obj.name = f"{title}.docx"

            from fastapi import UploadFile as FastAPIUploadFile
            upload_file = FastAPIUploadFile(
                filename=f"{title}.docx",
                file=file_obj
            )

            # Prepare material data
            material_data = MaterialCreate(
                title=title,
                description=f"AI-generated {rubric_type} rubric for {assignment_title}",
                material_type=MaterialType.DOCUMENT,
                subject_id=None,
                grade_level=grade_level,
                topic=assignment_title,
                tags=["rubric", "ai-generated", rubric_type.lower(), subject.lower()],
                is_published=True
            )

            # Upload material
            material = await MaterialService.upload_material(
                db,
                upload_file,
                material_data,
                school_context.user.id,
                school_context.school.id
            )

            # Add to folder if specified
            if folder_id:
                await MaterialService.add_material_to_folder(
                    db,
                    folder_id,
                    material.id,
                    school_context.user.id,
                    school_context.school.id
                )

            logger.info(f"Rubric saved as material: {material.id} by user {school_context.user.id}")

            return {
                "message": "Rubric saved successfully",
                "material_id": material.id,
                "folder_id": folder_id if folder_id else None
            }

        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    except Exception as e:
        import traceback
        logger.error(f"Error saving rubric: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save rubric: {str(e)}"
        )
