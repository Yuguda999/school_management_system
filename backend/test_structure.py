#!/usr/bin/env python3
"""
Simple structure test for the school management system backend.
This script tests the project structure without requiring external dependencies.
"""

import os
import sys
from pathlib import Path

def test_directory_structure():
    """Test that all required directories exist"""
    print("Testing directory structure...")
    
    required_dirs = [
        "app",
        "app/api",
        "app/api/v1",
        "app/api/v1/endpoints",
        "app/core",
        "app/models",
        "app/schemas",
        "app/services",
        "tests",
        "alembic"
    ]
    
    missing_dirs = []
    for dir_path in required_dirs:
        if os.path.exists(dir_path) and os.path.isdir(dir_path):
            print(f"✓ {dir_path}/ exists")
        else:
            print(f"✗ {dir_path}/ missing")
            missing_dirs.append(dir_path)
    
    return len(missing_dirs) == 0

def test_required_files():
    """Test that all required files exist"""
    print("\nTesting required files...")
    
    required_files = [
        "app/__init__.py",
        "app/main.py",
        "app/core/__init__.py",
        "app/core/config.py",
        "app/core/database.py",
        "app/core/security.py",
        "app/core/deps.py",
        "app/models/__init__.py",
        "app/models/base.py",
        "app/models/school.py",
        "app/models/user.py",
        "app/models/student.py",
        "app/models/academic.py",
        "app/models/fee.py",
        "app/models/grade.py",
        "app/models/communication.py",
        "app/schemas/__init__.py",
        "app/schemas/auth.py",
        "app/schemas/school.py",
        "app/schemas/user.py",
        "app/schemas/student.py",
        "app/schemas/academic.py",
        "app/schemas/fee.py",
        "app/schemas/grade.py",
        "app/schemas/communication.py",
        "app/services/__init__.py",
        "app/api/__init__.py",
        "app/api/v1/__init__.py",
        "app/api/v1/api.py",
        "app/api/v1/endpoints/__init__.py",
        "app/api/v1/endpoints/auth.py",
        "app/api/v1/endpoints/schools.py",
        "app/api/v1/endpoints/users.py",
        "app/api/v1/endpoints/students.py",
        "app/api/v1/endpoints/classes.py",
        "app/api/v1/endpoints/subjects.py",
        "app/api/v1/endpoints/terms.py",
        "app/api/v1/endpoints/fees.py",
        "app/api/v1/endpoints/grades.py",
        "app/api/v1/endpoints/communication.py",
        "requirements.txt",
        "run.py",
        ".env",
        "alembic.ini"
    ]
    
    missing_files = []
    for file_path in required_files:
        if os.path.exists(file_path) and os.path.isfile(file_path):
            print(f"✓ {file_path}")
        else:
            print(f"✗ {file_path} missing")
            missing_files.append(file_path)
    
    return len(missing_files) == 0

def test_python_syntax():
    """Test that Python files have valid syntax"""
    print("\nTesting Python file syntax...")
    
    python_files = []
    for root, dirs, files in os.walk("app"):
        for file in files:
            if file.endswith(".py"):
                python_files.append(os.path.join(root, file))
    
    syntax_errors = []
    for file_path in python_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Try to compile the file
            compile(content, file_path, 'exec')
            print(f"✓ {file_path} - syntax OK")
            
        except SyntaxError as e:
            print(f"✗ {file_path} - syntax error: {e}")
            syntax_errors.append((file_path, str(e)))
        except Exception as e:
            print(f"? {file_path} - could not check: {e}")
    
    return len(syntax_errors) == 0

def test_imports_structure():
    """Test basic import structure (without actually importing)"""
    print("\nTesting import structure...")
    
    # Check if main.py has the expected structure
    try:
        with open("app/main.py", 'r') as f:
            content = f.read()
        
        expected_patterns = [
            "from fastapi import",
            "app = FastAPI",
            "include_router"
        ]
        
        for pattern in expected_patterns:
            if pattern in content:
                print(f"✓ app/main.py contains '{pattern}'")
            else:
                print(f"✗ app/main.py missing '{pattern}'")
                return False
        
        return True
        
    except Exception as e:
        print(f"✗ Could not check app/main.py: {e}")
        return False

def test_configuration_files():
    """Test configuration files"""
    print("\nTesting configuration files...")
    
    # Check .env file
    if os.path.exists(".env"):
        print("✓ .env file exists")
        try:
            with open(".env", 'r') as f:
                env_content = f.read()
            
            required_env_vars = [
                "DATABASE_URL",
                "SECRET_KEY",
                "APP_NAME"
            ]
            
            for var in required_env_vars:
                if var in env_content:
                    print(f"✓ .env contains {var}")
                else:
                    print(f"✗ .env missing {var}")
                    return False
        except Exception as e:
            print(f"✗ Could not read .env: {e}")
            return False
    else:
        print("✗ .env file missing")
        return False
    
    # Check requirements.txt
    if os.path.exists("requirements.txt"):
        print("✓ requirements.txt exists")
        try:
            with open("requirements.txt", 'r') as f:
                req_content = f.read()
            
            required_packages = [
                "fastapi",
                "uvicorn",
                "sqlalchemy",
                "pydantic"
            ]
            
            for package in required_packages:
                if package in req_content.lower():
                    print(f"✓ requirements.txt contains {package}")
                else:
                    print(f"✗ requirements.txt missing {package}")
                    return False
        except Exception as e:
            print(f"✗ Could not read requirements.txt: {e}")
            return False
    else:
        print("✗ requirements.txt missing")
        return False
    
    return True

def main():
    """Run all tests"""
    print("=" * 60)
    print("SCHOOL MANAGEMENT SYSTEM BACKEND - STRUCTURE TEST")
    print("=" * 60)
    
    tests = [
        ("Directory Structure", test_directory_structure),
        ("Required Files", test_required_files),
        ("Python Syntax", test_python_syntax),
        ("Import Structure", test_imports_structure),
        ("Configuration Files", test_configuration_files)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'-' * 40}")
        print(f"Running: {test_name}")
        print(f"{'-' * 40}")
        result = test_func()
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
        print("\n🎉 Backend structure is correct!")
        print("\nNext steps:")
        print("1. Install dependencies: pip3 install -r requirements.txt")
        print("2. Run the application: python3 run.py")
        print("3. Visit http://localhost:8000/docs for API documentation")
    else:
        print(f"\n❌ {total - passed} tests failed. Please fix the issues.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
