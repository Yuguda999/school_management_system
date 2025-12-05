import { apiService } from './api';
import {
  CBTTest,
  CBTTestCreate,
  CBTTestUpdate,
  CBTQuestion,
  CBTTestSchedule,
  CBTScheduleCreate,
  CBTSubmission,
  CBTSubmissionSubmit,
  CBTTestForStudent,
  AvailableTest,
} from '../types';

export const cbtService = {
  // Test Management (Teachers/Admins)
  async createTest(data: CBTTestCreate): Promise<CBTTest> {
    return await apiService.post<CBTTest>('/api/v1/cbt/tests', data);
  },

  async getTests(params?: {
    subject_id?: string;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<{ tests: CBTTest[]; total: number; page: number; size: number }> {
    const queryParams = new URLSearchParams();
    if (params?.subject_id) queryParams.append('subject_id', params.subject_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/cbt/tests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<{ tests: CBTTest[]; total: number; page: number; size: number }>(url);
  },

  async getTest(testId: string): Promise<CBTTest> {
    return await apiService.get<CBTTest>(`/api/v1/cbt/tests/${testId}`);
  },

  async updateTest(testId: string, data: CBTTestUpdate): Promise<CBTTest> {
    return await apiService.put<CBTTest>(`/api/v1/cbt/tests/${testId}`, data);
  },

  async deleteTest(testId: string): Promise<void> {
    await apiService.delete(`/api/v1/cbt/tests/${testId}`);
  },

  async publishTest(testId: string): Promise<CBTTest> {
    return this.updateTest(testId, { status: 'published' });
  },

  async unpublishTest(testId: string): Promise<CBTTest> {
    return this.updateTest(testId, { status: 'draft' });
  },

  // Question Management
  async addQuestion(testId: string, question: CBTQuestion): Promise<CBTQuestion> {
    return await apiService.post<CBTQuestion>(`/api/v1/cbt/tests/${testId}/questions`, question);
  },

  async updateQuestion(questionId: string, question: Partial<CBTQuestion>): Promise<CBTQuestion> {
    return await apiService.put<CBTQuestion>(`/api/v1/cbt/questions/${questionId}`, question);
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await apiService.delete(`/api/v1/cbt/questions/${questionId}`);
  },

  // Test Scheduling
  async createSchedule(data: CBTScheduleCreate): Promise<CBTTestSchedule> {
    return await apiService.post<CBTTestSchedule>('/api/v1/cbt/schedules', data);
  },

  async getSchedules(params?: {
    test_id?: string;
    class_id?: string;
    page?: number;
    size?: number;
  }): Promise<{ schedules: CBTTestSchedule[]; total: number; page: number; size: number }> {
    const queryParams = new URLSearchParams();
    if (params?.test_id) queryParams.append('test_id', params.test_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/cbt/schedules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<{ schedules: CBTTestSchedule[]; total: number; page: number; size: number }>(url);
  },

  async deleteSchedule(scheduleId: string): Promise<void> {
    await apiService.delete(`/api/v1/cbt/schedules/${scheduleId}`);
  },

  // Student Test Taking
  async getAvailableTests(): Promise<AvailableTest[]> {
    return await apiService.get<AvailableTest[]>('/api/v1/cbt/student/available-tests');
  },

  async startTest(submissionId: string): Promise<CBTTestForStudent> {
    return await apiService.post<CBTTestForStudent>(`/api/v1/cbt/submissions/${submissionId}/start`);
  },

  async submitTest(submissionId: string, data: CBTSubmissionSubmit): Promise<CBTSubmission> {
    return await apiService.post<CBTSubmission>(`/api/v1/cbt/submissions/${submissionId}/submit`, data);
  },

  async getTestResults(submissionId: string): Promise<CBTSubmission> {
    return await apiService.get<CBTSubmission>(`/api/v1/cbt/submissions/${submissionId}/results`);
  },

  // Teacher/Admin - View Submissions
  async getTestSubmissions(
    testId: string,
    params?: {
      schedule_id?: string;
      status?: string;
    }
  ): Promise<CBTSubmission[]> {
    const queryParams = new URLSearchParams();
    if (params?.schedule_id) queryParams.append('schedule_id', params.schedule_id);
    if (params?.status) queryParams.append('status', params.status);

    const url = `/api/v1/cbt/tests/${testId}/submissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<CBTSubmission[]>(url);
  },

  async getSubmissionDetails(submissionId: string): Promise<CBTSubmission> {
    return await apiService.get<CBTSubmission>(`/api/v1/cbt/submissions/${submissionId}`);
  },

  // Export Results
  async exportResults(testId: string): Promise<Blob> {
    return await apiService.get<Blob>(`/api/v1/cbt/tests/${testId}/export`, {
      responseType: 'blob',
    });
  },

  // AI Generation
  async generateTest(data: {
    subject: string;
    topic: string;
    difficulty_level: string;
    question_count: number;
    additional_context?: string;
  }): Promise<any> {
    return await apiService.post<any>('/api/v1/cbt/generate', data);
  },
};

