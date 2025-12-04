from __future__ import annotations
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
    report_card_template_id: Optional[str] = None

    @validator('teacher_id', pre=True)
    def empty_str_to_none(cls, v):
        if v == '':
            return None
        return v


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[ClassLevel] = None
    section: Optional[str] = None
    capacity: Optional[int] = None
    teacher_id: Optional[str] = None
    description: Optional[str] = None
    report_card_template_id: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('teacher_id', pre=True)
    def empty_str_to_none(cls, v):
        if v == '':
            return None
        return v


class ClassResponse(ClassBase):
    id: str
    teacher_id: Optional[str] = None
    teacher_name: Optional[str] = None
    student_count: Optional[int] = None
    report_card_template_id: Optional[str] = None
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


# Helper schemas for subject relationships
class TeacherSubjectInfo(BaseModel):
    teacher_id: str
    teacher_name: str
    is_head_of_subject: bool

    class Config:
        from_attributes = True


class ClassSubjectInfo(BaseModel):
    class_id: str
    class_name: str
    is_core: bool

    class Config:
        from_attributes = True


# Teacher-Subject Assignment Schemas
class TeacherSubjectAssignmentBase(BaseModel):
    teacher_id: str
    subject_id: str
    is_head_of_subject: bool = False


class TeacherSubjectAssignmentCreate(TeacherSubjectAssignmentBase):
    pass


class TeacherSubjectAssignmentUpdate(BaseModel):
    is_head_of_subject: Optional[bool] = None


class TeacherSubjectAssignmentResponse(TeacherSubjectAssignmentBase):
    id: str
    teacher_name: Optional[str] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Class-Subject Assignment Schemas
class ClassSubjectAssignmentBase(BaseModel):
    class_id: str
    subject_id: str
    is_core: Optional[bool] = None  # Override subject's default is_core setting


class ClassSubjectAssignmentCreate(ClassSubjectAssignmentBase):
    pass


class ClassSubjectAssignmentUpdate(BaseModel):
    is_core: Optional[bool] = None


class ClassSubjectAssignmentResponse(ClassSubjectAssignmentBase):
    id: str
    class_name: Optional[str] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Bulk Assignment Schemas
class BulkTeacherSubjectAssignment(BaseModel):
    teacher_id: str
    subject_ids: List[str]
    head_of_subject_id: Optional[str] = None  # Subject ID for which teacher is head


class BulkClassSubjectAssignment(BaseModel):
    class_id: str
    subject_assignments: List[ClassSubjectAssignmentCreate]


class TermBase(BaseModel):
    name: str
    type: TermType
    academic_session: str
    start_date: date
    end_date: date

    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Term name cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('Term name must be at least 2 characters long')
        if len(v.strip()) > 50:
            raise ValueError('Term name cannot exceed 50 characters')
        return v.strip()

    @validator('academic_session')
    def validate_academic_session(cls, v):
        if not v or not v.strip():
            raise ValueError('Academic session cannot be empty')
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

    @validator('start_date')
    def validate_start_date(cls, v):
        from datetime import date
        if v < date(2020, 1, 1):
            raise ValueError('Start date cannot be before 2020')
        if v > date(2030, 12, 31):
            raise ValueError('Start date cannot be after 2030')
        return v

    @validator('end_date')
    def validate_end_date(cls, v, values):
        from datetime import date, timedelta

        if 'start_date' in values:
            start_date = values['start_date']
            if v <= start_date:
                raise ValueError('End date must be after start date')

            # Term should be at least 30 days and at most 150 days
            duration = (v - start_date).days
            if duration < 30:
                raise ValueError('Term duration must be at least 30 days')
            if duration > 150:
                raise ValueError('Term duration cannot exceed 150 days')

        if v < date(2020, 1, 1):
            raise ValueError('End date cannot be before 2020')
        if v > date(2030, 12, 31):
            raise ValueError('End date cannot be after 2030')

        return v


class TermCreate(TermBase):
    pass


class TermUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    is_active: Optional[bool] = None

    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Term name cannot be empty')
            if len(v.strip()) < 2:
                raise ValueError('Term name must be at least 2 characters long')
            if len(v.strip()) > 50:
                raise ValueError('Term name cannot exceed 50 characters')
            return v.strip()
        return v


class BulkTermCreate(BaseModel):
    academic_session: str
    first_term_start: date
    first_term_end: date
    second_term_start: date
    second_term_end: date
    third_term_start: Optional[date] = None
    third_term_end: Optional[date] = None

    @validator('academic_session')
    def validate_academic_session(cls, v):
        if not v or not v.strip():
            raise ValueError('Academic session cannot be empty')
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

    @validator('first_term_end')
    def validate_first_term(cls, v, values):
        if 'first_term_start' in values and v <= values['first_term_start']:
            raise ValueError('First term end date must be after start date')
        return v

    @validator('second_term_start')
    def validate_second_term_start(cls, v, values):
        if 'first_term_end' in values and v <= values['first_term_end']:
            raise ValueError('Second term must start after first term ends')
        return v

    @validator('second_term_end')
    def validate_second_term_end(cls, v, values):
        if 'second_term_start' in values and v <= values['second_term_start']:
            raise ValueError('Second term end date must be after start date')
        return v

    @validator('third_term_start')
    def validate_third_term_start(cls, v, values):
        if v is not None and 'second_term_end' in values and v <= values['second_term_end']:
            raise ValueError('Third term must start after second term ends')
        return v

    @validator('third_term_end')
    def validate_third_term_end(cls, v, values):
        if v is not None:
            if 'third_term_start' in values and values['third_term_start'] is not None:
                if v <= values['third_term_start']:
                    raise ValueError('Third term end date must be after start date')
            else:
                raise ValueError('Third term end date requires third term start date')
        return v


class BulkTermResponse(BaseModel):
    academic_session: str
    terms_created: List[TermResponse]
    message: str


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
    subject_id: Optional[str] = None  # NULL for class attendance, set for subject attendance
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
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    term_name: Optional[str] = None
    marked_by: Optional[str] = None
    marker_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Individual attendance record for bulk operations
class AttendanceRecordInput(BaseModel):
    student_id: str
    status: AttendanceStatus
    notes: Optional[str] = None


# Bulk class attendance (no subject)
class BulkClassAttendanceCreate(BaseModel):
    date: date
    class_id: str
    term_id: str
    records: List[AttendanceRecordInput]


# Bulk subject attendance
class BulkSubjectAttendanceCreate(BaseModel):
    date: date
    class_id: str
    subject_id: str
    term_id: str
    records: List[AttendanceRecordInput]


# For backward compatibility
class BulkAttendanceCreate(BaseModel):
    date: date
    class_id: str
    term_id: str
    attendances: List[dict]  # [{"student_id": "...", "status": "present"}, ...]


# Attendance summary for a student
class StudentAttendanceSummary(BaseModel):
    student_id: str
    student_name: str
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    excused_days: int
    attendance_rate: float
    
    class Config:
        from_attributes = True


# Attendance filter parameters
class AttendanceFilterParams(BaseModel):
    class_id: Optional[str] = None
    subject_id: Optional[str] = None
    student_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[AttendanceStatus] = None
    term_id: Optional[str] = None


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
