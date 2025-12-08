from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Any, Dict
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.services.search_service import SearchService

router = APIRouter()

@router.get("/", response_model=Dict[str, List[Dict[str, Any]]])
def search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Universal search endpoint.
    Returns results based on the user's role and permissions.
    """
    # Assuming school_id is available on the user or passed in context. 
    # For school owners/admins/teachers/students, they should belong to a school.
    print(f"DEBUG: Search request - q='{q}', limit={limit}, user={current_user.email}, role={current_user.role}, school={current_user.school_id}")
    
    if not current_user.school_id:
        print("DEBUG: No school_id for user")
        return {"results": []}

    results = SearchService.search_universal(
        db=db,
        query=q,
        user=current_user,
        school_id=current_user.school_id,
        limit=limit
    )
    print(f"DEBUG: Search results: {len(results)} found")
    
    return {"results": results}
