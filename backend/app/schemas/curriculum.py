"""
Curriculum Schemas for Curriculum Coverage & Lesson Plan Tracker (P2.3)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum


class CoverageStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


# Curriculum Unit Schemas
class CurriculumUnitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    order: int = 0
    subject_id: str
    class_id: str
    term_id: str
    estimated_hours: Optional[int] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    learning_objectives: List[str] = []
    resources: List[str] = []
    notes: Optional[str] = None


class CurriculumUnitCreate(CurriculumUnitBase):
    pass


class CurriculumUnitUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    order: Optional[int] = None
    coverage_status: Optional[CoverageStatus] = None
    estimated_hours: Optional[int] = None
    actual_hours: Optional[int] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    learning_objectives: Optional[List[str]] = None
    resources: Optional[List[str]] = None
    notes: Optional[str] = None


class CurriculumUnitResponse(CurriculumUnitBase):
    id: str
    coverage_status: CoverageStatus
    actual_hours: Optional[int] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


# Lesson Plan Item Schemas
class LessonPlanItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    curriculum_unit_id: Optional[str] = None
    subject_id: str
    class_id: str
    term_id: str
    scheduled_date: Optional[date] = None
    duration_minutes: Optional[int] = None
    learning_objectives: List[str] = []
    activities: List[Dict[str, Any]] = []
    materials: List[str] = []
    assessment_methods: List[str] = []


class LessonPlanItemCreate(LessonPlanItemBase):
    ai_generated_content: Optional[str] = None


class LessonPlanItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    curriculum_unit_id: Optional[str] = None
    scheduled_date: Optional[date] = None
    duration_minutes: Optional[int] = None
    is_delivered: Optional[bool] = None
    delivered_date: Optional[date] = None
    learning_objectives: Optional[List[str]] = None
    activities: Optional[List[Dict[str, Any]]] = None
    materials: Optional[List[str]] = None
    assessment_methods: Optional[List[str]] = None
    ai_generated_content: Optional[str] = None
    reflection_notes: Optional[str] = None
    student_engagement_rating: Optional[int] = Field(None, ge=1, le=5)


class LessonPlanItemResponse(LessonPlanItemBase):
    id: str
    teacher_id: str
    is_delivered: bool
    delivered_date: Optional[date] = None
    ai_generated_content: Optional[str] = None
    reflection_notes: Optional[str] = None
    student_engagement_rating: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Coverage Analytics Schemas
class CoverageStats(BaseModel):
    total_units: int
    planned: int
    in_progress: int
    completed: int
    skipped: int
    coverage_percentage: float
    total_estimated_hours: int
    total_actual_hours: int


class SubjectCoverage(BaseModel):
    subject_id: str
    subject_name: str
    stats: CoverageStats


class CurriculumCoverageResponse(BaseModel):
    class_id: str
    term_id: str
    overall_stats: CoverageStats
    by_subject: List[SubjectCoverage]
    overdue_units: List[CurriculumUnitResponse]
    upcoming_units: List[CurriculumUnitResponse]

