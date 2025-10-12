#!/usr/bin/env python3
"""
Test script to verify the improved authentication flows:
1. School code login - should skip school selection for school owners
2. Direct login - should show school selection for school owners
3. School switching - should work correctly
"""

import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000"

def print_section(title: str):
    """Print a section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_result(success: bool, message: str):
    """Print a test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def test_school_code_login(school_code: str, email: str, password: str):
    """Test school code login flow"""
    print_section("TEST 1: School Code Login (Should Skip School Selection)")
    
    url = f"{BASE_URL}/api/v1/auth/school/{school_code}/login"
    payload = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Check if school selection is NOT required
        requires_selection = data.get("requires_school_selection", False)
        has_school_id = data.get("school_id") is not None
        has_available_schools = data.get("available_schools") is not None
        
        print(f"\nResponse:")
        print(f"  - requires_school_selection: {requires_selection}")
        print(f"  - school_id: {data.get('school_id')}")
        print(f"  - available_schools: {data.get('available_schools')}")
        print(f"  - role: {data.get('role')}")
        
        # Verify expectations
        if not requires_selection and has_school_id and not has_available_schools:
            print_result(True, "School owner logged in directly without school selection")
            return data.get("access_token")
        else:
            print_result(False, "School owner should not require school selection when using school code login")
            return None
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text}")
        return None

def test_direct_login(email: str, password: str):
    """Test direct login flow"""
    print_section("TEST 2: Direct Login (Should Show School Selection)")
    
    url = f"{BASE_URL}/api/v1/auth/login"
    payload = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Check if school selection IS required
        requires_selection = data.get("requires_school_selection", False)
        has_school_id = data.get("school_id") is not None
        has_available_schools = data.get("available_schools") is not None
        
        print(f"\nResponse:")
        print(f"  - requires_school_selection: {requires_selection}")
        print(f"  - school_id: {data.get('school_id')}")
        print(f"  - available_schools count: {len(data.get('available_schools', []))}")
        print(f"  - role: {data.get('role')}")
        
        # Verify expectations
        if requires_selection and not has_school_id and has_available_schools:
            print_result(True, "School owner requires school selection for direct login")
            return data.get("access_token"), data.get("available_schools")
        else:
            print_result(False, "School owner should require school selection when using direct login")
            return None, None
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text}")
        return None, None

def test_school_selection(access_token: str, school_id: str):
    """Test school selection after direct login"""
    print_section("TEST 3: School Selection (After Direct Login)")
    
    url = f"{BASE_URL}/api/v1/auth/select-school"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    payload = {
        "school_id": school_id
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Check if school was selected successfully
        has_school_id = data.get("school_id") is not None
        requires_selection = data.get("requires_school_selection", False)
        
        print(f"\nResponse:")
        print(f"  - school_id: {data.get('school_id')}")
        print(f"  - requires_school_selection: {requires_selection}")
        
        # Verify expectations
        if has_school_id and not requires_selection:
            print_result(True, "School selected successfully")
            return data.get("access_token")
        else:
            print_result(False, "School selection should set school_id and clear requires_school_selection")
            return None
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text}")
        return None

def main():
    """Run all authentication flow tests"""
    print("\n" + "🔐 AUTHENTICATION FLOW TESTS" + "\n")
    
    # Test credentials - Using actual user data
    SCHOOL_CODE_1 = "GHS"  # Greenwood High School
    SCHOOL_CODE_2 = "BWD"  # Brownwood
    EMAIL = "elemenx93@gmail.com"  # School owner
    PASSWORD = "26692669"  # User password
    
    print(f"Test Configuration:")
    print(f"  - School Code 1: {SCHOOL_CODE_1}")
    print(f"  - School Code 2: {SCHOOL_CODE_2}")
    print(f"  - Email: {EMAIL}")
    print(f"  - Base URL: {BASE_URL}")

    # Test 1: School code login to first school
    print(f"\n🔹 Testing login to {SCHOOL_CODE_1}")
    token1 = test_school_code_login(SCHOOL_CODE_1, EMAIL, PASSWORD)

    # Test 2: School code login to second school
    print(f"\n🔹 Testing login to {SCHOOL_CODE_2}")
    token2 = test_school_code_login(SCHOOL_CODE_2, EMAIL, PASSWORD)

    # Test 3: Direct login
    print(f"\n🔹 Testing direct login")
    token3, available_schools = test_direct_login(EMAIL, PASSWORD)

    # Test 4: School selection (if direct login succeeded)
    if token3 and available_schools and len(available_schools) > 1:
        # Select the second school
        second_school_id = available_schools[1]["id"]
        print(f"\n🔹 Testing school selection to second school")
        token4 = test_school_selection(token3, second_school_id)
    
    # Summary
    print_section("TEST SUMMARY")
    print("\nAll tests completed. Review results above.")
    print("\nExpected behavior:")
    print("  1. School code login: School owners should be logged in directly without school selection")
    print("  2. Direct login: School owners should see school selection modal")
    print("  3. School selection: Should successfully select a school and update the session")

if __name__ == "__main__":
    main()

