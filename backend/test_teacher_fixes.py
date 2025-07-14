#!/usr/bin/env python3
"""
Test script to verify classroom teacher fixes
"""
import asyncio
import sys
import os
sys.path.append('.')

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_engine
from app.services.student_service import StudentService
from app.services.teacher_subject_service import TeacherSubjectService
from sqlalchemy import text

async def test_teacher_fixes():
    """Test the classroom teacher fixes"""
    async with async_engine.begin() as conn:
        # Get the classroom teacher for Primary 1-B
        teacher_query = text("""
            SELECT u.id, u.first_name, u.last_name, u.email, c.name as class_name
            FROM users u
            JOIN classes c ON u.id = c.teacher_id
            WHERE u.email = 'ms.yuguda0@gmail.com'
            AND u.role = 'TEACHER'
        """)
        
        result = await conn.execute(teacher_query)
        teacher = result.fetchone()
        
        if not teacher:
            print("❌ Teacher not found")
            return
        
        print(f"✅ Found teacher: {teacher.first_name} {teacher.last_name} ({teacher.email})")
        print(f"   Class: {teacher.class_name}")
        print()
        
        # Get school_id for this teacher
        school_query = text("SELECT school_id FROM users WHERE id = :teacher_id")
        school_result = await conn.execute(school_query, {"teacher_id": teacher.id})
        school_id = school_result.scalar()
        
        print(f"School ID: {school_id}")
        print()
        
        # Test 1: Check students accessible to this teacher
        print("=== TEST 1: Students accessible to teacher ===")
        
        # Use the updated get_teacher_students method
        async with async_engine.begin() as db:
            students = await StudentService.get_teacher_students(
                db, teacher.id, school_id
            )
            
            print(f"Found {len(students)} students accessible to teacher:")
            for student in students:
                print(f"  - {student.first_name} {student.last_name} ({student.admission_number})")
        
        print()
        
        # Test 2: Check subjects accessible to this teacher
        print("=== TEST 2: Subjects accessible to teacher ===")
        
        async with async_engine.begin() as db:
            subjects = await TeacherSubjectService.get_teacher_subjects(
                db, teacher.id, school_id
            )
            
            print(f"Found {len(subjects)} subjects accessible to teacher:")
            for subject in subjects:
                print(f"  - {subject.subject_name} ({subject.subject_code})")
                print(f"    Head of Subject: {subject.is_head_of_subject}")
        
        print()
        
        # Test 3: Check class subjects for Primary 1-B
        print("=== TEST 3: Class subjects for Primary 1-B ===")
        
        class_subjects_query = text("""
            SELECT s.name, s.code, cs.is_core
            FROM class_subjects cs
            JOIN subjects s ON cs.subject_id = s.id
            JOIN classes c ON cs.class_id = c.id
            WHERE c.name = 'Primary 1-B'
            AND cs.is_deleted = false
        """)
        
        result = await conn.execute(class_subjects_query)
        class_subjects = result.fetchall()
        
        print(f"Found {len(class_subjects)} subjects assigned to Primary 1-B:")
        for subject in class_subjects:
            print(f"  - {subject.name} ({subject.code}) - Core: {subject.is_core}")
        
        print()
        
        # Test 4: Check student enrollments in Primary 1-B
        print("=== TEST 4: Student enrollments in Primary 1-B ===")
        
        enrollments_query = text("""
            SELECT s.first_name, s.last_name, sub.name as subject_name, e.is_active
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN subjects sub ON e.subject_id = sub.id
            JOIN classes c ON e.class_id = c.id
            WHERE c.name = 'Primary 1-B'
            AND e.is_deleted = false
            ORDER BY s.first_name, sub.name
        """)
        
        result = await conn.execute(enrollments_query)
        enrollments = result.fetchall()
        
        print(f"Found {len(enrollments)} enrollments in Primary 1-B:")
        current_student = None
        for enrollment in enrollments:
            if current_student != f"{enrollment.first_name} {enrollment.last_name}":
                current_student = f"{enrollment.first_name} {enrollment.last_name}"
                print(f"  {current_student}:")
            print(f"    - {enrollment.subject_name} (Active: {enrollment.is_active})")
        
        print()
        print("✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(test_teacher_fixes())
