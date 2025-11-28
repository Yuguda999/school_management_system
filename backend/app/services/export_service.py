from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
import csv
import io

from app.models.student import Student, StudentStatus
from app.models.user import User, UserRole


class ExportService:
    @staticmethod
    async def export_students_csv(
        db: AsyncSession,
        school_id: str,
        class_id: Optional[str] = None,
        status: Optional[StudentStatus] = None,
        search: Optional[str] = None
    ) -> str:
        """
        Generate CSV content for students export with filters
        """
        # Build query with filters
        query = select(Student).options(
            selectinload(Student.current_class),
            selectinload(Student.parent)
        ).where(
            Student.school_id == school_id,
            Student.is_deleted == False
        )
        
        # Apply filters
        if class_id:
            query = query.where(Student.current_class_id == class_id)
        
        if status:
            query = query.where(Student.status == status)
        
        if search:
            search_filter = or_(
                Student.first_name.ilike(f"%{search}%"),
                Student.last_name.ilike(f"%{search}%"),
                Student.admission_number.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        # Execute query
        result = await db.execute(query)
        students = result.scalars().all()
        
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header row
        writer.writerow([
            'Admission Number',
            'First Name',
            'Middle Name',
            'Last Name',
            'Date of Birth',
            'Age',
            'Gender',
            'Email',
            'Phone',
            'Current Class',
            'Status',
            'Admission Date',
            'Parent Name',
            'Guardian Name',
            'Guardian Phone',
            'Guardian Email',
            'Guardian Relationship',
            'Emergency Contact Name',
            'Emergency Contact Phone',
            'Emergency Contact Relationship',
            'Medical Conditions',
            'Allergies',
            'Blood Group',
            'Address Line 1',
            'Address Line 2',
            'City',
            'State',
            'Postal Code'
        ])
        
        # Data rows
        for student in students:
            # Calculate age
            today = datetime.now().date()
            age = today.year - student.date_of_birth.year - (
                (today.month, today.day) < (student.date_of_birth.month, student.date_of_birth.day)
            )
            
            writer.writerow([
                student.admission_number,
                student.first_name,
                student.middle_name or '',
                student.last_name,
                student.date_of_birth.strftime('%Y-%m-%d'),
                age,
                student.gender,
                student.email or '',
                student.phone or '',
                student.current_class.name if student.current_class else '',
                student.status.value if hasattr(student.status, 'value') else str(student.status),
                student.admission_date.strftime('%Y-%m-%d') if student.admission_date else '',
                student.parent.full_name if student.parent else '',
                student.guardian_name or '',
                student.guardian_phone or '',
                student.guardian_email or '',
                student.guardian_relationship or '',
                student.emergency_contact_name or '',
                student.emergency_contact_phone or '',
                student.emergency_contact_relationship or '',
                student.medical_conditions or '',
                student.allergies or '',
                student.blood_group or '',
                student.address_line1 or '',
                student.address_line2 or '',
                student.city or '',
                student.state or '',
                student.postal_code or ''
            ])
        
        return output.getvalue()

    @staticmethod
    async def export_teachers_csv(
        db: AsyncSession,
        school_id: str,
        department: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> str:
        """
        Generate CSV content for teachers export with filters
        """
        from app.models.academic import teacher_subject_association, Subject, Class
        
        # Build query with filters - load taught_classes relationship
        query = select(User).options(
            selectinload(User.taught_classes)
        ).where(
            User.school_id == school_id,
            User.role == UserRole.TEACHER,
            User.is_deleted == False
        )
        
        # Apply filters
        if department:
            query = query.where(User.department == department)
        
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        
        # Execute query
        result = await db.execute(query)
        teachers = result.scalars().all()
        
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header row
        writer.writerow([
            'Employee ID',
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Department',
            'Position',
            'Hire Date',
            'Status',
            'Subjects Taught',
            'Classes Assigned'
        ])
        
        # Data rows
        for teacher in teachers:
            # Get teacher's subjects from the association table
            subjects_query = select(
                teacher_subject_association.c.subject_id
            ).where(
                teacher_subject_association.c.teacher_id == teacher.id,
                teacher_subject_association.c.school_id == school_id,
                teacher_subject_association.c.is_deleted == False
            )
            
            subjects_result = await db.execute(subjects_query)
            subject_ids = [row[0] for row in subjects_result.fetchall()]
            
            # Get subject details
            subjects = set()
            if subject_ids:
                subject_query = select(Subject).where(Subject.id.in_(subject_ids))
                subject_result = await db.execute(subject_query)
                subjects = {s.name for s in subject_result.scalars().all()}
            
            # Get classes through taught_classes relationship
            classes = set()
            if teacher.taught_classes:
                classes = {c.name for c in teacher.taught_classes if not c.is_deleted}
            
            writer.writerow([
                teacher.employee_id or '',
                teacher.first_name,
                teacher.last_name,
                teacher.email,
                teacher.phone or '',
                teacher.department or '',
                teacher.position or 'Teacher',
                teacher.created_at.strftime('%Y-%m-%d') if teacher.created_at else '',
                'Active' if teacher.is_active else 'Inactive',
                ', '.join(sorted(subjects)) if subjects else '',
                ', '.join(sorted(classes)) if classes else ''
            ])
        
        return output.getvalue()
