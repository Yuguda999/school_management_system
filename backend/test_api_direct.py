#!/usr/bin/env python3
"""
Test the API directly to see what's happening with teacher students
"""
import requests
import json

# Test login and get token
def test_teacher_api():
    base_url = "http://localhost:8000"
    
    # Login as classroom teacher
    login_data = {
        "email": "ms.yuguda0@gmail.com",
        "password": "Rafiu"
    }
    
    print("🔐 Logging in as classroom teacher...")
    login_response = requests.post(f"{base_url}/api/v1/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    token_data = login_response.json()
    access_token = token_data.get("access_token")
    
    if not access_token:
        print("❌ No access token received")
        return
    
    print(f"✅ Login successful, token: {access_token[:20]}...")
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Test 1: Get all students (should show teacher's accessible students)
    print("\n📚 Testing GET /api/v1/students/ (all accessible students)")
    students_response = requests.get(f"{base_url}/api/v1/students/", headers=headers)
    
    if students_response.status_code == 200:
        students_data = students_response.json()
        print(f"✅ Found {len(students_data.get('items', []))} students")
        for student in students_data.get('items', []):
            print(f"  - {student.get('first_name')} {student.get('last_name')} ({student.get('admission_number')})")
    else:
        print(f"❌ Failed to get students: {students_response.status_code}")
        print(students_response.text)
    
    # Test 2: Get students for specific class (Primary 1-B)
    print("\n🏫 Testing GET /api/v1/students/?class_id=<Primary 1-B ID>")
    
    # First, get the class ID for Primary 1-B
    classes_response = requests.get(f"{base_url}/api/v1/classes/", headers=headers)
    if classes_response.status_code == 200:
        classes_data = classes_response.json()
        primary_1b_class = None
        for cls in classes_data:
            if cls.get('name') == 'Primary 1-B':
                primary_1b_class = cls
                break
        
        if primary_1b_class:
            class_id = primary_1b_class['id']
            print(f"Found Primary 1-B class ID: {class_id}")
            
            # Get students for this specific class
            class_students_response = requests.get(
                f"{base_url}/api/v1/students/?class_id={class_id}", 
                headers=headers
            )
            
            if class_students_response.status_code == 200:
                class_students_data = class_students_response.json()
                print(f"✅ Found {len(class_students_data.get('items', []))} students in Primary 1-B")
                for student in class_students_data.get('items', []):
                    print(f"  - {student.get('first_name')} {student.get('last_name')} ({student.get('admission_number')})")
            else:
                print(f"❌ Failed to get class students: {class_students_response.status_code}")
                print(class_students_response.text)
        else:
            print("❌ Primary 1-B class not found")
    else:
        print(f"❌ Failed to get classes: {classes_response.status_code}")
    
    # Test 3: Get teacher subjects
    print("\n📖 Testing GET /api/v1/teacher-subjects/teachers/<teacher_id>/subjects")
    
    # Get teacher info first
    profile_response = requests.get(f"{base_url}/api/v1/auth/me", headers=headers)
    if profile_response.status_code == 200:
        teacher_data = profile_response.json()
        teacher_id = teacher_data.get('id')
        print(f"Teacher ID: {teacher_id}")
        
        # Get teacher subjects
        subjects_response = requests.get(
            f"{base_url}/api/v1/teacher-subjects/teachers/{teacher_id}/subjects", 
            headers=headers
        )
        
        if subjects_response.status_code == 200:
            subjects_data = subjects_response.json()
            print(f"✅ Found {len(subjects_data)} subjects for teacher")
            for subject in subjects_data:
                print(f"  - {subject.get('subject_name')} ({subject.get('subject_code')})")
        else:
            print(f"❌ Failed to get teacher subjects: {subjects_response.status_code}")
            print(subjects_response.text)
    else:
        print(f"❌ Failed to get teacher profile: {profile_response.status_code}")

if __name__ == "__main__":
    test_teacher_api()
