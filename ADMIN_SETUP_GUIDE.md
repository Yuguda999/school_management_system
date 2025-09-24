# 🔐 Admin User Setup Guide

## Quick Start - Add Admin User

### **Simple CLI Method (Recommended)**

```bash
cd backend
python add_admin.py
```

### **What the script does:**
1. **Lists all schools** in your database
2. **Interactive prompts** for admin details
3. **Creates admin user** with proper permissions
4. **Shows login credentials** for immediate use

---

## 📋 **Example Usage**

```bash
$ cd backend
$ python add_admin.py

🏫 School Management System - Add Admin User
==================================================

📚 Available Schools:
--------------------------------------------------
1. Test School 20250915_203622 (Code: TST5C87EB52)
   Email: test.school.5c87eb52@example.com
   ID: c1ddedc5-360f-498b-8601-a81189e1a129

Select school (1-1): 1

✅ Selected: Test School 20250915_203622
----------------------------------------

👤 Admin User Details:
First Name: John
Last Name: Admin
Email: john.admin@testschool.com
Phone (optional): +234-123-456-789
Password (min 8 characters): [hidden]
Confirm Password: [hidden]

🎭 Select Role:
1. Super Admin (Full access)
2. Admin (School admin)
Select role (1-2): 1

📋 Summary:
School: Test School 20250915_203622
Name: John Admin
Email: john.admin@testschool.com
Phone: +234-123-456-789
Role: super_admin

✅ Create this admin user? (y/N): y

🎉 SUCCESS! Admin user created successfully!
User ID: 83d342e0-06cf-4cd5-8220-ec70cd6b27cf
Email: john.admin@testschool.com
Role: super_admin
School: Test School 20250915_203622

🔑 Login Credentials:
Email: john.admin@testschool.com
Password: [The password you entered]
API Login URL: http://localhost:8000/api/v1/auth/login
```

---

## 🎭 **Admin Roles**

### **Super Admin**
- **Full system access**
- Can manage all users, students, classes
- Can modify school settings
- Can create other admins and teachers

### **Admin** 
- **School administration access**
- Can manage students, teachers, classes
- Cannot modify core school settings
- Cannot create other super admins

---

## 🔑 **Login After Creation**

### **API Login (for testing)**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your.admin@email.com",
    "password": "YourPassword123!"
  }'
```

### **Frontend Login**
1. Start the frontend: `cd frontend && npm run dev`
2. Open: `http://localhost:3000`
3. Use the email and password you created

---

## ✅ **Requirements**

- **Backend database** must be accessible
- **Virtual environment** activated (`source venv/bin/activate`)
- **Run from backend directory**: `cd backend`

---

## 🛠️ **Troubleshooting**

### **"No schools found"**
- First register a school using `python register_school.py`
- Or use the school registration API

### **"Database connection error"**
- Make sure PostgreSQL is running
- Check your `.env` file database settings
- Verify database credentials

### **"Email already exists"**
- Choose a different email address
- Or check if the user already exists in the system

---

## 📚 **Next Steps After Creating Admin**

1. **Start the backend server**:
   ```bash
   cd backend
   python start_server.py
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login and start managing**:
   - Add teachers and staff
   - Create classes and subjects
   - Enroll students
   - Set up academic terms

---

## 🎯 **Summary**

The `add_admin.py` script provides the **simplest way** to add admin users to your school management system:

- ✅ **Interactive and user-friendly**
- ✅ **Lists available schools**
- ✅ **Validates all input**
- ✅ **Secure password handling**
- ✅ **Immediate login credentials**
- ✅ **No complex API calls needed**

Just run `python add_admin.py` and follow the prompts!
