import { apiService } from './api';
import {
  SubjectsWithMappingsResponse,
  SubjectConsolidatedGradesResponse
} from '../types';

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
  grade: keyof GradeScale | null;
  student_id: string;
  subject_id: string;
  exam_id: string;
  term_id: string;
  school_id: string;
  graded_by: string;
  graded_date: string;
  remarks: string | null;
  is_published: boolean;
  component_scores?: Record<string, number>;  // Component breakdown (e.g., {"First C.A": 12.5, "Exam": 58.0})
  created_at: string;
  updated_at: string;

  // Populated fields
  grader_name?: string;
  student_name?: string;
  subject_name?: string;
  exam_name?: string;
  exam_type?: string;
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
  template_id?: string; // Optional template ID for custom report cards
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
  subjects_assessed: number;
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
  static async getReportCards(params?: {
    student_id?: string;
    class_id?: string;
    term_id?: string;
    is_published?: boolean;
    page?: number;
    size?: number;
  }): Promise<ReportCard[]> {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/grades/report-cards${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<ReportCard[]>(url);
  }

  static async createReportCard(data: ReportCardCreateData): Promise<ReportCard> {
    return await apiService.post<ReportCard>('/api/v1/grades/report-cards', data);
  }

  // Template-based report card generation
  static async generateReportCardWithTemplate(
    studentId: string,
    classId: string,
    termId: string,
    templateId?: string
  ): Promise<ReportCard> {
    const data: ReportCardCreateData = {
      student_id: studentId,
      class_id: classId,
      term_id: termId,
    };

    if (templateId) {
      data.template_id = templateId;
    }

    return await this.createReportCard(data);
  }

  static async getReportCardTemplate(classId: string, termId: string): Promise<string | null> {
    try {
      // Get the assigned template for this class
      const response = await apiService.get(`/api/v1/templates/assignments?class_id=${classId}&is_active=true`);
      const assignments = response.data;

      if (assignments && assignments.length > 0) {
        // Return the first active assignment's template ID
        return assignments[0].templateId;
      }

      return null;
    } catch (error) {
      console.error('Error getting template for class:', error);
      return null;
    }
  }

  static async generateReportCardHTML(reportCard: ReportCard, templateId?: string): Promise<string> {
    try {
      if (templateId) {
        // Generate using custom template
        const response = await apiService.post(`/api/v1/templates/${templateId}/preview`, {
          studentId: reportCard.student_id,
          classId: reportCard.class_id,
          termId: reportCard.term_id,
        });
        return response.data.preview_html;
      } else {
        // Generate using default template
        return this.generateDefaultReportCardHTML(reportCard);
      }
    } catch (error) {
      console.error('Error generating report card HTML:', error);
      return this.generateDefaultReportCardHTML(reportCard);
    }
  }

  private static generateDefaultReportCardHTML(reportCard: ReportCard): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 2px solid #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">REPORT CARD</h1>
          <h2 style="color: #34495e; margin-bottom: 5px;">${reportCard.term_name || 'Academic Term'}</h2>
          <p style="color: #7f8c8d; margin: 0;">${reportCard.class_name || 'Class'}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">Student Information</h3>
          <p><strong>Name:</strong> ${reportCard.student_name || 'N/A'}</p>
          <p><strong>Class:</strong> ${reportCard.class_name || 'N/A'}</p>
          <p><strong>Term:</strong> ${reportCard.term_name || 'N/A'}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">Academic Performance</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Subject</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Score</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Grade</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${reportCard.grades.map(grade => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 12px;">${grade.subject_name || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${grade.score}/${grade.total_marks}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">${this.formatGrade(grade.grade)}</td>
                  <td style="border: 1px solid #ddd; padding: 12px;">${grade.remarks || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
            <p><strong>Overall Score:</strong> ${reportCard.overall_score || 0}</p>
            <p><strong>Overall Percentage:</strong> ${reportCard.overall_percentage || 0}%</p>
            <p><strong>Overall Grade:</strong> ${this.formatGrade(reportCard.overall_grade)}</p>
            <p><strong>Position:</strong> ${reportCard.position || 'N/A'} out of ${reportCard.total_students || 'N/A'} students</p>
          </div>
        </div>
        
        ${reportCard.teacher_comment ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">Teacher's Comment</h3>
            <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">${reportCard.teacher_comment}</p>
          </div>
        ` : ''}
        
        ${reportCard.principal_comment ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">Principal's Comment</h3>
            <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #e74c3c;">${reportCard.principal_comment}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px;">
          <p>Generated on: ${new Date(reportCard.generated_date).toLocaleDateString()}</p>
          <p>Generated by: ${reportCard.generator_name || 'System'}</p>
        </div>
      </div>
    `;
  }

  static async updateReportCard(reportCardId: string, data: ReportCardUpdateData): Promise<ReportCard> {
    return await apiService.put<ReportCard>(`/api/v1/grades/report-cards/${reportCardId}`, data);
  }

  // Utility functions
  // Grade Setup Redesign Methods
  static async getSubjectsWithMappings(termId?: string): Promise<SubjectsWithMappingsResponse> {
    const params = new URLSearchParams();
    if (termId) params.append('term_id', termId);

    return await apiService.get<SubjectsWithMappingsResponse>(`/api/v1/grades/subjects-with-mappings?${params.toString()}`);
  }

  static async getSubjectConsolidatedGrades(
    subjectId: string,
    termId: string,
    classId?: string
  ): Promise<SubjectConsolidatedGradesResponse> {
    const params = new URLSearchParams();
    params.append('term_id', termId);
    if (classId) params.append('class_id', classId);

    return await apiService.get<SubjectConsolidatedGradesResponse>(`/api/v1/grades/subject/${subjectId}/consolidated?${params.toString()}`);
  }

  // Class Summary Sheet Methods
  static async getClassSummarySheet(classId: string, termId: string): Promise<import('../types').ClassGradesSummarySheet> {
    return await apiService.get<import('../types').ClassGradesSummarySheet>(
      `/api/v1/grades/summary-sheet?class_id=${classId}&term_id=${termId}`
    );
  }

  static async exportSummarySheet(classId: string, termId: string, format: 'csv' | 'pdf'): Promise<Blob> {
    const response = await fetch(
      `/api/v1/grades/summary-sheet/export?class_id=${classId}&term_id=${termId}&format=${format}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error('Export failed');
    }
    return await response.blob();
  }

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
