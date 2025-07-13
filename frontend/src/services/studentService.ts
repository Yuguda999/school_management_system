import { apiService } from './api';
import { Student, PaginatedResponse, CreateStudentForm } from '../types';

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
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.school_id) queryParams.append('school_id', params.school_id);

    return apiService.get<PaginatedResponse<Student>>(`/api/v1/students/?${queryParams.toString()}`);
  }

  // Get student by ID
  async getStudentById(id: string): Promise<Student> {
    return apiService.get<Student>(`/api/v1/students/${id}`);
  }

  // Get students by subject (for teachers)
  async getStudentsBySubject(subjectId: string, params?: {
    page?: number;
    size?: number;
  }): Promise<Student[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    return apiService.get<Student[]>(`/api/v1/students/by-subject/${subjectId}?${queryParams.toString()}`);
  }

  // Create new student
  async createStudent(studentData: CreateStudentForm): Promise<Student> {
    return apiService.post<Student>('/api/v1/students/', studentData);
  }

  // Update student
  async updateStudent(id: string, studentData: Partial<CreateStudentForm>): Promise<Student> {
    return apiService.put<Student>(`/api/v1/students/${id}`, studentData);
  }

  // Delete student
  async deleteStudent(id: string): Promise<void> {
    return apiService.delete(`/api/v1/students/${id}`);
  }

  // Update student status
  async updateStudentStatus(id: string, status: 'active' | 'graduated' | 'transferred' | 'suspended' | 'expelled'): Promise<Student> {
    return apiService.patch<Student>(`/api/v1/students/${id}/status`, { status });
  }

  // Assign student to class
  async assignToClass(studentId: string, classId: string): Promise<Student> {
    return apiService.post<Student>(`/api/v1/students/${studentId}/assign-class`, { class_id: classId });
  }

  // Remove student from class
  async removeFromClass(studentId: string): Promise<Student> {
    return apiService.post<Student>(`/api/v1/students/${studentId}/remove-class`);
  }

  // Get student's academic record
  async getStudentAcademicRecord(id: string): Promise<any> {
    return apiService.get(`/api/v1/students/${id}/academic-record`);
  }

  // Bulk operations
  async bulkUpdateStudents(studentIds: string[], updates: Partial<CreateStudentForm>): Promise<Student[]> {
    return apiService.post<Student[]>('/api/v1/students/bulk-update', {
      student_ids: studentIds,
      updates,
    });
  }

  async bulkAssignToClass(studentIds: string[], classId: string): Promise<Student[]> {
    return apiService.post<Student[]>('/api/v1/students/bulk-assign-class', {
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
    const formData = new FormData();
    formData.append('file', file);

    return apiService.post('/api/v1/students/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Download CSV template
  async downloadTemplate(): Promise<Blob> {
    return apiService.get('/api/v1/students/import/template', {
      responseType: 'blob',
    });
  }

  // Export students to CSV
  async exportStudents(params?: {
    class_id?: string;
    status?: string;
    format?: 'csv' | 'xlsx';
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.format) queryParams.append('format', params.format);

    return apiService.get(`/students/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });
  }
}

export const studentService = new StudentService();
