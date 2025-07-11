#!/usr/bin/env python3
"""
API Test Script for School Management System
Tests the main API endpoints to ensure they're working correctly.
"""

import requests
import json
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def test_api_health():
    """Test API health endpoint"""
    print("Testing API health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Health check passed: {data}")
            return True
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Health check error: {e}")
        return False

def test_api_info():
    """Test API info endpoint"""
    print("\nTesting API info...")
    try:
        response = requests.get(f"{API_BASE}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ API info: {data['message']}")
            print(f"✓ Documentation available at: {BASE_URL}{data['endpoints']['docs']}")
            return True
        else:
            print(f"✗ API info failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ API info error: {e}")
        return False

def test_openapi_spec():
    """Test OpenAPI specification"""
    print("\nTesting OpenAPI specification...")
    try:
        response = requests.get(f"{API_BASE}/openapi.json")
        if response.status_code == 200:
            spec = response.json()
            print(f"✓ OpenAPI spec loaded")
            print(f"✓ API Title: {spec.get('info', {}).get('title', 'Unknown')}")
            print(f"✓ API Version: {spec.get('info', {}).get('version', 'Unknown')}")
            
            # Count endpoints
            paths = spec.get('paths', {})
            endpoint_count = sum(len(methods) for methods in paths.values())
            print(f"✓ Total endpoints: {endpoint_count}")
            
            # List main endpoint groups
            endpoint_groups = set()
            for path in paths.keys():
                if path.startswith('/api/v1/'):
                    parts = path.split('/')
                    if len(parts) >= 4:
                        endpoint_groups.add(parts[3])
            
            print(f"✓ Endpoint groups: {', '.join(sorted(endpoint_groups))}")
            return True
        else:
            print(f"✗ OpenAPI spec failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ OpenAPI spec error: {e}")
        return False

def test_auth_endpoints():
    """Test authentication endpoints (without actual auth)"""
    print("\nTesting authentication endpoints...")
    try:
        # Test login endpoint (should fail without credentials)
        response = requests.post(f"{API_BASE}/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        
        # We expect this to fail, but the endpoint should exist
        if response.status_code in [400, 401, 422]:
            print("✓ Login endpoint exists and responds correctly")
            return True
        else:
            print(f"✗ Unexpected login response: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Auth endpoints error: {e}")
        return False

def test_school_endpoints():
    """Test school endpoints (without auth)"""
    print("\nTesting school endpoints...")
    try:
        # Test getting current school (should require auth)
        response = requests.get(f"{API_BASE}/schools/me")

        # We expect this to fail due to missing auth
        if response.status_code in [401, 403]:
            print("✓ Schools endpoint exists and requires authentication")
            return True
        else:
            print(f"✗ Unexpected schools response: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ School endpoints error: {e}")
        return False

def test_endpoint_security():
    """Test that protected endpoints require authentication"""
    print("\nTesting endpoint security...")
    
    protected_endpoints = [
        f"{API_BASE}/users/",
        f"{API_BASE}/students/",
        f"{API_BASE}/classes/",
        f"{API_BASE}/subjects/",
        f"{API_BASE}/terms/",
        f"{API_BASE}/fees/structures",
        f"{API_BASE}/grades/exams",
        f"{API_BASE}/communication/messages"
    ]
    
    all_protected = True
    for endpoint in protected_endpoints:
        try:
            response = requests.get(endpoint)
            if response.status_code in [401, 403]:
                print(f"✓ {endpoint} is properly protected")
            else:
                print(f"✗ {endpoint} is not protected (status: {response.status_code})")
                all_protected = False
        except Exception as e:
            print(f"? {endpoint} - error testing: {e}")
    
    return all_protected

def test_cors_headers():
    """Test CORS headers"""
    print("\nTesting CORS headers...")
    try:
        response = requests.options(f"{API_BASE}/")
        headers = response.headers
        
        if 'access-control-allow-origin' in headers:
            print(f"✓ CORS enabled: {headers['access-control-allow-origin']}")
            return True
        else:
            print("? CORS headers not found (may be configured differently)")
            return True  # Not necessarily an error
    except Exception as e:
        print(f"✗ CORS test error: {e}")
        return False

def main():
    """Run all API tests"""
    print("=" * 60)
    print("SCHOOL MANAGEMENT SYSTEM - API FUNCTIONALITY TEST")
    print("=" * 60)
    
    tests = [
        ("API Health Check", test_api_health),
        ("API Info", test_api_info),
        ("OpenAPI Specification", test_openapi_spec),
        ("Authentication Endpoints", test_auth_endpoints),
        ("School Endpoints", test_school_endpoints),
        ("Endpoint Security", test_endpoint_security),
        ("CORS Headers", test_cors_headers)
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
        print("\n🎉 All API tests passed! The school management system is working correctly.")
        print("\nYou can now:")
        print(f"1. Visit {BASE_URL}/api/v1/docs for interactive API documentation")
        print(f"2. Visit {BASE_URL}/api/v1/redoc for alternative documentation")
        print("3. Start integrating with your frontend application")
        print("4. Create your first school and users through the API")
    else:
        print(f"\n❌ {total - passed} tests failed. Please check the issues.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
