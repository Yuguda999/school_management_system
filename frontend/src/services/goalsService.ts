/**
 * Goals Service for Student Goal Setting & Progress Tracker (P2.5)
 */

import { apiService as api } from './api';

// ============== Types ==============

export type GoalCategory = 'academic' | 'attendance' | 'behavior' | 'extracurricular' | 'personal';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

export interface StudentGoal {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  target_value?: number;
  current_value?: number;
  target_date?: string;
  subject_id?: string;
  subject_name?: string;
  milestones: GoalMilestone[];
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  is_completed: boolean;
  completed_at?: string;
  order: number;
}

export interface GoalCreate {
  title: string;
  description?: string;
  category: GoalCategory;
  target_value?: number;
  target_date?: string;
  subject_id?: string;
  milestones?: Array<{ title: string; order: number }>;
}

export interface GoalUpdate {
  title?: string;
  description?: string;
  category?: GoalCategory;
  status?: GoalStatus;
  target_value?: number;
  current_value?: number;
  target_date?: string;
}

export interface GoalProgress {
  current_value: number;
  notes?: string;
}

export interface GoalStats {
  total_goals: number;
  completed: number;
  in_progress: number;
  not_started: number;
  abandoned: number;
  completion_rate: number;
  by_category: Record<GoalCategory, number>;
}

export interface GoalListResponse {
  items: StudentGoal[];
  total: number;
  active_count: number;
  completed_count: number;
}

// ============== API Functions ==============

const goalsService = {
  // List goals for current student
  getMyGoals: async (schoolCode: string, status?: GoalStatus, category?: GoalCategory) => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (category) params.category = category;
    return await api.get<GoalListResponse>(`/api/v1/school/${schoolCode}/goals/me`, { params });
  },

  // List goals for a specific student (teacher/admin)
  getStudentGoals: async (schoolCode: string, studentId: string, status?: GoalStatus) => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    return await api.get<GoalListResponse>(`/api/v1/school/${schoolCode}/goals/student/${studentId}`, { params });
  },

  // Create a new goal
  createGoal: async (schoolCode: string, data: GoalCreate, studentId?: string) => {
    const endpoint = studentId
      ? `/api/v1/school/${schoolCode}/goals/student/${studentId}`
      : `/api/v1/school/${schoolCode}/goals/me`;
    return await api.post<StudentGoal>(endpoint, data);
  },

  // Get a specific goal
  // Get a specific goal
  getGoal: async (schoolCode: string, goalId: string) => {
    return await api.get<StudentGoal>(`/api/v1/school/${schoolCode}/goals/me/${goalId}`);
  },

  // Update a goal
  updateGoal: async (schoolCode: string, goalId: string, data: GoalUpdate) => {
    return await api.put<StudentGoal>(`/api/v1/school/${schoolCode}/goals/me/${goalId}`, data);
  },

  // Delete a goal
  deleteGoal: async (schoolCode: string, goalId: string) => {
    await api.delete(`/api/v1/school/${schoolCode}/goals/me/${goalId}`);
  },

  // Update goal progress
  updateProgress: async (schoolCode: string, goalId: string, data: GoalProgress) => {
    return await api.post<StudentGoal>(`/api/v1/school/${schoolCode}/goals/me/${goalId}/progress`, data);
  },

  // Complete a milestone
  completeMilestone: async (schoolCode: string, goalId: string, milestoneId: string) => {
    return await api.post<StudentGoal>(`/api/v1/school/${schoolCode}/goals/me/milestones/${milestoneId}/complete`);
  },

  // Get goal statistics
  getGoalStats: async (schoolCode: string, studentId?: string) => {
    const endpoint = studentId
      ? `/api/v1/school/${schoolCode}/goals/student/${studentId}/stats`
      : `/api/v1/school/${schoolCode}/goals/me/stats`;
    return await api.get<GoalStats>(endpoint);
  },
};

export default goalsService;

