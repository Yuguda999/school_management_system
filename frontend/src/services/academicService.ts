import { apiService } from './api';
import { PaginatedResponse, Class, CreateClassForm, UpdateClassForm } from '../types';

class AcademicService {
  // Classes
  async getClasses(params?: {
    academic_session?: string;
    is_active?: boolean;
    page?: number;
    size?: number;
  }): Promise<Class[]> {
    const queryParams = new URLSearchParams();

    if (params?.academic_session) queryParams.append('academic_session', params.academic_session);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/classes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Class[]>(url);
  }

  async getClass(classId: string): Promise<Class> {
    return apiService.get<Class>(`/api/v1/classes/${classId}`);
  }

  async createClass(classData: CreateClassForm): Promise<Class> {
    console.log('Academic service creating class:', classData);
    return apiService.post<Class>('/api/v1/classes', classData);
  }

  async updateClass(classId: string, classData: UpdateClassForm): Promise<Class> {
    return apiService.put<Class>(`/api/v1/classes/${classId}`, classData);
  }

  async deleteClass(classId: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/api/v1/classes/${classId}`);
  }

  // Subjects
  async getSubjects(params?: {
    class_id?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/academic/subjects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<PaginatedResponse<any>>(url);
  }

  async getSubject(subjectId: string): Promise<any> {
    return apiService.get<any>(`/api/v1/academic/subjects/${subjectId}`);
  }

  async createSubject(subjectData: any): Promise<any> {
    return apiService.post<any>('/api/v1/academic/subjects', subjectData);
  }

  async updateSubject(subjectId: string, subjectData: any): Promise<any> {
    return apiService.put<any>(`/api/v1/academic/subjects/${subjectId}`, subjectData);
  }

  async deleteSubject(subjectId: string): Promise<void> {
    return apiService.delete<void>(`/api/v1/academic/subjects/${subjectId}`);
  }

  // Terms
  async getTerms(params?: {
    academic_year?: string;
    is_current?: boolean;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params?.academic_year) queryParams.append('academic_year', params.academic_year);
    if (params?.is_current !== undefined) queryParams.append('is_current', params.is_current.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/academic/terms${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<PaginatedResponse<any>>(url);
  }

  async getTerm(termId: string): Promise<any> {
    return apiService.get<any>(`/api/v1/academic/terms/${termId}`);
  }

  async createTerm(termData: any): Promise<any> {
    return apiService.post<any>('/api/v1/academic/terms', termData);
  }

  async updateTerm(termId: string, termData: any): Promise<any> {
    return apiService.put<any>(`/api/v1/academic/terms/${termId}`, termData);
  }

  async deleteTerm(termId: string): Promise<void> {
    return apiService.delete<void>(`/api/v1/academic/terms/${termId}`);
  }
}

export const academicService = new AcademicService();
