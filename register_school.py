#!/usr/bin/env python3
"""
School Registration Script
Helps register a new school in the School Management System
"""

import requests
import json
import sys
from typing import Dict, Any


def get_user_input() -> Dict[str, Any]:
    """Get school registration data from user input"""
    print("🏫 School Management System - School Registration")
    print("=" * 50)
    
    # School Information
    print("\n📋 School Information:")
    name = input("School Name: ").strip()
    code = input("School Code (e.g., SCH001): ").strip().upper()
    email = input("School Email: ").strip()
    phone = input("School Phone (optional): ").strip() or None
    website = input("School Website (optional): ").strip() or None
    
    # Address Information
    print("\n📍 Address Information:")
    address_line1 = input("Address Line 1: ").strip()
    address_line2 = input("Address Line 2 (optional): ").strip() or None
    city = input("City: ").strip()
    state = input("State: ").strip()
    postal_code = input("Postal Code: ").strip()
    country = input("Country (default: Nigeria): ").strip() or "Nigeria"
    
    # School Details
    print("\n🏛️ School Details:")
    description = input("Description (optional): ").strip() or None
    motto = input("School Motto (optional): ").strip() or None
    established_year = input("Established Year (optional): ").strip() or None
    
    # Academic Configuration
    print("\n📚 Academic Configuration:")
    current_session = input("Current Session (e.g., 2024/2025): ").strip()
    current_term = input("Current Term (e.g., First Term): ").strip()
    
    # Admin User Information
    print("\n👤 Admin User Information:")
    admin_first_name = input("Admin First Name: ").strip()
    admin_last_name = input("Admin Last Name: ").strip()
    admin_email = input("Admin Email: ").strip()
    admin_password = input("Admin Password (min 8 chars): ").strip()
    admin_phone = input("Admin Phone (optional): ").strip() or None
    
    # Validate required fields
    required_fields = {
        "name": name,
        "code": code,
        "email": email,
        "address_line1": address_line1,
        "city": city,
        "state": state,
        "postal_code": postal_code,
        "current_session": current_session,
        "current_term": current_term,
        "admin_first_name": admin_first_name,
        "admin_last_name": admin_last_name,
        "admin_email": admin_email,
        "admin_password": admin_password
    }
    
    missing_fields = [field for field, value in required_fields.items() if not value]
    if missing_fields:
        print(f"\n❌ Missing required fields: {', '.join(missing_fields)}")
        return None
    
    if len(admin_password) < 8:
        print("\n❌ Admin password must be at least 8 characters long")
        return None
    
    return {
        "name": name,
        "code": code,
        "email": email,
        "phone": phone,
        "website": website,
        "address_line1": address_line1,
        "address_line2": address_line2,
        "city": city,
        "state": state,
        "postal_code": postal_code,
        "country": country,
        "description": description,
        "motto": motto,
        "established_year": established_year,
        "current_session": current_session,
        "current_term": current_term,
        "admin_first_name": admin_first_name,
        "admin_last_name": admin_last_name,
        "admin_email": admin_email,
        "admin_password": admin_password,
        "admin_phone": admin_phone
    }


def register_school(data: Dict[str, Any], api_url: str = "http://localhost:8000") -> bool:
    """Register school via API"""
    url = f"{api_url}/api/v1/schools/register"
    
    try:
        print(f"\n🚀 Registering school at {url}...")
        response = requests.post(url, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ School registered successfully!")
            print(f"School ID: {result['school']['id']}")
            print(f"School Name: {result['school']['name']}")
            print(f"School Code: {result['school']['code']}")
            print(f"Admin User ID: {result['admin_user_id']}")
            print(f"Message: {result['message']}")
            
            print(f"\n🔑 Admin Login Credentials:")
            print(f"Email: {data['admin_email']}")
            print(f"Password: {data['admin_password']}")
            
            return True
        else:
            print(f"\n❌ Registration failed with status {response.status_code}")
            try:
                error_detail = response.json()
                print(f"Error: {error_detail.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Could not connect to API at {api_url}")
        print("Make sure the backend server is running on http://localhost:8000")
        return False
    except requests.exceptions.Timeout:
        print(f"\n❌ Request timed out")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return False


def main():
    """Main function"""
    print("Welcome to the School Registration Tool!")
    
    # Check if API is accessible
    api_url = "http://localhost:8000"
    try:
        response = requests.get(f"{api_url}/health", timeout=5)
        if response.status_code != 200:
            print(f"⚠️  API health check failed. Make sure backend is running.")
    except:
        print(f"⚠️  Cannot reach API at {api_url}. Make sure backend is running.")
        print("Continue anyway? (y/n): ", end="")
        if input().lower() != 'y':
            sys.exit(1)
    
    # Get registration data
    data = get_user_input()
    if not data:
        print("\n❌ Registration cancelled due to invalid input.")
        sys.exit(1)
    
    # Confirm registration
    print(f"\n📋 Registration Summary:")
    print(f"School: {data['name']} ({data['code']})")
    print(f"Email: {data['email']}")
    print(f"Admin: {data['admin_first_name']} {data['admin_last_name']}")
    print(f"Admin Email: {data['admin_email']}")
    
    print(f"\nProceed with registration? (y/n): ", end="")
    if input().lower() != 'y':
        print("Registration cancelled.")
        sys.exit(0)
    
    # Register school
    success = register_school(data, api_url)
    
    if success:
        print(f"\n🎉 Registration completed successfully!")
        print(f"You can now log in to the system using the admin credentials.")
        sys.exit(0)
    else:
        print(f"\n💥 Registration failed. Please check the errors above and try again.")
        sys.exit(1)


if __name__ == "__main__":
    main()
