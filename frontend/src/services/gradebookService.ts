/**
 * Gradebook Service for Unified Assessment & Gradebook Automation (P2.2)
 */

import { apiService as api } from './api';

// ============== Types ==============

export interface GradebookEntry {
  student_id: string;
  student_name: string;
  admission_number: string;
  components: GradebookComponent[];
  total_score: number;
  weighted_score: number;
  grade: string;
  grade_point: number;
  remark: string;
}

export interface GradebookComponent {
  component_id: string;
  component_name: string;
  component_type: string;
  max_score: number;
  weight: number;
  score?: number;
  weighted_score?: number;
  source?: string;
  source_id?: string;
}

export interface GradebookSummary {
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  term_id: string;
  term_name: string;
  total_students: number;
  graded_students: number;
  class_average: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  grade_distribution: Record<string, number>;
}

export interface ComponentScore {
  student_id: string;
  component_id: string;
  score: number;
  source?: string;
  source_id?: string;
  notes?: string;
}

export interface BulkScoreUpdate {
  component_id: string;
  scores: Array<{
    student_id: string;
    score: number;
  }>;
}

export interface GradebookFilters {
  class_id: string;
  subject_id: string;
  term_id: string;
}

// ============== API Functions ==============

const gradebookService = {
  // Get gradebook for a class/subject/term
  getGradebook: async (schoolCode: string, filters: GradebookFilters) => {
    return await api.get<{
      entries: GradebookEntry[];
      summary: GradebookSummary;
    }>(`/school/${schoolCode}/gradebook`, { params: filters });
  },

  // Get gradebook summary
  getGradebookSummary: async (schoolCode: string, filters: GradebookFilters) => {
    return await api.get<GradebookSummary>(`/school/${schoolCode}/gradebook/summary`, { params: filters });
  },

  // Get student's gradebook entry
  getStudentGradebook: async (schoolCode: string, studentId: string, subjectId: string, termId: string) => {
    return await api.get<GradebookEntry>(`/school/${schoolCode}/gradebook/student/${studentId}`, {
      params: { subject_id: subjectId, term_id: termId }
    });
  },

  // Update a single component score
  updateComponentScore: async (schoolCode: string, data: ComponentScore) => {
    return await api.post(`/school/${schoolCode}/gradebook/scores`, data);
  },

  // Bulk update component scores
  bulkUpdateScores: async (schoolCode: string, data: BulkScoreUpdate) => {
    return await api.post(`/school/${schoolCode}/gradebook/scores/bulk`, data);
  },

  // Sync scores from CBT
  syncFromCBT: async (schoolCode: string, examId: string, componentId: string) => {
    return await api.post(`/school/${schoolCode}/gradebook/sync/cbt`, {
      exam_id: examId,
      component_id: componentId
    });
  },

  // Sync scores from assignments
  syncFromAssignments: async (schoolCode: string, assignmentId: string, componentId: string) => {
    return await api.post(`/school/${schoolCode}/gradebook/sync/assignment`, {
      assignment_id: assignmentId,
      component_id: componentId
    });
  },

  // Calculate final grades
  calculateFinalGrades: async (schoolCode: string, filters: GradebookFilters) => {
    return await api.post(`/school/${schoolCode}/gradebook/calculate`, filters);
  },

  // Export gradebook
  exportGradebook: async (schoolCode: string, filters: GradebookFilters, format: 'csv' | 'excel' | 'pdf') => {
    const response = await api.api.get(`/school/${schoolCode}/gradebook/export`, {
      params: { ...filters, format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Get available components for a class/subject
  getComponents: async (schoolCode: string, classId: string, subjectId: string, termId: string) => {
    return await api.get<GradebookComponent[]>(`/school/${schoolCode}/gradebook/components`, {
      params: { class_id: classId, subject_id: subjectId, term_id: termId }
    });
  },
};

export default gradebookService;

