/**
 * Curriculum Service for Curriculum Coverage & Lesson Plan Tracker (P2.3)
 */

import { apiService as api } from './api';

// ============== Types ==============

export type CoverageStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface CurriculumUnit {
  id: string;
  subject_id: string;
  subject_name?: string;
  class_id: string;
  class_name?: string;
  term_id: string;
  term_name?: string;
  title: string;
  description?: string;
  learning_objectives: string[];
  order: number;
  planned_weeks: number;
  coverage_status: CoverageStatus;
  coverage_percentage: number;
  started_at?: string;
  completed_at?: string;
  lesson_plans: LessonPlanItem[];
  created_at: string;
}

export interface LessonPlanItem {
  id: string;
  unit_id: string;
  title: string;
  description?: string;
  objectives: string[];
  activities: string[];
  resources: string[];
  assessment_methods: string[];
  duration_minutes: number;
  order: number;
  is_delivered: boolean;
  delivered_at?: string;
  delivery_notes?: string;
  created_at: string;
}

export interface CurriculumUnitCreate {
  subject_id: string;
  class_id: string;
  term_id: string;
  title: string;
  description?: string;
  learning_objectives?: string[];
  order?: number;
  planned_weeks?: number;
}

export interface LessonPlanCreate {
  title: string;
  description?: string;
  objectives?: string[];
  activities?: string[];
  resources?: string[];
  assessment_methods?: string[];
  duration_minutes?: number;
  order?: number;
}

export interface CoverageStats {
  total_units: number;
  completed_units: number;
  in_progress_units: number;
  not_started_units: number;
  skipped_units: number;
  overall_coverage_percentage: number;
  total_lessons: number;
  delivered_lessons: number;
  lesson_delivery_rate: number;
}

export interface SubjectCoverage {
  subject_id: string;
  subject_name: string;
  total_units: number;
  completed_units: number;
  coverage_percentage: number;
  units: CurriculumUnit[];
}

// ============== API Functions ==============

const curriculumService = {
  // Curriculum Units
  listUnits: async (schoolCode: string, subjectId?: string, classId?: string, termId?: string) => {
    const params: Record<string, string> = {};
    if (subjectId) params.subject_id = subjectId;
    if (classId) params.class_id = classId;
    if (termId) params.term_id = termId;
    return await api.get<CurriculumUnit[]>(`/school/${schoolCode}/curriculum/units`, { params });
  },

  createUnit: async (schoolCode: string, data: CurriculumUnitCreate) => {
    return await api.post<CurriculumUnit>(`/school/${schoolCode}/curriculum/units`, data);
  },

  getUnit: async (schoolCode: string, unitId: string) => {
    return await api.get<CurriculumUnit>(`/school/${schoolCode}/curriculum/units/${unitId}`);
  },

  updateUnit: async (schoolCode: string, unitId: string, data: Partial<CurriculumUnitCreate>) => {
    return await api.put<CurriculumUnit>(`/school/${schoolCode}/curriculum/units/${unitId}`, data);
  },

  deleteUnit: async (schoolCode: string, unitId: string) => {
    await api.delete(`/school/${schoolCode}/curriculum/units/${unitId}`);
  },

  updateUnitStatus: async (schoolCode: string, unitId: string, status: CoverageStatus, percentage?: number) => {
    return await api.patch<CurriculumUnit>(`/school/${schoolCode}/curriculum/units/${unitId}/status`, {
      coverage_status: status,
      coverage_percentage: percentage
    });
  },

  // Lesson Plans
  createLessonPlan: async (schoolCode: string, unitId: string, data: LessonPlanCreate) => {
    return await api.post<LessonPlanItem>(`/school/${schoolCode}/curriculum/units/${unitId}/lessons`, data);
  },

  updateLessonPlan: async (schoolCode: string, lessonId: string, data: Partial<LessonPlanCreate>) => {
    return await api.put<LessonPlanItem>(`/school/${schoolCode}/curriculum/lessons/${lessonId}`, data);
  },

  deleteLessonPlan: async (schoolCode: string, lessonId: string) => {
    await api.delete(`/school/${schoolCode}/curriculum/lessons/${lessonId}`);
  },

  markLessonDelivered: async (schoolCode: string, lessonId: string, notes?: string) => {
    return await api.post<LessonPlanItem>(`/school/${schoolCode}/curriculum/lessons/${lessonId}/deliver`, { notes });
  },

  // Coverage Analytics
  getCoverageAnalytics: async (schoolCode: string, classId?: string, termId?: string) => {
    const params: Record<string, string> = {};
    if (classId) params.class_id = classId;
    if (termId) params.term_id = termId;
    return await api.get<{
      stats: CoverageStats;
      by_subject: SubjectCoverage[];
    }>(`/school/${schoolCode}/curriculum/coverage`, { params });
  },
};

export default curriculumService;

