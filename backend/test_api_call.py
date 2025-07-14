#!/usr/bin/env python3
"""
Test the exact API call that the frontend is making
"""
import asyncio
import httpx
import json

async def test_teacher_api():
    """Test the teacher API calls"""
    async with httpx.AsyncClient() as client:
        try:
            # 1. Login as teacher
            print("=== LOGGING IN AS TEACHER ===")
            login_data = {
                'username': 'ms.yuguda0@gmail.com',
                'password': 'Yuguda26692669'
            }
            
            response = await client.post('http://localhost:8000/api/v1/auth/login', data=login_data)
            print(f'Login status: {response.status_code}')
            
            if response.status_code != 200:
                print(f'Login failed: {response.text}')
                return
                
            token_data = response.json()
            token = token_data['access_token']
            print('✅ Login successful')
            print(f'Token: {token[:50]}...')
            print()
            
            headers = {'Authorization': f'Bearer {token}'}
            
            # 2. Get current user info
            print("=== GETTING CURRENT USER ===")
            response = await client.get('http://localhost:8000/api/v1/auth/me', headers=headers)
            print(f'Get user status: {response.status_code}')
            if response.status_code == 200:
                user_data = response.json()
                print(f'User: {user_data.get("full_name")} ({user_data.get("role")})')
                print(f'School ID: {user_data.get("school_id")}')
            print()
            
            # 3. Get classes for teacher
            print("=== GETTING TEACHER CLASSES ===")
            response = await client.get('http://localhost:8000/api/v1/classes/', headers=headers)
            print(f'Get classes status: {response.status_code}')
            if response.status_code == 200:
                classes_data = response.json()
                print(f'Classes returned: {len(classes_data)}')
                for cls in classes_data:
                    print(f'  - {cls["name"]} (ID: {cls["id"]})')
                    class_id = cls["id"]
            else:
                print(f'Error: {response.text}')
                return
            print()
            
            # 4. Test getting all students (no class filter)
            print("=== GETTING ALL STUDENTS (NO FILTER) ===")
            response = await client.get('http://localhost:8000/api/v1/students/', headers=headers)
            print(f'Get all students status: {response.status_code}')
            if response.status_code == 200:
                data = response.json()
                print(f'Total students returned: {len(data.get("items", []))}')
                for student in data.get('items', []):
                    print(f'  - {student["first_name"]} {student["last_name"]} (Class: {student.get("current_class_id", "None")})')
            else:
                print(f'Error: {response.text}')
            print()
            
            # 5. Test getting students for specific class (this is what frontend does)
            print("=== GETTING STUDENTS FOR SPECIFIC CLASS ===")
            print(f'Class ID: {class_id}')
            response = await client.get(f'http://localhost:8000/api/v1/students/?class_id={class_id}&status=active&page=1&size=100', headers=headers)
            print(f'Get students for class status: {response.status_code}')
            if response.status_code == 200:
                data = response.json()
                print(f'Students in class returned: {len(data.get("items", []))}')
                print(f'Response structure: {list(data.keys())}')
                for student in data.get('items', []):
                    print(f'  - {student["first_name"]} {student["last_name"]} (ID: {student["id"]})')
                    print(f'    Admission: {student["admission_number"]}')
                    print(f'    Class ID: {student.get("current_class_id")}')
                    print(f'    Status: {student.get("status")}')
            else:
                print(f'Error: {response.text}')
                print(f'Response headers: {dict(response.headers)}')
            print()
            
        except Exception as e:
            print(f'Exception: {e}')
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_teacher_api())
