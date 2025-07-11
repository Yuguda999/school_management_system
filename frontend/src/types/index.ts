// User and Authentication Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  school_id: string;
  phone?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent';

export type Gender = 'male' | 'female' | 'other';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  email: string;
  role: UserRole;
  school_id: string;
  full_name: string;
}

// School Types
export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  theme_settings: ThemeSettings;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  dark_mode_enabled: boolean;
}

// Student Types
export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: Gender;
  phone?: string;
  email?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  admission_date: string;
  current_class_id?: string;
  status: 'active' | 'graduated' | 'transferred' | 'suspended' | 'expelled';

  // Parent/Guardian Information
  parent_id?: string;
  parent_name?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;

  // Medical Information
  medical_conditions?: string;
  allergies?: string;
  blood_group?: string;

  // Additional Information
  profile_picture_url?: string;
  notes?: string;

  // Class Information
  current_class_name?: string;

  // Computed fields
  age?: number;
  full_name?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Parent Types
export interface Parent {
  id: string;
  user_id: string;
  phone: string;
  address: string;
  occupation?: string;
  user: User;
  children: Student[];
}

// Teacher Types
export interface Teacher {
  id: string;
  user_id: string;
  employee_id: string;
  department?: string;
  hire_date: string;
  salary?: number;
  status: 'active' | 'inactive';
  user: User;
  subjects: Subject[];
  classes: Class[];
}

// Academic Types
export enum ClassLevel {
  NURSERY_1 = "nursery_1",
  NURSERY_2 = "nursery_2",
  PRIMARY_1 = "primary_1",
  PRIMARY_2 = "primary_2",
  PRIMARY_3 = "primary_3",
  PRIMARY_4 = "primary_4",
  PRIMARY_5 = "primary_5",
  PRIMARY_6 = "primary_6",
  JSS_1 = "jss_1",
  JSS_2 = "jss_2",
  JSS_3 = "jss_3",
  SS_1 = "ss_1",
  SS_2 = "ss_2",
  SS_3 = "ss_3"
}

export interface Class {
  id: string;
  name: string;
  level: ClassLevel;
  section?: string;
  teacher_id?: string;
  school_id: string;
  academic_session: string;
  capacity: number;
  description?: string;
  is_active: boolean;
  teacher?: Teacher;
  teacher_name?: string;
  student_count?: number;
  students?: Student[];
  subjects?: Subject[];
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  school_id: string;
  teacher_id?: string;
  teacher?: Teacher;
}

export interface Term {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  academic_year: string;
  school_id: string;
  is_current: boolean;
}

// Grade Types
export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  term_id: string;
  assignment_type: string;
  score: number;
  max_score: number;
  date_recorded: string;
  comments?: string;
  student: Student;
  subject: Subject;
  term: Term;
}

// Fee Types
export interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  fee_type: 'tuition' | 'transport' | 'library' | 'lab' | 'other';
  class_id?: string;
  school_id: string;
  academic_year: string;
  is_mandatory: boolean;
}

export interface FeePayment {
  id: string;
  student_id: string;
  fee_structure_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'online';
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed';
  student: Student;
  fee_structure: FeeStructure;
}

// Communication Types
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  sent_at: string;
  read_at?: string;
  sender: User;
  recipient: User;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  school_id: string;
  target_audience: 'all' | 'teachers' | 'students' | 'parents';
  priority: 'low' | 'medium' | 'high';
  published_at: string;
  expires_at?: string;
  author: User;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Form Types
export interface CreateStudentForm {
  // Basic Information
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string; // Will be converted to Date on backend
  gender: Gender;
  phone?: string;
  email?: string; // Optional

  // Address Information
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;

  // Academic Information
  admission_date: string; // Will be converted to Date on backend
  current_class_id?: string;

  // Parent/Guardian Information
  parent_id?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;

  // Medical Information
  medical_conditions?: string;
  allergies?: string;
  blood_group?: string;

  // Additional Information
  notes?: string;
}

// Multistep form step types
export interface StudentBasicInfoForm {
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: Gender;
  phone?: string;
  email?: string;
}

export interface StudentAddressForm {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface StudentParentForm {
  parent_id?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
}

export interface StudentEmergencyContactForm {
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface StudentMedicalForm {
  medical_conditions?: string;
  allergies?: string;
  blood_group?: string;
}

export interface StudentAcademicForm {
  admission_date: string;
  current_class_id?: string;
  notes?: string;
}

export interface CreateTeacherForm {
  // Basic Information
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  password: string;

  // Professional Information
  employee_id: string;
  department?: string;
  position?: string;
  qualification?: string;
  experience_years?: string;

  // Address Information
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;

  // Profile Information
  bio?: string;
}

// Step-specific form interfaces for multistep teacher form
export interface TeacherBasicInfoForm {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  password: string;
}

export interface TeacherProfessionalInfoForm {
  employee_id: string;
  department?: string;
  position?: string;
  qualification?: string;
  experience_years?: string;
  bio?: string;
}

export interface TeacherAddressInfoForm {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface CreateClassForm {
  name: string;
  level: ClassLevel;
  section?: string;
  teacher_id?: string;
  academic_session: string;
  capacity: number;
  description?: string;
}

export interface UpdateClassForm {
  name?: string;
  level?: ClassLevel;
  section?: string;
  teacher_id?: string;
  description?: string;
  is_active?: boolean;
}

// Dashboard Types
export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  total_revenue: number;
  pending_fees: number;
  recent_enrollments: number;
}

// Theme Types
export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}
