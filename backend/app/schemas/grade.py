from typing import Optional, List, Dict, Any
from pydantic import BaseModel, validator, Field
from datetime import date, datetime
from decimal import Decimal
from app.models.grade import ExamType, GradeScale


class ExamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    exam_type: ExamType
    exam_date: date
    start_time: Optional[str] = Field(None, pattern=r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
    duration_minutes: Optional[int] = Field(None, ge=1, le=480)  # Max 8 hours
    total_marks: Decimal = Field(..., ge=0, le=1000)
    pass_marks: Decimal = Field(..., ge=0, le=1000)
    subject_id: str
    class_id: str
    term_id: str
    instructions: Optional[str] = None
    venue: Optional[str] = Field(None, max_length=100)
    
    @validator('pass_marks')
    def validate_pass_marks(cls, v, values):
        if 'total_marks' in values and v > values['total_marks']:
            raise ValueError('Pass marks cannot be greater than total marks')
        return v


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    exam_type: Optional[ExamType] = None
    exam_date: Optional[date] = None
    start_time: Optional[str] = Field(None, pattern=r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
    duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    total_marks: Optional[Decimal] = Field(None, ge=0, le=1000)
    pass_marks: Optional[Decimal] = Field(None, ge=0, le=1000)
    instructions: Optional[str] = None
    venue: Optional[str] = Field(None, max_length=100)
    is_published: Optional[bool] = None
    is_active: Optional[bool] = None


class ExamResponse(ExamBase):
    id: str
    is_published: bool
    is_active: bool
    created_by: str
    creator_name: Optional[str] = None
    subject_name: Optional[str] = None
    class_name: Optional[str] = None
    term_name: Optional[str] = None
    total_students: Optional[int] = None
    graded_students: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class GradeBase(BaseModel):
    score: float = Field(..., ge=0, le=1000)
    total_marks: float = Field(..., ge=0, le=1000)
    student_id: str
    subject_id: str
    exam_id: str
    term_id: str
    remarks: Optional[str] = None
    
    @validator('score')
    def validate_score(cls, v, values):
        if 'total_marks' in values and v > values['total_marks']:
            raise ValueError('Score cannot be greater than total marks')
        return v


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    score: Optional[Decimal] = Field(None, ge=0, le=1000)
    remarks: Optional[str] = None
    is_published: Optional[bool] = None


class GradeResponse(GradeBase):
    id: str
    percentage: float
    grade: Optional[GradeScale] = None
    graded_by: str
    graded_date: date
    is_published: bool
    grader_name: Optional[str] = None
    student_name: Optional[str] = None
    subject_name: Optional[str] = None
    exam_name: Optional[str] = None
    exam_type: Optional[ExamType] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BulkGradeCreate(BaseModel):
    exam_id: str
    grades: List[Dict[str, Any]] = Field(..., description="List of grade data with student_id and score")
    
    @validator('grades')
    def validate_grades(cls, v):
        if not v:
            raise ValueError('At least one grade must be provided')
        
        for grade in v:
            if 'student_id' not in grade or 'score' not in grade:
                raise ValueError('Each grade must have student_id and score')
            
            if not isinstance(grade['score'], (int, float, Decimal)):
                raise ValueError('Score must be a number')
                
            if grade['score'] < 0:
                raise ValueError('Score cannot be negative')
        
        return v


class SubjectGradeSummary(BaseModel):
    """Summary of grades for a single subject"""
    subject_id: str
    subject_name: str
    grades: List[GradeResponse]
    average_score: float
    average_percentage: float
    grade: Optional[GradeScale] = None
    position: Optional[int] = None
    total_students: Optional[int] = None

    class Config:
        from_attributes = True


class StudentGradesSummary(BaseModel):
    student_id: str
    student_name: str
    class_id: str
    class_name: str
    term_id: str
    term_name: str
    total_subjects: int
    graded_subjects: int
    total_score: float
    total_possible: float
    overall_percentage: float
    overall_grade: Optional[GradeScale] = None
    position: Optional[int] = None
    total_students: Optional[int] = None
    grades: List[GradeResponse]
    subject_summaries: Optional[List[SubjectGradeSummary]] = None

    class Config:
        from_attributes = True


class ClassGradesSummary(BaseModel):
    class_id: str
    class_name: str
    term_id: str
    term_name: str
    exam_id: str
    exam_name: str
    subject_id: str
    subject_name: str
    total_students: int
    graded_students: int
    highest_score: Optional[Decimal] = None
    lowest_score: Optional[Decimal] = None
    average_score: Optional[Decimal] = None
    pass_rate: Optional[Decimal] = None
    grades: List[GradeResponse]
    
    class Config:
        from_attributes = True


class ReportCardBase(BaseModel):
    student_id: str
    class_id: str
    term_id: str
    teacher_comment: Optional[str] = None
    principal_comment: Optional[str] = None
    next_term_begins: Optional[date] = None


class ReportCardCreate(ReportCardBase):
    template_id: Optional[str] = Field(None, description="Optional template ID for custom report cards")


class ReportCardUpdate(BaseModel):
    teacher_comment: Optional[str] = None
    principal_comment: Optional[str] = None
    next_term_begins: Optional[date] = None
    is_published: Optional[bool] = None


class ReportCardResponse(ReportCardBase):
    id: str
    total_score: float
    average_score: float
    total_subjects: int
    position: int
    total_students: int
    generated_by: str
    generated_date: date
    is_published: bool
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    term_name: Optional[str] = None
    generator_name: Optional[str] = None
    grades: List[GradeResponse]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class GradeStatistics(BaseModel):
    total_exams: int
    published_exams: int
    total_grades: int
    published_grades: int
    average_class_performance: Optional[float] = None
    subjects_assessed: int
    subjects_performance: List[Dict[str, Any]]
    grade_distribution: Dict[str, int]
    
    class Config:
        from_attributes = True
