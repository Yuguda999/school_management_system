# 📚 API Documentation

This document provides comprehensive information about the School Management System API endpoints, authentication, and usage examples.

## 🔗 Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

All API endpoints are prefixed with `/api/v1`

## 🔐 Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST `/api/v1/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin"
  }
}
```

#### POST `/api/v1/auth/refresh`
Refresh JWT token.

#### POST `/api/v1/auth/logout`
Logout and invalidate token.

#### POST `/api/v1/auth/forgot-password`
Request password reset.

#### POST `/api/v1/auth/reset-password`
Reset password with token.

## 👥 User Management

### GET `/api/v1/users`
Get list of users with pagination and filtering.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `size` (int): Items per page (default: 20)
- `role` (string): Filter by user role
- `is_active` (boolean): Filter by active status
- `search` (string): Search by name or email

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "teacher",
      "is_active": true,
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 20,
  "pages": 5
}
```

### POST `/api/v1/users`
Create a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "teacher",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "address": "123 Main St, City, State"
}
```

### GET `/api/v1/users/{user_id}`
Get user by ID.

### PUT `/api/v1/users/{user_id}`
Update user information.

### DELETE `/api/v1/users/{user_id}`
Delete user (soft delete).

## 🎓 Student Management

### GET `/api/v1/students`
Get list of students.

**Query Parameters:**
- `page`, `size`: Pagination
- `class_id`: Filter by class
- `academic_session`: Filter by academic session
- `is_active`: Filter by active status
- `search`: Search by name or admission number

### POST `/api/v1/students`
Create new student.

**Request Body:**
```json
{
  "admission_number": "STU2023001",
  "first_name": "Alice",
  "last_name": "Johnson",
  "email": "alice@example.com",
  "date_of_birth": "2010-05-15",
  "gender": "female",
  "class_id": "class-uuid",
  "parent_id": "parent-uuid",
  "address": "456 Oak St, City, State",
  "phone": "+1234567890",
  "emergency_contact": {
    "name": "Emergency Contact",
    "phone": "+1234567890",
    "relationship": "guardian"
  }
}
```

### GET `/api/v1/students/{student_id}`
Get student details.

### PUT `/api/v1/students/{student_id}`
Update student information.

### GET `/api/v1/students/{student_id}/academic-record`
Get student's academic record.

### GET `/api/v1/students/{student_id}/attendance`
Get student's attendance record.

## 👨‍🏫 Teacher Management

### GET `/api/v1/teachers`
Get list of teachers.

### POST `/api/v1/teachers`
Create new teacher.

**Request Body:**
```json
{
  "employee_id": "TCH2023001",
  "first_name": "Robert",
  "last_name": "Wilson",
  "email": "robert@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1985-03-20",
  "qualification": "M.Ed Mathematics",
  "experience_years": 8,
  "department": "Mathematics",
  "position": "Senior Teacher",
  "salary": 50000,
  "hire_date": "2023-01-15"
}
```

### GET `/api/v1/teachers/{teacher_id}/classes`
Get classes assigned to teacher.

### POST `/api/v1/teachers/{teacher_id}/assign-class`
Assign class to teacher.

## 📚 Academic Management

### Classes

#### GET `/api/v1/classes`
Get list of classes.

#### POST `/api/v1/classes`
Create new class.

**Request Body:**
```json
{
  "name": "Grade 10-A",
  "academic_session": "2023-2024",
  "class_teacher_id": "teacher-uuid",
  "capacity": 30,
  "room_number": "101",
  "subjects": ["math", "science", "english"]
}
```

### Subjects

#### GET `/api/v1/subjects`
Get list of subjects.

#### POST `/api/v1/subjects`
Create new subject.

### Terms

#### GET `/api/v1/terms`
Get academic terms.

#### POST `/api/v1/terms`
Create new term.

## 📅 Attendance Management

### GET `/api/v1/attendance`
Get attendance records.

**Query Parameters:**
- `class_id`: Filter by class
- `student_id`: Filter by student
- `date_from`, `date_to`: Date range
- `status`: Filter by attendance status

### POST `/api/v1/attendance`
Mark attendance.

**Request Body:**
```json
{
  "class_id": "class-uuid",
  "date": "2023-10-01",
  "attendance_records": [
    {
      "student_id": "student-uuid",
      "status": "present",
      "remarks": "On time"
    },
    {
      "student_id": "student-uuid-2",
      "status": "absent",
      "remarks": "Sick leave"
    }
  ]
}
```

### GET `/api/v1/attendance/summary`
Get attendance summary and statistics.

### GET `/api/v1/attendance/reports`
Generate attendance reports.

## 💰 Fee Management

### Fee Structures

#### GET `/api/v1/fees/structures`
Get fee structures.

#### POST `/api/v1/fees/structures`
Create fee structure.

**Request Body:**
```json
{
  "name": "Tuition Fee - Grade 10",
  "academic_session": "2023-2024",
  "class_level": "Grade 10",
  "fee_type": "tuition",
  "amount": 5000,
  "is_mandatory": true,
  "due_date": "2023-04-30",
  "late_fee_amount": 100,
  "late_fee_days": 7
}
```

### Fee Assignments

#### GET `/api/v1/fees/assignments`
Get fee assignments.

#### POST `/api/v1/fees/assignments`
Assign fees to students.

#### POST `/api/v1/fees/assignments/bulk`
Bulk assign fees to multiple students.

### Payments

#### GET `/api/v1/fees/payments`
Get payment records.

#### POST `/api/v1/fees/payments`
Record payment.

**Request Body:**
```json
{
  "student_id": "student-uuid",
  "fee_assignment_id": "assignment-uuid",
  "amount": 5000,
  "payment_method": "cash",
  "payment_date": "2023-04-15",
  "transaction_reference": "TXN123456",
  "notes": "Full payment for tuition fee"
}
```

#### GET `/api/v1/fees/payments/{payment_id}/receipt`
Generate payment receipt.

## 📢 Communication

### Messages

#### GET `/api/v1/communication/messages`
Get messages.

#### POST `/api/v1/communication/messages`
Send message.

**Request Body:**
```json
{
  "subject": "Important Notice",
  "content": "This is an important message for all students.",
  "message_type": "email",
  "recipient_type": "class",
  "recipient_class_id": "class-uuid",
  "is_urgent": false,
  "scheduled_at": "2023-10-01T09:00:00Z"
}
```

### Announcements

#### GET `/api/v1/communication/announcements`
Get announcements.

#### POST `/api/v1/communication/announcements`
Create announcement.

**Request Body:**
```json
{
  "title": "School Holiday Notice",
  "content": "School will be closed on October 15th for Diwali celebration.",
  "target_audience": "all_students",
  "is_urgent": false,
  "start_date": "2023-10-01T00:00:00Z",
  "end_date": "2023-10-15T23:59:59Z",
  "category": "holiday"
}
```

## 📊 Reports and Analytics

### GET `/api/v1/reports/dashboard`
Get dashboard statistics.

### GET `/api/v1/reports/attendance`
Generate attendance reports.

### GET `/api/v1/reports/academic`
Generate academic performance reports.

### GET `/api/v1/reports/financial`
Generate financial reports.

## 🔍 Search and Filtering

Most list endpoints support the following query parameters:

- **Pagination**: `page`, `size`
- **Sorting**: `sort_by`, `sort_order` (asc/desc)
- **Filtering**: Various field-specific filters
- **Search**: `search` parameter for text search

Example:
```
GET /api/v1/students?page=1&size=20&sort_by=first_name&sort_order=asc&class_id=uuid&search=john
```

## 📁 File Upload

### POST `/api/v1/upload`
Upload files (images, documents).

**Request**: Multipart form data
- `file`: File to upload
- `type`: File type (profile_picture, document, etc.)

**Response:**
```json
{
  "file_url": "https://domain.com/uploads/filename.jpg",
  "file_name": "filename.jpg",
  "file_size": 1024000,
  "file_type": "image/jpeg"
}
```

## ❌ Error Handling

The API uses standard HTTP status codes and returns error details in JSON format:

```json
{
  "detail": "Error message",
  "error_code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

## 🔄 Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **File upload**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## 📝 API Versioning

The API uses URL versioning (`/api/v1/`). When breaking changes are introduced, a new version will be created (`/api/v2/`).

## 🧪 Testing the API

### Using cURL

```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# Get users (with token)
curl -X GET "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Python requests

```python
import requests

# Login
response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "admin@example.com", "password": "password"}
)
token = response.json()["access_token"]

# Get users
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    "http://localhost:8000/api/v1/users",
    headers=headers
)
users = response.json()
```

## 📖 Interactive Documentation

Visit the following URLs for interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These interfaces allow you to test API endpoints directly from your browser.

## 🔧 SDK and Client Libraries

Official client libraries are available for:

- **JavaScript/TypeScript**: `npm install school-management-sdk`
- **Python**: `pip install school-management-sdk`

Example usage:
```javascript
import { SchoolManagementAPI } from 'school-management-sdk';

const api = new SchoolManagementAPI({
  baseURL: 'http://localhost:8000',
  apiKey: 'your-api-key'
});

const students = await api.students.list();
```

For more detailed examples and advanced usage, refer to the SDK documentation.
