from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_school_admin,
    require_teacher_or_admin_user,
    get_current_school,
    get_current_school_context,
    check_teacher_can_access_student,
    check_teacher_can_access_subject,
    SchoolContext
)
from app.models.user import User, UserRole
from app.models.school import School
from app.models.grade import ExamType, Grade, ReportCard
from app.models.academic import Enrollment
from app.models.student import Student
from app.schemas.grade import (
    ExamCreate,
    ExamUpdate,
    ExamResponse,
    GradeCreate,
    GradeUpdate,
    GradeResponse,
    BulkGradeCreate,
    StudentGradesSummary,
    ClassGradesSummary,
    ReportCardCreate,
    ReportCardUpdate,
    ReportCardResponse,
    GradeStatistics,
    SubjectsWithMappingsResponse,
    SubjectWithMapping,
    SubjectConsolidatedGradesResponse,
    ConsolidatedStudentGrade
)
from app.services.grade_service import GradeService

router = APIRouter()


# Exam Management Endpoints
@router.post("/exams", response_model=ExamResponse)
async def create_exam(
    exam_data: ExamCreate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    school_context: SchoolContext = Depends(get_current_school_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new exam (Teacher/Admin only)"""
    # Additional validation for teachers
    if current_user.role == UserRole.TEACHER:
        # Check if teacher can access the subject
        can_access_subject = await check_teacher_can_access_subject(
            db, current_user.id, exam_data.subject_id, school_context.school.id
        )
        if not can_access_subject:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create exams for subjects you teach"
            )

    exam = await GradeService.create_exam(
        db, exam_data, school_context.school_id, current_user.id
    )
    
    # Prepare response with additional data
    response = ExamResponse.from_orm(exam)
    if exam.creator:
        response.creator_name = exam.creator.full_name
    if exam.subject:
        response.subject_name = exam.subject.name
    if exam.class_:
        response.class_name = exam.class_.name
    if exam.term:
        response.term_name = exam.term.name
    
    return response


@router.get("/exams", response_model=List[ExamResponse])
async def get_exams(
    subject_id: Optional[str] = Query(None, description="Filter by subject"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    exam_type: Optional[ExamType] = Query(None, description="Filter by exam type"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all exams with filtering"""
    allowed_subject_ids = None
    
    # For teachers, only show exams for subjects they teach
    if current_user.role == UserRole.TEACHER:
        from app.services.teacher_subject_service import TeacherSubjectService
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
        
        # If subject_id filter is provided, verify teacher access
        if subject_id and subject_id not in allowed_subject_ids:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view exams for subjects you teach"
            )

    skip = (page - 1) * size
    exams = await GradeService.get_exams(
        db, current_school.id, subject_id, class_id, term_id, 
        exam_type, is_published, is_active, allowed_subject_ids, skip, size
    )
    
    response_exams = []
    for exam in exams:
        exam_response = ExamResponse.from_orm(exam)
        if exam.creator:
            exam_response.creator_name = exam.creator.full_name
        if exam.subject:
            exam_response.subject_name = exam.subject.name
        if exam.class_:
            exam_response.class_name = exam.class_.name
        if exam.term:
            exam_response.term_name = exam.term.name
        
        # Add grade statistics
        # total_students: count of active enrollments for the exam's class/subject/term
        # graded_students: count of all grades entered for the exam (regardless of publish state)
        if exam.class_id and exam.subject_id and exam.term_id:
            enroll_count_result = await db.execute(
                select(func.count(Enrollment.id)).where(
                    Enrollment.school_id == current_school.id,
                    Enrollment.class_id == exam.class_id,
                    Enrollment.subject_id == exam.subject_id,
                    Enrollment.term_id == exam.term_id,
                    Enrollment.is_deleted == False,
                    Enrollment.is_active == True
                )
            )
            exam_response.total_students = enroll_count_result.scalar() or 0
        else:
            exam_response.total_students = 0

        exam_response.graded_students = len(exam.grades) if exam.grades else 0
        
        response_exams.append(exam_response)
    
    return response_exams


@router.get("/exams/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get exam by ID"""
    exam = await GradeService.get_exam_by_id(db, exam_id, current_school.id)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    # For teachers, check if they have access to the subject
    if current_user.role == UserRole.TEACHER:
        from app.services.teacher_subject_service import TeacherSubjectService
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
        
        if exam.subject_id not in allowed_subject_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view exams for subjects you teach"
            )
    
    response = ExamResponse.from_orm(exam)
    if exam.creator:
        response.creator_name = exam.creator.full_name
    if exam.subject:
        response.subject_name = exam.subject.name
    if exam.class_:
        response.class_name = exam.class_.name
    if exam.term:
        response.term_name = exam.term.name
    
    # Add grade statistics
    if exam.class_id and exam.subject_id and exam.term_id:
        enroll_count_result = await db.execute(
            select(func.count(Enrollment.id)).where(
                Enrollment.school_id == current_school.id,
                Enrollment.class_id == exam.class_id,
                Enrollment.subject_id == exam.subject_id,
                Enrollment.term_id == exam.term_id,
                Enrollment.is_deleted == False,
                Enrollment.is_active == True
            )
        )
        response.total_students = enroll_count_result.scalar() or 0
    else:
        response.total_students = 0

    response.graded_students = len(exam.grades) if exam.grades else 0
    
    return response


@router.put("/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: str,
    exam_data: ExamUpdate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update exam (Teacher/Admin only)"""
    # Verify exam exists first
    exam = await GradeService.get_exam_by_id(db, exam_id, current_school.id)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )

    # For teachers, check if they have access to the subject
    if current_user.role == UserRole.TEACHER:
        from app.services.teacher_subject_service import TeacherSubjectService
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
        
        if exam.subject_id not in allowed_subject_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update exams for subjects you teach"
            )

    exam = await GradeService.update_exam(db, exam_id, exam_data, current_school.id)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    response = ExamResponse.from_orm(exam)
    if exam.creator:
        response.creator_name = exam.creator.full_name
    if exam.subject:
        response.subject_name = exam.subject.name
    if exam.class_:
        response.class_name = exam.class_.name
    if exam.term:
        response.term_name = exam.term.name
    
    return response


@router.delete("/exams/{exam_id}")
async def delete_exam(
    exam_id: str,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete exam (Admin only)"""
    success = await GradeService.delete_exam(db, exam_id, current_school.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    return {"message": "Exam deleted successfully"}


@router.post("/exams/{exam_id}/publish")
async def publish_exam(
    exam_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Publish an exam (Teacher/Admin only)"""
    exam = await GradeService.get_exam_by_id(db, exam_id, current_school.id)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    # For teachers, check if they have access to the subject
    if current_user.role == UserRole.TEACHER:
        from app.services.teacher_subject_service import TeacherSubjectService
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
        
        if exam.subject_id not in allowed_subject_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only publish exams for subjects you teach"
            )

    # Update exam to published
    exam_data = ExamUpdate(is_published=True)
    await GradeService.update_exam(db, exam_id, exam_data, current_school.id)
    
    return {"message": "Exam published successfully", "exam_id": exam_id}


# Grade Management Endpoints
@router.post("/grades", response_model=GradeResponse)
async def create_grade(
    grade_data: GradeCreate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new grade (Teacher/Admin only)"""
    # Additional validation for teachers
    if current_user.role == UserRole.TEACHER:
        # Check if teacher can access the student
        can_access_student = await check_teacher_can_access_student(
            db, current_user.id, grade_data.student_id, school_context.school.id
        )
        if not can_access_student:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only grade students in your classes or subjects"
            )

        # Check if teacher can access the subject
        can_access_subject = await check_teacher_can_access_subject(
            db, current_user.id, grade_data.subject_id, school_context.school.id, strict=True
        )
        if not can_access_subject:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only grade students in subjects you teach"
            )

    grade = await GradeService.create_grade(
        db, grade_data, school_context.school_id, current_user.id
    )
    
    # Prepare response with additional data
    response = GradeResponse.from_orm(grade)
    if grade.grader:
        response.grader_name = grade.grader.full_name
    if grade.student:
        response.student_name = grade.student.full_name
    if grade.subject:
        response.subject_name = grade.subject.name
    if grade.exam:
        response.exam_name = grade.exam.name
    
    return response


@router.post("/grades/bulk", response_model=List[GradeResponse])
async def create_bulk_grades(
    bulk_data: BulkGradeCreate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create multiple grades for an exam (Teacher/Admin only)"""
    # Additional validation for teachers
    if current_user.role == UserRole.TEACHER:
        # Get exam details to check subject
        from sqlalchemy import select
        from app.models.grade import Exam

        exam_result = await db.execute(
            select(Exam).where(
                Exam.id == bulk_data.exam_id,
                Exam.school_id == current_school.id,
                Exam.is_deleted == False
            )
        )
        exam = exam_result.scalar_one_or_none()
        if not exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exam not found"
            )

        # Check if teacher can access the subject
        can_access_subject = await check_teacher_can_access_subject(
            db, current_user.id, exam.subject_id, current_school.id, strict=True
        )
        if not can_access_subject:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only grade exams for subjects you teach"
            )

        # Check if teacher can access all students
        for grade_data in bulk_data.grades:
            can_access_student = await check_teacher_can_access_student(
                db, current_user.id, grade_data['student_id'], current_school.id
            )
            if not can_access_student:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"You cannot grade student {grade_data['student_id']} as they are not in your classes or subjects"
                )

    grades = await GradeService.create_bulk_grades(
        db, bulk_data, current_school.id, current_user.id
    )
    
    # Query the grades again with relationships loaded to avoid MissingGreenlet errors
    if grades:
        grade_ids = [grade.id for grade in grades]
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select
        from app.models.grade import Grade
        
        result = await db.execute(
            select(Grade)
            .options(
                selectinload(Grade.student),
                selectinload(Grade.subject),
                selectinload(Grade.exam),
                selectinload(Grade.grader)
            )
            .where(Grade.id.in_(grade_ids))
        )
        grades = result.scalars().all()
    
    response_grades = []
    for grade in grades:
        grade_response = GradeResponse.from_orm(grade)
        # Convert Decimal fields to float for proper JSON serialization
        grade_response.score = float(grade.score)
        grade_response.total_marks = float(grade.total_marks)
        grade_response.percentage = float(grade.percentage) if grade.percentage else 0.0
        if grade.grader:
            grade_response.grader_name = grade.grader.full_name
        if grade.student:
            grade_response.student_name = grade.student.full_name
        if grade.subject:
            grade_response.subject_name = grade.subject.name
        if grade.exam:
            grade_response.exam_name = grade.exam.name
        
        response_grades.append(grade_response)
    
    return response_grades


@router.get("/grades", response_model=List[GradeResponse])
async def get_grades(
    student_id: Optional[str] = Query(None, description="Filter by student"),
    subject_id: Optional[str] = Query(None, description="Filter by subject"),
    exam_id: Optional[str] = Query(None, description="Filter by exam"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all grades with filtering"""
    allowed_subject_ids = None
    allowed_student_ids = None

    # Students can only see their own published grades
    if current_user.role == UserRole.STUDENT:
        student_id = current_user.student.id if current_user.student else None
        is_published = True
    elif current_user.role == UserRole.TEACHER:
        # Teachers can only see grades for their subjects and students
        from app.services.teacher_subject_service import TeacherSubjectService
        from app.services.student_service import StudentService

        # Get allowed subjects
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]

        # Get allowed students
        teacher_students = await StudentService.get_teacher_students(
            db, current_user.id, current_school.id, None, None, 0, 1000
        )
        allowed_student_ids = [s.id for s in teacher_students]

        # If specific filters are provided, validate teacher access
        if subject_id and subject_id not in allowed_subject_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view grades for subjects you teach"
            )

        if student_id and student_id not in allowed_student_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view grades for students in your classes or subjects"
            )

    skip = (page - 1) * size

    grades = await GradeService.get_grades(
        db, current_school.id, student_id, subject_id, exam_id,
        term_id, class_id, is_published, allowed_subject_ids, allowed_student_ids, skip, size
    )
    
    response_grades = []
    for grade in grades:
        grade_response = GradeResponse.from_orm(grade)
        # Convert Decimal fields to float for proper JSON serialization
        grade_response.score = float(grade.score)
        grade_response.total_marks = float(grade.total_marks)
        grade_response.percentage = float(grade.percentage) if grade.percentage else 0.0
        if grade.grader:
            grade_response.grader_name = grade.grader.full_name
        if grade.student:
            grade_response.student_name = grade.student.full_name
        if grade.subject:
            grade_response.subject_name = grade.subject.name
        if grade.exam:
            grade_response.exam_name = grade.exam.name
        
        response_grades.append(grade_response)
    
    return response_grades


