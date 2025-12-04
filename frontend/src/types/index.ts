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
  school_id: string | null;
  school?: SchoolInfo;
  school_code?: string; // Direct access to school code
  school_name?: string; // Direct access to school name
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

export interface SchoolInfo {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  email: string;
  phone?: string;
  website?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description?: string;
  motto?: string;
  established_year?: string;
  current_session: string;
  current_term: string;
  settings?: Record<string, any>;
  is_active: boolean;
  is_verified: boolean;
  subscription_plan: string;
  subscription_status: string;
  trial_started_at?: string;
  trial_expires_at?: string;
  trial_days: number;
  trial_days_remaining?: number;
  is_trial?: boolean;
  trial_expired?: boolean;
  max_students?: number;
  max_teachers?: number;
  max_classes?: number;
  default_template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubjectInfo {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  is_head_of_subject: boolean;
}

export type UserRole = 'platform_super_admin' | 'school_owner' | 'school_admin' | 'teacher' | 'student' | 'parent';

export type Gender = 'male' | 'female' | 'other';

// CBT (Computer-Based Testing) Types
export type TestStatus = 'draft' | 'published' | 'archived';
export type SubmissionStatus = 'not_started' | 'in_progress' | 'submitted' | 'graded';

export interface CBTQuestionOption {
  id?: string;
  option_label: string;
  option_text: string;
  is_correct: boolean;
  order_number: number;
  question_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CBTQuestion {
  id?: string;
  question_text: string;
  question_type?: string;
  points: number;
  order_number: number;
  image_url?: string;
  media_url?: string;
  test_id?: string;
  options: CBTQuestionOption[];
  created_at?: string;
  updated_at?: string;
}

export interface CBTTest {
  id?: string;
  title: string;
  description?: string;
  instructions?: string;
  subject_id: string;
  grade_level?: string;
  duration_minutes: number;
  total_points?: number;
  pass_percentage?: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  allow_multiple_attempts?: boolean;
  max_attempts?: number;
  show_results_immediately?: boolean;
  show_correct_answers?: boolean;
  status?: TestStatus;
  created_by?: string;
  school_id?: string;
  questions?: CBTQuestion[];
  question_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CBTTestSchedule {
  id?: string;
  test_id: string;
  start_datetime: string;
  end_datetime: string;
  class_id?: string;
  student_ids?: string[];
  school_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CBTAnswer {
  id?: string;
  submission_id?: string;
  question_id: string;
  selected_option_id?: string;
  is_correct?: boolean;
  points_earned?: number;
  answered_at?: string;
  time_spent_seconds?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudentBasicInfo {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
}

export interface CBTSubmission {
  id?: string;
  test_id: string;
  schedule_id: string;
  student_id?: string;
  status?: SubmissionStatus;
  started_at?: string;
  submitted_at?: string;
  time_spent_seconds?: number;
  total_score?: number;
  total_possible?: number;
  percentage?: number;
  passed?: boolean;
  attempt_number?: number;
  school_id?: string;
  answers?: CBTAnswer[];
  student?: StudentBasicInfo;
  created_at?: string;
  updated_at?: string;
}

export interface CBTTestForStudent {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  duration_minutes: number;
  total_points: number;
  question_count: number;
  questions: CBTQuestion[];
}

export interface AvailableTest {
  submission_id: string;
  test_id: string;
  test_title: string;
  test_description?: string;
  subject_name?: string;
  duration_minutes: number;
  total_points: number;
  start_datetime: string;
  end_datetime: string;
  is_available: boolean;
  can_attempt: boolean;
  status: SubmissionStatus;
  attempt_number: number;
  max_attempts: number;
  score?: number;
  percentage?: number;
  passed?: boolean;
}

// CBT Form Types
export interface CBTTestCreate {
  title: string;
  description?: string;
  instructions?: string;
  subject_id: string;
  grade_level?: string;
  duration_minutes: number;
  pass_percentage?: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  allow_multiple_attempts?: boolean;
  max_attempts?: number;
  show_results_immediately?: boolean;
  show_correct_answers?: boolean;
  questions?: CBTQuestion[];
}

export interface CBTTestUpdate {
  title?: string;
  description?: string;
  instructions?: string;
  subject_id?: string;
  grade_level?: string;
  duration_minutes?: number;
  pass_percentage?: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  allow_multiple_attempts?: boolean;
  max_attempts?: number;
  show_results_immediately?: boolean;
  show_correct_answers?: boolean;
  status?: TestStatus;
}

export interface CBTScheduleCreate {
  test_id: string;
  start_datetime: string;
  end_datetime: string;
  class_id?: string;
  student_ids?: string[];
}

export interface CBTSubmissionSubmit {
  answers: {
    question_id: string;
    selected_option_id?: string;
  }[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SchoolSelectionRequest {
  school_id: string;
}

export interface SchoolSelectionResponse {
  access_token: string;
  school: SchoolOption;
  message: string;
}

export interface OwnedSchoolsResponse {
  schools: SchoolOption[];
  total_count: number;
  has_multiple_schools: boolean;
}

export interface SchoolOption {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  is_primary: boolean;
  subscription_plan?: string;
  subscription_status?: string;
  is_trial?: boolean;
  trial_expires_at?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  email: string;
  role: UserRole;
  school_id: string | null;
  full_name: string;
  profile_completed: boolean;
  requires_school_selection?: boolean;
  available_schools?: SchoolOption[];
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
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended' | 'expelled';

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
  report_card_template_id?: string;
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

// Timetable Types
export interface TimetableEntry {
  id: string;
  day_of_week: number; // 0=Monday, 6=Sunday
  start_time: string;
  end_time: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  term_id: string;
  room?: string;
  notes?: string;
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
  term_name?: string;
  created_at: string;
  updated_at: string;
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
  subjects_assessed: number;
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
  amount_paid: number;
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
  transaction_reference?: string;
  receipt_number: string;
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
  payment_date: string;
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
  status?: 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended' | 'expelled';
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
  report_card_template_id?: string;
  is_active?: boolean;
}

// Document Types
export interface Document {
  id: string;
  title: string;
  description?: string;
  document_type: DocumentType;
  status: DocumentStatus;
  file_name: string;
  original_file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  student_id: string;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  expires_at?: string;
  tags?: string;
  is_public: boolean;
  school_id: string;
  created_at: string;
  updated_at: string;
  file_size_mb?: number;
  is_expired?: boolean;
  is_image?: boolean;
  is_pdf?: boolean;
  uploader_name?: string;
  verifier_name?: string;
  student_name?: string;
}

export type DocumentType =
  | 'birth_certificate'
  | 'passport'
  | 'national_id'
  | 'medical_record'
  | 'academic_transcript'
  | 'immunization_record'
  | 'photo'
  | 'parent_id'
  | 'proof_of_address'
  | 'other';

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export * from './dashboard';

// Theme Types
export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

// ============================================================================
// Teacher Materials Management Types
// ============================================================================

export type MaterialType =
  | 'pdf'
  | 'document'
  | 'presentation'
  | 'spreadsheet'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'other';

export type ShareType =
  | 'all_students'
  | 'class'
  | 'individual_student'
  | 'teacher'
  | 'public';

export type AccessType =
  | 'view'
  | 'download'
  | 'preview';

export interface TeacherMaterial {
  id: string;
  title: string;
  description?: string;
  material_type: MaterialType;
  file_name: string;
  original_file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  school_id: string;
  subject_id?: string;
  grade_level?: string;
  topic?: string;
  tags: string[];
  is_published: boolean;
  published_at?: string;
  scheduled_publish_at?: string;
  version_number: number;
  parent_material_id?: string;
  is_current_version: boolean;
  view_count: number;
  download_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;

  // Computed properties
  file_size_mb?: number;
  is_image?: boolean;
  is_pdf?: boolean;
  is_video?: boolean;
  is_audio?: boolean;
  can_preview?: boolean;

  // Related data
  uploader_name?: string;
  subject_name?: string;
  share_count?: number;
}

export interface MaterialCreate {
  title: string;
  description?: string;
  material_type?: MaterialType;
  subject_id?: string;
  grade_level?: string;
  topic?: string;
  tags?: string[];
  is_published?: boolean;
  scheduled_publish_at?: string;
}

export interface MaterialUpdate {
  title?: string;
  description?: string;
  material_type?: MaterialType;
  subject_id?: string;
  grade_level?: string;
  topic?: string;
  tags?: string[];
  is_published?: boolean;
  scheduled_publish_at?: string;
  is_favorite?: boolean;
}

export interface MaterialUploadResponse {
  message: string;
  material_id: string;
  file_url: string;
  preview_url?: string;
}

export interface BulkUploadResponse {
  message: string;
  successful_uploads: MaterialUploadResponse[];
  failed_uploads: Array<{ filename: string; error: string }>;
  total_count: number;
  success_count: number;
  failure_count: number;
}

export interface MaterialShare {
  id: string;
  material_id: string;
  school_id: string;
  share_type: ShareType;
  target_id?: string;
  can_download: boolean;
  can_view: boolean;
  expires_at?: string;
  shared_by: string;
  shared_at: string;
  created_at: string;

  // Computed properties
  is_expired?: boolean;

  // Related data
  sharer_name?: string;
  target_name?: string;
  material_title?: string;
}

export interface MaterialShareCreate {
  material_id?: string;
  share_type: ShareType;
  target_id?: string;
  can_download?: boolean;
  can_view?: boolean;
  expires_at?: string;
}

export interface BulkShareCreate {
  material_ids: string[];
  share_type: ShareType;
  target_id?: string;
  can_download?: boolean;
  can_view?: boolean;
  expires_at?: string;
}

export interface MaterialFolder {
  id: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  teacher_id: string;
  school_id: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;

  // Related data
  material_count?: number;
  subfolder_count?: number;
}

export interface MaterialFolderCreate {
  name: string;
  description?: string;
  parent_folder_id?: string;
  color?: string;
  icon?: string;
}

export interface MaterialFolderUpdate {
  name?: string;
  description?: string;
  parent_folder_id?: string;
  color?: string;
  icon?: string;
}

export interface MaterialStats {
  total_materials: number;
  published_materials: number;
  draft_materials: number;
  total_storage_mb: number;
  materials_by_type: Record<string, number>;
  materials_by_subject: Record<string, number>;
  recent_uploads: TeacherMaterial[];
  popular_materials: TeacherMaterial[];
  total_views: number;
  total_downloads: number;
}

export interface MaterialAnalytics {
  material_id: string;
  view_count: number;
  download_count: number;
  share_count: number;
  unique_viewers: number;
  recent_access: Array<Record<string, any>>;
  access_by_date: Record<string, number>;
}

export interface StorageQuota {
  used_mb: number;
  quota_mb: number;
  percentage_used: number;
  remaining_mb: number;
  material_count: number;
  largest_materials: TeacherMaterial[];
}

export interface MaterialFilters {
  subject_id?: string;
  grade_level?: string;
  material_type?: MaterialType;
  tags?: string[];
  search?: string;
  is_published?: boolean;
  is_favorite?: boolean;
}

export interface MaterialListParams extends MaterialFilters {
  skip?: number;
  limit?: number;
}

// Notification Types
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface Notification {
  id: string;
  school_id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  created_at: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  school_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Asset Management Types
export enum AssetCategory {
  FURNITURE = 'furniture',
  BUILDING = 'building',
  EQUIPMENT = 'equipment',
  ELECTRONICS = 'electronics',
  VEHICLES = 'vehicles',
  SPORTS = 'sports',
  LABORATORY = 'laboratory',
  OTHER = 'other'
}

export enum AssetCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged'
}

export interface Asset {
  id: string;
  school_id: string;
  name: string;
  category: AssetCategory;
  description?: string;
  quantity: number;
  condition: AssetCondition;
  location?: string;
  purchase_date?: string;
  purchase_price?: number;
  serial_number?: string;
  warranty_expiry?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetCreate {
  name: string;
  category: AssetCategory;
  description?: string;
  quantity: number;
  condition: AssetCondition;
  location?: string;
  purchase_date?: string;
  purchase_price?: number;
  serial_number?: string;
  warranty_expiry?: string;
  is_active?: boolean;
}

export interface AssetUpdate {
  name?: string;
  category?: AssetCategory;
  description?: string;
  quantity?: number;
  condition?: AssetCondition;
  location?: string;
  purchase_date?: string;
  purchase_price?: number;
  serial_number?: string;
  warranty_expiry?: string;
  is_active?: boolean;
}

export interface AssetStats {
  total_assets: number;
  total_value: number;
  by_category: Record<string, number>;
  by_condition: Record<string, number>;
  active_assets: number;
  inactive_assets: number;
}

// Grade Template Types
export interface AssessmentComponent {
  id?: string;
  template_id?: string;
  name: string;
  weight: number; // Percentage weight (0-100)
  is_required: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentComponentCreate {
  name: string;
  weight: number;
  is_required?: boolean;
  order?: number;
}

export interface GradeScaleItem {
  id?: string;
  template_id?: string;
  grade: string; // e.g., "A+", "A", "B", etc.
  min_score: number;
  max_score: number;
  remark?: string; // e.g., "Excellent", "Good", etc.
  color?: string; // Hex color code
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface GradeScaleCreate {
  grade: string;
  min_score: number;
  max_score: number;
  remark?: string;
  color?: string;
  order?: number;
}

export interface RemarkTemplate {
  id?: string;
  template_id?: string;
  min_percentage: number;
  max_percentage: number;
  remark_text: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface RemarkTemplateCreate {
  min_percentage: number;
  max_percentage: number;
  remark_text: string;
  order?: number;
}

export interface GradeTemplate {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  total_marks: number;
  is_default: boolean;
  is_active: boolean;
  created_by: string;
  assessment_components: AssessmentComponent[];
  grade_scales: GradeScaleItem[];
  remark_templates: RemarkTemplate[];
  created_at: string;
  updated_at: string;
}

export interface GradeTemplateCreate {
  name: string;
  description?: string;
  total_marks?: number;
  assessment_components: AssessmentComponentCreate[];
  grade_scales: GradeScaleCreate[];
  remark_templates?: RemarkTemplateCreate[];
}

export interface GradeTemplateUpdate {
  name?: string;
  description?: string;
  total_marks?: number;
  is_active?: boolean;
  assessment_components?: AssessmentComponentCreate[];
  grade_scales?: GradeScaleCreate[];
  remark_templates?: RemarkTemplateCreate[];
}

export interface GradeTemplateSummary {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  total_marks: number;
  component_count: number;
  scale_count: number;
  created_at: string;
  updated_at: string;
}

// Component Mapping Types
export interface ComponentMapping {
  id: string;
  school_id: string;
  teacher_id: string;
  subject_id: string;
  term_id: string;
  component_id: string;
  exam_type_name: string;
  include_in_calculation: boolean;
  component_name?: string;
  component_weight?: number;
  created_at: string;
  updated_at: string;
}

export interface ComponentMappingCreate {
  teacher_id: string;
  subject_id: string;
  term_id: string;
  component_id: string;
  exam_type_name: string;
  include_in_calculation?: boolean;
}

export interface ComponentMappingUpdate {
  exam_type_name?: string;
  component_id?: string;
  include_in_calculation?: boolean;
}

export interface ExamTypeInfo {
  exam_type_name: string;
  exam_count: number;
  mapped: boolean;
  mapped_to_component?: string;
}

export interface MappingPreview {
  component_id: string;
  component_name: string;
  component_weight: number;
  mapped_exam_types: string[];
  exam_count: number;
  sample_score?: number;
  weighted_score?: number;
}

// Grade Setup Redesign Types
export interface SubjectWithMapping {
  subject_id: string;
  subject_name: string;
  class_id: string;
  class_name: string;
  term_id: string;
  term_name: string;
  has_mappings: boolean;
  student_count: number;
  template_id?: string;
  template_name?: string;
}

export interface SubjectsWithMappingsResponse {
  subjects: SubjectWithMapping[];
}

export interface ConsolidatedStudentGrade {
  student_id: string;
  student_name: string;
  component_scores: Record<string, number>;
  total: number;
  grade?: string;
}

export interface SubjectConsolidatedGradesResponse {
  subject_id: string;
  subject_name: string;
  class_name: string;
  term_name: string;
  template_components: string[];
  students: ConsolidatedStudentGrade[];
}
