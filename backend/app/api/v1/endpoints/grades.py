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
    GradeStatistics
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
    skip = (page - 1) * size
    exams = await GradeService.get_exams(
        db, current_school.id, subject_id, class_id, term_id, 
        exam_type, is_published, is_active, skip, size
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
            db, current_user.id, grade_data.student_id, current_school.id
        )
        if not can_access_student:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only grade students in your classes or subjects"
            )

        # Check if teacher can access the subject
        can_access_subject = await check_teacher_can_access_subject(
            db, current_user.id, grade_data.subject_id, current_school.id
        )
        if not can_access_subject:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only grade students in subjects you teach"
            )

    grade = await GradeService.create_grade(
        db, grade_data, current_school.id, current_user.id
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
            db, current_user.id, exam.subject_id, current_school.id
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
    # Students can only see their own published grades
    if current_user.role == UserRole.STUDENT:
        student_id = current_user.student.id if current_user.student else None
        is_published = True
    elif current_user.role == UserRole.TEACHER:
        # Teachers can only see grades for their subjects and students
        # If specific filters are provided, validate teacher access
        if subject_id:
            can_access_subject = await check_teacher_can_access_subject(
                db, current_user.id, subject_id, current_school.id
            )
            if not can_access_subject:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view grades for subjects you teach"
                )

        if student_id:
            can_access_student = await check_teacher_can_access_student(
                db, current_user.id, student_id, current_school.id
            )
            if not can_access_student:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view grades for students in your classes or subjects"
                )

    skip = (page - 1) * size

    # For teachers, we need to filter grades to only show those they can access
    if current_user.role == UserRole.TEACHER:
        # Get teacher's subjects and students
        from app.services.teacher_subject_service import TeacherSubjectService
        from app.services.student_service import StudentService

        teacher_subjects = await TeacherSubjectService.get_teacher_subjects(
            db, current_user.id, current_school.id
        )
        teacher_subject_ids = [ts.subject_id for ts in teacher_subjects]

        teacher_students = await StudentService.get_teacher_students(
            db, current_user.id, current_school.id, None, None, 0, 1000  # Get all accessible students
        )
        teacher_student_ids = [s.id for s in teacher_students]

        # Apply teacher-specific filters
        if not subject_id:
            subject_id = teacher_subject_ids[0] if teacher_subject_ids else None
        if not student_id and teacher_student_ids:
            # Don't set student_id to allow viewing all accessible students
            pass

        grades = await GradeService.get_grades(
            db, current_school.id, student_id, subject_id, exam_id,
            term_id, class_id, is_published, skip, size
        )

        # Additional filtering to ensure teacher can only see their grades
        filtered_grades = []
        for grade in grades:
            if (grade.subject_id in teacher_subject_ids and
                grade.student_id in teacher_student_ids):
                filtered_grades.append(grade)
        grades = filtered_grades
    else:
        grades = await GradeService.get_grades(
            db, current_school.id, student_id, subject_id, exam_id,
            term_id, class_id, is_published, skip, size
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

    summary = await GradeService.get_student_grades_summary(
        db, student_id, term_id, current_school.id
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
    summary = await GradeService.get_class_grades_summary(
        db, class_id, exam_id, current_school.id
    )
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class or exam not found"
        )

    return summary


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


@router.get("/statistics", response_model=GradeStatistics)
async def get_grade_statistics(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    current_user: User = Depends(require_teacher_or_admin_user()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get comprehensive grade statistics (Teacher/Admin only)"""
    statistics = await GradeService.get_grade_statistics(
        db, current_school.id, term_id, class_id
    )

    return statistics
