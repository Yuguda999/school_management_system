import { apiService } from './api';

export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  total_subjects: number;
  active_terms: number;
  pending_fees: number;
  recent_enrollments: number;
  attendance_rate: number;
}

export interface StudentReport {
  student_id: string;
  student_name: string;
  class_name: string;
  attendance_rate: number;
  grade_average: number;
  fee_status: 'paid' | 'pending' | 'overdue';
  last_payment_date?: string;
  total_fees_paid: number;
  pending_amount: number;
}

export interface ClassReport {
  class_id: string;
  class_name: string;
  total_students: number;
  average_attendance: number;
  average_grade: number;
  fee_collection_rate: number;
  total_fees_collected: number;
  pending_fees: number;
}

export interface FinancialReport {
  total_revenue: number;
  fees_collected: number;
  pending_fees: number;
  overdue_fees: number;
  collection_rate: number;
  monthly_revenue: Array<{
    month: string;
    amount: number;
  }>;
  fee_type_breakdown: Array<{
    fee_type: string;
    amount: number;
    percentage: number;
  }>;
}

export interface AttendanceReport {
  overall_attendance_rate: number;
  class_wise_attendance: Array<{
    class_id: string;
    class_name: string;
    attendance_rate: number;
    total_students: number;
    present_students: number;
  }>;
  monthly_attendance: Array<{
    month: string;
    attendance_rate: number;
  }>;
  low_attendance_students: Array<{
    student_id: string;
    student_name: string;
    class_name: string;
    attendance_rate: number;
  }>;
}

export interface AcademicReport {
  overall_performance: {
    average_grade: number;
    pass_rate: number;
    distinction_rate: number;
  };
  subject_wise_performance: Array<{
    subject_id: string;
    subject_name: string;
    average_grade: number;
    pass_rate: number;
    total_students: number;
  }>;
  class_wise_performance: Array<{
    class_id: string;
    class_name: string;
    average_grade: number;
    pass_rate: number;
    total_students: number;
  }>;
  top_performers: Array<{
    student_id: string;
    student_name: string;
    class_name: string;
    average_grade: number;
  }>;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  date_range?: {
    start_date: string;
    end_date: string;
  };
  filters?: Record<string, any>;
}

class ReportsService {
  // Dashboard Statistics
  async getDashboardStats(termId?: string): Promise<DashboardStats> {
    const url = `/api/v1/dashboard/stats${termId ? `?term_id=${termId}` : ''}`;
    return apiService.get<DashboardStats>(url);
  }

  // Student Reports
  async getStudentReports(params?: {
    class_id?: string;
    term_id?: string;
    page?: number;
    size?: number;
  }): Promise<{
    items: StudentReport[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }> {
    const queryParams = new URLSearchParams();

    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/reports/students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  }

  async getStudentReport(studentId: string, termId?: string): Promise<StudentReport> {
    const url = `/api/v1/reports/students/${studentId}${termId ? `?term_id=${termId}` : ''}`;
    return apiService.get<StudentReport>(url);
  }

  // Class Reports
  async getClassReports(params?: {
    term_id?: string;
    page?: number;
    size?: number;
  }): Promise<{
    items: ClassReport[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }> {
    const queryParams = new URLSearchParams();

    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/reports/classes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  }

  async getClassReport(classId: string, termId?: string): Promise<ClassReport> {
    const url = `/api/v1/reports/classes/${classId}${termId ? `?term_id=${termId}` : ''}`;
    return apiService.get<ClassReport>(url);
  }

  // Financial Reports
  async getFinancialReport(params?: {
    start_date?: string;
    end_date?: string;
    term_id?: string;
    class_id?: string;
    fee_type?: string;
    payment_status?: string;
  }): Promise<FinancialReport> {
    const queryParams = new URLSearchParams();

    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.fee_type) queryParams.append('fee_type', params.fee_type);
    if (params?.payment_status) queryParams.append('payment_status', params.payment_status);

    const url = `/api/v1/reports/financial${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<FinancialReport>(url);
  }

  // Attendance Reports
  async getAttendanceReport(params?: {
    start_date?: string;
    end_date?: string;
    class_id?: string;
    term_id?: string;
  }): Promise<AttendanceReport> {
    const queryParams = new URLSearchParams();

    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.term_id) queryParams.append('term_id', params.term_id);

    const url = `/api/v1/reports/attendance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<AttendanceReport>(url);
  }

  // Academic Reports
  async getAcademicReport(params?: {
    term_id?: string;
    class_id?: string;
    subject_id?: string;
  }): Promise<AcademicReport> {
    const queryParams = new URLSearchParams();

    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.subject_id) queryParams.append('subject_id', params.subject_id);

    const url = `/api/v1/reports/academic${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<AcademicReport>(url);
  }

  // Communication Statistics (already implemented in communicationService)
  async getCommunicationStats(days: number = 30) {
    return apiService.get(`/api/v1/communication/statistics?days=${days}`);
  }

  // Grade Statistics (from grades endpoint)
  async getGradeStatistics(params?: {
    term_id?: string;
    class_id?: string;
  }) {
    const queryParams = new URLSearchParams();

    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);

    const url = `/api/v1/grades/statistics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  }

  // Fee Collection Report (from fees endpoint)
  async getFeeCollectionReport(params?: {
    term_id?: string;
    class_id?: string;
  }) {
    const queryParams = new URLSearchParams();

    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);

    const url = `/api/v1/fees/reports/collection${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  }

  // Export Functions
  async exportReport(reportType: string, options: ExportOptions): Promise<Blob> {
    const response = await apiService.api.post(`/api/v1/reports/export/${reportType}`, options, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportStudentReport(studentId: string, options: ExportOptions): Promise<Blob> {
    const response = await apiService.api.post(`/api/v1/reports/students/${studentId}/export`, options, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportClassReport(classId: string, options: ExportOptions): Promise<Blob> {
    const response = await apiService.api.post(`/api/v1/reports/classes/${classId}/export`, options, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const reportsService = new ReportsService();
