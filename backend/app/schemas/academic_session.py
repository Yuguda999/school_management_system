from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import date, datetime
from app.models.academic_session import SessionStatus


class AcademicSessionBase(BaseModel):
    """Base schema for academic sessions"""
    name: str  # e.g., "2023/2024"
    start_date: date
    end_date: date
    term_count: int = 3  # 2 or 3
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Academic session name cannot be empty')
        # Validate format like "2023/2024" or "2023-2024"
        import re
        pattern = r'^\d{4}[/-]\d{4}$'
        if not re.match(pattern, v.strip()):
            raise ValueError('Academic session must be in format YYYY/YYYY or YYYY-YYYY (e.g., 2023/2024)')

        # Validate that the second year is exactly one year after the first
        years = re.split('[/-]', v.strip())
        if int(years[1]) != int(years[0]) + 1:
            raise ValueError('Academic session must span consecutive years (e.g., 2023/2024)')

        return v.strip()
    
    @validator('term_count')
    def validate_term_count(cls, v):
        if v not in [2, 3]:
            raise ValueError('Term count must be 2 or 3')
        return v
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v


class AcademicSessionCreate(AcademicSessionBase):
    """Schema for creating an academic session"""
    pass


class AcademicSessionUpdate(BaseModel):
    """Schema for updating an academic session"""
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[SessionStatus] = None
    is_current: Optional[bool] = None
    promotion_completed: Optional[bool] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Academic session name cannot be empty')
            import re
            pattern = r'^\d{4}[/-]\d{4}$'
            if not re.match(pattern, v.strip()):
                raise ValueError('Academic session must be in format YYYY/YYYY (e.g., 2023/2024)')
            return v.strip()
        return v


class AcademicSessionResponse(AcademicSessionBase):
    """Schema for academic session response"""
    id: str
    status: SessionStatus
    is_current: bool
    promotion_completed: bool
    school_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TermSummary(BaseModel):
    """Brief summary of a term for inclusion in session responses"""
    id: str
    name: str
    type: str
    sequence_number: int
    is_current: bool
    start_date: date
    end_date: date
    
    class Config:
        from_attributes = True


class AcademicSessionWithTermsResponse(AcademicSessionResponse):
    """Academic session response with included terms"""
    terms: List[TermSummary] = []
    
    class Config:
        from_attributes = True


# ========================
# Promotion Schemas
# ========================

class PromotionCandidate(BaseModel):
    """A student who is a candidate for promotion"""
    student_id: str
    student_name: str
    admission_number: str
    current_class_id: str
    current_class_name: str
    session_average: Optional[float] = None
    promotion_eligible: bool = True
    suggested_action: str = "promote"  # promote, repeat, graduate
    next_class_id: Optional[str] = None
    next_class_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class PromotionDecision(BaseModel):
    """A promotion decision for a single student"""
    student_id: str
    class_history_id: str
    action: str  # promote, repeat, graduate, transfer
    next_class_id: Optional[str] = None  # Required if action is promote or transfer
    remarks: Optional[str] = None
    
    @validator('action')
    def validate_action(cls, v):
        valid_actions = ['promote', 'repeat', 'graduate', 'transfer']
        if v.lower() not in valid_actions:
            raise ValueError(f'Action must be one of: {", ".join(valid_actions)}')
        return v.lower()
    
    @validator('next_class_id')
    def validate_next_class(cls, v, values):
        if values.get('action') in ['promote', 'transfer'] and not v:
            raise ValueError('next_class_id is required for promote and transfer actions')
        return v


class BulkPromotionRequest(BaseModel):
    """Request to execute bulk promotions"""
    session_id: str
    decisions: List[PromotionDecision]
    
    @validator('decisions')
    def validate_decisions(cls, v):
        if not v:
            raise ValueError('At least one promotion decision is required')
        return v


class PromotionPreviewRequest(BaseModel):
    """Request to preview promotions before executing"""
    session_id: str
    class_id: Optional[str] = None  # If None, preview all classes


class PromotionResult(BaseModel):
    """Result for a single student promotion"""
    student_id: str
    student_name: str
    success: bool
    action: str
    from_class: str
    to_class: Optional[str] = None
    error: Optional[str] = None


class BulkPromotionResult(BaseModel):
    """Result of bulk promotion operation"""
    total_processed: int
    successful: int
    failed: int
    promoted: int
    repeated: int
    graduated: int
    transferred: int
    results: List[PromotionResult]


class PromotionPreviewResponse(BaseModel):
    """Preview of promotions before executing"""
    session_id: str
    session_name: str
    total_students: int
    promotable: int
    repeating: int
    graduating: int
    candidates: List[PromotionCandidate]


# ========================
# Session Transition Schemas
# ========================

class SessionTransitionRequest(BaseModel):
    """Request to transition from one session to another"""
    old_session_id: str
    new_session_id: str
    run_promotions: bool = True
    auto_promote: bool = False  # If True, use school's promotion rules


class SessionTransitionResult(BaseModel):
    """Result of session transition"""
    old_session_id: str
    new_session_id: str
    old_session_name: str
    new_session_name: str
    promotions_completed: bool
    promotion_result: Optional[BulkPromotionResult] = None
    students_enrolled_in_new_session: int
    message: str
