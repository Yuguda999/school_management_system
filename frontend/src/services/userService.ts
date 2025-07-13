import { apiService } from './api';
import { User, PaginatedResponse, CreateTeacherForm } from '../types';

class UserService {
  // Get all users with pagination and filtering
  async getUsers(params?: {
    page?: number;
    size?: number;
    role?: string;
    search?: string;
    school_id?: string;
  }): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.school_id) queryParams.append('school_id', params.school_id);

    return apiService.get<PaginatedResponse<User>>(`/api/v1/users?${queryParams.toString()}`);
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    return apiService.get<User>(`/api/v1/users/${id}`);
  }

  // Create new user
  async createUser(userData: Partial<User>): Promise<User> {
    return apiService.post<User>('/api/v1/users', userData);
  }

  // Update user
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return apiService.put<User>(`/api/v1/users/${id}`, userData);
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    return apiService.delete(`/api/v1/users/${id}`);
  }

  // Activate/Deactivate user
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    return apiService.patch<User>(`/api/v1/users/${id}/status`, { is_active: isActive });
  }

  // Get users by role
  async getUsersByRole(role: string, schoolId?: string): Promise<User[]> {
    const params = new URLSearchParams({ role });
    if (schoolId) params.append('school_id', schoolId);
    
    const response = await apiService.get<PaginatedResponse<User>>(`/api/v1/users?${params.toString()}`);
    return response.items;
  }

  // Bulk operations
  async bulkUpdateUsers(userIds: string[], updates: Partial<User>): Promise<User[]> {
    return apiService.post<User[]>('/api/v1/users/bulk-update', {
      user_ids: userIds,
      updates,
    });
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    return apiService.post('/api/v1/users/bulk-delete', { user_ids: userIds });
  }

  // Teacher-specific methods
  async createTeacher(teacherData: CreateTeacherForm): Promise<User> {
    return apiService.post<User>('/api/v1/users/teachers', teacherData);
  }

  async createStaff(staffData: any): Promise<User> {
    return apiService.post<User>('/api/v1/users/staff', staffData);
  }

  async createParent(parentData: any): Promise<User> {
    return apiService.post<User>('/api/v1/users/parents', parentData);
  }

  async getTeachers(params?: {
    page?: number;
    size?: number;
  }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    return apiService.get<User[]>(`/api/v1/users/teachers?${queryParams.toString()}`);
  }
}

export const userService = new UserService();
