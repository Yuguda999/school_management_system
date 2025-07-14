#!/usr/bin/env python3
"""
Script to auto-enroll all students in their class subjects
"""
import asyncio
import sys
import os
sys.path.append('.')

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine
from app.services.enrollment_service import EnrollmentService
from sqlalchemy import text

async def fix_enrollments():
    """Auto-enroll all students in their class subjects"""
    async with engine.begin() as conn:
        # Get all students with their classes
        students_query = text("""
            SELECT s.id as student_id, s.first_name, s.last_name, 
                   s.current_class_id, c.name as class_name, s.school_id
            FROM students s
            JOIN classes c ON s.current_class_id = c.id
            WHERE s.is_deleted = false 
            AND c.is_deleted = false
            AND s.current_class_id IS NOT NULL
        """)
        
        result = await conn.execute(students_query)
        students = result.fetchall()
        
        print(f"Found {len(students)} students to process")
        
        # Process each student
        for student in students:
            print(f"\nProcessing {student.first_name} {student.last_name} in {student.class_name}")
            
            # Get class subjects
            class_subjects_query = text("""
                SELECT cs.subject_id, s.name as subject_name
                FROM class_subjects cs
                JOIN subjects s ON cs.subject_id = s.id
                WHERE cs.class_id = :class_id
                AND cs.is_deleted = false
                AND s.is_deleted = false
            """)
            
            subjects_result = await conn.execute(class_subjects_query, {
                "class_id": student.current_class_id
            })
            class_subjects = subjects_result.fetchall()
            
            print(f"  Class has {len(class_subjects)} subjects: {[s.subject_name for s in class_subjects]}")
            
            # Check current enrollments
            current_enrollments_query = text("""
                SELECT e.subject_id, s.name as subject_name
                FROM enrollments e
                JOIN subjects s ON e.subject_id = s.id
                WHERE e.student_id = :student_id
                AND e.is_deleted = false
                AND e.is_active = true
            """)
            
            enrollments_result = await conn.execute(current_enrollments_query, {
                "student_id": student.student_id
            })
            current_enrollments = enrollments_result.fetchall()
            current_subject_ids = [e.subject_id for e in current_enrollments]
            
            print(f"  Currently enrolled in {len(current_enrollments)} subjects: {[e.subject_name for e in current_enrollments]}")
            
            # Find missing enrollments
            missing_subjects = [s for s in class_subjects if s.subject_id not in current_subject_ids]
            
            if missing_subjects:
                print(f"  Need to enroll in {len(missing_subjects)} subjects: {[s.subject_name for s in missing_subjects]}")
                
                # Get current term
                term_query = text("""
                    SELECT id FROM terms 
                    WHERE school_id = :school_id 
                    AND is_current = true 
                    AND is_deleted = false
                    LIMIT 1
                """)
                
                term_result = await conn.execute(term_query, {"school_id": student.school_id})
                current_term = term_result.scalar_one_or_none()
                
                if not current_term:
                    print(f"  WARNING: No current term found for school {student.school_id}")
                    continue
                
                # Create enrollments
                for subject in missing_subjects:
                    enrollment_id = __import__('uuid').uuid4().hex
                    enrollment_date = __import__('datetime').date.today().isoformat()
                    now = __import__('datetime').datetime.now().isoformat()
                    
                    insert_query = text("""
                        INSERT INTO enrollments (
                            id, student_id, class_id, subject_id, term_id, school_id,
                            enrollment_date, is_active, created_at, updated_at, is_deleted
                        ) VALUES (
                            :id, :student_id, :class_id, :subject_id, :term_id, :school_id,
                            :enrollment_date, true, :created_at, :updated_at, false
                        )
                    """)
                    
                    await conn.execute(insert_query, {
                        "id": enrollment_id,
                        "student_id": student.student_id,
                        "class_id": student.current_class_id,
                        "subject_id": subject.subject_id,
                        "term_id": current_term,
                        "school_id": student.school_id,
                        "enrollment_date": enrollment_date,
                        "created_at": now,
                        "updated_at": now
                    })
                    
                    print(f"    ✓ Enrolled in {subject.subject_name}")
            else:
                print(f"  ✓ Already enrolled in all class subjects")
        
        print(f"\n✅ Enrollment fix completed for {len(students)} students")

if __name__ == "__main__":
    asyncio.run(fix_enrollments())
