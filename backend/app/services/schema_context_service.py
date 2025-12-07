"""
Schema Context Service for Text-to-Action feature
Generates database schema context for AI prompts
"""
import logging
from typing import List, Dict, Set
from functools import lru_cache

logger = logging.getLogger(__name__)


# Define table access permissions per role
# School owners have access to ALL tables in their school
SCHOOL_OWNER_TABLES = {
    # Core tables
    "schools", "users", "students", "classes", "subjects", "terms",
    # Academic tables
    "enrollments", "attendances", "grades", "exams", "grade_templates",
    "student_class_history", "teacher_subjects", "class_subjects", 
    "timetable_entries", "curriculum_items", "lesson_plans",
    # Fee/Finance tables
    "fee_structures", "fee_assignments", "fee_payments",
    # Communication tables  
    "messages", "message_recipients", "announcements", "notifications",
    # Report cards
    "report_cards", "report_card_templates", "report_card_template_fields",
    # Assessment/CBT tables
    "cbt_exams", "cbt_questions", "cbt_answers", "cbt_results",
    # Documents & Assets
    "documents", "assets", "asset_assignments",
    # Other
    "teacher_materials", "student_goals", "component_mappings",
    "audit_logs", "alert_rules"
}

TEACHER_TABLES = {
    "students", "classes", "subjects", "terms", "enrollments",
    "attendances", "grades", "exams", "teacher_subjects", "class_subjects",
    "timetable_entries", "grade_templates", "teacher_materials",
    "cbt_exams", "cbt_questions", "cbt_results"
}


