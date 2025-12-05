/**
 * Analytics Service for Advanced Features
 * Provides API calls for all analytics endpoints
 */

import { apiService as api } from './api';

// ============== Types ==============

export interface ClassAnalytics {
  class_id: string;
  class_name: string;
  total_students: number;
  average_attendance: number;
  average_grade: number;
  grade_distribution: Record<string, number>;
  at_risk_students: Array<{
    student_id: string;
    student_name: string;
    risk_factors: string[];
  }>;
  top_performers: Array<{
    student_id: string;
    student_name: string;
    average_grade: number;
  }>;
  subject_performance: Array<{
    subject_id: string;
    subject_name: string;
    average_grade: number;
    pass_rate: number;
  }>;
}

export interface FinanceAnalytics {
  total_revenue: number;
  total_collected: number;
  total_pending: number;
  total_overdue: number;
  overall_collection_rate: number;
  aging_buckets: Array<{
    bucket_name: string;
    count: number;
    amount: number;
  }>;
  revenue_by_term: Array<{
    term_id: string;
    term_name: string;
    academic_session: string;
    target_revenue: number;
    actual_revenue: number;
    collection_rate: number;
  }>;
  fee_type_breakdown: Array<{
    fee_type: string;
    total_assigned: number;
    collected: number;
    pending: number;
    overdue: number;
    collection_rate: number;
  }>;
  top_classes_by_outstanding: Array<{
    class_id: string;
    class_name: string;
    total_students: number;
    total_fees: number;
    fees_collected: number;
    pending_fees: number;
    overdue_fees: number;
    collection_rate: number;
  }>;
}

export interface EnrollmentAnalytics {
  current_enrollment: number;
  previous_enrollment: number;
  growth_rate: number;
  retention_rate: number;
  enrollment_trends: Array<{
    date: string;
    period_label: string;
    total: number;
    new_students: number;
    returning_students: number;
  }>;
  cohort_retention: Array<{
    period_label: string;
    retained_count: number;
    original_count: number;
    retention_percentage: number;
  }>;
  grade_level_distribution: Array<{
    grade_level: string;
    student_count: number;
  }>;
  by_class: Array<{
    class_id: string;
    class_name: string;
    count: number;
    capacity: number;
    utilization: number;
  }>;
  gender_distribution: Record<string, number>;
  total_new_this_term: number;
  total_returning: number;
}

export interface TeacherAnalytics {
  teacher_id: string;
  teacher_name: string;
  classes_count: number;
  subjects_count: number;
  total_students: number;
  average_class_performance: number;
  workload_hours: number;
  attendance_rate: number;
  lesson_plans_count: number;
  materials_count: number;
}

export interface StudentRecommendation {
  type: string;
  priority: string;
  subject?: string;
  current_score?: number;
  message: string;
  suggested_actions: string[];
}

export interface StudyRecommendationsResponse {
  student_id: string;
  weak_subjects: Array<{ id: string; name: string; average: number }>;
  strong_subjects: Array<{ id: string; name: string; average: number }>;
  attendance_rate: number;
  recommendations: StudentRecommendation[];
  recent_performance: Array<{ subject: string; score: number; date: string }>;
}

export interface EngagementAnalytics {
  total_messages: number;
  messages_by_type: Record<string, number>;
  recipient_engagement: {
    total_recipients: number;
    delivered: number;
    read: number;
    delivery_rate: number;
    read_rate: number;
  };
  announcements: {
    total: number;
    active: number;
    expired: number;
  };
  notifications: {
    total: number;
    read: number;
    unread: number;
  };
  daily_trends: Array<{
    date: string;
    messages: number;
    announcements: number;
  }>;
}

export interface BenchmarkData {
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  student_score: number;
  class_average: number;
  class_median: number;
  class_min: number;
  class_max: number;
  percentile: number;
  grade_distribution: Record<string, number>;
}

// ============== API Functions ==============

const analyticsService = {
  // Class Analytics (P1.3)
  getClassAnalytics: async (schoolCode: string, classId: string, termId?: string) => {
    const params = termId ? { term_id: termId } : {};
    return await api.get<ClassAnalytics>(`/api/v1/school/${schoolCode}/analytics/class/${classId}`, { params });
  },

  // Finance Analytics (P1.2)
  getFinanceAnalytics: async (schoolCode: string, termId?: string) => {
    const params = termId ? { term_id: termId } : {};
    return await api.get<FinanceAnalytics>(`/api/v1/school/${schoolCode}/analytics/financial`, { params });
  },

  // Enrollment Analytics (P2.1)
  getEnrollmentAnalytics: async (schoolCode: string, session?: string) => {
    const params = session ? { session } : {};
    return await api.get<EnrollmentAnalytics>(`/api/v1/school/${schoolCode}/analytics/enrollment`, { params });
  },

  // Teacher Analytics (P2.4)
  getTeacherAnalytics: async (schoolCode: string, teacherId: string, termId?: string) => {
    const params = termId ? { term_id: termId } : {};
    return await api.get<TeacherAnalytics>(`/api/v1/school/${schoolCode}/analytics/teacher/${teacherId}`, { params });
  },

  getAllTeachersAnalytics: async (schoolCode: string, termId?: string) => {
    const params = termId ? { term_id: termId } : {};
    return await api.get<TeacherAnalytics[]>(`/api/v1/school/${schoolCode}/analytics/teachers`, { params });
  },

  // Student Recommendations (P2.7)
  getStudentRecommendations: async (schoolCode: string, studentId?: string) => {
    const endpoint = studentId
      ? `/api/v1/school/${schoolCode}/analytics/student/${studentId}/recommendations`
      : `/api/v1/school/${schoolCode}/analytics/student/me/recommendations`;
    return await api.get<StudyRecommendationsResponse>(endpoint);
  },

  // Engagement Analytics (P2.6)
  getEngagementAnalytics: async (schoolCode: string, startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return await api.get<EngagementAnalytics>(`/api/v1/school/${schoolCode}/analytics/engagement`, { params });
  },

  // Benchmark Data (P3.3)
  getStudentBenchmark: async (schoolCode: string, studentId: string, subjectId?: string, termId?: string) => {
    const params: Record<string, string> = {};
    if (subjectId) params.subject_id = subjectId;
    if (termId) params.term_id = termId;
    return await api.get<BenchmarkData[]>(`/api/v1/school/${schoolCode}/analytics/benchmark/student/${studentId}`, { params });
  },

  getClassBenchmark: async (schoolCode: string, classId: string, subjectId?: string, termId?: string) => {
    const params: Record<string, string> = {};
    if (subjectId) params.subject_id = subjectId;
    if (termId) params.term_id = termId;
    return await api.get(`/api/v1/school/${schoolCode}/analytics/benchmark/class/${classId}`, { params });
  },
};

export default analyticsService;

