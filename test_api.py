#!/usr/bin/env python3

import requests
import json

# Test the API endpoints
API_BASE = "http://localhost:8000/api/v1"

def test_health():
    """Test if the API is running"""
    try:
        response = requests.get(f"{API_BASE}/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print("✓ API is running")
            return True
        else:
            print("✗ API health check failed")
            return False
    except Exception as e:
        print(f"✗ API connection failed: {e}")
        return False

def test_classes_endpoint():
    """Test the classes endpoint"""
    try:
        response = requests.get(f"{API_BASE}/classes")
        print(f"Classes endpoint: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code
    except Exception as e:
        print(f"✗ Classes endpoint failed: {e}")
        return None

if __name__ == "__main__":
    print("Testing API endpoints...")
    
    if test_health():
        test_classes_endpoint()
    else:
        print("API is not running. Please start the backend server.")
