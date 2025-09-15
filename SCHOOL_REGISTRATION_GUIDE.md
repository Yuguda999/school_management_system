# 🏫 School Registration Guide

This guide explains how to register a new school in the School Management System.

## 📋 Prerequisites

1. **Backend server running**: Ensure the backend API is running on `http://localhost:8000`
2. **Database initialized**: The database should be set up with all tables
3. **Valid school information**: Prepare all required school details

## 🚀 Method 1: API Registration (Recommended)

### Step 1: Prepare School Data

Create a JSON payload with the following required fields:

```json
{
  "name": "Your School Name",
  "code": "SCH001",
  "email": "admin@yourschool.com",
  "phone": "+234-123-456-7890",
  "website": "https://yourschool.com",
  "address_line1": "123 School Street",
  "address_line2": "Suite 100",
  "city": "Lagos",
  "state": "Lagos State",
  "postal_code": "100001",
  "country": "Nigeria",
  "description": "A premier educational institution",
  "motto": "Excellence in Education",
  "established_year": "2020",
  "current_session": "2024/2025",
  "current_term": "First Term",
  "admin_first_name": "John",
  "admin_last_name": "Doe",
  "admin_email": "john.doe@yourschool.com",
  "admin_password": "SecurePassword123!",
  "admin_phone": "+234-987-654-3210"
}
```

### Step 2: Make API Request

#### Using cURL:
```bash
curl -X POST "http://localhost:8000/api/v1/schools/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your School Name",
    "code": "SCH001",
    "email": "admin@yourschool.com",
    "address_line1": "123 School Street",
    "city": "Lagos",
    "state": "Lagos State",
    "postal_code": "100001",
    "current_session": "2024/2025",
    "current_term": "First Term",
    "admin_first_name": "John",
    "admin_last_name": "Doe",
    "admin_email": "john.doe@yourschool.com",
    "admin_password": "SecurePassword123!"
  }'
```

#### Using Python:
```python
import requests
import json

url = "http://localhost:8000/api/v1/schools/register"
data = {
    "name": "Your School Name",
    "code": "SCH001",
    "email": "admin@yourschool.com",
    "address_line1": "123 School Street",
    "city": "Lagos",
    "state": "Lagos State",
    "postal_code": "100001",
    "current_session": "2024/2025",
    "current_term": "First Term",
    "admin_first_name": "John",
    "admin_last_name": "Doe",
    "admin_email": "john.doe@yourschool.com",
    "admin_password": "SecurePassword123!"
}

response = requests.post(url, json=data)
print(response.json())
```

### Step 3: Verify Registration

Successful registration returns:
```json
{
  "school": {
    "id": "uuid-string",
    "name": "Your School Name",
    "code": "SCH001",
    "email": "admin@yourschool.com",
    "is_active": true,
    "is_verified": false,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "admin_user_id": "admin-uuid-string",
  "message": "School registered successfully"
}
```

## 🌐 Method 2: Frontend Registration (Coming Soon)

The frontend registration interface is being developed. Once available, you'll be able to register schools through the web interface at `http://localhost:3000/register-school`.

## 📝 Required Fields Explanation

### School Information
- **name**: Full name of the school
- **code**: Unique school identifier (e.g., "SCH001", "ABC123")
- **email**: Official school email address
- **phone**: School contact number
- **website**: School website URL (optional)

### Address Information
- **address_line1**: Primary address line
- **address_line2**: Secondary address line (optional)
- **city**: City name
- **state**: State/Province name
- **postal_code**: ZIP/Postal code
- **country**: Country (defaults to "Nigeria")

### School Details
- **description**: Brief description of the school (optional)
- **motto**: School motto (optional)
- **established_year**: Year the school was established (optional)

### Academic Configuration
- **current_session**: Current academic session (e.g., "2024/2025")
- **current_term**: Current academic term (e.g., "First Term", "Second Term", "Third Term")

### Admin User Information
- **admin_first_name**: First name of the school administrator
- **admin_last_name**: Last name of the school administrator
- **admin_email**: Email address for the admin user (must be unique)
- **admin_password**: Password for the admin user (minimum 8 characters)
- **admin_phone**: Phone number for the admin user (optional)

## ✅ Validation Rules

1. **School Code**: Must be unique across all schools
2. **School Email**: Must be unique and valid email format
3. **Admin Email**: Must be unique and valid email format
4. **Admin Password**: Minimum 8 characters
5. **Required Fields**: All non-optional fields must be provided

## 🔐 After Registration

Once registered successfully:

1. **Admin User Created**: A Super Admin user is created with the provided credentials
2. **School Status**: School is created as active but unverified
3. **Login Access**: Admin can log in using their email and password
4. **Full Access**: Admin has full access to manage the school

## 🔑 Admin Login

After registration, the admin can log in at:
- **API Login**: `POST /api/v1/auth/login`
- **Frontend Login**: `http://localhost:3000/login` (when available)

Login credentials:
- **Email**: The admin_email provided during registration
- **Password**: The admin_password provided during registration

## 🛠️ Troubleshooting

### Common Errors

1. **"School code already exists"**
   - Solution: Use a different, unique school code

2. **"School email already exists"**
   - Solution: Use a different email address for the school

3. **"Admin email already exists"**
   - Solution: Use a different email address for the admin user

4. **"Password must be at least 8 characters long"**
   - Solution: Use a stronger password with at least 8 characters

### Verification

To verify your school was created successfully:

```bash
# Check if school exists
curl "http://localhost:8000/api/v1/schools/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📚 Next Steps

After successful registration:

1. **Login as Admin**: Use the admin credentials to log in
2. **Configure School Settings**: Set up academic calendar, grading system, etc.
3. **Create Academic Structure**: Add terms, classes, and subjects
4. **Add Users**: Create teacher and staff accounts
5. **Enroll Students**: Add students to the system
6. **Set Up Fee Structure**: Configure fee categories and amounts

## 🔗 Related Documentation

- [API Documentation](docs/API_DOCUMENTATION.md)
- [User Management Guide](docs/USER_MANAGEMENT.md)
- [Academic Setup Guide](docs/ACADEMIC_SETUP.md)
- [Student Management Guide](docs/STUDENT_MANAGEMENT.md)
