# 🏗️ Platform Architecture - Multi-Tenant School Management

## 🎯 **Correct Role Hierarchy**

### **1. PLATFORM_SUPER_ADMIN** 
- **Who**: Platform owner (YOU)
- **Access**: Entire platform oversight
- **Creation**: CLI only, ONE TIME
- **Permissions**: 
  - Create school owners
  - Platform-wide analytics
  - System configuration
  - Cannot access individual school data directly

### **2. SCHOOL_OWNER**
- **Who**: School proprietor/owner
- **Access**: Their school only
- **Creation**: By Platform Super Admin
- **Permissions**:
  - Register their school
  - Full control over their school
  - Create school admins and teachers
  - School-level settings and policies

### **3. SCHOOL_ADMIN**
- **Who**: School administrative staff
- **Access**: Their school only
- **Creation**: By School Owner
- **Permissions**:
  - Manage students, teachers, classes
  - Academic operations
  - Cannot modify core school settings

### **4. TEACHER**
- **Who**: Teaching staff
- **Access**: Their assigned classes/subjects
- **Creation**: By School Owner/Admin
- **Permissions**:
  - Manage assigned classes
  - Grade students
  - View student records

### **5. PARENT**
- **Who**: Student guardians
- **Access**: Their children's data only
- **Creation**: By School Owner/Admin
- **Permissions**:
  - View children's progress
  - Communicate with teachers
  - Pay fees

### **6. STUDENT**
- **Who**: Students with login access
- **Access**: Their own data only
- **Creation**: By School Owner/Admin
- **Permissions**:
  - View grades and assignments
  - Submit assignments
  - Access learning materials

---

## 🚀 **Setup Process**

### **Step 1: Platform Initialization (ONE TIME - CLI)**
```bash
python create_platform_admin.py
```
- Creates the platform owner (YOU)
- Only run ONCE during initial setup
- Platform admin oversees entire platform

### **Step 2: Everything Else (Frontend UI)**
1. **Start the platform**:
   ```bash
   cd backend && python start_server.py
   cd frontend && npm run dev
   ```

2. **Platform admin logs in** to frontend with CLI credentials

3. **Platform admin creates school owners** via admin panel

4. **School owners register schools** via frontend registration

5. **School operations** happen entirely in frontend:
   - School owners manage their schools
   - Create admins, teachers, students
   - All school management via UI

---

## 🔐 **Security Model**

### **Data Isolation**
- **Platform Level**: Platform admin sees platform metrics only
- **School Level**: Each school's data is completely isolated
- **User Level**: Users only access their authorized data

### **Permission Inheritance**
```
PLATFORM_SUPER_ADMIN
├── Can create SCHOOL_OWNER
└── Platform oversight only

SCHOOL_OWNER
├── Can create SCHOOL_ADMIN
├── Can create TEACHER
├── Can create PARENT
├── Can create STUDENT
└── Full school control

SCHOOL_ADMIN
├── Can create TEACHER
├── Can create PARENT
├── Can create STUDENT
└── School operations only

TEACHER
├── Can manage assigned classes
└── Limited student access

PARENT
└── Children's data only

STUDENT
└── Own data only
```

---

## 📊 **Database Schema**

### **Users Table**
```sql
users:
  - id (UUID)
  - email (unique)
  - role (PLATFORM_SUPER_ADMIN | SCHOOL_OWNER | SCHOOL_ADMIN | TEACHER | PARENT | STUDENT)
  - school_id (nullable for platform admin)
  - first_name, last_name, phone
  - is_active, is_verified
```

### **Schools Table**
```sql
schools:
  - id (UUID)
  - name, code (unique)
  - owner_id (references users.id where role = SCHOOL_OWNER)
  - contact details
  - settings
  - is_active, is_verified
```

---

## 🛠️ **Tools**

### **CLI Tool (ONE TIME ONLY)**
```bash
# Create platform super admin
python create_platform_admin.py
```

### **Frontend UI (Everything Else)**
- **Platform Admin Panel**: Manage school owners, platform settings
- **School Registration**: School owners register their schools
- **School Management**: All school operations via UI
- **User Management**: Create and manage all school users
- **Academic Operations**: Classes, subjects, students, grades
- **Reports & Analytics**: School and platform-level insights

---

## 🎯 **Business Flow**

### **Platform Owner Perspective**
1. Set up platform (one time)
2. Create school owners (as needed)
3. Monitor platform metrics
4. Handle platform-level issues

### **School Owner Perspective**
1. Receive access from platform admin
2. Register their school
3. Set up school structure (classes, subjects)
4. Create school staff (admins, teachers)
5. Manage school operations

### **School Admin Perspective**
1. Receive access from school owner
2. Manage day-to-day operations
3. Handle student enrollment
4. Coordinate with teachers

### **Teacher Perspective**
1. Receive access from school admin
2. Manage assigned classes
3. Grade students
4. Communicate with parents

---

## ✅ **Benefits of This Architecture**

### **For Platform Owner**
- ✅ Complete platform oversight
- ✅ Scalable school onboarding
- ✅ Clear separation of concerns
- ✅ Revenue tracking per school

### **For School Owners**
- ✅ Full control over their school
- ✅ Data privacy and isolation
- ✅ Customizable school settings
- ✅ Independent operations

### **For Users**
- ✅ Clear role-based permissions
- ✅ Secure data access
- ✅ Appropriate functionality
- ✅ Multi-tenant security

---

## 🚨 **Important Notes**

1. **Platform Admin**: Only ONE per platform
2. **School Isolation**: Complete data separation between schools
3. **Role Hierarchy**: Clear permission inheritance
4. **Security**: Multi-level access control
5. **Scalability**: Easy to add new schools and users

This architecture ensures proper multi-tenancy, security, and scalability for a school management platform.