class SchemaContextService:
    """Service to generate database schema context for AI SQL generation"""
    
    def __init__(self):
        self._schema_cache: Dict[str, str] = {}
    
    def get_allowed_tables(self, user_role: str) -> Set[str]:
        """Get tables that the user role is allowed to query"""
        if user_role in ("school_owner", "school_admin", "platform_super_admin"):
            return SCHOOL_OWNER_TABLES
        elif user_role == "teacher":
            return TEACHER_TABLES
        else:
            # Students and parents have very limited access
            return {"students", "grades", "attendances", "classes", "subjects", "terms"}
    
    def get_schema_context(self, user_role: str, school_id: str) -> str:
        """
        Generate schema context for AI prompts
        
        Args:
            user_role: The role of the user making the query
            school_id: The school ID for data isolation
            
        Returns:
            A string containing the database schema information
        """
        allowed_tables = self.get_allowed_tables(user_role)
        
        schema_context = f"""# Database Schema for School Management System

## CRITICAL RULES:
1. ALWAYS include `school_id = '{school_id}'` in WHERE clause for data isolation
2. ALWAYS include `is_deleted = false` to exclude soft-deleted records
3. Generate ONLY SELECT statements - no modifications allowed
4. Use proper JOINs when accessing related tables

## Available Tables and Columns:

"""
        # Add schema for each allowed table
        for table in sorted(allowed_tables):
            table_schema = self._get_table_schema(table)
            if table_schema:
                schema_context += table_schema + "\n"
        
        schema_context += self._get_relationships_context(allowed_tables)
        schema_context += self._get_enum_values_context()
        schema_context += self._get_query_examples()
        
        return schema_context
    
    def _get_table_schema(self, table_name: str) -> str:
        """Get schema description for a specific table"""
        schemas = {
            "schools": """### schools
- id (UUID, primary key) -- NOTE: The primary key column is 'id', NOT 'school_id'! Use schools.id for joins and lookups.
- name (string) - School name
- code (string) - Unique school code
- email, phone (string)
- city, state, country (string)
- current_session (string) - e.g., "2023/2024"
- current_term (string) - e.g., "First Term"
- is_active (boolean)
- subscription_plan (string) - trial/starter/professional/enterprise
- max_students, max_teachers, max_classes (integer, nullable)
- created_at, updated_at (timestamp)
- is_deleted (boolean)""",

            "users": """### users (teachers, staff, admins)
- id (UUID, primary key)
- email (string)
- first_name, last_name, middle_name (string)
- phone (string, nullable)
- role (enum: platform_super_admin, school_owner, school_admin, teacher, parent, student)
- is_active (boolean)
- department, position (string, nullable) - for staff
- school_id (UUID, foreign key -> schools.id)
- created_at, updated_at (timestamp)
- is_deleted (boolean)""",

            "students": """### students
- id (UUID, primary key)
- admission_number (string) - Unique student ID
- first_name, last_name, middle_name (string)
- date_of_birth (date)
- gender (enum: male, female, other)
- email, phone (string, nullable)
- address_line1, city, state, postal_code (string)
- admission_date (date)
- current_class_id (UUID, foreign key -> classes.id)
- status (enum: active, inactive, graduated, transferred, suspended, expelled)
- guardian_name, guardian_phone, guardian_email (string, nullable)
- school_id (UUID, foreign key -> schools.id)
- created_at, updated_at (timestamp)
- is_deleted (boolean)""",

            "classes": """### classes
- id (UUID, primary key)
- name (string) - e.g., "Primary 1A", "JSS 2B"
- level (enum: nursery_1, nursery_2, primary_1-6, jss_1-3, ss_1-3)
- section (string, nullable) - e.g., "A", "B"
- capacity (integer)
- teacher_id (UUID, foreign key -> users.id) - Class teacher
- academic_session (string) - e.g., "2023/2024"
- is_active (boolean)
- school_id (UUID, foreign key -> schools.id)
- created_at, updated_at (timestamp)
- is_deleted (boolean)""",

            "subjects": """### subjects
- id (UUID, primary key)
- name (string) - e.g., "Mathematics", "English"
- code (string) - Subject code
- description (string, nullable)
- is_core (boolean) - Core vs Elective
- credit_units (integer)
- is_active (boolean)
- school_id (UUID, foreign key -> schools.id)
- created_at, updated_at (timestamp)
- is_deleted (boolean)""",

            "terms": """### terms
- id (UUID, primary key)
- name (string) - e.g., "First Term"
- type (enum: first_term, second_term, third_term)
- academic_session (string) - e.g., "2023/2024"
- start_date, end_date (date)
- is_current (boolean) - Current active term
- is_active (boolean)
- school_id (UUID, foreign key -> schools.id)
- created_at, updated_at (timestamp)
- is_deleted (boolean)""",

            "enrollments": """### enrollments
- id (UUID, primary key)
- student_id (UUID, foreign key -> students.id)
- class_id (UUID, foreign key -> classes.id)
- subject_id (UUID, foreign key -> subjects.id)
- term_id (UUID, foreign key -> terms.id)
- enrollment_date (date)
- is_active (boolean)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "attendances": """### attendances
- id (UUID, primary key)
- date (date)
- status (enum: PRESENT, ABSENT, LATE, EXCUSED) - UPPERCASE values required
- student_id (UUID, foreign key -> students.id)
- class_id (UUID, foreign key -> classes.id)
- subject_id (UUID, foreign key -> subjects.id, nullable) - NULL for class attendance
- term_id (UUID, foreign key -> terms.id)
- marked_by (UUID, foreign key -> users.id)
- notes (string, nullable)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "grades": """### grades
- id (UUID, primary key)
- score (decimal) - Points earned
- total_marks (decimal) - Maximum possible points
- percentage (decimal) - Calculated percentage
- grade (enum: A+, A, B+, B, C+, C, D+, D, E, F)
- student_id (UUID, foreign key -> students.id)
- subject_id (UUID, foreign key -> subjects.id)
- exam_id (UUID, foreign key -> exams.id)
- term_id (UUID, foreign key -> terms.id)
- graded_by (UUID, foreign key -> users.id)
- graded_date (date)
- remarks (string, nullable)
- is_published (boolean)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "exams": """### exams
- id (UUID, primary key)
- name (string)
- description (string, nullable)
- exam_type (enum: continuous_assessment, mid_term, final_exam, quiz, assignment, project, practical, oral)
- exam_date (date)
- total_marks (decimal)
- pass_marks (decimal)
- subject_id (UUID, foreign key -> subjects.id)
- class_id (UUID, foreign key -> classes.id)
- term_id (UUID, foreign key -> terms.id)
- is_published (boolean)
- is_active (boolean)
- school_id (UUID, foreign key -> schools.id)
- created_by (UUID, foreign key -> users.id)
- is_deleted (boolean)""",

            "fee_structures": """### fee_structures
- id (UUID, primary key)
- name (string)
- description (string, nullable)
- academic_session (string)
- fee_type (enum: tuition, registration, examination, library, laboratory, sports, transport, uniform, books, feeding, development, other)
- amount (decimal)
- is_mandatory (boolean)
- due_date (date, nullable)
- is_active (boolean)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "fee_assignments": """### fee_assignments
- id (UUID, primary key)
- student_id (UUID, foreign key -> students.id)
- fee_structure_id (UUID, foreign key -> fee_structures.id)
- term_id (UUID, foreign key -> terms.id)
- assigned_date, due_date (date)
- amount (decimal)
- amount_paid (decimal)
- amount_outstanding (decimal)
- status (enum: pending, partial, paid, overdue, cancelled)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "fee_payments": """### fee_payments
- id (UUID, primary key)
- payment_date (date)
- amount (decimal)
- payment_method (enum: cash, bank_transfer, card, mobile_money, cheque, online)
- transaction_reference (string, nullable)
- receipt_number (string)
- student_id (UUID, foreign key -> students.id)
- fee_assignment_id (UUID, foreign key -> fee_assignments.id)
- collected_by (UUID, foreign key -> users.id)
- is_verified (boolean)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "teacher_subjects": """### teacher_subjects (junction table)
- id (UUID, primary key)
- teacher_id (UUID, foreign key -> users.id)
- subject_id (UUID, foreign key -> subjects.id)
- is_head_of_subject (boolean)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "class_subjects": """### class_subjects (junction table)
- id (UUID, primary key)
- class_id (UUID, foreign key -> classes.id)
- subject_id (UUID, foreign key -> subjects.id)
- is_core (boolean)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "messages": """### messages
- id (UUID, primary key)
- subject (string)
- content (text)
- message_type (enum: sms, email, notification, announcement)
- sender_id (UUID, foreign key -> users.id)
- recipient_type (enum: individual, class, role, all_parents, all_teachers, all_students, custom_group)
- status (enum: draft, sent, delivered, read, failed)
- sent_at (timestamp, nullable)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "announcements": """### announcements
- id (UUID, primary key)
- title (string)
- content (text)
- published_by (UUID, foreign key -> users.id)
- is_published (boolean)
- is_public (boolean)
- is_urgent (boolean)
- category (string, nullable)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "report_cards": """### report_cards
- id (UUID, primary key)
- academic_session (string)
- term_name (string)
- total_subjects (integer)
- total_score (decimal)
- average_score (decimal)
- position (integer, nullable)
- total_students (integer, nullable)
- days_present, days_absent, total_school_days (integer)
- student_id (UUID, foreign key -> students.id)
- class_id (UUID, foreign key -> classes.id)
- term_id (UUID, foreign key -> terms.id)
- teacher_comment, principal_comment (text, nullable)
- is_published (boolean)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "student_class_history": """### student_class_history
- id (UUID, primary key)
- student_id (UUID, foreign key -> students.id)
- class_id (UUID, foreign key -> classes.id)
- term_id (UUID, foreign key -> terms.id)
- academic_session (string)
- enrollment_date (date)
- completion_date (date, nullable)
- is_current (boolean)
- status (enum: active, completed, promoted, repeated, transferred)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "timetable_entries": """### timetable_entries
- id (UUID, primary key)
- day_of_week (integer) - 0=Monday, 6=Sunday
- start_time, end_time (time)
- class_id (UUID, foreign key -> classes.id)
- subject_id (UUID, foreign key -> subjects.id)
- teacher_id (UUID, foreign key -> users.id)
- term_id (UUID, foreign key -> terms.id)
- room (string, nullable)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "notifications": """### notifications
- id (UUID, primary key)
- title (string)
- message (text)
- type (string) - notification type
- is_read (boolean)
- user_id (UUID, foreign key -> users.id)
- school_id (UUID, foreign key -> schools.id)
- created_at (timestamp)
- is_deleted (boolean)""",

            "documents": """### documents
- id (UUID, primary key)
- name (string)
- file_path (string)
- file_type (string)
- file_size (integer)
- uploaded_by (UUID, foreign key -> users.id)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "assets": """### assets
- id (UUID, primary key)
- name (string)
- description (text, nullable)
- category (string)
- quantity (integer)
- purchase_date (date, nullable)
- purchase_price (decimal, nullable)
- condition (string)
- location (string, nullable)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "cbt_exams": """### cbt_exams (Computer-Based Tests)
- id (UUID, primary key)
- title (string)
- description (text, nullable)
- duration_minutes (integer)
- total_marks (integer)
- pass_marks (integer)
- subject_id (UUID, foreign key -> subjects.id)
- class_id (UUID, foreign key -> classes.id)
- term_id (UUID, foreign key -> terms.id)
- created_by (UUID, foreign key -> users.id)
- is_published (boolean)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "cbt_questions": """### cbt_questions
- id (UUID, primary key)
- question_text (text)
- question_type (string) - multiple_choice, true_false, short_answer
- options (JSON, nullable) - for multiple choice
- correct_answer (string)
- marks (integer)
- exam_id (UUID, foreign key -> cbt_exams.id)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "cbt_results": """### cbt_results
- id (UUID, primary key)
- score (integer)
- total_marks (integer)
- percentage (decimal)
- time_taken_seconds (integer, nullable)
- student_id (UUID, foreign key -> students.id)
- exam_id (UUID, foreign key -> cbt_exams.id)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "teacher_materials": """### teacher_materials
- id (UUID, primary key)
- title (string)
- description (text, nullable)
- file_path (string, nullable)
- material_type (string)
- subject_id (UUID, foreign key -> subjects.id)
- class_id (UUID, foreign key -> classes.id, nullable)
- teacher_id (UUID, foreign key -> users.id)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "student_goals": """### student_goals
- id (UUID, primary key)
- title (string)
- description (text, nullable)
- target_date (date, nullable)
- status (string) - pending, in_progress, completed
- student_id (UUID, foreign key -> students.id)
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)""",

            "audit_logs": """### audit_logs
