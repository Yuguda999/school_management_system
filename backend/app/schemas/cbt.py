"""CBT (Computer-Based Testing) schemas"""
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime
from decimal import Decimal


# Question Option Schemas
class CBTQuestionOptionBase(BaseModel):
    option_label: str = Field(..., description="Option label (A, B, C, D)")
    option_text: str = Field(..., description="Option text")
    is_correct: bool = Field(default=False, description="Whether this is the correct answer")
    order_number: int = Field(..., description="Display order")


class CBTQuestionOptionCreate(CBTQuestionOptionBase):
    pass


class CBTQuestionOptionUpdate(BaseModel):
    option_label: Optional[str] = None
    option_text: Optional[str] = None
    is_correct: Optional[bool] = None
    order_number: Optional[int] = None


class CBTQuestionOptionResponse(CBTQuestionOptionBase):
    id: str
    question_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Question Schemas
class CBTQuestionBase(BaseModel):
    question_text: str = Field(..., description="Question text")
    question_type: str = Field(default="multiple_choice", description="Question type")
    points: Decimal = Field(default=1.0, description="Points for this question")
    order_number: int = Field(..., description="Question order in test")
    image_url: Optional[str] = None
    media_url: Optional[str] = None


class CBTQuestionCreate(CBTQuestionBase):
    options: List[CBTQuestionOptionCreate] = Field(..., min_length=2, max_length=6)

    @field_validator('options')
    @classmethod
    def validate_options(cls, v):
        if len(v) < 2:
            raise ValueError('At least 2 options are required')
        correct_count = sum(1 for opt in v if opt.is_correct)
        if correct_count != 1:
            raise ValueError('Exactly one option must be marked as correct')
        return v


class CBTQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    points: Optional[Decimal] = None
    order_number: Optional[int] = None
    image_url: Optional[str] = None
    media_url: Optional[str] = None
    options: Optional[List[CBTQuestionOptionCreate]] = None

    @field_validator('options')
    @classmethod
    def validate_options(cls, v):
        if v is not None:
            if len(v) < 2:
                raise ValueError('At least 2 options are required')
            correct_count = sum(1 for opt in v if opt.is_correct)
            if correct_count != 1:
                raise ValueError('Exactly one option must be marked as correct')
        return v


class CBTQuestionResponse(CBTQuestionBase):
    id: str
    test_id: str
    options: List[CBTQuestionOptionResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Test Schemas
class CBTTestBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    subject_id: str
    grade_level: Optional[str] = None
    duration_minutes: int = Field(..., gt=0, description="Test duration in minutes")
    pass_percentage: Decimal = Field(default=50.0, ge=0, le=100)
    randomize_questions: bool = Field(default=False)
    randomize_options: bool = Field(default=False)
    allow_multiple_attempts: bool = Field(default=False)
    max_attempts: int = Field(default=1, ge=1)
    show_results_immediately: bool = Field(default=True)
    show_correct_answers: bool = Field(default=False)


class CBTTestCreate(CBTTestBase):
    questions: Optional[List[CBTQuestionCreate]] = Field(default=[], description="Questions for the test")


class CBTTestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    subject_id: Optional[str] = None
    grade_level: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    pass_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    randomize_questions: Optional[bool] = None
    randomize_options: Optional[bool] = None
    allow_multiple_attempts: Optional[bool] = None
    max_attempts: Optional[int] = Field(None, ge=1)
    show_results_immediately: Optional[bool] = None
    show_correct_answers: Optional[bool] = None
    status: Optional[str] = None


class CBTTestResponse(CBTTestBase):
    id: str
    status: str
    total_points: Decimal
    created_by: str
    school_id: str
    created_at: datetime
    updated_at: datetime
    questions: List[CBTQuestionResponse] = []
    question_count: Optional[int] = None

    class Config:
        from_attributes = True


# Test Schedule Schemas
class CBTTestScheduleBase(BaseModel):
    start_datetime: datetime
    end_datetime: datetime
    class_id: Optional[str] = None
    student_ids: Optional[List[str]] = None

    @model_validator(mode='after')
    def validate_schedule(self):
        # Validate end_datetime is after start_datetime
        if self.end_datetime <= self.start_datetime:
            raise ValueError('End datetime must be after start datetime')

        # At least one of class_id or student_ids must be provided
        if not self.class_id and not self.student_ids:
            raise ValueError('Either class_id or student_ids must be provided')

        return self


class CBTTestScheduleCreate(CBTTestScheduleBase):
    test_id: str


class CBTTestScheduleUpdate(BaseModel):
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    class_id: Optional[str] = None
    student_ids: Optional[List[str]] = None


class CBTTestScheduleResponse(CBTTestScheduleBase):
    id: str
    test_id: str
    school_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Answer Schemas
class CBTAnswerBase(BaseModel):
    question_id: str
    selected_option_id: Optional[str] = None


class CBTAnswerCreate(CBTAnswerBase):
    pass


class CBTAnswerUpdate(BaseModel):
    selected_option_id: Optional[str] = None


class CBTAnswerResponse(CBTAnswerBase):
    id: str
    submission_id: str
    is_correct: Optional[bool] = None
    points_earned: Optional[Decimal] = None
    answered_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Submission Schemas
class CBTSubmissionBase(BaseModel):
    test_id: str
    schedule_id: str


class CBTSubmissionCreate(CBTSubmissionBase):
    pass


class CBTSubmissionStart(BaseModel):
    """Schema for starting a test"""
    pass


class CBTSubmissionSubmit(BaseModel):
    """Schema for submitting a test"""
    answers: List[CBTAnswerCreate]


class StudentBasicInfo(BaseModel):
    """Basic student info for submissions"""
    id: str
    admission_number: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None

    class Config:
        from_attributes = True


class CBTSubmissionResponse(CBTSubmissionBase):
    id: str
    student_id: str
    status: str
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None
    total_score: Optional[Decimal] = None
    total_possible: Optional[Decimal] = None
    percentage: Optional[Decimal] = None
    passed: Optional[bool] = None
    attempt_number: int
    school_id: str
    created_at: datetime
    updated_at: datetime
    answers: List[CBTAnswerResponse] = []
    student: Optional[StudentBasicInfo] = None

    class Config:
        from_attributes = True


# List Response Schemas
class CBTTestListResponse(BaseModel):
    tests: List[CBTTestResponse]
    total: int
    page: int
    size: int


class CBTScheduleListResponse(BaseModel):
    schedules: List[CBTTestScheduleResponse]
    total: int
    page: int
    size: int


class CBTSubmissionListResponse(BaseModel):
    submissions: List[CBTSubmissionResponse]
    total: int
    page: int
    size: int


# Student Test View (without answers for taking test)
class CBTQuestionOptionForStudent(BaseModel):
    """Option schema for students (no correct answer info)"""
    id: str
    option_label: str
    option_text: str
    order_number: int

    class Config:
        from_attributes = True


class CBTQuestionForStudent(BaseModel):
    """Question schema for students taking test (no correct answer info)"""
    id: str
    question_text: str
    points: Decimal
    order_number: int
    image_url: Optional[str] = None
    media_url: Optional[str] = None
    options: List[CBTQuestionOptionForStudent]

    class Config:
        from_attributes = True


class CBTTestForStudent(BaseModel):
    """Test schema for students (without correct answers)"""
    id: str
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_minutes: int
    total_points: Decimal
    question_count: int
    questions: List[CBTQuestionForStudent] = []

    class Config:
        from_attributes = True
