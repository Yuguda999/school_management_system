import { apiService } from './api';
import {
  FeeStructure,
  FeeAssignment,
  FeePayment,
  CreateFeeStructureForm,
  BulkFeeAssignmentForm,
  CreateFeePaymentForm
} from '../types';

export class FeeService {
  // Fee Structure Management
  static async getFeeStructures(params?: {
    academic_session?: string;
    class_level?: string;
    fee_type?: string;
    is_active?: boolean;
    page?: number;
    size?: number;
  }): Promise<FeeStructure[]> {
    const queryParams = new URLSearchParams();

    if (params?.academic_session) queryParams.append('academic_session', params.academic_session);
    if (params?.class_level) queryParams.append('class_level', params.class_level);
    if (params?.fee_type) queryParams.append('fee_type', params.fee_type);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/fees/structures${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<FeeStructure[]>(url);
  }

  static async createFeeStructure(data: CreateFeeStructureForm): Promise<FeeStructure> {
    return await apiService.post<FeeStructure>('/api/v1/fees/structures', data);
  }

  static async updateFeeStructure(id: string, data: Partial<CreateFeeStructureForm>): Promise<FeeStructure> {
    return await apiService.put<FeeStructure>(`/api/v1/fees/structures/${id}`, data);
  }

  static async deleteFeeStructure(id: string): Promise<void> {
    await apiService.delete(`/api/v1/fees/structures/${id}`);
  }

  // Fee Assignment Management
  static async getStudentFeeAssignments(
    studentId: string,
    params?: {
      term_id?: string;
      status?: string;
    }
  ): Promise<FeeAssignment[]> {
    const queryParams = new URLSearchParams();

    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.status) queryParams.append('status', params.status);

    const url = `/api/v1/fees/students/${studentId}/assignments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<FeeAssignment[]>(url);
  }

  static async getFeeAssignments(params?: {
    term_id?: string;
    class_id?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<FeeAssignment[]> {
    const queryParams = new URLSearchParams();

    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('skip', ((params.page - 1) * (params.size || 100)).toString());
    if (params?.size) queryParams.append('limit', params.size.toString());

    const url = `/api/v1/fees/assignments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<FeeAssignment[]>(url);
  }

  static async bulkCreateFeeAssignments(data: BulkFeeAssignmentForm): Promise<FeeAssignment[]> {
    return await apiService.post<FeeAssignment[]>('/api/v1/fees/assignments/bulk', data);
  }

  // Fee Payment Management
  static async getStudentPayments(
    studentId: string,
    params?: {
      page?: number;
      size?: number;
    }
  ): Promise<FeePayment[]> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/fees/students/${studentId}/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<FeePayment[]>(url);
  }

  static async getPayments(params?: {
    start_date?: string;
    end_date?: string;
    payment_method?: string;
    class_id?: string;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<FeePayment[]> {
    const queryParams = new URLSearchParams();

    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('skip', ((params.page - 1) * (params.size || 100)).toString());
    if (params?.size) queryParams.append('limit', params.size.toString());

    const url = `/api/v1/fees/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<FeePayment[]>(url);
  }

  static async createPayment(data: CreateFeePaymentForm): Promise<FeePayment> {
    return await apiService.post<FeePayment>('/api/v1/fees/payments', data);
  }

  // Reports
  static async getFeeCollectionReport(params?: {
    term_id?: string;
    class_id?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();

    if (params?.term_id) queryParams.append('term_id', params.term_id);
    if (params?.class_id) queryParams.append('class_id', params.class_id);

    const url = `/api/v1/fees/reports/collection${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get(url);
  }

  // Helper methods for fee calculations
  static calculateOutstandingAmount(assignment: FeeAssignment): number {
    return assignment.amount - assignment.discount_amount;
  }

  static calculateTotalPaid(payments: FeePayment[]): number {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  }

  static calculateBalance(assignment: FeeAssignment, payments: FeePayment[]): number {
    const totalPaid = this.calculateTotalPaid(payments);
    const outstanding = this.calculateOutstandingAmount(assignment);
    return outstanding - totalPaid;
  }

  static isOverdue(assignment: FeeAssignment): boolean {
    const dueDate = new Date(assignment.due_date);
    const today = new Date();
    return today > dueDate && assignment.status !== 'paid';
  }

  // Fee structure validation
  static validateFeeStructure(data: CreateFeeStructureForm): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 3) {
      errors.push('Fee name must be at least 3 characters long');
    }

    if (!data.fee_type) {
      errors.push('Fee type is required');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.academic_session) {
      errors.push('Academic session is required');
    }

    if (!data.applicable_to) {
      errors.push('Applicable to selection is required');
    }

    if (data.applicable_to === 'specific_classes' && (!data.class_ids || data.class_ids.length === 0)) {
      errors.push('At least one class must be selected when applying to specific classes');
    }

    if (data.late_fee_amount && data.late_fee_amount < 0) {
      errors.push('Late fee amount cannot be negative');
    }

    if (data.late_fee_days && data.late_fee_days < 1) {
      errors.push('Late fee days must be at least 1');
    }

    return errors;
  }

  // Fee assignment validation
  static validateBulkFeeAssignment(data: BulkFeeAssignmentForm): string[] {
    const errors: string[] = [];

    if (!data.fee_structure_id) {
      errors.push('Fee structure is required');
    }

    if (!data.term_id) {
      errors.push('Term is required');
    }

    if (!data.class_ids || data.class_ids.length === 0) {
      errors.push('At least one class must be selected');
    }

    if (data.discount_amount && data.discount_amount < 0) {
      errors.push('Discount amount cannot be negative');
    }

    return errors;
  }

  // Payment validation
  static validatePayment(data: CreateFeePaymentForm): string[] {
    const errors: string[] = [];

    if (!data.student_id) {
      errors.push('Student is required');
    }

    if (!data.fee_assignment_id) {
      errors.push('Fee assignment is required');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Payment amount must be greater than 0');
    }

    if (!data.payment_method) {
      errors.push('Payment method is required');
    }

    return errors;
  }

  // Utility methods for formatting
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  static getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'partial':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'pending':
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  }

  static getFeeTypeIcon(feeType: string): string {
    switch (feeType) {
      case 'tuition':
        return '🎓';
      case 'transport':
        return '🚌';
      case 'library':
        return '📚';
      case 'lab':
        return '🔬';
      case 'examination':
        return '📝';
      case 'sports':
        return '⚽';
      case 'uniform':
        return '👕';
      case 'books':
        return '📖';
      default:
        return '💰';
    }
  }
}
