import { apiService } from './api';

export interface ExamType {
  CONTINUOUS_ASSESSMENT: 'continuous_assessment';
  MID_TERM: 'mid_term';
  FINAL_EXAM: 'final_exam';
  QUIZ: 'quiz';
  ASSIGNMENT: 'assignment';
  PROJECT: 'project';
  PRACTICAL: 'practical';
  ORAL: 'oral';
}

export interface GradeScale {
  A_PLUS: 'A+';
  A: 'A';
  B_PLUS: 'B+';
  B: 'B';
  C_PLUS: 'C+';
  C: 'C';
  D_PLUS: 'D+';
  D: 'D';
  E: 'E';
  F: 'F';
}

export interface Exam {
  id: string;
  name: string;
  description?: string;
  exam_type: keyof ExamType;
  exam_date: string;
  start_time?: string;
  duration_minutes?: number;
  total_marks: number;
  pass_marks: number;
  subject_id: string;
  class_id: string;
  term_id: string;
  instructions?: string;
  venue?: string;
  is_published: boolean;
  is_active: boolean;
  created_by: string;
  creator_name?: string;
  subject_name?: string;
  class_name?: string;
  term_name?: string;
  total_students?: number;
  graded_students?: number;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  score: number;
  total_marks: number;
  percentage: number;
  grade?: keyof GradeScale;
  student_id: string;
  subject_id: string;
  exam_id: string;
  term_id: string;
  graded_by: string;
  graded_date: string;
  remarks?: string;
  is_published: boolean;
  grader_name?: string;
  student_name?: string;
  subject_name?: string;
  exam_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamCreateData {
  name: string;
  description?: string;
  exam_type: keyof ExamType;
  exam_date: string;
  start_time?: string;
  duration_minutes?: number;
  total_marks: number;
  pass_marks: number;
  subject_id: string;
  class_id: string;
  term_id: string;
  instructions?: string;
  venue?: string;
}

export interface ExamUpdateData {
  name?: string;
  description?: string;
  exam_type?: keyof ExamType;
  exam_date?: string;
  start_time?: string;
  duration_minutes?: number;
  total_marks?: number;
  pass_marks?: number;
  instructions?: string;
  venue?: string;
  is_published?: boolean;
  is_active?: boolean;
}

export interface GradeCreateData {
  score: number;
  total_marks: number;
  student_id: string;
  subject_id: string;
  exam_id: string;
  term_id: string;
  remarks?: string;
}

export interface GradeUpdateData {
  score?: number;
  remarks?: string;
  is_published?: boolean;
}

export interface BulkGradeCreateData {
  exam_id: string;
  grades: Array<{
    student_id: string;
    score: number;
    remarks?: string;
  }>;
}

export interface StudentGradesSummary {
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  term_id: string;
  term_name: string;
  total_subjects: number;
  graded_subjects: number;
  total_score: number;
  total_possible: number;
  overall_percentage: number;
  overall_grade?: keyof GradeScale;
  position?: number;
  grades: Grade[];
}

export interface ClassGradesSummary {
  class_id: string;
  class_name: string;
  term_id: string;
  term_name: string;
  exam_id: string;
  exam_name: string;
  subject_id: string;
  subject_name: string;
  total_students: number;
  graded_students: number;
  highest_score?: number;
  lowest_score?: number;
  average_score?: number;
  pass_rate?: number;
  grades: Grade[];
}

export interface ReportCard {
  id: string;
  student_id: string;
  class_id: string;
  term_id: string;
  overall_score: number;
  overall_percentage: number;
  overall_grade?: keyof GradeScale;
  position: number;
  total_students: number;
  generated_by: string;
  generated_date: string;
  is_published: boolean;
  teacher_comment?: string;
  principal_comment?: string;
  next_term_begins?: string;
  student_name?: string;
  class_name?: string;
  term_name?: string;
  generator_name?: string;
  grades: Grade[];
  created_at: string;
  updated_at: string;
}

export interface ReportCardCreateData {
  student_id: string;
  class_id: string;
  term_id: string;
  teacher_comment?: string;
  principal_comment?: string;
  next_term_begins?: string;
}

export interface ReportCardUpdateData {
  teacher_comment?: string;
  principal_comment?: string;
  next_term_begins?: string;
  is_published?: boolean;
}

export interface GradeStatistics {
  total_exams: number;
  published_exams: number;
  total_grades: number;
  published_grades: number;
  average_class_performance?: number;
  subjects_performance: Array<{
    subject_id: string;
    subject_name: string;
    average_score: number;
    total_students: number;
    pass_rate: number;
  }>;
  grade_distribution: Record<string, number>;
}

class GradeService {
  // Exam Management
  static async getExams(params?: {
    subject_id?: string;
    class_id?: string;
    term_id?: string;
    exam_type?: keyof ExamType;
    is_published?: boolean;
    is_active?: boolean;
  }): Promise<Exam[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.subject_id) queryParams.append('subject_id', params.subject_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.exam_type) queryParams.append('exam_type', params.exam_type);
    if (params?.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

    const url = `/api/v1/grades/exams${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<Exam[]>(url);
  }

  static async getExam(examId: string): Promise<Exam> {
    return await apiService.get<Exam>(`/api/v1/grades/exams/${examId}`);
  }

  static async createExam(data: ExamCreateData): Promise<Exam> {
    return await apiService.post<Exam>('/api/v1/grades/exams', data);
  }

  static async updateExam(examId: string, data: ExamUpdateData): Promise<Exam> {
    return await apiService.put<Exam>(`/api/v1/grades/exams/${examId}`, data);
  }

  static async deleteExam(examId: string): Promise<void> {
    await apiService.delete(`/api/v1/grades/exams/${examId}`);
  }

  // Grade Management
  static async getGrades(params?: {
    student_id?: string;
    subject_id?: string;
    exam_id?: string;
    term_id?: string;
    class_id?: string;
    is_published?: boolean;
  }): Promise<Grade[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.subject_id) queryParams.append('subject_id', params.subject_id);
    if (params?.exam_id) queryParams.append('exam_id', params.exam_id);
    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());

    const url = `/api/v1/grades/grades${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<Grade[]>(url);
  }

  static async getGrade(gradeId: string): Promise<Grade> {
    return await apiService.get<Grade>(`/api/v1/grades/grades/${gradeId}`);
  }

  static async createGrade(data: GradeCreateData): Promise<Grade> {
    return await apiService.post<Grade>('/api/v1/grades/grades', data);
  }

  static async createBulkGrades(data: BulkGradeCreateData): Promise<Grade[]> {
    return await apiService.post<Grade[]>('/api/v1/grades/grades/bulk', data);
  }

  static async updateGrade(gradeId: string, data: GradeUpdateData): Promise<Grade> {
    return await apiService.put<Grade>(`/api/v1/grades/grades/${gradeId}`, data);
  }

  static async deleteGrade(gradeId: string): Promise<void> {
    await apiService.delete(`/api/v1/grades/grades/${gradeId}`);
  }

  // Analytics and Reports
  static async getStudentGradesSummary(studentId: string, termId: string): Promise<StudentGradesSummary> {
    return await apiService.get<StudentGradesSummary>(`/api/v1/grades/students/${studentId}/summary?term_id=${termId}`);
  }

  static async getClassGradesSummary(classId: string, examId: string): Promise<ClassGradesSummary> {
    return await apiService.get<ClassGradesSummary>(`/api/v1/grades/classes/${classId}/exams/${examId}/summary`);
  }

  static async getGradeStatistics(params?: {
    term_id?: string;
    class_id?: string;
  }): Promise<GradeStatistics> {
    const queryParams = new URLSearchParams();

    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);

    const url = `/api/v1/grades/statistics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<GradeStatistics>(url);
  }

  // Report Cards
  static async createReportCard(data: ReportCardCreateData): Promise<ReportCard> {
    return await apiService.post<ReportCard>('/api/v1/grades/report-cards', data);
  }

  static async updateReportCard(reportCardId: string, data: ReportCardUpdateData): Promise<ReportCard> {
    return await apiService.put<ReportCard>(`/api/v1/grades/report-cards/${reportCardId}`, data);
  }

  // Utility functions
  static getGradeColor(grade?: keyof GradeScale): string {
    if (!grade) return 'text-gray-500';

    switch (grade) {
      case 'A_PLUS':
      case 'A':
        return 'text-green-600';
      case 'B_PLUS':
      case 'B':
        return 'text-blue-600';
      case 'C_PLUS':
      case 'C':
        return 'text-yellow-600';
      case 'D_PLUS':
      case 'D':
        return 'text-orange-600';
      case 'E':
      case 'F':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  }

  static formatGrade(grade?: keyof GradeScale): string {
    if (!grade) return 'N/A';
    return grade.replace('_PLUS', '+');
  }

  static getExamTypeLabel(examType: keyof ExamType): string {
    const labels: Record<keyof ExamType, string> = {
      CONTINUOUS_ASSESSMENT: 'Continuous Assessment',
      MID_TERM: 'Mid-term Exam',
      FINAL_EXAM: 'Final Exam',
      QUIZ: 'Quiz',
      ASSIGNMENT: 'Assignment',
      PROJECT: 'Project',
      PRACTICAL: 'Practical',
      ORAL: 'Oral Exam'
    };
    return labels[examType] || examType;
  }
}

export default GradeService;
