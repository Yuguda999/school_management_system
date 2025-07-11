#!/usr/bin/env python3

import requests
import json

# Test the class creation API
API_BASE = "http://localhost:8000/api/v1"

def test_class_creation():
    """Test creating a class"""
    
    # First, let's test if the API is running
    try:
        response = requests.get(f"{API_BASE}/health")
        if response.status_code != 200:
            print("❌ API is not running")
            return False
        print("✅ API is running")
    except Exception as e:
        print(f"❌ API connection failed: {e}")
        return False
    
    # Test class creation
    class_data = {
        "name": "Primary 1-A",
        "level": "primary_1",
        "section": "A",
        "capacity": 30,
        "academic_session": "2024/2025",
        "description": "Test class creation"
    }
    
    try:
        print("🧪 Testing class creation...")
        print(f"📤 Sending data: {json.dumps(class_data, indent=2)}")
        
        response = requests.post(
            f"{API_BASE}/classes",
            json=class_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📥 Response status: {response.status_code}")
        print(f"📥 Response body: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Class created successfully!")
            print(f"   Class ID: {result.get('id')}")
            print(f"   Class Name: {result.get('name')}")
            print(f"   Level: {result.get('level')}")
            print(f"   Capacity: {result.get('capacity')}")
            return True
        else:
            print(f"❌ Class creation failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Class creation error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Class Management API...")
    test_class_creation()
