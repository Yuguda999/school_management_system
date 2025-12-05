"""
Student Goal Schemas for Goal Setting & Progress Tracker (P2.5)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from enum import Enum


class GoalCategory(str, Enum):
    ACADEMIC = "academic"
    ATTENDANCE = "attendance"
    BEHAVIOR = "behavior"
    EXTRACURRICULAR = "extracurricular"
    PERSONAL = "personal"


class GoalStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


# Milestone Schemas
class MilestoneBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    target_date: Optional[date] = None
    order: float = 0


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    target_date: Optional[date] = None
    is_completed: Optional[bool] = None
    order: Optional[float] = None


class MilestoneResponse(MilestoneBase):
    id: str
    goal_id: str
    is_completed: bool
    completed_date: Optional[date] = None

    class Config:
        from_attributes = True


# Goal Schemas
class GoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: GoalCategory = GoalCategory.ACADEMIC
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    subject_id: Optional[str] = None
    term_id: Optional[str] = None
    notes: Optional[str] = None


class GoalCreate(GoalBase):
    milestones: Optional[List[MilestoneCreate]] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[GoalCategory] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    target_unit: Optional[str] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    status: Optional[GoalStatus] = None
    subject_id: Optional[str] = None
    term_id: Optional[str] = None
    notes: Optional[str] = None


class GoalResponse(GoalBase):
    id: str
    student_id: str
    current_value: Optional[float] = None
    status: GoalStatus
    progress_percentage: float
    completed_date: Optional[date] = None
    milestones: List[MilestoneResponse] = []
    subject_name: Optional[str] = None
    term_name: Optional[str] = None

    class Config:
        from_attributes = True


class GoalListResponse(BaseModel):
    items: List[GoalResponse]
    total: int
    active_count: int
    completed_count: int


class GoalProgressUpdate(BaseModel):
    """Update goal progress"""
    current_value: float
    notes: Optional[str] = None


class GoalSummary(BaseModel):
    """Summary of student goals"""
    total_goals: int
    active_goals: int
    completed_goals: int
    abandoned_goals: int
    completion_rate: float
    goals_by_category: dict

