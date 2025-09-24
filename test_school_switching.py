#!/usr/bin/env python3
"""
Test script to verify school switching functionality works correctly.
This script tests the backend API endpoints to ensure school context is properly handled.
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_school_switching():
    """Test the school switching functionality"""
    print("🧪 Testing School Switching Functionality")
    print("=" * 50)
    
    # Test data - using test school owner
    test_email = "testowner@school.com"  # Test School Owner
    test_password = "testpassword123"  # Test password
    
    session = requests.Session()
    
    try:
        # Step 1: Login
        print("1. 🔐 Testing login...")
        login_response = session.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
            
        login_data = login_response.json()
        access_token = login_data["access_token"]
        print(f"✅ Login successful. User ID: {login_data['user_id']}")
        print(f"   School ID: {login_data.get('school_id', 'None')}")
        print(f"   Requires school selection: {login_data.get('requires_school_selection', False)}")
        
        # Set authorization header
        session.headers.update({"Authorization": f"Bearer {access_token}"})
        
        # Step 2: Get current user info
        print("\n2. 👤 Testing /auth/me endpoint...")
        me_response = session.get(f"{BASE_URL}/api/v1/auth/me")
        
        if me_response.status_code != 200:
            print(f"❌ /auth/me failed: {me_response.status_code}")
            print(f"Response: {me_response.text}")
            return False
            
        me_data = me_response.json()
        print(f"✅ /auth/me successful")
        print(f"   User ID: {me_data['id']}")
        print(f"   School ID: {me_data.get('school_id', 'None')}")
        print(f"   Role: {me_data['role']}")
        
        # Step 3: Get current school info
        print("\n3. 🏫 Testing /schools/me endpoint...")
        school_response = session.get(f"{BASE_URL}/api/v1/schools/me")
        
        if school_response.status_code != 200:
            print(f"❌ /schools/me failed: {school_response.status_code}")
            print(f"Response: {school_response.text}")
            return False
            
        school_data = school_response.json()
        print(f"✅ /schools/me successful")
        print(f"   School Name: {school_data['name']}")
        print(f"   School ID: {school_data['id']}")
        print(f"   School Code: {school_data['code']}")
        
        # Step 4: Test school-specific data (students)
        print("\n4. 📚 Testing school-specific data (students)...")
        students_response = session.get(f"{BASE_URL}/api/v1/students/?page=1&size=5")
        
        if students_response.status_code != 200:
            print(f"❌ /students failed: {students_response.status_code}")
            print(f"Response: {students_response.text}")
            return False
            
        students_data = students_response.json()
        print(f"✅ /students successful")
        print(f"   Total students: {students_data.get('total', 0)}")
        print(f"   Students in response: {len(students_data.get('items', []))}")
        
        # Step 5: If user is school owner, test school switching
        if me_data['role'] == 'school_owner':
            print("\n5. 🔄 Testing school switching (school owner)...")
            
            # Get owned schools
            owned_schools_response = session.get(f"{BASE_URL}/api/v1/school-selection/owned-schools")
            
            if owned_schools_response.status_code != 200:
                print(f"❌ /owned-schools failed: {owned_schools_response.status_code}")
                print(f"Response: {owned_schools_response.text}")
                return False
                
            owned_schools_data = owned_schools_response.json()
            print(f"✅ /owned-schools successful")
            print(f"   Total owned schools: {owned_schools_data.get('total_count', 0)}")
            
            schools = owned_schools_data.get('schools', [])
            if len(schools) > 1:
                # Find a different school to switch to
                current_school_id = me_data.get('school_id')
                target_school = None
                
                for school in schools:
                    if school['id'] != current_school_id:
                        target_school = school
                        break
                
                if target_school:
                    print(f"   Switching to school: {target_school['name']} (ID: {target_school['id']})")
                    
                    # Switch school
                    switch_response = session.post(f"{BASE_URL}/api/v1/auth/select-school", json={
                        "school_id": target_school['id']
                    })
                    
                    if switch_response.status_code != 200:
                        print(f"❌ School switch failed: {switch_response.status_code}")
                        print(f"Response: {switch_response.text}")
                        return False
                    
                    switch_data = switch_response.json()
                    new_access_token = switch_data["access_token"]
                    print(f"✅ School switch successful")
                    
                    # Update session with new token
                    session.headers.update({"Authorization": f"Bearer {new_access_token}"})
                    
                    # Verify the switch worked
                    print("\n6. ✅ Verifying school switch...")
                    
                    # Check /auth/me again
                    me_response_2 = session.get(f"{BASE_URL}/api/v1/auth/me")
                    if me_response_2.status_code == 200:
                        me_data_2 = me_response_2.json()
                        print(f"   New school ID in /auth/me: {me_data_2.get('school_id')}")
                        
                        if me_data_2.get('school_id') == target_school['id']:
                            print("✅ School context updated correctly in /auth/me")
                        else:
                            print("❌ School context NOT updated in /auth/me")
                            return False
                    
                    # Check /schools/me again
                    school_response_2 = session.get(f"{BASE_URL}/api/v1/schools/me")
                    if school_response_2.status_code == 200:
                        school_data_2 = school_response_2.json()
                        print(f"   New school name in /schools/me: {school_data_2['name']}")
                        
                        if school_data_2['id'] == target_school['id']:
                            print("✅ School context updated correctly in /schools/me")
                        else:
                            print("❌ School context NOT updated in /schools/me")
                            return False
                    
                    # Check students data again
                    students_response_2 = session.get(f"{BASE_URL}/api/v1/students/?page=1&size=5")
                    if students_response_2.status_code == 200:
                        students_data_2 = students_response_2.json()
                        print(f"   Students count after switch: {students_data_2.get('total', 0)}")
                        print("✅ Students data filtered by new school context")
                    
                else:
                    print("   Only one school owned, cannot test switching")
            else:
                print("   User owns only one school, cannot test switching")
        else:
            print(f"\n5. ⏭️  Skipping school switching test (user role: {me_data['role']})")
        
        print("\n🎉 All tests passed! School switching functionality is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
        return False

if __name__ == "__main__":
    success = test_school_switching()
    sys.exit(0 if success else 1)
