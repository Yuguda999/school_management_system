#!/usr/bin/env python3
"""
Debug script to check teacher student access issue
"""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import async_engine

async def debug_teacher_issue():
    """Debug the teacher student access issue"""
    async with async_engine.begin() as conn:
        print("=== DEBUGGING TEACHER STUDENT ACCESS ===")
        
        # 1. Check if teacher exists
        teacher_query = text("""
            SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.school_id
            FROM users u
            WHERE u.email = 'ms.yuguda0@gmail.com'
        """)
        
        result = await conn.execute(teacher_query)
        teacher = result.fetchone()
        
        if not teacher:
            print("❌ Teacher not found!")
            return
            
        print(f"✅ Teacher found: {teacher.first_name} {teacher.last_name}")
        print(f"   Email: {teacher.email}")
        print(f"   Role: {teacher.role}")
        print(f"   School ID: {teacher.school_id}")
        print()
        
        # 2. Check classes where teacher is class teacher
        class_query = text("""
            SELECT c.id, c.name, c.teacher_id
            FROM classes c
            WHERE c.teacher_id = :teacher_id
            AND c.is_deleted = false
        """)
        
        result = await conn.execute(class_query, {"teacher_id": teacher.id})
        classes = result.fetchall()
        
        print(f"Classes where teacher is class teacher: {len(classes)}")
        for cls in classes:
            print(f"  - {cls.name} (ID: {cls.id})")
        print()
        
        # 3. Check students in those classes
        if classes:
            for cls in classes:
                student_query = text("""
                    SELECT s.id, s.first_name, s.last_name, s.admission_number, s.current_class_id
                    FROM students s
                    WHERE s.current_class_id = :class_id
                    AND s.is_deleted = false
                """)
                
                result = await conn.execute(student_query, {"class_id": cls.id})
                students = result.fetchall()
                
                print(f"Students in {cls.name}: {len(students)}")
                for student in students:
                    print(f"  - {student.first_name} {student.last_name} ({student.admission_number})")
                print()
        
        # 4. Test the exact SQL query from get_teacher_students
        print("=== Testing get_teacher_students SQL query ===")
        
        test_query = text("""
            SELECT DISTINCT s.id, s.first_name, s.last_name, s.admission_number
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
            ORDER BY s.first_name, s.last_name
        """)
        
        result = await conn.execute(test_query, {
            "teacher_id": teacher.id,
            "school_id": teacher.school_id
        })
        query_students = result.fetchall()
        
        print(f"SQL query returned: {len(query_students)} students")
        for student in query_students:
            print(f"  - {student.first_name} {student.last_name} ({student.admission_number})")
        print()
        
        # 5. Check teacher subjects
        teacher_subjects_query = text("""
            SELECT ts.id, s.name, s.code, ts.is_head_of_subject
            FROM teacher_subjects ts
            JOIN subjects s ON ts.subject_id = s.id
            WHERE ts.teacher_id = :teacher_id
            AND ts.is_deleted = false
        """)
        
        result = await conn.execute(teacher_subjects_query, {"teacher_id": teacher.id})
        teacher_subjects = result.fetchall()
        
        print(f"Teacher subjects: {len(teacher_subjects)}")
        for subject in teacher_subjects:
            print(f"  - {subject.name} ({subject.code}) - Head: {subject.is_head_of_subject}")
        print()
        
        # 6. Check enrollments
        enrollments_query = text("""
            SELECT e.id, e.student_id, e.subject_id, e.is_active,
                   s.first_name, s.last_name, sub.name as subject_name
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN subjects sub ON e.subject_id = sub.id
            WHERE s.school_id = :school_id
            AND e.is_active = true
        """)
        
        result = await conn.execute(enrollments_query, {"school_id": teacher.school_id})
        enrollments = result.fetchall()
        
        print(f"Active enrollments in school: {len(enrollments)}")
        for enrollment in enrollments[:5]:  # Show first 5
            print(f"  - {enrollment.first_name} {enrollment.last_name} -> {enrollment.subject_name}")
        if len(enrollments) > 5:
            print(f"  ... and {len(enrollments) - 5} more")

if __name__ == "__main__":
    asyncio.run(debug_teacher_issue())
