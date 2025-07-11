from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import date, time, datetime
from app.models.academic import ClassLevel, TermType, AttendanceStatus


class ClassBase(BaseModel):
    name: str
    level: ClassLevel
    section: Optional[str] = None
    capacity: int = 30
    academic_session: str
    description: Optional[str] = None


class ClassCreate(ClassBase):
    teacher_id: Optional[str] = None


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[ClassLevel] = None
    section: Optional[str] = None
    capacity: Optional[int] = None
    teacher_id: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ClassResponse(ClassBase):
    id: str
    teacher_id: Optional[str] = None
    teacher_name: Optional[str] = None
    student_count: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SubjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    is_core: bool = False
    credit_units: int = 1


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_core: Optional[bool] = None
    credit_units: Optional[int] = None
    is_active: Optional[bool] = None


class SubjectResponse(SubjectBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TermBase(BaseModel):
    name: str
    type: TermType
    academic_session: str
    start_date: date
    end_date: date
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v


class TermCreate(TermBase):
    pass


class TermUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    is_active: Optional[bool] = None


class TermResponse(TermBase):
    id: str
    is_current: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EnrollmentBase(BaseModel):
    student_id: str
    class_id: str
    subject_id: str
    term_id: str
    enrollment_date: date


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentResponse(EnrollmentBase):
    id: str
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    subject_name: Optional[str] = None
    term_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TimetableEntryBase(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    class_id: str
    subject_id: str
    teacher_id: str
    term_id: str
    room: Optional[str] = None
    notes: Optional[str] = None
    
    @validator('day_of_week')
    def validate_day_of_week(cls, v):
        if v < 0 or v > 6:
            raise ValueError('Day of week must be between 0 (Monday) and 6 (Sunday)')
        return v
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v


class TimetableEntryCreate(TimetableEntryBase):
    pass


class TimetableEntryUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    class_id: Optional[str] = None
    subject_id: Optional[str] = None
    teacher_id: Optional[str] = None
    term_id: Optional[str] = None
    room: Optional[str] = None
    notes: Optional[str] = None


class TimetableEntryResponse(TimetableEntryBase):
    id: str
    class_name: Optional[str] = None
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None
    term_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AttendanceBase(BaseModel):
    date: date
    status: AttendanceStatus
    student_id: str
    class_id: str
    term_id: str
    notes: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    notes: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    id: str
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    term_name: Optional[str] = None
    marked_by: Optional[str] = None
    marker_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BulkAttendanceCreate(BaseModel):
    date: date
    class_id: str
    term_id: str
    attendances: List[dict]  # [{"student_id": "...", "status": "present"}, ...]


class ClassTimetableResponse(BaseModel):
    class_info: ClassResponse
    timetable_entries: List[TimetableEntryResponse]


class WeeklyTimetableResponse(BaseModel):
    monday: List[TimetableEntryResponse]
    tuesday: List[TimetableEntryResponse]
    wednesday: List[TimetableEntryResponse]
    thursday: List[TimetableEntryResponse]
    friday: List[TimetableEntryResponse]
    saturday: List[TimetableEntryResponse]
    sunday: List[TimetableEntryResponse]
