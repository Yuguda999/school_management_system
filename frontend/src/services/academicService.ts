import { apiService } from './api';
import {
  PaginatedResponse,
  Class,
  CreateClassForm,
  UpdateClassForm,
  Subject,
  CreateSubjectForm,
  Term,
  TeacherSubjectAssignment,
  ClassSubjectAssignment,
  BulkTeacherSubjectAssignment,
  BulkClassSubjectAssignment
} from '../types';

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

  // Get teacher's assigned classes (for teachers only)
  async getTeacherClasses(params?: {
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
    is_active?: boolean;
    is_core?: boolean;
    page?: number;
    size?: number;
  }): Promise<Subject[]> {
    const queryParams = new URLSearchParams();

    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.is_core !== undefined) queryParams.append('is_core', params.is_core.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/subjects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Subject[]>(url);
  }

  async getSubject(subjectId: string): Promise<Subject> {
    return apiService.get<Subject>(`/api/v1/subjects/${subjectId}`);
  }

  async createSubject(subjectData: CreateSubjectForm): Promise<Subject> {
    return apiService.post<Subject>('/api/v1/subjects', subjectData);
  }

  async updateSubject(subjectId: string, subjectData: Partial<CreateSubjectForm>): Promise<Subject> {
    return apiService.put<Subject>(`/api/v1/subjects/${subjectId}`, subjectData);
  }

  async deleteSubject(subjectId: string): Promise<void> {
    return apiService.delete<void>(`/api/v1/subjects/${subjectId}`);
  }

  // Terms
  async getTerms(params?: {
    academic_year?: string;
    is_current?: boolean;
    page?: number;
    size?: number;
  }): Promise<Term[]> {
    const queryParams = new URLSearchParams();

    if (params?.academic_year) queryParams.append('academic_year', params.academic_year);
    if (params?.is_current !== undefined) queryParams.append('is_current', params.is_current.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/terms${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Term[]>(url);
  }

  async getTerm(termId: string): Promise<Term> {
    return apiService.get<Term>(`/api/v1/terms/${termId}`);
  }

  async createTerm(termData: any): Promise<any> {
    return apiService.post<any>('/api/v1/terms', termData);
  }

  async updateTerm(termId: string, termData: any): Promise<any> {
    return apiService.put<any>(`/api/v1/terms/${termId}`, termData);
  }

  async deleteTerm(termId: string): Promise<void> {
    return apiService.delete<void>(`/api/v1/terms/${termId}`);
  }

  async getCurrentTerm(): Promise<Term> {
    return apiService.get<Term>('/api/v1/terms/current');
  }

  async setCurrentTerm(termId: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`/api/v1/terms/${termId}/set-current`);
  }

  async createBulkTerms(bulkData: {
    academic_session: string;
    first_term_start: string;
    first_term_end: string;
    second_term_start: string;
    second_term_end: string;
    third_term_start?: string;
    third_term_end?: string;
  }): Promise<{
    academic_session: string;
    terms_created: Term[];
    message: string;
  }> {
    return apiService.post('/api/v1/terms/bulk', bulkData);
  }

  // Teacher-Subject Assignments
  async assignSubjectToTeacher(teacherId: string, assignmentData: {
    subject_id: string;
    is_head_of_subject?: boolean;
  }): Promise<TeacherSubjectAssignment> {
    return apiService.post<TeacherSubjectAssignment>(
      `/api/v1/assignments/teachers/${teacherId}/subjects`,
      assignmentData
    );
  }

  async bulkAssignSubjectsToTeacher(
    teacherId: string,
    assignmentData: Omit<BulkTeacherSubjectAssignment, 'teacher_id'>
  ): Promise<TeacherSubjectAssignment[]> {
    return apiService.post<TeacherSubjectAssignment[]>(
      `/api/v1/assignments/teachers/${teacherId}/subjects/bulk`,
      assignmentData
    );
  }

  async getTeacherSubjects(teacherId: string): Promise<TeacherSubjectAssignment[]> {
    return apiService.get<TeacherSubjectAssignment[]>(
      `/api/v1/assignments/teachers/${teacherId}/subjects`
    );
  }

  async getSubjectTeachers(subjectId: string): Promise<TeacherSubjectAssignment[]> {
    return apiService.get<TeacherSubjectAssignment[]>(
      `/api/v1/assignments/subjects/${subjectId}/teachers`
    );
  }

  async removeTeacherSubjectAssignment(assignmentId: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/api/v1/assignments/teacher-subjects/${assignmentId}`);
  }

  async updateTeacherSubjectAssignment(
    assignmentId: string,
    updateData: { is_head_of_subject?: boolean }
  ): Promise<TeacherSubjectAssignment> {
    return apiService.put<TeacherSubjectAssignment>(
      `/api/v1/assignments/teacher-subjects/${assignmentId}`,
      updateData
    );
  }

  // Class-Subject Assignments
  async assignSubjectToClass(classId: string, assignmentData: {
    subject_id: string;
    is_core?: boolean;
  }): Promise<ClassSubjectAssignment> {
    return apiService.post<ClassSubjectAssignment>(
      `/api/v1/assignments/classes/${classId}/subjects`,
      assignmentData
    );
  }

  async bulkAssignSubjectsToClass(
    classId: string,
    assignmentData: Omit<BulkClassSubjectAssignment, 'class_id'>
  ): Promise<ClassSubjectAssignment[]> {
    return apiService.post<ClassSubjectAssignment[]>(
      `/api/v1/assignments/classes/${classId}/subjects/bulk`,
      assignmentData
    );
  }

  async getClassSubjects(classId: string): Promise<ClassSubjectAssignment[]> {
    return apiService.get<ClassSubjectAssignment[]>(
      `/api/v1/assignments/classes/${classId}/subjects`
    );
  }

  // Get class timetable
  async getClassTimetable(classId: string, termId: string): Promise<TimetableEntry[]> {
    return apiService.get<TimetableEntry[]>(
      `/api/v1/classes/${classId}/timetable?term_id=${termId}`
    );
  }

  // Get current term (we'll need this for timetable)
  async getCurrentTerm(): Promise<Term | null> {
    try {
      const terms = await apiService.get<Term[]>('/api/v1/terms?is_current=true&size=1');
      return terms.length > 0 ? terms[0] : null;
    } catch (error) {
      console.error('Failed to get current term:', error);
      return null;
    }
  }

  async getSubjectClasses(subjectId: string): Promise<ClassSubjectAssignment[]> {
    return apiService.get<ClassSubjectAssignment[]>(
      `/api/v1/assignments/subjects/${subjectId}/classes`
    );
  }

  async removeClassSubjectAssignment(assignmentId: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/api/v1/assignments/class-subjects/${assignmentId}`);
  }

  async removeSubjectFromClass(classId: string, assignmentId: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/api/v1/assignments/classes/${classId}/subjects/${assignmentId}`);
  }

  async updateClassSubjectAssignment(
    classId: string,
    assignmentId: string,
    updateData: { is_core?: boolean }
  ): Promise<ClassSubjectAssignment> {
    return apiService.put<ClassSubjectAssignment>(
      `/api/v1/assignments/classes/${classId}/subjects/${assignmentId}`,
      updateData
    );
  }


}

export const academicService = new AcademicService();
