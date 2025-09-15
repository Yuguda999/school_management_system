#!/usr/bin/env python3
"""
Test script to verify school registration functionality
"""

import requests
import json
import uuid
from datetime import datetime


def test_school_registration():
    """Test school registration with sample data"""
    
    # Generate unique identifiers to avoid conflicts
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    
    # Sample school registration data
    test_data = {
        "name": f"Test School {timestamp}",
        "code": f"TST{unique_id.upper()}",
        "email": f"test.school.{unique_id}@example.com",
        "phone": "+234-123-456-7890",
        "website": f"https://testschool{unique_id}.com",
        "address_line1": "123 Test Street",
        "address_line2": "Suite 100",
        "city": "Lagos",
        "state": "Lagos State",
        "postal_code": "100001",
        "country": "Nigeria",
        "description": "A test school for system verification",
        "motto": "Testing Excellence",
        "established_year": "2024",
        "current_session": "2024/2025",
        "current_term": "First Term",
        "admin_first_name": "Test",
        "admin_last_name": "Admin",
        "admin_email": f"admin.{unique_id}@testschool.com",
        "admin_password": "TestPassword123!",
        "admin_phone": "+234-987-654-3210"
    }
    
    api_url = "http://localhost:8000"
    
    print("🧪 Testing School Registration")
    print("=" * 40)
    
    # Test API health first
    try:
        print("1. Checking API health...")
        health_response = requests.get(f"{api_url}/health", timeout=5)
        if health_response.status_code == 200:
            print("   ✅ API is healthy")
        else:
            print(f"   ⚠️  API health check returned {health_response.status_code}")
    except Exception as e:
        print(f"   ❌ Cannot reach API: {e}")
        return False
    
    # Test school registration
    try:
        print("2. Testing school registration...")
        print(f"   School: {test_data['name']}")
        print(f"   Code: {test_data['code']}")
        print(f"   Admin: {test_data['admin_email']}")
        
        response = requests.post(
            f"{api_url}/api/v1/schools/register",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("   ✅ School registration successful!")
            print(f"   School ID: {result['school']['id']}")
            print(f"   Admin User ID: {result['admin_user_id']}")
            
            # Test admin login
            print("3. Testing admin login...")
            login_data = {
                "email": test_data['admin_email'],
                "password": test_data['admin_password']
            }

            login_response = requests.post(
                f"{api_url}/api/v1/auth/login",
                json=login_data,  # JSON data for login
                timeout=10
            )
            
            if login_response.status_code == 200:
                login_result = login_response.json()
                print("   ✅ Admin login successful!")
                print(f"   Access token received: {login_result['access_token'][:20]}...")
                
                # Test authenticated request
                print("4. Testing authenticated request...")
                headers = {"Authorization": f"Bearer {login_result['access_token']}"}
                
                school_info_response = requests.get(
                    f"{api_url}/api/v1/schools/me",
                    headers=headers,
                    timeout=10
                )
                
                if school_info_response.status_code == 200:
                    school_info = school_info_response.json()
                    print("   ✅ Authenticated request successful!")
                    print(f"   Retrieved school: {school_info['name']}")
                    return True
                else:
                    print(f"   ❌ Authenticated request failed: {school_info_response.status_code}")
                    return False
            else:
                print(f"   ❌ Admin login failed: {login_response.status_code}")
                try:
                    error = login_response.json()
                    print(f"   Error: {error.get('detail', 'Unknown error')}")
                except:
                    print(f"   Error: {login_response.text}")
                return False
        else:
            print(f"   ❌ School registration failed: {response.status_code}")
            try:
                error = response.json()
                print(f"   Error: {error.get('detail', 'Unknown error')}")
            except:
                print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Test failed with exception: {e}")
        return False


def main():
    """Main function"""
    print("School Registration Test Suite")
    print("This will test the complete school registration flow\n")
    
    success = test_school_registration()
    
    if success:
        print("\n🎉 All tests passed! School registration is working correctly.")
        print("\nYou can now register schools using:")
        print("1. The registration script: python register_school.py")
        print("2. Direct API calls as shown in SCHOOL_REGISTRATION_GUIDE.md")
        print("3. The frontend interface (when available)")
    else:
        print("\n💥 Tests failed! Please check the backend server and database.")
        print("\nTroubleshooting steps:")
        print("1. Ensure backend server is running: cd backend && python start_server.py")
        print("2. Check database connection in backend/.env")
        print("3. Verify all database tables are created")


if __name__ == "__main__":
    main()
