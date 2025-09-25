#!/usr/bin/env python3
"""
Simple test script to verify the school management system is working correctly.
This script tests basic functionality without requiring a full test setup.
"""

import asyncio
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

async def test_imports():
    """Test that all modules can be imported successfully"""
    print("Testing imports...")
    
    try:
        # Test core imports
        from app.core.config import settings
        from app.core.database import get_db
        from app.core.security import create_access_token, verify_password
        print("✓ Core modules imported successfully")
        
        # Test model imports
        from app.models.school import School
        from app.models.user import User
        from app.models.student import Student
        from app.models.academic import Class, Subject, Term
        from app.models.fee import FeeStructure, FeePayment
        from app.models.grade import Exam, Grade
        from app.models.communication import Message, Announcement
        print("✓ All models imported successfully")
        
        # Test schema imports
        from app.schemas.school import SchoolCreate, SchoolResponse
        from app.schemas.user import UserCreate, UserResponse
        from app.schemas.student import StudentCreate, StudentResponse
        from app.schemas.academic import ClassCreate, SubjectCreate, TermCreate
        from app.schemas.fee import FeeStructureCreate, FeePaymentCreate
        from app.schemas.grade import ExamCreate, GradeCreate
        from app.schemas.communication import MessageCreate, AnnouncementCreate
        print("✓ All schemas imported successfully")
        
        # Test service imports
        from app.services.school_service import SchoolService
        from app.services.user_service import UserService
        from app.services.student_service import StudentService
        from app.services.academic_service import AcademicService
        from app.services.fee_service import FeeService
        from app.services.grade_service import GradeService
        from app.services.communication_service import CommunicationService
        print("✓ All services imported successfully")
        
        # Test API imports
        from app.api.v1.endpoints import auth, schools, users, students, classes, subjects, terms, fees, grades, communication
        print("✓ All API endpoints imported successfully")
        
        # Test main app
        from app.main import app
        print("✓ Main FastAPI app imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False


def test_configuration():
    """Test configuration settings"""
    print("\nTesting configuration...")
    
    try:
        from app.core.config import settings
        
        # Check that required settings exist
        required_settings = [
            'secret_key',
            'database_url',
            'access_token_expire_minutes',
            'app_name'
        ]
        
        for setting in required_settings:
            if hasattr(settings, setting):
                print(f"✓ {setting} is configured")
            else:
                print(f"✗ {setting} is missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"✗ Configuration error: {e}")
        return False


def test_model_definitions():
    """Test that models are properly defined"""
    print("\nTesting model definitions...")
    
    try:
        from app.models.school import School
        from app.models.user import User
        from app.models.student import Student
        from app.models.academic import Class, Subject, Term
        from app.models.fee import FeeStructure
        from app.models.grade import Exam, Grade
        from app.models.communication import Message
        
        # Test that models have required attributes
        models_to_test = [
            (School, ['name', 'email', 'phone', 'address_line1']),
            (User, ['email', 'full_name', 'role', 'school_id']),
            (Student, ['admission_number', 'first_name', 'last_name', 'school_id']),
            (Class, ['name', 'level', 'school_id']),
            (Subject, ['name', 'code', 'school_id']),
            (Term, ['name', 'type', 'academic_session', 'school_id']),
            (FeeStructure, ['name', 'amount', 'school_id']),
            (Exam, ['name', 'exam_type', 'total_marks', 'school_id']),
            (Grade, ['score', 'student_id', 'exam_id', 'school_id']),
            (Message, ['subject', 'content', 'message_type', 'school_id'])
        ]
        
        for model, required_attrs in models_to_test:
            model_name = model.__name__
            for attr in required_attrs:
                if hasattr(model, attr):
                    print(f"✓ {model_name}.{attr} exists")
                else:
                    print(f"✗ {model_name}.{attr} is missing")
                    return False
        
        return True
        
    except Exception as e:
        print(f"✗ Model definition error: {e}")
        return False


def test_api_structure():
    """Test API structure"""
    print("\nTesting API structure...")
    
    try:
        from app.api.v1.api import api_router
        from fastapi import FastAPI
        
        # Create a test app and include the router
        test_app = FastAPI()
        test_app.include_router(api_router, prefix="/api/v1")
        
        # Check that routes are registered
        routes = [route.path for route in test_app.routes]
        
        expected_route_prefixes = [
            "/api/v1/auth",
            "/api/v1/schools",
            "/api/v1/users",
            "/api/v1/students",
            "/api/v1/classes",
            "/api/v1/subjects",
            "/api/v1/terms",
            "/api/v1/fees",
            "/api/v1/grades",
            "/api/v1/communication"
        ]
        
        for prefix in expected_route_prefixes:
            if any(route.startswith(prefix) for route in routes):
                print(f"✓ {prefix} routes are registered")
            else:
                print(f"✗ {prefix} routes are missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"✗ API structure error: {e}")
        return False


def test_enum_definitions():
    """Test that enums are properly defined"""
    print("\nTesting enum definitions...")
    
    try:
        from app.models.user import UserRole
        from app.models.academic import ClassLevel, TermType
        from app.models.fee import PaymentStatus, PaymentMethod
        from app.models.grade import ExamType, GradeScale
        from app.models.communication import MessageType, MessageStatus
        
        # Test that enums have expected values
        enum_tests = [
            (UserRole, ['PLATFORM_SUPER_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
            (ClassLevel, ['NURSERY_1', 'PRIMARY_1', 'JSS_1', 'SS_1']),
            (TermType, ['FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM']),
            (PaymentStatus, ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']),
            (PaymentMethod, ['CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE_MONEY']),
            (ExamType, ['CONTINUOUS_ASSESSMENT', 'MID_TERM', 'FINAL_EXAM']),
            (GradeScale, ['A_PLUS', 'A', 'B', 'C', 'D', 'F']),
            (MessageType, ['SMS', 'EMAIL', 'NOTIFICATION']),
            (MessageStatus, ['DRAFT', 'SENT', 'DELIVERED', 'READ', 'FAILED'])
        ]
        
        for enum_class, expected_values in enum_tests:
            enum_name = enum_class.__name__
            for value in expected_values:
                if hasattr(enum_class, value):
                    print(f"✓ {enum_name}.{value} exists")
                else:
                    print(f"✗ {enum_name}.{value} is missing")
                    return False
        
        return True
        
    except Exception as e:
        print(f"✗ Enum definition error: {e}")
        return False


async def main():
    """Run all tests"""
    print("=" * 60)
    print("SCHOOL MANAGEMENT SYSTEM - BASIC FUNCTIONALITY TEST")
    print("=" * 60)
    
    tests = [
        ("Import Test", test_imports()),
        ("Configuration Test", test_configuration()),
        ("Model Definition Test", test_model_definitions()),
        ("API Structure Test", test_api_structure()),
        ("Enum Definition Test", test_enum_definitions())
    ]
    
    results = []
    for test_name, test_func in tests:
        if asyncio.iscoroutine(test_func):
            result = await test_func
        else:
            result = test_func
        results.append((test_name, result))
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "PASSED" if result else "FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! The school management system is ready to use.")
        print("\nNext steps:")
        print("1. Set up your database (PostgreSQL recommended)")
        print("2. Update the DATABASE_URL in your environment variables")
        print("3. Run database migrations: alembic upgrade head")
        print("4. Start the server: uvicorn app.main:app --reload")
        print("5. Visit http://localhost:8000/docs for API documentation")
    else:
        print(f"\n❌ {total - passed} tests failed. Please fix the issues before proceeding.")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
