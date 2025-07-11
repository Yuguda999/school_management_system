import { apiService } from './api';
import { User, PaginatedResponse } from '../types';

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

    return apiService.get<PaginatedResponse<User>>(`/users?${queryParams.toString()}`);
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    return apiService.get<User>(`/users/${id}`);
  }

  // Create new user
  async createUser(userData: Partial<User>): Promise<User> {
    return apiService.post<User>('/users', userData);
  }

  // Update user
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return apiService.put<User>(`/users/${id}`, userData);
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    return apiService.delete(`/users/${id}`);
  }

  // Activate/Deactivate user
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    return apiService.patch<User>(`/users/${id}/status`, { is_active: isActive });
  }

  // Get users by role
  async getUsersByRole(role: string, schoolId?: string): Promise<User[]> {
    const params = new URLSearchParams({ role });
    if (schoolId) params.append('school_id', schoolId);
    
    const response = await apiService.get<PaginatedResponse<User>>(`/users?${params.toString()}`);
    return response.items;
  }

  // Bulk operations
  async bulkUpdateUsers(userIds: string[], updates: Partial<User>): Promise<User[]> {
    return apiService.post<User[]>('/users/bulk-update', {
      user_ids: userIds,
      updates,
    });
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    return apiService.post('/users/bulk-delete', { user_ids: userIds });
  }
}

export const userService = new UserService();
