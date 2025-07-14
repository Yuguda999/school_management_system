from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import date

from app.models.student import Student
from app.models.user import User, UserRole
from app.models.academic import Class
from app.schemas.student import StudentCreate, StudentUpdate
from app.services.enrollment_service import EnrollmentService
from app.utils.enum_converter import convert_gender_enum, convert_student_status_enum
from datetime import datetime


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
        school_id: str
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
            selectinload(Student.class_),
            selectinload(Student.parent),
            selectinload(Student.user)
        ).where(
            Student.school_id == school_id,
            Student.is_deleted == False
        )
        
        if class_id:
            query = query.where(Student.class_id == class_id)
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
                selectinload(Student.class_),
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
        school_id: str
    ) -> Optional[Student]:
        """Update student"""
        student = await StudentService.get_student_by_id(db, student_id, school_id)
        if not student:
            return None
        
        # Check if new admission number conflicts
        if student_data.admission_number and student_data.admission_number != student.admission_number:
            result = await db.execute(
                select(Student).where(
                    Student.admission_number == student_data.admission_number,
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
        
        # Check if class is changing
        old_class_id = student.current_class_id
        new_class_id = student_data.class_id if hasattr(student_data, 'class_id') and student_data.class_id is not None else old_class_id

        # Update fields
        update_data = student_data.dict(exclude_unset=True)
        for field, value in update_data.items():
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

        return student
    
    @staticmethod
    async def delete_student(
        db: AsyncSession,
        student_id: str,
        school_id: str
    ) -> bool:
        """Soft delete student"""
        student = await StudentService.get_student_by_id(db, student_id, school_id)
        if not student:
            return False
        
        student.is_deleted = True
        await db.commit()
        
        return True
    
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
        params["limit"] = str(limit)
        params["skip"] = str(skip)

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
                   s.medical_conditions, s.allergies, s.blood_group, s.profile_picture_url, s.notes
            FROM students s
            JOIN enrollments e ON s.id = e.student_id
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
                   s.medical_conditions, s.allergies, s.blood_group, s.profile_picture_url, s.notes
            FROM students s
            JOIN enrollments e ON s.id = e.student_id
            JOIN teacher_subjects ts ON e.subject_id = ts.subject_id
            WHERE ts.teacher_id = :teacher_id
            AND ts.subject_id = :subject_id
            AND s.school_id = :school_id
            AND s.is_deleted = false
            AND ts.is_deleted = false
            AND e.is_active = true
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
            students.append(student)

        return students
