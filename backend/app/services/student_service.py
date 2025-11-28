from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import date

from app.models.student import Student, StudentClassHistory, ClassHistoryStatus
from app.models.user import User, UserRole
from app.models.academic import Class, Term
from app.models.grade import Grade
from app.schemas.student import StudentCreate, StudentUpdate, StudentProfileResponse, PerformanceTrendsResponse, BulkStudentUpdate
from app.services.enrollment_service import EnrollmentService
from app.utils.enum_converter import convert_gender_enum, convert_student_status_enum
from datetime import datetime
from decimal import Decimal
from app.services.audit_service import AuditService
from app.schemas.audit_log import AuditLogCreate
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from app.models.notification import NotificationType


def convert_date_string(date_str):
    """Convert date string to date object"""
    if not date_str:
        return None

    if isinstance(date_str, str):
        try:
            # Try parsing different date formats
            if 'T' in date_str:
                # ISO format with time
                return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
            else:
                # Try common date formats
                for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y']:
                    try:
                        return datetime.strptime(date_str, fmt).date()
                    except ValueError:
                        continue
                # If no format works, return None
                return None
        except (ValueError, AttributeError):
            return None
    else:
        # Already a date object
        return date_str


class StudentService:
    """Service class for student operations"""
    
    @staticmethod
    async def create_student(
        db: AsyncSession,
        student_data: StudentCreate,
        school_id: str,
        current_user_id: Optional[str] = None
    ) -> Student:
        """Create a new student"""
        # Check if admission number already exists
        result = await db.execute(
            select(Student).where(
                Student.admission_number == student_data.admission_number,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student with this admission number already exists"
            )
        
        # Verify class exists
        if student_data.class_id:
            class_result = await db.execute(
                select(Class).where(
                    Class.id == student_data.class_id,
                    Class.school_id == school_id,
                    Class.is_deleted == False
                )
            )
            if not class_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Class not found"
                )
        
        # Create student
        student_dict = student_data.dict()
        student_dict['school_id'] = school_id

        student = Student(**student_dict)
        db.add(student)
        await db.commit()
        await db.refresh(student)

        # Auto-enroll student in class subjects if assigned to a class
        if student.current_class_id:
            try:
                await EnrollmentService.auto_enroll_student_in_class_subjects(
                    db, student.id, student.current_class_id, school_id
                )
            except HTTPException as e:
                # Log the error but don't fail student creation
                print(f"Warning: Could not auto-enroll student in class subjects: {e.detail}")

        # Audit Log
        if current_user_id:
            await AuditService.log_action(
                db=db,
                school_id=school_id,
                audit_data=AuditLogCreate(
                    user_id=current_user_id,
                    action="CREATE",
                    entity_type="student",
                    entity_id=student.id,
                    details={"admission_number": student.admission_number, "name": f"{student.first_name} {student.last_name}"}
                )
            )

            # Notification for the creator (Confirmation)
            await NotificationService.create_notification(
                db=db,
                school_id=school_id,
                notification_data=NotificationCreate(
                    user_id=current_user_id,
                    title="Student Created",
                    message=f"Student {student.first_name} {student.last_name} ({student.admission_number}) has been successfully admitted.",
                    type=NotificationType.SUCCESS,
                    link=f"/students/{student.id}"
                )
            )

        return student
    
    @staticmethod
    async def get_students(
        db: AsyncSession,
        school_id: str,
        class_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Student]:
        """Get students with filtering"""
        query = select(Student).options(
            selectinload(Student.current_class),
            selectinload(Student.parent),
            selectinload(Student.user)
        ).where(
            Student.school_id == school_id,
            Student.is_deleted == False
        )
        
        if class_id:
            query = query.where(Student.current_class_id == class_id)
        if is_active is not None:
            query = query.where(Student.is_active == is_active)
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Student.first_name.ilike(search_term),
                    Student.last_name.ilike(search_term),
                    Student.admission_number.ilike(search_term)
                )
            )
        
        query = query.order_by(Student.first_name, Student.last_name).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_student_by_id(
        db: AsyncSession,
        student_id: str,
        school_id: str
    ) -> Optional[Student]:
        """Get student by ID"""
        result = await db.execute(
            select(Student).options(
                selectinload(Student.current_class),
                selectinload(Student.parent),
                selectinload(Student.user),
                selectinload(Student.grades),
                selectinload(Student.fee_assignments)
            ).where(
                Student.id == student_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_student_by_admission_number(
        db: AsyncSession,
        admission_number: str,
        school_id: str
    ) -> Optional[Student]:
        """Get student by admission number"""
        result = await db.execute(
            select(Student).options(
                selectinload(Student.class_),
                selectinload(Student.parent),
                selectinload(Student.user)
            ).where(
                Student.admission_number == admission_number,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_student(
        db: AsyncSession,
        student_id: str,
        student_data: StudentUpdate,
        school_id: str,
        current_user_id: Optional[str] = None
    ) -> Optional[Student]:
        """Update student"""
        student = await StudentService.get_student_by_id(db, student_id, school_id)
        if not student:
            return None
        
        # Check if new admission number conflicts
        new_admission_number = getattr(student_data, 'admission_number', None)
        if new_admission_number and new_admission_number != student.admission_number:
            result = await db.execute(
                select(Student).where(
                    Student.admission_number == new_admission_number,
                    Student.school_id == school_id,
                    Student.id != student_id,
                    Student.is_deleted == False
                )
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student with this admission number already exists"
                )
        
        # Verify new class exists if provided
        new_class_id = getattr(student_data, 'current_class_id', None)
        if new_class_id:
            class_result = await db.execute(
                select(Class).where(
                    Class.id == new_class_id,
                    Class.school_id == school_id,
                    Class.is_deleted == False
                )
            )
            if not class_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Class not found"
                )
        
        # Check if class is changing
        old_class_id = student.current_class_id

        # Update fields
        update_data = student_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == 'id':
                continue
            setattr(student, field, value)

        await db.commit()
        await db.refresh(student)

        # Auto-enroll student in new class subjects if class changed
        if new_class_id and new_class_id != old_class_id:
            try:
                await EnrollmentService.auto_enroll_student_in_class_subjects(
                    db, student.id, new_class_id, school_id
                )
            except HTTPException as e:
                # Log the error but don't fail student update
                print(f"Warning: Could not auto-enroll student in new class subjects: {e.detail}")

        # Audit Log
        if current_user_id:
            await AuditService.log_action(
                db=db,
                school_id=school_id,
                audit_data=AuditLogCreate(
                    user_id=current_user_id,
                    action="UPDATE",
                    entity_type="student",
                    entity_id=student.id,
                    details={"updated_fields": list(update_data.keys())}
                )
            )
            
            # Notify Student if updated by someone else
            if student.user_id and current_user_id != student.user_id:
                 await NotificationService.create_notification(
                    db=db,
                    school_id=school_id,
                    notification_data=NotificationCreate(
                        user_id=student.user_id,
                        title="Profile Updated",
                        message="Your student profile information has been updated by an administrator.",
                        type=NotificationType.INFO,
                        link="/profile"
                    )
                )

        return student
    
    @staticmethod
    async def delete_student(
        db: AsyncSession,
        student_id: str,
        school_id: str,
        current_user_id: Optional[str] = None
    ) -> bool:
        """Soft delete student"""
        student = await StudentService.get_student_by_id(db, student_id, school_id)
        if not student:
            return False
        
        student.is_deleted = True
        await db.commit()
        
        # Audit Log
        if current_user_id:
            await AuditService.log_action(
                db=db,
                school_id=school_id,
                audit_data=AuditLogCreate(
                    user_id=current_user_id,
                    action="DELETE",
                    entity_type="student",
                    entity_id=student_id,
                    details={"name": f"{student.first_name} {student.last_name}"}
                )
            )

        return True
    
    @staticmethod
    async def bulk_update_students(
        db: AsyncSession,
        bulk_data: BulkStudentUpdate,
        school_id: str,
        current_user_id: str
    ) -> List[Student]:
        """Bulk update students"""
        updated_students = []
        
        for student_update in bulk_data.students:
            student = await StudentService.update_student(
                db, 
                student_update.id, 
                student_update, 
                school_id, 
                current_user_id
            )
            if student:
                updated_students.append(student)
                
        return updated_students
    
    @staticmethod
    async def get_students_count(
        db: AsyncSession,
        school_id: str,
        class_id: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> int:
        """Get total count of students"""
        query = select(func.count(Student.id)).where(
            Student.school_id == school_id,
            Student.is_deleted == False
        )

        if class_id:
            query = query.where(Student.class_id == class_id)
        if is_active is not None:
            query = query.where(Student.is_active == is_active)

        result = await db.execute(query)
        return result.scalar() or 0

    @staticmethod
    async def get_teacher_students(
        db: AsyncSession,
        teacher_id: str,
        school_id: str,
        class_id: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Student]:
        """Get students that a teacher can access"""
        from sqlalchemy import text

        # Build the base query to get students accessible to the teacher
        # Teachers can access students if:
        # 1. They are the class teacher for the student's class (ALL students in the class)
        # 2. They teach a subject that the student is enrolled in
        base_query = """
            SELECT DISTINCT s.id, s.first_name, s.last_name, s.middle_name,
                   s.admission_number, s.date_of_birth, s.gender, s.current_class_id,
                   s.parent_id, s.created_at, s.updated_at,
                   s.school_id, s.is_deleted, s.status, s.admission_date,
                   s.phone, s.email, s.address_line1, s.address_line2, s.city, s.state, s.postal_code,
                   s.guardian_name, s.guardian_phone, s.guardian_email, s.guardian_relationship,
                   s.emergency_contact_name, s.emergency_contact_phone, s.emergency_contact_relationship,
                   s.medical_conditions, s.allergies, s.blood_group, s.profile_picture_url, s.notes
            FROM students s
            LEFT JOIN classes c ON s.current_class_id = c.id
            LEFT JOIN enrollments e ON s.id = e.student_id
            LEFT JOIN teacher_subjects ts ON e.subject_id = ts.subject_id
            WHERE s.school_id = :school_id
            AND s.is_deleted = false
            AND (
                c.teacher_id = :teacher_id OR
                (ts.teacher_id = :teacher_id AND ts.is_deleted = false AND e.is_active = true)
            )
        """

        params = {
            "teacher_id": teacher_id,
            "school_id": school_id
        }

        # Add filters
        if class_id:
            base_query += " AND s.current_class_id = :class_id"
            params["class_id"] = class_id

        if search:
            base_query += """ AND (
                s.first_name ILIKE :search OR
                s.last_name ILIKE :search OR
                s.admission_number ILIKE :search
            )"""
            params["search"] = f"%{search}%"

        # Add ordering and pagination
        base_query += " ORDER BY s.first_name, s.last_name LIMIT :limit OFFSET :skip"
        params["limit"] = limit
        params["skip"] = skip

        result = await db.execute(text(base_query), params)
        rows = result.fetchall()

        # Convert rows to Student objects
        students = []

        for row in rows:
            try:
                # Convert enum values to lowercase to match Pydantic expectations
                from app.utils.enum_converter import convert_gender_enum, convert_student_status_enum
                from datetime import datetime, date

                gender_value = convert_gender_enum(row.gender)
                status_value = convert_student_status_enum(row.status)

                # Convert date string to date object
                def convert_date_string(date_str):
                    if not date_str:
                        return None
                    if isinstance(date_str, str):
                        try:
                            return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
                        except:
                            return datetime.strptime(date_str, '%Y-%m-%d').date()
                    elif isinstance(date_str, datetime):
                        return date_str.date()
                    elif isinstance(date_str, date):
                        return date_str
                    return None

                date_of_birth = convert_date_string(row.date_of_birth)
                admission_date = convert_date_string(row.admission_date)

                student = Student(
                    id=row.id,
                    first_name=row.first_name,
                    last_name=row.last_name,
                    middle_name=row.middle_name,
                    admission_number=row.admission_number,
                    date_of_birth=date_of_birth,
                    gender=gender_value,
                    current_class_id=row.current_class_id,
                    parent_id=row.parent_id,
                    created_at=row.created_at,
                    updated_at=row.updated_at,
                    school_id=row.school_id,
                    is_deleted=row.is_deleted,
                    status=status_value,
                    admission_date=admission_date,
                    phone=row.phone,
                    email=row.email,
                    address_line1=row.address_line1,
                    address_line2=row.address_line2,
                    city=row.city,
                    state=row.state,
                    postal_code=row.postal_code,
                    guardian_name=row.guardian_name,
                    guardian_phone=row.guardian_phone,
                    guardian_email=row.guardian_email,
                    guardian_relationship=row.guardian_relationship,
                    emergency_contact_name=row.emergency_contact_name,
                    emergency_contact_phone=row.emergency_contact_phone,
                    emergency_contact_relationship=row.emergency_contact_relationship,
                    medical_conditions=row.medical_conditions,
                    allergies=row.allergies,
                    blood_group=row.blood_group,
                    profile_picture_url=row.profile_picture_url,
                    notes=row.notes
                )
                students.append(student)

            except Exception:
                # Skip rows that can't be converted to Student objects
                continue

        return students

    @staticmethod
    async def get_students_by_subject(
        db: AsyncSession,
        subject_id: str,
        school_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Student]:
        """Get all students enrolled in a specific subject (for admin access)"""
        from sqlalchemy import text

        query = text("""
            SELECT DISTINCT s.id, s.first_name, s.last_name, s.middle_name,
                   s.admission_number, s.date_of_birth, s.gender, s.current_class_id,
                   s.parent_id, s.created_at, s.updated_at,
                   s.school_id, s.is_deleted, s.status, s.admission_date,
                   s.phone, s.email, s.address_line1, s.address_line2, s.city, s.state, s.postal_code,
                   s.guardian_name, s.guardian_phone, s.guardian_email, s.guardian_relationship,
                   s.emergency_contact_name, s.emergency_contact_phone, s.emergency_contact_relationship,
                   s.medical_conditions, s.allergies, s.blood_group, s.profile_picture_url, s.notes,
                   c.name as class_name
            FROM students s
            JOIN enrollments e ON s.id = e.student_id
            LEFT JOIN classes c ON s.current_class_id = c.id
            WHERE e.subject_id = :subject_id
            AND s.school_id = :school_id
            AND s.is_deleted = false
            AND e.is_active = true
            ORDER BY s.first_name, s.last_name
            LIMIT :limit OFFSET :skip
        """)

        result = await db.execute(query, {
            "subject_id": subject_id,
            "school_id": school_id,
            "limit": limit,
            "skip": skip
        })

        rows = result.fetchall()

        # Convert rows to Student objects
        students = []
        for row in rows:
            # Convert enum values to lowercase to match Pydantic expectations
            gender_value = convert_gender_enum(row.gender)
            status_value = convert_student_status_enum(row.status)

            # Convert date string to date object
            date_of_birth = convert_date_string(row.date_of_birth)
            admission_date = convert_date_string(row.admission_date)

            student = Student(
                id=row.id,
                first_name=row.first_name,
                last_name=row.last_name,
                middle_name=row.middle_name,
                admission_number=row.admission_number,
                date_of_birth=date_of_birth,
                gender=gender_value,
                current_class_id=row.current_class_id,
                parent_id=row.parent_id,
                created_at=row.created_at,
                updated_at=row.updated_at,
                school_id=row.school_id,
                is_deleted=row.is_deleted,
                status=status_value,
                admission_date=admission_date,
                phone=row.phone,
                email=row.email,
                address_line1=row.address_line1,
                address_line2=row.address_line2,
                city=row.city,
                state=row.state,
                postal_code=row.postal_code,
                guardian_name=row.guardian_name,
                guardian_phone=row.guardian_phone,
                guardian_email=row.guardian_email,
                guardian_relationship=row.guardian_relationship,
                emergency_contact_name=row.emergency_contact_name,
                emergency_contact_phone=row.emergency_contact_phone,
                emergency_contact_relationship=row.emergency_contact_relationship,
                medical_conditions=row.medical_conditions,
                allergies=row.allergies,
                blood_group=row.blood_group,
                profile_picture_url=row.profile_picture_url,
                notes=row.notes
            )
            
            # Manually populate current_class relationship for class name
            if row.current_class_id and row.class_name:
                student.current_class = Class(id=row.current_class_id, name=row.class_name)
                
            students.append(student)

        return students

    @staticmethod
    async def get_teacher_students_count(
        db: AsyncSession,
        teacher_id: str,
        school_id: str,
        class_id: Optional[str] = None
    ) -> int:
        """Get count of students that a teacher can access"""
        from sqlalchemy import text

        base_query = """
            SELECT COUNT(DISTINCT s.id)
            FROM students s
            LEFT JOIN classes c ON s.current_class_id = c.id
            LEFT JOIN enrollments e ON s.id = e.student_id
            LEFT JOIN teacher_subjects ts ON e.subject_id = ts.subject_id
            WHERE s.school_id = :school_id
            AND s.is_deleted = false
            AND (
                c.teacher_id = :teacher_id OR
                (ts.teacher_id = :teacher_id AND ts.is_deleted = false AND e.is_active = true)
            )
        """

        params = {
            "teacher_id": teacher_id,
            "school_id": school_id
        }

        if class_id:
            base_query += " AND s.current_class_id = :class_id"
            params["class_id"] = class_id

        result = await db.execute(text(base_query), params)
        return result.scalar() or 0

    @staticmethod
    async def get_students_by_teacher_subject(
        db: AsyncSession,
        teacher_id: str,
        subject_id: str,
        school_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Student]:
        """Get students enrolled in a specific subject taught by a teacher"""
        from sqlalchemy import text

        query = text("""
            SELECT DISTINCT s.id, s.first_name, s.last_name, s.middle_name,
                   s.admission_number, s.date_of_birth, s.gender, s.current_class_id,
                   s.parent_id, s.created_at, s.updated_at,
                   s.school_id, s.is_deleted, s.status, s.admission_date,
                   s.phone, s.email, s.address_line1, s.address_line2, s.city, s.state, s.postal_code,
                   s.guardian_name, s.guardian_phone, s.guardian_email, s.guardian_relationship,
                   s.emergency_contact_name, s.emergency_contact_phone, s.emergency_contact_relationship,
                   s.medical_conditions, s.allergies, s.blood_group, s.profile_picture_url, s.notes,
                   c.name as class_name
            FROM students s
            JOIN enrollments e ON s.id = e.student_id
            LEFT JOIN classes c ON s.current_class_id = c.id
            WHERE e.subject_id = :subject_id
            AND s.school_id = :school_id
            AND s.is_deleted = false
            AND e.is_active = true
            AND (
                -- Direct teacher-subject assignment
                EXISTS (
                    SELECT 1 FROM teacher_subjects ts
                    WHERE ts.teacher_id = :teacher_id
                    AND ts.subject_id = :subject_id
                    AND ts.school_id = :school_id
                    AND ts.is_deleted = false
                )
                OR
                -- Class-based assignment (teacher is class teacher)
                EXISTS (
                    SELECT 1 FROM classes c
                    JOIN class_subjects cs ON c.id = cs.class_id
                    WHERE c.teacher_id = :teacher_id
                    AND cs.subject_id = :subject_id
                    AND cs.school_id = :school_id
                    AND c.is_deleted = false
                    AND cs.is_deleted = false
                    AND s.current_class_id = c.id
                )
            )
            ORDER BY s.first_name, s.last_name
            LIMIT :limit OFFSET :skip
        """)

        result = await db.execute(query, {
            "teacher_id": teacher_id,
            "subject_id": subject_id,
            "school_id": school_id,
            "limit": limit,
            "skip": skip
        })

        rows = result.fetchall()

        # Convert rows to Student objects
        students = []
        for row in rows:
            # Convert enum values to lowercase to match Pydantic expectations
            gender_value = convert_gender_enum(row.gender)
            status_value = convert_student_status_enum(row.status)

            # Convert date string to date object
            date_of_birth = convert_date_string(row.date_of_birth)
            admission_date = convert_date_string(row.admission_date)

            student = Student(
                id=row.id,
                first_name=row.first_name,
                last_name=row.last_name,
                middle_name=row.middle_name,
                admission_number=row.admission_number,
                date_of_birth=date_of_birth,
                gender=gender_value,
                current_class_id=row.current_class_id,
                parent_id=row.parent_id,
                created_at=row.created_at,
                updated_at=row.updated_at,
                school_id=row.school_id,
                is_deleted=row.is_deleted,
                status=status_value,
                admission_date=admission_date,
                phone=row.phone,
                email=row.email,
                address_line1=row.address_line1,
                address_line2=row.address_line2,
                city=row.city,
                state=row.state,
                postal_code=row.postal_code,
                guardian_name=row.guardian_name,
                guardian_phone=row.guardian_phone,
                guardian_email=row.guardian_email,
                guardian_relationship=row.guardian_relationship,
                emergency_contact_name=row.emergency_contact_name,
                emergency_contact_phone=row.emergency_contact_phone,
                emergency_contact_relationship=row.emergency_contact_relationship,
                medical_conditions=row.medical_conditions,
                allergies=row.allergies,
                blood_group=row.blood_group,
                profile_picture_url=row.profile_picture_url,
                notes=row.notes
            )
            
            # Manually populate current_class relationship for class name
            if row.current_class_id and row.class_name:
                student.current_class = Class(id=row.current_class_id, name=row.class_name)
                
            students.append(student)

        return students

    # Student Portal Methods
    @staticmethod
    async def get_student_by_user_id(
        db: AsyncSession,
        user_id: str,
        school_id: str
    ) -> Optional[Student]:
        """Get student record linked to a user account"""
        result = await db.execute(
            select(Student).options(
                selectinload(Student.current_class)
            ).where(
                Student.user_id == user_id,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_student_class_history(
        db: AsyncSession,
        student_id: str,
        school_id: str
    ) -> List[StudentClassHistory]:
        """Get all class history for a student"""
        result = await db.execute(
            select(StudentClassHistory).options(
                selectinload(StudentClassHistory.class_),
                selectinload(StudentClassHistory.term),
                selectinload(StudentClassHistory.promoted_to_class)
            ).where(
                StudentClassHistory.student_id == student_id,
                StudentClassHistory.school_id == school_id,
                StudentClassHistory.is_deleted == False
            ).order_by(desc(StudentClassHistory.enrollment_date))
        )
        return result.scalars().all()

    @staticmethod
    async def get_student_grades_for_term(
        db: AsyncSession,
        student_id: str,
        term_id: str,
        school_id: str
    ) -> List[Grade]:
        """Get all published grades for a student in a specific term"""
        result = await db.execute(
            select(Grade).options(
                selectinload(Grade.subject),
                selectinload(Grade.exam)
            ).where(
                Grade.student_id == student_id,
                Grade.term_id == term_id,
                Grade.school_id == school_id,
                Grade.is_published == True,
                Grade.is_deleted == False
            ).order_by(Grade.created_at)
        )
        return result.scalars().all()

    @staticmethod
    async def get_student_performance_trends(
        db: AsyncSession,
        student_id: str,
        school_id: str
    ) -> dict:
        """Calculate performance trends across all terms for a student"""
        # Get all terms the student has grades in
        result = await db.execute(
            select(Grade.term_id, func.count(Grade.id).label('grade_count')).where(
                Grade.student_id == student_id,
                Grade.school_id == school_id,
                Grade.is_published == True,
                Grade.is_deleted == False
            ).group_by(Grade.term_id)
        )
        term_data = result.all()

        if not term_data:
            return {
                "student_id": student_id,
                "terms": [],
                "overall_average": 0.0,
                "best_term": None,
                "improvement_trend": "no_data",
                "subject_performance": []
            }

        # Get detailed data for each term
        terms_list = []
        all_averages = []

        for term_id, _ in term_data:
            # Get term info
            term_result = await db.execute(
                select(Term).where(Term.id == term_id)
            )
            term = term_result.scalar_one_or_none()

            if not term:
                continue

            # Get grades for this term
            grades_result = await db.execute(
                select(Grade).where(
                    Grade.student_id == student_id,
                    Grade.term_id == term_id,
                    Grade.school_id == school_id,
                    Grade.is_published == True,
                    Grade.is_deleted == False
                )
            )
            grades = grades_result.scalars().all()

            if grades:
                total_percentage = sum(float(g.percentage) for g in grades)
                average = total_percentage / len(grades)
                all_averages.append(average)

                terms_list.append({
                    "term_id": term_id,
                    "term_name": term.name,
                    "academic_session": term.academic_session,
                    "average_score": round(average, 2),
                    "total_subjects": len(grades),
                    "start_date": term.start_date.isoformat() if term.start_date else None
                })

        # Sort terms by date
        terms_list.sort(key=lambda x: x.get("start_date", ""), reverse=True)

        # Calculate overall average
        overall_avg = sum(all_averages) / len(all_averages) if all_averages else 0.0

        # Find best term
        best_term = max(terms_list, key=lambda x: x["average_score"]) if terms_list else None

        # Determine improvement trend
        improvement_trend = "stable"
        if len(all_averages) >= 2:
            recent_avg = sum(all_averages[:2]) / 2 if len(all_averages) >= 2 else all_averages[0]
            older_avg = sum(all_averages[-2:]) / 2 if len(all_averages) >= 2 else all_averages[-1]

            if recent_avg > older_avg + 5:
                improvement_trend = "improving"
            elif recent_avg < older_avg - 5:
                improvement_trend = "declining"

        return {
            "student_id": student_id,
            "terms": terms_list,
            "overall_average": round(overall_avg, 2),
            "best_term": best_term,
            "improvement_trend": improvement_trend,
            "subject_performance": []  # Can be enhanced later with subject-specific trends
        }

    # Class History Management
    @staticmethod
    async def create_class_history(
        db: AsyncSession,
        student_id: str,
        class_id: str,
        term_id: str,
        academic_session: str,
        school_id: str,
        enrollment_date: date = None,
        status: ClassHistoryStatus = ClassHistoryStatus.ACTIVE
    ) -> StudentClassHistory:
        """Create a class history record for a student"""
        if enrollment_date is None:
            enrollment_date = date.today()

        # Check if record already exists
        existing_result = await db.execute(
            select(StudentClassHistory).where(
                StudentClassHistory.student_id == student_id,
                StudentClassHistory.term_id == term_id,
                StudentClassHistory.school_id == school_id,
                StudentClassHistory.is_deleted == False
            )
        )
        existing = existing_result.scalar_one_or_none()

        if existing:
            # Update existing record
            existing.class_id = class_id
            existing.academic_session = academic_session
            existing.status = status
            existing.is_current = (status == ClassHistoryStatus.ACTIVE)
            await db.commit()
            await db.refresh(existing)
            return existing

        # Create new record
        history = StudentClassHistory(
            student_id=student_id,
            class_id=class_id,
            term_id=term_id,
            academic_session=academic_session,
            school_id=school_id,
            enrollment_date=enrollment_date,
            status=status,
            is_current=(status == ClassHistoryStatus.ACTIVE)
        )

        db.add(history)
        await db.commit()
        await db.refresh(history)

        return history

    @staticmethod
    async def update_class_history_status(
        db: AsyncSession,
        history_id: str,
        status: ClassHistoryStatus,
        school_id: str,
        promoted_to_class_id: Optional[str] = None,
        promotion_date: Optional[date] = None,
        remarks: Optional[str] = None
    ) -> Optional[StudentClassHistory]:
        """Update class history status (e.g., mark as completed, promoted)"""
        result = await db.execute(
            select(StudentClassHistory).where(
                StudentClassHistory.id == history_id,
                StudentClassHistory.school_id == school_id,
                StudentClassHistory.is_deleted == False
            )
        )
        history = result.scalar_one_or_none()

        if not history:
            return None

        history.status = status
        history.is_current = (status == ClassHistoryStatus.ACTIVE)

        if status == ClassHistoryStatus.COMPLETED:
            history.completion_date = date.today()

        if promoted_to_class_id:
            history.promoted_to_class_id = promoted_to_class_id
            history.promotion_date = promotion_date or date.today()

        if remarks:
            history.remarks = remarks

        await db.commit()
        await db.refresh(history)

        # Notify Student on Promotion
        if promoted_to_class_id:
            # Get user_id
            student_res = await db.execute(select(Student.user_id).where(Student.id == history.student_id))
            user_id = student_res.scalar_one_or_none()
            
            if user_id:
                # Get class name
                class_res = await db.execute(select(Class.name).where(Class.id == promoted_to_class_id))
                class_name = class_res.scalar_one_or_none()
                
                await NotificationService.create_notification(
                    db=db,
                    school_id=school_id,
                    notification_data=NotificationCreate(
                        user_id=user_id,
                        title="Promotion",
                        message=f"Congratulations! You have been promoted to {class_name}.",
                        type=NotificationType.SUCCESS,
                        link="/academics/classes"
                    )
                )

        return history

    @staticmethod
    async def set_current_class_history(
        db: AsyncSession,
        student_id: str,
        term_id: str,
        school_id: str
    ) -> None:
        """Set all class history records for a student to not current except the specified term"""
        # Get all history records for the student
        result = await db.execute(
            select(StudentClassHistory).where(
                StudentClassHistory.student_id == student_id,
                StudentClassHistory.school_id == school_id,
                StudentClassHistory.is_deleted == False
            )
        )
        histories = result.scalars().all()

        for history in histories:
            if history.term_id == term_id:
                history.is_current = True
                history.status = ClassHistoryStatus.ACTIVE
            else:
                history.is_current = False
                if history.status == ClassHistoryStatus.ACTIVE:
                    history.status = ClassHistoryStatus.COMPLETED

        await db.commit()