- id (UUID, primary key)
- action (string) - create, update, delete
- entity_type (string) - table name
- entity_id (UUID)
- old_values (JSON, nullable)
- new_values (JSON, nullable)
- user_id (UUID, foreign key -> users.id)
- school_id (UUID, foreign key -> schools.id)
- created_at (timestamp)""",

            "grade_templates": """### grade_templates
- id (UUID, primary key)
- name (string)
- description (text, nullable)
- components (JSON) - grade component configuration
- school_id (UUID, foreign key -> schools.id)
- is_deleted (boolean)"""
        }
        
        return schemas.get(table_name, "")
    
    def _get_relationships_context(self, allowed_tables: Set[str]) -> str:
        """Get relationship information between tables"""
        return """
## Key Relationships:

### Data Isolation (CRITICAL):
- ALL tables have school_id -> schools.id for data isolation
- ALWAYS filter by school_id to ensure only this school's data is returned

### Core Relationships:
- students.current_class_id -> classes.id (student's current class)
- users.school_id -> schools.id (all staff belong to a school)
- classes.teacher_id -> users.id (class teacher)

### Academic Relationships:
- enrollments.student_id -> students.id
- enrollments.class_id -> classes.id  
- enrollments.subject_id -> subjects.id
- attendances.student_id -> students.id
- attendances.class_id -> classes.id
- grades.student_id -> students.id
- grades.subject_id -> subjects.id
- grades.exam_id -> exams.id
- exams.subject_id -> subjects.id
- exams.class_id -> classes.id
- student_class_history.student_id -> students.id

### Teacher Relationships:
- teacher_subjects.teacher_id -> users.id (teachers assigned to subjects)
- teacher_subjects.subject_id -> subjects.id
- teacher_materials.teacher_id -> users.id

### Financial Relationships:
- fee_assignments.student_id -> students.id
- fee_assignments.fee_structure_id -> fee_structures.id
- fee_payments.student_id -> students.id
- fee_payments.fee_assignment_id -> fee_assignments.id

### CBT/Assessment Relationships:
- cbt_exams.subject_id -> subjects.id
- cbt_exams.class_id -> classes.id
- cbt_questions.exam_id -> cbt_exams.id
- cbt_results.student_id -> students.id
- cbt_results.exam_id -> cbt_exams.id

"""
    
    def _get_enum_values_context(self) -> str:
        """Get enum value references"""
        return """## Enum Values Reference:
IMPORTANT: All enum values must be UPPERCASE in SQL queries!

- User roles: PLATFORM_SUPER_ADMIN, SCHOOL_OWNER, SCHOOL_ADMIN, TEACHER, PARENT, STUDENT
- Student status: ACTIVE, INACTIVE, GRADUATED, TRANSFERRED, SUSPENDED, EXPELLED
- Gender: MALE, FEMALE, OTHER
- Class levels: NURSERY_1, NURSERY_2, PRIMARY_1 through PRIMARY_6, JSS_1 through JSS_3, SS_1 through SS_3
- Term types: FIRST_TERM, SECOND_TERM, THIRD_TERM
- Attendance status: PRESENT, ABSENT, LATE, EXCUSED (UPPERCASE required!)
- Exam types: CONTINUOUS_ASSESSMENT, MID_TERM, FINAL_EXAM, QUIZ, ASSIGNMENT, PROJECT, PRACTICAL, ORAL
- Grade scale: A+, A, B+, B, C+, C, D+, D, E, F
- Fee types: TUITION, REGISTRATION, EXAMINATION, LIBRARY, LABORATORY, SPORTS, TRANSPORT, UNIFORM, BOOKS, FEEDING, DEVELOPMENT, OTHER
- Payment status: PENDING, PARTIAL, PAID, OVERDUE, CANCELLED
- Payment methods: CASH, BANK_TRANSFER, CARD, MOBILE_MONEY, CHEQUE, ONLINE

"""
    
    def _get_query_examples(self) -> str:
        """Get example queries to help the AI"""
        return """## Example Queries:

### Count students:
SELECT COUNT(*) as total_students FROM students WHERE school_id = '{school_id}' AND is_deleted = false AND status = 'ACTIVE'

### Count teachers:
SELECT COUNT(*) as total_teachers FROM users WHERE school_id = '{school_id}' AND is_deleted = false AND role = 'TEACHER' AND is_active = true

### Students per class:
SELECT c.name as class_name, COUNT(s.id) as student_count 
FROM classes c 
LEFT JOIN students s ON s.current_class_id = c.id AND s.is_deleted = false AND s.status = 'ACTIVE'
WHERE c.school_id = '{school_id}' AND c.is_deleted = false AND c.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name

### Average grade by subject:
SELECT sub.name as subject_name, AVG(g.percentage) as average_percentage
FROM grades g
JOIN subjects sub ON g.subject_id = sub.id
WHERE g.school_id = '{school_id}' AND g.is_deleted = false
GROUP BY sub.id, sub.name
ORDER BY average_percentage DESC

### Attendance rate calculation (IMPORTANT: use UPPERCASE enum values):
SELECT ROUND(AVG(CASE WHEN status = 'PRESENT' THEN 1.0 ELSE 0.0 END) * 100, 2) AS average_attendance_rate
FROM attendances
WHERE school_id = '{school_id}' AND is_deleted = false

### Fee collection summary:
SELECT SUM(amount) as total_collected, payment_method
FROM fee_payments
WHERE school_id = '{school_id}' AND is_deleted = false
GROUP BY payment_method

"""


# Singleton instance
_schema_context_service = None


def get_schema_context_service() -> SchemaContextService:
    """Get or create schema context service instance"""
    global _schema_context_service
    if _schema_context_service is None:
        _schema_context_service = SchemaContextService()
    return _schema_context_service
