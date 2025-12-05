from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import json
from app.core import deps
from app.models.user import User
from app.services.ai_service_factory import get_ai_service

router = APIRouter()

class CBTGenerationRequest(BaseModel):
    subject: str
    topic: str
    difficulty_level: str
    question_count: int = Field(..., ge=1, le=50)
    additional_context: Optional[str] = None

@router.post("/generate", response_model=Dict[str, Any])
async def generate_cbt_test(
    request: CBTGenerationRequest,
    current_user: User = Depends(deps.get_current_active_user),
    ai_service = Depends(get_ai_service)
):
    """
    Generate a CBT test structure using AI
    """
    try:
        json_str = await ai_service.generate_cbt_test_json(
            subject=request.subject,
            topic=request.topic,
            difficulty_level=request.difficulty_level,
            question_count=request.question_count,
            additional_context=request.additional_context
        )
        
        # Parse JSON to ensure it's valid before returning
        try:
            test_data = json.loads(json_str)
            return test_data
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI generated invalid JSON. Please try again."
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
