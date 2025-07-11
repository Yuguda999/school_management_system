#!/usr/bin/env python3
"""
Demo script for School Management System API
This script demonstrates how to use the main API endpoints.
"""

import requests
import json
import sys
import random
from datetime import date, datetime

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def demo_school_registration():
    """Demo school registration"""
    print("=" * 60)
    print("DEMO: School Registration")
    print("=" * 60)

    # Generate unique school code
    unique_id = random.randint(1000, 9999)

    school_data = {
        "name": f"Demo High School {unique_id}",
        "code": f"DHS{unique_id}",
        "email": f"admin{unique_id}@demohighschool.edu",
        "phone": "+1234567890",
        "website": "https://demohighschool.edu",
        "address_line1": "123 Education Street",
        "city": "Demo City",
        "state": "Demo State",
        "postal_code": "12345",
        "country": "Demo Country",
        "description": "A demo school for testing the management system",
        "motto": "Excellence in Education",
        "established_year": "2020",
        "current_session": "2023/2024",
        "current_term": "First Term",
        "admin_first_name": "John",
        "admin_last_name": "Administrator",
        "admin_email": f"admin{unique_id}@demohighschool.edu",
        "admin_password": "SecurePassword123!",
        "admin_phone": "+1234567890"
    }
    
    try:
        response = requests.post(f"{API_BASE}/schools/register", json=school_data)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ School registered successfully!")
            print(f"  School ID: {result['school']['id']}")
            print(f"  School Name: {result['school']['name']}")
            print(f"  Admin ID: {result['admin_user_id']}")
            print(f"  Message: {result['message']}")
            # Return both result and the unique email for login
            return {**result, 'admin_email': f"admin{unique_id}@demohighschool.edu"}
        else:
            print(f"✗ Registration failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Registration error: {e}")
        return None

def demo_login(email, password):
    """Demo user login"""
    print("\n" + "=" * 60)
    print("DEMO: User Login")
    print("=" * 60)
    
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", json=login_data)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Login successful!")
            print(f"  User ID: {result['user_id']}")
            print(f"  Email: {result['email']}")
            print(f"  Role: {result['role']}")
            print(f"  Access Token: {result['access_token'][:50]}...")
            return result['access_token']
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Login error: {e}")
        return None

def demo_create_class(token):
    """Demo class creation"""
    print("\n" + "=" * 60)
    print("DEMO: Create Class")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    class_data = {
        "name": "Grade 10A",
        "level": "ss_1",
        "section": "A",
        "capacity": 30,
        "academic_session": "2023/2024",
        "description": "Senior Secondary 1, Section A"
    }
    
    try:
        response = requests.post(f"{API_BASE}/classes/", json=class_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Class created successfully!")
            print(f"  Class ID: {result['id']}")
            print(f"  Class Name: {result['name']}")
            print(f"  Level: {result['level']}")
            print(f"  Capacity: {result['capacity']}")
            return result
        else:
            print(f"✗ Class creation failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Class creation error: {e}")
        return None

def demo_create_subject(token):
    """Demo subject creation"""
    print("\n" + "=" * 60)
    print("DEMO: Create Subject")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    subject_data = {
        "name": "Mathematics",
        "code": "MATH101",
        "description": "Advanced Mathematics for Senior Secondary",
        "is_core": True,
        "credit_units": 4
    }
    
    try:
        response = requests.post(f"{API_BASE}/subjects/", json=subject_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Subject created successfully!")
            print(f"  Subject ID: {result['id']}")
            print(f"  Subject Name: {result['name']}")
            print(f"  Subject Code: {result['code']}")
            print(f"  Credit Units: {result['credit_units']}")
            return result
        else:
            print(f"✗ Subject creation failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Subject creation error: {e}")
        return None

def demo_create_term(token):
    """Demo term creation"""
    print("\n" + "=" * 60)
    print("DEMO: Create Term")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    term_data = {
        "name": "First Term",
        "type": "first_term",
        "academic_session": "2023/2024",
        "start_date": "2023-09-01",
        "end_date": "2023-12-15",
        "is_current": True
    }
    
    try:
        response = requests.post(f"{API_BASE}/terms/", json=term_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Term created successfully!")
            print(f"  Term ID: {result['id']}")
            print(f"  Term Name: {result['name']}")
            print(f"  Academic Session: {result['academic_session']}")
            print(f"  Start Date: {result['start_date']}")
            print(f"  End Date: {result['end_date']}")
            return result
        else:
            print(f"✗ Term creation failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Term creation error: {e}")
        return None

def demo_get_school_info(token):
    """Demo getting school information"""
    print("\n" + "=" * 60)
    print("DEMO: Get School Information")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE}/schools/me", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ School information retrieved!")
            print(f"  School Name: {result['name']}")
            print(f"  School Code: {result['code']}")
            print(f"  Email: {result['email']}")
            print(f"  Current Session: {result['current_session']}")
            print(f"  Current Term: {result['current_term']}")
            print(f"  Status: {'Active' if result['is_active'] else 'Inactive'}")
            return result
        else:
            print(f"✗ Failed to get school info: {response.status_code}")
            print(f"  Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ School info error: {e}")
        return None

def main():
    """Run the demo"""
    print("🏫 SCHOOL MANAGEMENT SYSTEM API DEMO")
    print("=" * 60)
    print("This demo will show you how to use the main API endpoints.")
    print("Make sure the server is running on http://localhost:8000")
    print()
    
    # Step 1: Register a school
    registration_result = demo_school_registration()
    if not registration_result:
        print("\n❌ Demo failed at school registration step.")
        return 1
    
    # Step 2: Login as admin
    admin_email = registration_result['admin_email']  # From registration
    admin_password = "SecurePassword123!"  # From registration
    
    token = demo_login(admin_email, admin_password)
    if not token:
        print("\n❌ Demo failed at login step.")
        return 1
    
    # Step 3: Get school information
    school_info = demo_get_school_info(token)
    if not school_info:
        print("\n❌ Demo failed at getting school info.")
        return 1
    
    # Step 4: Create a class
    class_result = demo_create_class(token)
    if not class_result:
        print("\n❌ Demo failed at class creation.")
        return 1
    
    # Step 5: Create a subject
    subject_result = demo_create_subject(token)
    if not subject_result:
        print("\n❌ Demo failed at subject creation.")
        return 1
    
    # Step 6: Create a term
    term_result = demo_create_term(token)
    if not term_result:
        print("\n❌ Demo failed at term creation.")
        return 1
    
    print("\n" + "=" * 60)
    print("🎉 DEMO COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("You have successfully:")
    print("✓ Registered a school")
    print("✓ Logged in as admin")
    print("✓ Retrieved school information")
    print("✓ Created a class")
    print("✓ Created a subject")
    print("✓ Created a term")
    print()
    print("Next steps you can try:")
    print("• Create students and enroll them in classes")
    print("• Create fee structures and assign them to students")
    print("• Create exams and record grades")
    print("• Send messages and announcements")
    print()
    print(f"📚 API Documentation: {BASE_URL}/api/v1/docs")
    print(f"🔍 Alternative Docs: {BASE_URL}/api/v1/redoc")
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
