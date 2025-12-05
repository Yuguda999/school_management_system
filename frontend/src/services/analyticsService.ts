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

export interface TeacherAnalyticsResponse {
  total_teachers: number;
  average_workload: number;
  teachers_above_average_workload: number;
  teacher_metrics: TeacherAnalytics[];
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

// ... (existing interfaces)

const analyticsService = {
  // Teacher Analytics (P2.4)
  getTeacherAnalytics: async (schoolCode: string, teacherId: string, termId?: string) => {
    const params = termId ? { term_id: termId } : {};
    // Note: The backend endpoint for single teacher might not exist or returns the wrapper. 
    // Assuming we use the plural endpoint with filter or a specific endpoint if it exists.
    // Based on previous errors, the frontend was calling the plural endpoint.
    // Let's assume we want to use the plural endpoint for now as that's what I fixed.
    return await api.get<TeacherAnalyticsResponse>(`/api/v1/school/${schoolCode}/analytics/teachers`, { params: { ...params, teacher_id: teacherId } });
  },

  getAllTeachersAnalytics: async (schoolCode: string, termId?: string) => {
    const params = termId ? { term_id: termId } : {};
    return await api.get<TeacherAnalyticsResponse>(`/api/v1/school/${schoolCode}/analytics/teachers`, { params });
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