@router.get("/grades/{grade_id}", response_model=GradeResponse)
async def get_grade(
    grade_id: str,
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get grade by ID"""
    grade = await GradeService.get_grade_by_id(db, grade_id, current_school.id)
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )

    # Teachers can only see grades for their subjects and students
    if current_user.role == UserRole.TEACHER:
        from app.services.teacher_subject_service import TeacherSubjectService
        from app.services.student_service import StudentService

        # Check subject access
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
        
        if grade.subject_id not in allowed_subject_ids:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view grades for subjects you teach"
            )

        # Check student access
        can_access_student = await check_teacher_can_access_student(
            db, current_user.id, grade.student_id, current_school.id
        )
        if not can_access_student:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view grades for students in your classes or subjects"
            )

    # Students can only see their own published grades
    if current_user.role == UserRole.STUDENT:
        if grade.student_id != current_user.student.id or not grade.is_published:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

    response = GradeResponse.from_orm(grade)
    if grade.grader:
        response.grader_name = grade.grader.full_name
    if grade.student:
        response.student_name = grade.student.full_name
    if grade.subject:
        response.subject_name = grade.subject.name
    if grade.exam:
        response.exam_name = grade.exam.name

    return response


@router.put("/grades/{grade_id}", response_model=GradeResponse)
async def update_grade(
    grade_id: str,
    grade_data: GradeUpdate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update grade (Teacher/Admin only)"""
    # Verify grade exists first
    grade = await GradeService.get_grade_by_id(db, grade_id, current_school.id)
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )

    # For teachers, check if they have access to the subject
    if current_user.role == UserRole.TEACHER:
        from app.services.teacher_subject_service import TeacherSubjectService
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
        
        if grade.subject_id not in allowed_subject_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update grades for subjects you teach"
            )

    grade = await GradeService.update_grade(db, grade_id, grade_data, current_school.id)
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )

    response = GradeResponse.from_orm(grade)
    if grade.grader:
        response.grader_name = grade.grader.full_name
    if grade.student:
        response.student_name = grade.student.full_name
    if grade.subject:
        response.subject_name = grade.subject.name
    if grade.exam:
        response.exam_name = grade.exam.name

    return response


