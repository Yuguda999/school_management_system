import { apiService } from './api';
import { User, AuthResponse, LoginCredentials } from '../types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/v1/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });

    // Store refresh token
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }

    return response;
  }

  async studentLogin(data: { admission_number: string; first_name: string }, schoolCode?: string): Promise<AuthResponse> {
    let endpoint = '/api/v1/auth/student/login';
    
    // Use school-specific endpoint if school code is provided
    if (schoolCode) {
      endpoint = `/api/v1/auth/school/${schoolCode}/student/login`;
    }
    
    const response = await apiService.post<AuthResponse>(endpoint, data);
    
    // Store refresh token
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }
    
    return response;
  }

  async getCurrentUser(): Promise<User> {
    // Add cache-busting headers to ensure fresh data
    const cacheHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    const response = await apiService.get<any>('/api/v1/auth/me', { headers: cacheHeaders });

    // For students, the school information should already be included in the response
    // from the backend /me endpoint, so we don't need to make a separate call
    let school = response.school || null;
    
    // Only fetch additional school information for non-students if needed
    if (response.school_id && response.role !== 'student' && !school) {
      try {
        school = await apiService.get<any>('/api/v1/schools/me', { headers: cacheHeaders });
      } catch (error) {
        console.warn('Failed to fetch additional school information:', error);
      }
    }

    return {
      id: response.id,
      email: response.email,
      first_name: response.full_name?.split(' ')[0] || '',
      last_name: response.full_name?.split(' ').slice(1).join(' ') || '',
      full_name: response.full_name,
      role: response.role,
      is_active: response.is_active,
      is_verified: response.is_verified,
      profile_completed: response.profile_completed || false,
      school_id: response.school_id,
      school: school,
      school_code: school?.code,
      school_name: school?.name,
      phone: response.phone,
      date_of_birth: response.date_of_birth,
      gender: response.gender,
      address_line1: response.address_line1,
      address_line2: response.address_line2,
      city: response.city,
      state: response.state,
      postal_code: response.postal_code,
      country: response.country,
      qualification: response.qualification,
      experience_years: response.experience_years,
      bio: response.bio,
      profile_picture_url: response.profile_picture_url,
      department: response.department,
      position: response.position,
      created_at: response.created_at || new Date().toISOString(),
      updated_at: response.updated_at || new Date().toISOString(),
    };
  }

  async refreshToken(): Promise<{ access_token: string; token_type: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return apiService.post<{ access_token: string; token_type: string }>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
  }

  async logout(): Promise<void> {
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Note: Backend doesn't have a logout endpoint, so we just clear local storage
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiService.post('/api/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    return apiService.post('/api/v1/auth/password-reset', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return apiService.post('/api/v1/auth/password-reset/confirm', {
      token,
      new_password: newPassword,
    });
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  async getValidToken(): Promise<string | null> {
    const token = localStorage.getItem('access_token');

    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      try {
        const response = await this.refreshToken();
        localStorage.setItem('access_token', response.access_token);
        return response.access_token;
      } catch {
        // Refresh failed, clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return null;
      }
    }

    return token;
  }
}

export const authService = new AuthService();
