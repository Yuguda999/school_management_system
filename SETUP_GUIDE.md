# 🚀 Platform Setup Guide

## 🎯 **Simple Setup Process**

### **Step 1: Create Platform Super Admin (ONE TIME ONLY)**

```bash
cd backend
python ../create_platform_admin.py
```

**What this does:**
- Creates the platform owner (YOU)
- Only needs to be run ONCE
- Gives you full platform control

**Example:**
```bash
$ cd backend
$ python ../create_platform_admin.py

🚀 Platform Super Admin Setup
==================================================
⚠️  WARNING: This should only be run ONCE during initial setup!
⚠️  The Platform Super Admin oversees the entire platform.

✅ No Platform Super Admin found. Proceeding with creation...

👤 Platform Super Admin Details:
(This person will have full control over the entire platform)

First Name: John
Last Name: Doe
Email: admin@yourplatform.com
Phone (optional): +234-123-456-789
Password (min 8 characters): [hidden]
Confirm Password: [hidden]

📋 Platform Super Admin Summary:
Name: John Doe
Email: admin@yourplatform.com
Phone: +234-123-456-789
Role: Platform Super Admin (FULL PLATFORM CONTROL)

🔥 IMPORTANT:
- This user will have FULL control over the entire platform
- They can create school owners and manage all schools
- This can only be done ONCE
- Make sure the details are correct!

✅ Create Platform Super Admin? (type 'YES' to confirm): YES

🎉 SUCCESS! Platform Super Admin created!
```

### **Step 2: Start the Platform**

```bash
# Start backend
cd backend
python start_server.py

# Start frontend (new terminal)
cd frontend
npm run dev
```

### **Step 3: Login to Frontend**

1. Open: `http://localhost:3000`
2. Login with your platform admin credentials
3. Access the admin panel

### **Step 4: Everything Else via Frontend**

From the frontend admin panel, you can:

- ✅ **Create school owners** who can register schools
- ✅ **Manage platform settings**
- ✅ **View platform analytics**
- ✅ **Oversee all schools**

School owners will then:
- ✅ **Register their schools** via frontend
- ✅ **Manage their school operations** via UI
- ✅ **Create teachers, students, etc.** via frontend

---

## 🎭 **Role Overview**

### **PLATFORM_SUPER_ADMIN (YOU)**
- **Created**: CLI only (one time)
- **Access**: Full platform control
- **Can do**: Create school owners, platform settings

### **SCHOOL_OWNER**
- **Created**: By platform admin via frontend
- **Access**: Their school only
- **Can do**: Register school, manage everything in their school

### **SCHOOL_ADMIN**
- **Created**: By school owner via frontend
- **Access**: Their school only
- **Can do**: School operations, manage teachers/students

### **TEACHER**
- **Created**: By school owner/admin via frontend
- **Access**: Their classes only
- **Can do**: Manage classes, grade students

### **PARENT**
- **Created**: By school staff via frontend
- **Access**: Their children's data only
- **Can do**: View progress, communicate

### **STUDENT**
- **Created**: By school staff via frontend
- **Access**: Their own data only
- **Can do**: View grades, submit assignments

---

## ✅ **That's It!**

**CLI**: Only for creating the platform super admin (once)
**Frontend**: Everything else happens in the UI

**Benefits:**
- ✅ Simple one-time CLI setup
- ✅ User-friendly frontend for everything else
- ✅ Proper role-based access control
- ✅ Multi-tenant school isolation
- ✅ Scalable architecture

**Next Steps:**
1. Run the CLI script once
2. Start the platform
3. Login and manage everything via frontend
4. School owners register and manage their schools via UI

Perfect separation: CLI for initial setup, Frontend for operations!