@router.delete("/grades/{grade_id}")
async def delete_grade(
    grade_id: str,
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete grade (Admin only)"""
    success = await GradeService.delete_grade(db, grade_id, current_school.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )

    return {"message": "Grade deleted successfully"}


@router.post("/grades/{grade_id}/publish")
async def publish_grade(
    grade_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Publish a grade (Teacher/Admin only)"""
    grade = await GradeService.get_grade_by_id(db, grade_id, current_school.id)
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )
    
    # For teachers, check if they have access to the subject
    if current_user.role == UserRole.TEACHER:
        from app.services.teacher_subject_service import TeacherSubjectService
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
        
        if grade.subject_id not in allowed_subject_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only publish grades for subjects you teach"
            )

    # Update grade to published
    grade_data = GradeUpdate(is_published=True)
    await GradeService.update_grade(db, grade_id, grade_data, current_school.id)
    
    return {"message": "Grade published successfully", "grade_id": grade_id}


@router.post("/exams/{exam_id}/grades/publish")
async def publish_exam_grades(
    exam_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Publish all grades for an exam (Teacher/Admin only)"""
    # Verify exam exists and belongs to school
    exam = await GradeService.get_exam_by_id(db, exam_id, current_school.id)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    
    # For teachers, check if they have access to the subject
    if current_user.role == UserRole.TEACHER:
        from app.services.teacher_subject_service import TeacherSubjectService
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
        
        if exam.subject_id not in allowed_subject_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only publish grades for subjects you teach"
            )
    
    # Update all grades for this exam to published
    from sqlalchemy import update
    from app.models.grade import Grade
    
    result = await db.execute(
        update(Grade)
        .where(
            Grade.exam_id == exam_id,
            Grade.school_id == current_school.id,
            Grade.is_deleted == False
        )
        .values(is_published=True)
    )
    
    await db.commit()
    
    return {
        "message": f"Published {result.rowcount} grades for exam {exam_id}",
        "exam_id": exam_id,
        "grades_published": result.rowcount
    }


# Report and Analytics Endpoints
@router.get("/students/{student_id}/summary", response_model=StudentGradesSummary)
async def get_student_grades_summary(
    student_id: str,
    term_id: str = Query(..., description="Term ID for the summary"),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get comprehensive grade summary for a student"""
    # Students can only see their own summary
    if current_user.role == UserRole.STUDENT:
        if student_id != current_user.student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

    # Teachers can only see summaries for students they have access to
    allowed_subject_ids = None
    if current_user.role == UserRole.TEACHER:
        can_access_student = await check_teacher_can_access_student(
            db, current_user.id, student_id, current_school.id
        )
        if not can_access_student:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view summaries for students in your classes or subjects"
            )
        
        # Get teacher's allowed subjects to filter the summary
        from app.services.teacher_subject_service import TeacherSubjectService
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]

    summary = await GradeService.get_student_grades_summary(
        db, student_id, term_id, current_school.id, allowed_subject_ids
    )
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student or term not found"
        )

    return summary


