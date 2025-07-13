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
  profile_completed: boolean;
  school_id: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  qualification?: string;
  experience_years?: string;
  bio?: string;
  profile_picture_url?: string;
  department?: string;
  position?: string;
  subjects?: UserSubjectInfo[];
  created_at: string;
  updated_at: string;
}

export interface UserSubjectInfo {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  is_head_of_subject: boolean;
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
  profile_completed: boolean;
}

// Teacher Invitation Types
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface TeacherInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  department?: string;
  position?: string;
  invitation_token: string;
  status: InvitationStatus;
  expires_at: string;
  invited_at: string;
  accepted_at?: string;
  invited_by: string;
  school_id: string;
  invitation_message?: string;
  is_expired: boolean;
  is_pending: boolean;
}

export interface TeacherInvitationCreate {
  email: string;
  first_name: string;
  last_name: string;
  department?: string;
  position?: string;
  invitation_message?: string;
}

export interface InvitationAcceptRequest {
  invitation_token: string;
  password: string;
  confirm_password: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  qualification?: string;
  experience_years?: string;
  bio?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface InvitationValidationResponse {
  valid: boolean;
  invitation?: TeacherInvitation;
  message: string;
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
  is_core: boolean;
  credit_units: number;
  is_active: boolean;
  school_id: string;
  teachers?: TeacherSubjectInfo[];
  classes?: ClassSubjectInfo[];
  created_at: string;
  updated_at: string;
}

// Teacher-Subject Assignment Types
export interface TeacherSubjectAssignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  is_head_of_subject: boolean;
  teacher_name?: string;
  subject_name?: string;
  subject_code?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherSubjectInfo {
  teacher_id: string;
  teacher_name: string;
  is_head_of_subject: boolean;
}

export interface ClassSubjectInfo {
  class_id: string;
  class_name: string;
  is_core: boolean;
}

// Class-Subject Assignment Types
export interface ClassSubjectAssignment {
  id: string;
  class_id: string;
  subject_id: string;
  is_core?: boolean;
  class_name?: string;
  subject_name?: string;
  subject_code?: string;
  created_at: string;
  updated_at: string;
}

// Bulk Assignment Types
export interface BulkTeacherSubjectAssignment {
  teacher_id: string;
  subject_ids: string[];
  head_of_subject_id?: string;
}

export interface BulkClassSubjectAssignment {
  class_id: string;
  subject_assignments: {
    class_id: string;
    subject_id: string;
    is_core?: boolean;
  }[];
}

export enum TermType {
  FIRST_TERM = 'first_term',
  SECOND_TERM = 'second_term',
  THIRD_TERM = 'third_term'
}

export interface Term {
  id: string;
  name: string;
  type: TermType;
  academic_session: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  school_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTermForm {
  name: string;
  type: TermType;
  academic_session: string;
  start_date: string;
  end_date: string;
}

export interface UpdateTermForm {
  name?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  is_active?: boolean;
}

export interface BulkTermCreateForm {
  academic_session: string;
  first_term_start: string;
  first_term_end: string;
  second_term_start: string;
  second_term_end: string;
  third_term_start?: string;
  third_term_end?: string;
}

export interface BulkTermResponse {
  academic_session: string;
  terms_created: Term[];
  message: string;
}

// Grade Types
export type ExamType =
  | 'continuous_assessment'
  | 'mid_term'
  | 'final_exam'
  | 'quiz'
  | 'assignment'
  | 'project'
  | 'practical'
  | 'oral';

export type GradeScale =
  | 'A+'
  | 'A'
  | 'B+'
  | 'B'
  | 'C+'
  | 'C'
  | 'D+'
  | 'D'
  | 'E'
  | 'F';

export interface Exam {
  id: string;
  name: string;
  description?: string;
  exam_type: ExamType;
  exam_date: string;
  start_time?: string;
  duration_minutes?: number;
  total_marks: number;
  pass_marks: number;
  subject_id: string;
  class_id: string;
  term_id: string;
  instructions?: string;
  venue?: string;
  is_published: boolean;
  is_active: boolean;
  created_by: string;
  creator_name?: string;
  subject_name?: string;
  class_name?: string;
  term_name?: string;
  total_students?: number;
  graded_students?: number;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  score: number;
  total_marks: number;
  percentage: number;
  grade?: GradeScale;
  student_id: string;
  subject_id: string;
  exam_id: string;
  term_id: string;
  graded_by: string;
  graded_date: string;
  remarks?: string;
  is_published: boolean;
  grader_name?: string;
  student_name?: string;
  subject_name?: string;
  exam_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentGradesSummary {
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  term_id: string;
  term_name: string;
  total_subjects: number;
  graded_subjects: number;
  total_score: number;
  total_possible: number;
  overall_percentage: number;
  overall_grade?: GradeScale;
  position?: number;
  grades: Grade[];
}

export interface ClassGradesSummary {
  class_id: string;
  class_name: string;
  term_id: string;
  term_name: string;
  exam_id: string;
  exam_name: string;
  subject_id: string;
  subject_name: string;
  total_students: number;
  graded_students: number;
  highest_score?: number;
  lowest_score?: number;
  average_score?: number;
  pass_rate?: number;
  grades: Grade[];
}

export interface ReportCard {
  id: string;
  student_id: string;
  class_id: string;
  term_id: string;
  overall_score: number;
  overall_percentage: number;
  overall_grade?: GradeScale;
  position: number;
  total_students: number;
  generated_by: string;
  generated_date: string;
  is_published: boolean;
  teacher_comment?: string;
  principal_comment?: string;
  next_term_begins?: string;
  student_name?: string;
  class_name?: string;
  term_name?: string;
  generator_name?: string;
  grades: Grade[];
  created_at: string;
  updated_at: string;
}

export interface GradeStatistics {
  total_exams: number;
  published_exams: number;
  total_grades: number;
  published_grades: number;
  average_class_performance?: number;
  subjects_performance: Array<{
    subject_id: string;
    subject_name: string;
    average_score: number;
    total_students: number;
    pass_rate: number;
  }>;
  grade_distribution: Record<string, number>;
}

// Fee Types
export interface FeeStructure {
  id: string;
  name: string;
  description?: string;
  fee_type: 'tuition' | 'transport' | 'library' | 'lab' | 'examination' | 'sports' | 'uniform' | 'books' | 'other';
  amount: number;
  academic_session: string;
  applicable_to: 'all' | 'specific_classes'; // Whether it applies to all classes or specific ones
  class_ids?: string[]; // Array of class IDs when applicable_to is 'specific_classes'
  due_date?: string;
  late_fee_amount?: number;
  late_fee_days?: number;
  allow_installments: boolean;
  installment_count: number;
  is_active: boolean;
  is_mandatory: boolean;
  school_id: string;
  additional_data?: Record<string, any>;
  applicable_classes?: Array<{
    id: string;
    name: string;
    level: string;
    section?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface FeeAssignment {
  id: string;
  student_id: string;
  fee_structure_id: string;
  term_id: string;
  amount: number;
  discount_amount: number;
  amount_outstanding: number;
  due_date: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  school_id: string;
  created_at: string;
  updated_at: string;
  // Related data
  student?: Student;
  fee_structure?: FeeStructure;
  term?: Term;
  student_name?: string;
  fee_structure_name?: string;
  term_name?: string;
}

export interface FeePayment {
  id: string;
  student_id: string;
  fee_assignment_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'online' | 'cheque';
  transaction_id?: string;
  payment_date: string;
  collected_by: string;
  notes?: string;
  school_id: string;
  created_at: string;
  updated_at: string;
  // Related data
  student?: Student;
  fee_assignment?: FeeAssignment;
  collector?: User;
  student_name?: string;
  collector_name?: string;
}

// Fee form types
export interface CreateFeeStructureForm {
  name: string;
  description?: string;
  fee_type: string;
  amount: number;
  academic_session: string;
  applicable_to: 'all' | 'specific_classes';
  class_ids?: string[];
  due_date?: string;
  late_fee_amount?: number;
  late_fee_days?: number;
  allow_installments?: boolean;
  installment_count?: number;
  is_mandatory: boolean;
}

// Subject form types
export interface CreateSubjectForm {
  name: string;
  code: string;
  description?: string;
  is_core: boolean;
  credit_units: number;
}

export interface CreateFeeAssignmentForm {
  student_id: string;
  fee_structure_id: string;
  term_id: string;
  amount: number;
  discount_amount?: number;
  due_date: string;
}

export interface BulkFeeAssignmentForm {
  fee_structure_id: string;
  term_id: string;
  class_ids: string[];
  discount_amount?: number;
}

export interface CreateFeePaymentForm {
  student_id: string;
  fee_assignment_id: string;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
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

  // Subject Assignments
  subject_ids?: string[];
  head_of_subject_id?: string;
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
