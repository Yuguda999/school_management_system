import { apiService } from './api';
import { Student, PaginatedResponse, CreateStudentForm } from '../types';
import { getSchoolCodeFromUrl, buildSchoolApiUrl } from '../utils/schoolCode';

class StudentService {
  // Get all students with pagination and filtering
  async getStudents(params?: {
    page?: number;
    size?: number;
    class_id?: string;
    status?: string;
    search?: string;
    school_id?: string;
  }): Promise<PaginatedResponse<Student>> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.school_id) queryParams.append('school_id', params.school_id);

    const endpoint = buildSchoolApiUrl(schoolCode, `students/?${queryParams.toString()}`);
    return apiService.get<PaginatedResponse<Student>>(endpoint);
  }

  // Get student by ID
  async getStudentById(id: string): Promise<Student> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, `students/${id}`);
    return apiService.get<Student>(endpoint);
  }

  // Get students by subject (for teachers)
  async getStudentsBySubject(subjectId: string, params?: {
    page?: number;
    size?: number;
  }): Promise<Student[]> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const endpoint = buildSchoolApiUrl(schoolCode, `students/by-subject/${subjectId}?${queryParams.toString()}`);
    return apiService.get<Student[]>(endpoint);
  }

  // Create new student
  async createStudent(studentData: CreateStudentForm): Promise<Student> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, 'students/');
    return apiService.post<Student>(endpoint, studentData);
  }

  // Update student
  async updateStudent(id: string, studentData: Partial<CreateStudentForm>): Promise<Student> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, `students/${id}`);
    return apiService.put<Student>(endpoint, studentData);
  }

  // Delete student
  async deleteStudent(id: string): Promise<void> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, `students/${id}`);
    return apiService.delete(endpoint);
  }

  // Update student status
  async updateStudentStatus(id: string, status: 'active' | 'graduated' | 'transferred' | 'suspended' | 'expelled'): Promise<Student> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, `students/${id}/status`);
    return apiService.patch<Student>(endpoint, { status });
  }

  // Assign student to class
  async assignToClass(studentId: string, classId: string): Promise<Student> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, `students/${studentId}/assign-class`);
    return apiService.post<Student>(endpoint, { class_id: classId });
  }

  // Remove student from class
  async removeFromClass(studentId: string): Promise<Student> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, `students/${studentId}/remove-class`);
    return apiService.post<Student>(endpoint);
  }

  // Get student's academic record
  async getStudentAcademicRecord(id: string): Promise<any> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, `students/${id}/academic-record`);
    return apiService.get(endpoint);
  }

  // Bulk operations
  async bulkUpdateStudents(studentIds: string[], updates: Partial<CreateStudentForm>): Promise<Student[]> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, 'students/bulk-update');

    // Transform data to match backend schema: { students: [{ id: "...", ...updates }, ...] }
    const students = studentIds.map(id => ({
      id,
      ...updates
    }));

    return apiService.post<Student[]>(endpoint, {
      students
    });
  }

  async bulkAssignToClass(studentIds: string[], classId: string): Promise<Student[]> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, 'students/bulk-assign-class');
    return apiService.post<Student[]>(endpoint, {
      student_ids: studentIds,
      class_id: classId,
    });
  }

  // Import students from CSV
  async importStudents(file: File): Promise<{
    total_rows: number;
    successful_imports: number;
    failed_imports: number;
    errors: Array<{
      row: number;
      field: string;
      value: string;
      error: string;
    }>;
    created_students: Student[];
  }> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const formData = new FormData();
    formData.append('file', file);

    const endpoint = buildSchoolApiUrl(schoolCode, 'students/import');
    return apiService.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Download CSV template
  async downloadTemplate(): Promise<Blob> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const endpoint = buildSchoolApiUrl(schoolCode, 'students/import/template');
    const response = await apiService.api.get(endpoint, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Export students to CSV
  async exportStudents(params?: {
    class_id?: string;
    status?: string;
    search?: string;
    format?: 'csv' | 'xlsx';
  }): Promise<Blob> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }

    const queryParams = new URLSearchParams();
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.format) queryParams.append('format', params.format);

    const endpoint = buildSchoolApiUrl(schoolCode, `students/export?${queryParams.toString()}`);
    const response = await apiService.api.get(endpoint, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Student Portal Methods (for authenticated students)
  async getMyProfile(): Promise<any> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }
    return apiService.get(buildSchoolApiUrl(schoolCode, 'students/me/profile'));
  }

  async getMyClassHistory(): Promise<any[]> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }
    return apiService.get(buildSchoolApiUrl(schoolCode, 'students/me/class-history'));
  }

  async getMyGrades(termId?: string): Promise<any[]> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }
    const params = termId ? `?term_id=${termId}` : '';
    return apiService.get(buildSchoolApiUrl(schoolCode, `students/me/grades${params}`));
  }

  async getMyGradesSummary(termId: string): Promise<any> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }
    return apiService.get(buildSchoolApiUrl(schoolCode, `students/me/grades/summary?term_id=${termId}`));
  }

  async getMyPerformanceTrends(): Promise<any> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }
    return apiService.get(buildSchoolApiUrl(schoolCode, 'students/me/performance/trends'));
  }

  async getMyTerms(): Promise<any[]> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }
    return apiService.get(buildSchoolApiUrl(schoolCode, 'students/me/terms'));
  }

  async getMyFees(termId?: string, status?: string): Promise<any[]> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }
    const queryParams = new URLSearchParams();
    if (termId) queryParams.append('term_id', termId);
    if (status) queryParams.append('status', status);

    return apiService.get(buildSchoolApiUrl(schoolCode, `students/me/fees?${queryParams.toString()}`));
  }

  async getMyPayments(page: number = 1, size: number = 20): Promise<any[]> {
    const schoolCode = getSchoolCodeFromUrl();
    if (!schoolCode) {
      throw new Error('School code not found in URL');
    }
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());

    return apiService.get(buildSchoolApiUrl(schoolCode, `students/me/payments?${queryParams.toString()}`));
  }
}

export const studentService = new StudentService();