@router.get("/classes/{class_id}/exams/{exam_id}/summary", response_model=ClassGradesSummary)
async def get_class_grades_summary(
    class_id: str,
    exam_id: str,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get grade summary for a class in a specific exam (Teacher/Admin only)"""
    # Verify exam exists first to check subject
    exam = await GradeService.get_exam_by_id(db, exam_id, current_school.id)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )

    # Teachers can only see summaries for subjects they teach
    if current_user.role == UserRole.TEACHER:
        from app.services.teacher_subject_service import TeacherSubjectService
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
        
        if exam.subject_id not in allowed_subject_ids:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view summaries for subjects you teach"
            )

    summary = await GradeService.get_class_grades_summary(
        db, class_id, exam_id, current_school.id
    )
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class or exam not found"
        )

    return summary


@router.get("/summary-sheet")
async def get_class_summary_sheet(
    class_id: str = Query(..., description="Class ID"),
    term_id: str = Query(..., description="Term ID"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get comprehensive grades summary sheet for a class.
    Shows all students with their consolidated scores per subject, total, and position.
    (School Admin only)
    """
    summary = await GradeService.get_class_summary_sheet(
        db, class_id, term_id, current_school.id
    )
    return summary


@router.get("/summary-sheet/export")
async def export_class_summary_sheet(
    class_id: str = Query(..., description="Class ID"),
    term_id: str = Query(..., description="Term ID"),
    format: str = Query("csv", regex="^(csv|pdf)$", description="Export format: csv or pdf"),
    current_user: User = Depends(require_school_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Export class summary sheet as CSV or PDF.
    (School Admin only)
    """
    from fastapi.responses import StreamingResponse
    import csv
    import io
    
    # Get the summary data
    summary = await GradeService.get_class_summary_sheet(
        db, class_id, term_id, current_school.id
    )
    
    if format == "csv":
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header row
        headers = ["S/N", "Name", "Admission No."]
        for subject in summary["subjects"]:
            headers.append(subject["name"])
        headers.extend(["Total", "Position"])
        writer.writerow(headers)
        
        # Data rows
        for i, student in enumerate(summary["students"], 1):
            row = [i, student["student_name"], student["admission_number"]]
            for subject in summary["subjects"]:
                score = student["subject_scores"].get(subject["id"])
                row.append(score if score is not None else "-")
            row.extend([student["total_score"], student["position"]])
            writer.writerow(row)
        
        output.seek(0)
        filename = f"{summary['class_name']}_{summary['term_name']}_Summary.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:  # PDF
        # For PDF, we'll use reportlab if available, otherwise return error
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
            elements = []
            styles = getSampleStyleSheet()
            
            # Title
            title = Paragraph(f"<b>{summary['class_name']} - {summary['term_name']} Summary Sheet</b>", styles['Heading1'])
            elements.append(title)
            elements.append(Spacer(1, 20))
            
            # Table data
            headers = ["S/N", "Name"]
            for subject in summary["subjects"]:
                headers.append(subject["code"] or subject["name"][:5])
            headers.extend(["Total", "Pos"])
            
            table_data = [headers]
            for i, student in enumerate(summary["students"], 1):
                row = [str(i), student["student_name"][:25]]
                for subject in summary["subjects"]:
                    score = student["subject_scores"].get(subject["id"])
                    row.append(str(int(score)) if score is not None else "-")
                row.extend([str(int(student["total_score"])), str(student["position"])])
                table_data.append(row)
            
            # Create table
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E34234')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('FONTSIZE', (0, 1), (-1, -1), 7),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(table)
            
            doc.build(elements)
            buffer.seek(0)
            
            filename = f"{summary['class_name']}_{summary['term_name']}_Summary.pdf"
            
            return StreamingResponse(
                buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
            
        except ImportError:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="PDF export requires reportlab library. Please install it or use CSV format."
            )


@router.post("/report-cards", response_model=ReportCardResponse)
async def create_report_card(
    report_data: ReportCardCreate,
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a report card for a student (Teacher/Admin only)"""
    report_card = await GradeService.create_report_card(
        db, report_data, current_school.id, current_user.id
    )

    # Prepare response with additional data
    # Create response manually to avoid grades field validation error
    response_data = {
        'id': report_card.id,
        'student_id': report_card.student_id,
        'class_id': report_card.class_id,
        'term_id': report_card.term_id,
        'teacher_comment': report_card.teacher_comment,
        'principal_comment': report_card.principal_comment,
        'next_term_begins': report_card.next_term_begins,
        'total_score': float(report_card.total_score),
        'average_score': float(report_card.average_score),
        'total_subjects': report_card.total_subjects,
        'position': report_card.position,
        'total_students': report_card.total_students,
        'generated_by': report_card.generated_by,
        'generated_date': report_card.generated_date,
        'is_published': report_card.is_published,
        'created_at': report_card.created_at,
        'updated_at': report_card.updated_at,
        'grades': []  # Will be populated below
    }
    response = ReportCardResponse(**response_data)
    
    # Add related data by querying separately to avoid lazy loading issues
    # Get student name
    student_result = await db.execute(
        select(Student.first_name, Student.middle_name, Student.last_name).where(Student.id == report_card.student_id)
    )
    student_data = student_result.first()
    if student_data:
        if student_data.middle_name:
            response.student_name = f"{student_data.first_name} {student_data.middle_name} {student_data.last_name}"
        else:
            response.student_name = f"{student_data.first_name} {student_data.last_name}"
    
    # Get class name
    from app.models.academic import Class
    class_result = await db.execute(
        select(Class.name).where(Class.id == report_card.class_id)
    )
    class_name = class_result.scalar()
    if class_name:
        response.class_name = class_name
    
    # Get term name
    from app.models.academic import Term
    term_result = await db.execute(
        select(Term.name).where(Term.id == report_card.term_id)
    )
    term_name = term_result.scalar()
    if term_name:
        response.term_name = term_name
    
    # Get generator name
    from app.models.user import User
    generator_result = await db.execute(
        select(User.first_name, User.middle_name, User.last_name).where(User.id == report_card.generated_by)
    )
    generator_data = generator_result.first()
    if generator_data:
        if generator_data.middle_name:
            response.generator_name = f"{generator_data.first_name} {generator_data.middle_name} {generator_data.last_name}"
        else:
            response.generator_name = f"{generator_data.first_name} {generator_data.last_name}"
    
    # Get grades for this student and term
    grades_result = await db.execute(
        select(Grade).options(
            selectinload(Grade.subject),
            selectinload(Grade.exam),
            selectinload(Grade.grader),
            selectinload(Grade.student)
        ).where(
            Grade.student_id == report_data.student_id,
            Grade.term_id == report_data.term_id,
            Grade.school_id == current_school.id,
            Grade.is_deleted == False
        )
    )
    grades = list(grades_result.scalars().all())
    
    # Convert grades to GradeResponse objects
    grade_responses = []
    for grade in grades:
        grade_response = GradeResponse.from_orm(grade)
        grade_response.score = float(grade.score)
        grade_response.total_marks = float(grade.total_marks)
        grade_response.percentage = float(grade.percentage) if grade.percentage else 0.0
        if grade.grader:
            grade_response.grader_name = grade.grader.full_name
        if grade.student:
            grade_response.student_name = grade.student.full_name
        if grade.subject:
            grade_response.subject_name = grade.subject.name
        if grade.exam:
            grade_response.exam_name = grade.exam.name
        grade_responses.append(grade_response)
    
    response.grades = grade_responses

    return response


@router.get("/report-cards", response_model=List[ReportCardResponse])
async def get_report_cards(
    student_id: Optional[str] = Query(None, description="Filter by student"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get list of report cards"""
    try:
        # Build filter conditions
        conditions = [
            ReportCard.school_id == current_school.id,
            ReportCard.is_deleted == False
        ]
        
        if student_id:
            conditions.append(ReportCard.student_id == student_id)
        if class_id:
            conditions.append(ReportCard.class_id == class_id)
        if term_id:
            conditions.append(ReportCard.term_id == term_id)
        if is_published is not None:
            conditions.append(ReportCard.is_published == is_published)
        
        # For teachers, filter report cards by subjects they teach
        allowed_subject_ids = None
        if current_user.role == UserRole.TEACHER:
            from app.services.teacher_subject_service import TeacherSubjectService
            teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
                db, current_user.id, current_school.id, include_class_subjects=False
            )
            allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
            # If a teacher has no subjects, they shouldn't see any report cards
            if not allowed_subject_ids:
                return []
            
            # Filter report cards by checking if any of their associated grades belong to allowed subjects
            # This requires a subquery or join to the Grade table
            conditions.append(
                ReportCard.id.in_(
                    select(Grade.report_card_id)
                    .where(
                        Grade.subject_id.in_(allowed_subject_ids),
                        Grade.school_id == current_school.id,
                        Grade.is_deleted == False
                    )
                )
            )

        # Calculate pagination
        skip = (page - 1) * size
        
        # Get report cards
        report_cards_result = await db.execute(
            select(ReportCard)
            .where(and_(*conditions))
            .order_by(desc(ReportCard.generated_date))
            .offset(skip)
            .limit(size)
        )
        report_cards = list(report_cards_result.scalars().all())
        
        # Convert to response objects
        response_report_cards = []
        for report_card in report_cards:
            response_data = {
                'id': report_card.id,
                'student_id': report_card.student_id,
                'class_id': report_card.class_id,
                'term_id': report_card.term_id,
                'teacher_comment': report_card.teacher_comment,
                'principal_comment': report_card.principal_comment,
                'next_term_begins': report_card.next_term_begins,
                'total_score': float(report_card.total_score),
                'average_score': float(report_card.average_score),
                'total_subjects': report_card.total_subjects,
                'position': report_card.position,
                'total_students': report_card.total_students,
                'generated_by': report_card.generated_by,
                'generated_date': report_card.generated_date,
                'is_published': report_card.is_published,
                'created_at': getattr(report_card, 'created_at', report_card.generated_date),
                'updated_at': getattr(report_card, 'updated_at', report_card.generated_date),
                'grades': []
            }
            response = ReportCardResponse(**response_data)
            
            # Add related data
            student_result = await db.execute(
                select(Student.first_name, Student.middle_name, Student.last_name).where(Student.id == report_card.student_id)
            )
            student_data = student_result.first()
            if student_data:
                if student_data.middle_name:
                    response.student_name = f"{student_data.first_name} {student_data.middle_name} {student_data.last_name}"
                else:
                    response.student_name = f"{student_data.first_name} {student_data.last_name}"
            
            from app.models.academic import Class
            class_result = await db.execute(
                select(Class.name).where(Class.id == report_card.class_id)
            )
            class_name = class_result.scalar()
            if class_name:
                response.class_name = class_name
            
            from app.models.academic import Term
            term_result = await db.execute(
                select(Term.name).where(Term.id == report_card.term_id)
            )
            term_name = term_result.scalar()
            if term_name:
                response.term_name = term_name
            
            generator_result = await db.execute(
                select(User.first_name, User.middle_name, User.last_name).where(User.id == report_card.generated_by)
            )
            generator_data = generator_result.first()
            if generator_data:
                if generator_data.middle_name:
                    response.generator_name = f"{generator_data.first_name} {generator_data.middle_name} {generator_data.last_name}"
                else:
                    response.generator_name = f"{generator_data.first_name} {generator_data.last_name}"
            
            response_report_cards.append(response)
        
        return response_report_cards
    except Exception as e:
        print(f"Error in get_report_cards: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching report cards: {str(e)}"
        )



# Grade Setup Endpoints
@router.get("/subjects-with-mappings", response_model=SubjectsWithMappingsResponse)
async def get_subjects_with_mappings(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get subjects with component mappings configured (Teacher/Admin only)"""
    from app.models.component_mapping import ComponentMapping
    from app.models.academic import Subject, Class, Term
    from app.models.grade_template import GradeTemplate, AssessmentComponent
    from app.services.teacher_subject_service import TeacherSubjectService
    
    # Get teacher's allowed subjects
    allowed_subject_ids = None
    if current_user.role == UserRole.TEACHER:
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
    
    # Build query conditions
    conditions = [
        ComponentMapping.school_id == current_school.id,
        ComponentMapping.is_deleted == False,
        ComponentMapping.include_in_calculation == True
    ]
    
    if term_id:
        conditions.append(ComponentMapping.term_id == term_id)
    
    if allowed_subject_ids:
        conditions.append(ComponentMapping.subject_id.in_(allowed_subject_ids))
    
    # Get all component mappings
    mappings_result = await db.execute(
        select(ComponentMapping).options(
            selectinload(ComponentMapping.subject),
            selectinload(ComponentMapping.term),
            selectinload(ComponentMapping.component).selectinload(AssessmentComponent.template)
        ).where(and_(*conditions))
    )
    mappings = list(mappings_result.scalars().all())
    
    # Group by subject+term+class
    subject_term_map = {}
    for mapping in mappings:
        if not mapping.subject or not mapping.term:
            continue
            
        # Get class info from teacher subjects
        class_id = None
        class_name = None
        
        if current_user.role == UserRole.TEACHER:
            # Find the class this teacher teaches this subject in
            for ts in teacher_subjects:
                if ts.subject_id == mapping.subject_id:
                    class_id = ts.class_id if hasattr(ts, 'class_id') else None
                    class_name = ts.class_.name if hasattr(ts, 'class_') and ts.class_ else "All Classes"
                    break
        
        key = f"{mapping.subject_id}_{mapping.term_id}_{class_id or 'all'}"
        
        if key not in subject_term_map:
            # Count students enrolled in this subject/term/class
            enroll_conditions = [
                Enrollment.school_id == current_school.id,
                Enrollment.subject_id == mapping.subject_id,
                Enrollment.term_id == mapping.term_id,
                Enrollment.is_deleted == False,
                Enrollment.is_active == True
            ]
            
            if class_id:
                enroll_conditions.append(Enrollment.class_id == class_id)
            
            student_count_result = await db.execute(
                select(func.count(Enrollment.student_id.distinct())).where(and_(*enroll_conditions))
            )
            student_count = student_count_result.scalar() or 0
            
            # Get template info if available
            template_id = None
            template_name = None
            if mapping.component and mapping.component.template:
                template_id = mapping.component.template.id
                template_name = mapping.component.template.name
            
            subject_term_map[key] = SubjectWithMapping(
                subject_id=mapping.subject_id,
                subject_name=mapping.subject.name,
                class_id=class_id or "",
                class_name=class_name or "All Classes",
                term_id=mapping.term_id,
                term_name=mapping.term.name,
                has_mappings=True,
                student_count=student_count,
                template_id=template_id,
                template_name=template_name
            )
    
    return SubjectsWithMappingsResponse(subjects=list(subject_term_map.values()))


@router.get("/subject/{subject_id}/consolidated", response_model=SubjectConsolidatedGradesResponse)
async def get_subject_consolidated_grades(
    subject_id: str,
    term_id: str = Query(..., description="Term ID"),
    class_id: Optional[str] = Query(None, description="Optional class ID filter"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get consolidated grades for all students in a subject (Teacher/Admin only)"""
    from app.models.academic import Subject, Class, Term
    from app.models.grade_template import AssessmentComponent
    
    # Verify teacher access to subject
    if current_user.role == UserRole.TEACHER:
        can_access = await check_teacher_can_access_subject(
            db, current_user.id, subject_id, current_school.id
        )
        if not can_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view grades for subjects you teach"
            )
    
    # Get subject, term, and class info
    subject = await db.get(Subject, subject_id)
    term = await db.get(Term, term_id)
    
    class_name = "All Classes"
    if class_id:
        class_obj = await db.get(Class, class_id)
        if class_obj:
            class_name = class_obj.name
    
    if not subject or not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject or term not found"
        )
    
    # Get all enrolled students for this subject/term
    enroll_conditions = [
        Enrollment.school_id == current_school.id,
        Enrollment.subject_id == subject_id,
        Enrollment.term_id == term_id,
        Enrollment.is_deleted == False,
        Enrollment.is_active == True
    ]
    
    if class_id:
        enroll_conditions.append(Enrollment.class_id == class_id)
    
    enrollments_result = await db.execute(
        select(Enrollment).options(
            selectinload(Enrollment.student)
        ).where(and_(*enroll_conditions))
    )
    enrollments = list(enrollments_result.scalars().all())
    
    # Get template components for this subject (via component mappings)
    from app.models.component_mapping import ComponentMapping
    
    mappings_result = await db.execute(
        select(ComponentMapping).options(
            selectinload(ComponentMapping.component)
        ).where(
            ComponentMapping.subject_id == subject_id,
            ComponentMapping.term_id == term_id,
            ComponentMapping.school_id == current_school.id,
            ComponentMapping.is_deleted == False,
            ComponentMapping.include_in_calculation == True
        )
    )
    mappings = list(mappings_result.scalars().all())
    
    # Get unique component names
    component_names_set = set()
    for mapping in mappings:
        if mapping.component:
            component_names_set.add(mapping.component.name)
    
    template_components = sorted(list(component_names_set))
    
    # Get consolidated grades for each student
    consolidated_students = []
    
    for enrollment in enrollments:
        if not enrollment.student:
            continue
        
        student = enrollment.student
        
        # Get all grades for this student in this subject/term
        grades_result = await db.execute(
            select(Grade).options(
                selectinload(Grade.exam),
                selectinload(Grade.subject)
            ).where(
                Grade.student_id == student.id,
                Grade.subject_id == subject_id,
                Grade.term_id == term_id,
                Grade.school_id == current_school.id,
                Grade.is_deleted == False
            )
        )
        grades = list(grades_result.scalars().all())
        
        if not grades:
            continue
        
        # Consolidate grades using the service method
        consolidated = await GradeService.consolidate_grades_by_subject(
            db=db,
            grades=grades,
            term_id=term_id,
            school_id=current_school.id,
            grade_template_id=None
        )
        
        if consolidated:
            consolidated_grade = consolidated[0]
            
            consolidated_students.append(ConsolidatedStudentGrade(
                student_id=student.id,
                student_name=student.full_name,
                component_scores=consolidated_grade['component_scores'],
                total=float(consolidated_grade['score']),
                grade=consolidated_grade['grade'].value if consolidated_grade.get('grade') else None
            ))
    
    return SubjectConsolidatedGradesResponse(
        subject_id=subject_id,
        subject_name=subject.name,
        class_name=class_name,
        term_name=term.name,
        template_components=template_components,
        students=consolidated_students
    )


@router.get("/statistics", response_model=GradeStatistics)
async def get_grade_statistics(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get comprehensive grade statistics (Teacher/Admin only)"""
    allowed_subject_ids = None
    
    # For teachers, only show statistics for subjects they teach
    if current_user.role == UserRole.TEACHER:
        from app.services.teacher_subject_service import TeacherSubjectService
        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id, include_class_subjects=False
        )
        allowed_subject_ids = [ts.subject_id for ts in teacher_subjects]
    
    statistics = await GradeService.get_grade_statistics(
        db, current_school.id, term_id, class_id, allowed_subject_ids
    )

    return statistics
