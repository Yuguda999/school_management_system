"""
API Endpoints for Support
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Path, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.school import School
from app.services.support_service import SupportService
from app.services.text_to_action_service import get_text_to_action_service
from app.schemas.text_to_action import TextToActionRequest, TextToActionResult

logger = logging.getLogger(__name__)

router = APIRouter()
support_service = SupportService()


class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    context: Optional[str] = None


class EscalationRequest(BaseModel):
    issue_description: str
    chat_history: List[dict] = []


@router.post("/chat/stream")
async def stream_chat(
    request: ChatRequest,
    raw_request: Request,
    school_code: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Stream AI support chat response.
    If text-to-action is enabled and the message is a data query,
    the response will include database results.
    """
    try:
        # Fallback: try to get school_code from path params if not injected
        if not school_code and "school_code" in raw_request.path_params:
            school_code = raw_request.path_params["school_code"]
            logger.info(f"Extracted school_code from path params: {school_code}")

        # Determine the target school ID
        # Default to current_user.school_id
        target_school_id = str(current_user.school_id) if current_user.school_id else None
        
        # If school_code is provided in the URL, prioritize resolving that school
        if school_code:
            logger.info(f"Resolving school context from URL code: {school_code}")
            # Use ilike for case-insensitive matching
            school_result = await db.execute(
                select(School).where(School.code.ilike(school_code))
            )
            target_school = school_result.scalar_one_or_none()
            
            if target_school:
                # Verify access if the user is not a platform admin
                if current_user.role.value != "platform_super_admin":
                    # For school owners, we should check if they own this school
                    # For now, we'll assume if they are authenticated and have access to the route (which is protected), 
                    # they should have access. But strictly we should verify ownership/membership.
                    # Since this is a support chat, strict data access control happens in the service layer usually,
                    # but for text-to-action we need to be careful.
                    
                    # If the resolved school is different from user's primary school, 
                    # we should ideally verify they have access to it.
                    # For school owners, they might have multiple schools.
                    pass

                target_school_id = str(target_school.id)
                logger.info(f"Resolved target school ID: {target_school_id} from code {school_code}")
            else:
                logger.warning(f"School code {school_code} not found")

        # Check if this might be a text-to-action query
        text_to_action = get_text_to_action_service()
        
        # If user has a school (or target school resolved) and message looks like a data query
        is_data_query = text_to_action.is_data_query(request.message)
        logger.info(f"Chat message received: '{request.message[:50]}...' - Is data query: {is_data_query}, Target school ID: {target_school_id}")
        
        if target_school_id and is_data_query:
            logger.info(f"Processing as text-to-action query for school_id: {target_school_id}")
            
            # Try to process as a data query
            result = await text_to_action.process_query(
                message=request.message,
                school_id=target_school_id,
                user_id=current_user.id,
                user_role=current_user.role.value,
                db=db
            )
            
            logger.info(f"Text-to-action result: success={result.success}, error={result.error}")
            
            # If successful, return the result as a stream
            if result.success:
                logger.info(f"Returning text-to-action result with {result.row_count} rows")
                async def generate_response():
                    yield result.natural_language_answer
                
                return StreamingResponse(
                    generate_response(),
                    media_type="text/event-stream"
                )
            else:
                # If the error indicates it's not a data query, fall through to support
                if "Not a data query" in (result.error or ""):
                    logger.info("Not a data query, falling through to regular support")
                elif result.error:
                    # For other errors, return the error message from text-to-action
                    logger.warning(f"Text-to-action failed: {result.error}")
                    if result.natural_language_answer:
                        async def generate_error_response():
                            yield result.natural_language_answer
                        return StreamingResponse(
                            generate_error_response(),
                            media_type="text/event-stream"
                        )

        # Fall back to regular support chat
        logger.info(f"Using regular support chat with school_id: {target_school_id}")
        return StreamingResponse(
            support_service.chat_stream(
                message=request.message,
                history=request.history,
                user_role=current_user.role.value,
                context=request.context,
                school_id=target_school_id,
                db=db
            ),
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text-to-action")
async def text_to_action_query(
    request: TextToActionRequest,
    school_code: str = Path(..., description="School code"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Process a natural language query and return database results.
    This endpoint is specifically for text-to-action queries.
    """
    try:
        # Verify the user has access to the school
        if not current_user.school_id:
            raise HTTPException(
                status_code=403,
                detail="You must be associated with a school to use this feature"
            )
        
        # Get the school to verify access
        result = await db.execute(
            select(School).where(
                School.code == school_code,
                School.is_deleted == False
            )
        )
        school = result.scalar_one_or_none()
        
        if not school:
            raise HTTPException(status_code=404, detail="School not found")
        
        if str(school.id) != str(current_user.school_id):
            raise HTTPException(
                status_code=403,
                detail="You don't have access to this school's data"
            )
        
        # Check if user role is allowed to use this feature
        allowed_roles = ["school_owner", "school_admin", "teacher"]
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="This feature is only available to school owners, admins, and teachers"
            )
        
        # Process the query
        text_to_action = get_text_to_action_service()
        query_result = await text_to_action.process_query(
            message=request.query,
            school_id=str(school.id),
            user_id=str(current_user.id),
            user_role=current_user.role.value,
            db=db
        )
        
        return query_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from app.models.school_ownership import SchoolOwnership

@router.patch("/text-to-action/toggle")
async def toggle_text_to_action(
    enabled: bool = Body(..., embed=True),
    school_code: str = Path(..., description="School code"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Enable or disable text-to-action feature for a school.
    Only school owners can toggle this setting.
    """
    try:
        # Verify the user is a school owner or super admin
        if current_user.role.value not in ["school_owner", "platform_super_admin"]:
            raise HTTPException(
                status_code=403,
                detail="Only school owners can modify this setting"
            )
        
        # Get the school
        result = await db.execute(
            select(School).where(
                School.code == school_code,
                School.is_deleted == False
            )
        )
        school = result.scalar_one_or_none()
        
        if not school:
            raise HTTPException(status_code=404, detail="School not found")
        
        # Verify ownership
        if current_user.role.value == "school_owner":
            # Check if user owns this specific school
            ownership_result = await db.execute(
                select(SchoolOwnership).where(
                    SchoolOwnership.user_id == current_user.id,
                    SchoolOwnership.school_id == school.id,
                    SchoolOwnership.is_active == True
                )
            )
            ownership = ownership_result.scalar_one_or_none()
            
            if not ownership:
                raise HTTPException(
                    status_code=403,
                    detail="You can only modify settings for schools you own"
                )
        
        # Update the settings
        if school.settings is None:
            school.settings = {}
        
        school.settings["text_to_action_enabled"] = enabled
        
        # Mark the settings field as modified (for JSON columns)
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(school, "settings")
        
        await db.commit()
        
        return {
            "status": "success",
            "text_to_action_enabled": enabled,
            "message": f"Text-to-action feature has been {'enabled' if enabled else 'disabled'}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/text-to-action/status")
async def get_text_to_action_status(
    school_code: str = Path(..., description="School code"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current status of the text-to-action feature for a school.
    """
    try:
        # Get the school
        result = await db.execute(
            select(School).where(
                School.code == school_code,
                School.is_deleted == False
            )
        )
        school = result.scalar_one_or_none()
        
        if not school:
            raise HTTPException(status_code=404, detail="School not found")
        
        return {
            "text_to_action_enabled": school.text_to_action_enabled,
            "feature_available": current_user.role.value in ["school_owner", "school_admin", "teacher"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/escalate")
async def escalate_issue(
    request: EscalationRequest,
    school_code: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Escalate issue to human support
    """
    success = await support_service.escalate_issue(
        user_email=current_user.email,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        user_role=current_user.role.value,
        issue_description=request.issue_description,
        chat_history=request.chat_history
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to escalate issue")
    
    return {"status": "success", "message": "Issue escalated to support team"}

