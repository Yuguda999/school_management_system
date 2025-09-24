import { apiService as api } from './api';

export interface PlatformStatistics {
  total_schools: number;
  active_schools: number;
  total_school_owners: number;
  schools_this_month: number;
  growth_metrics: {
    schools: string;
    school_owners: string;
    monthly_growth: string;
  };
}

export interface SchoolDetail {
  id: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  address: string;
  owner_name: string;
  owner_email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  student_count: number;
  teacher_count: number;
  last_activity?: string;
}

export interface SchoolOwner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  school_id?: string;
  created_at: string;
  full_name: string;
  temp_password?: string;
}



export interface PlatformActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export interface TrialStatistics {
  total_trial_schools: number;
  active_trials: number;
  expired_trials: number;
  converted_trials: number;
  trial_conversion_rate: number;
  average_trial_duration: number;
  trials_expiring_soon: number;
}

export interface PlatformDashboardData {
  statistics: PlatformStatistics;
  recent_schools: SchoolDetail[];
  recent_activity: PlatformActivity[];
  trial_statistics: TrialStatistics;
}

export interface SchoolOwnerCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}



export interface SchoolStatusUpdate {
  is_active?: boolean;
  is_verified?: boolean;
}

export interface BulkSchoolAction {
  school_ids: string[];
  action: 'activate' | 'deactivate' | 'verify' | 'unverify';
}

class PlatformAdminService {
  // Dashboard
  async getDashboardData(): Promise<PlatformDashboardData> {
    return await api.get('/api/v1/platform/dashboard');
  }

  async getStatistics(): Promise<PlatformStatistics> {
    return await api.get('/api/v1/platform/statistics');
  }

  async getActivity(limit: number = 20): Promise<PlatformActivity[]> {
    return await api.get(`/api/v1/platform/activity?limit=${limit}`);
  }

  // Schools
  async getAllSchools(params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
  } = {}): Promise<SchoolDetail[]> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);

    return await api.get(`/api/v1/platform/schools?${queryParams}`);
  }

  async updateSchoolStatus(schoolId: string, statusUpdate: SchoolStatusUpdate): Promise<void> {
    await api.put(`/api/v1/platform/schools/${schoolId}/status`, statusUpdate);
  }

  async bulkSchoolAction(action: BulkSchoolAction): Promise<any> {
    return await api.post('/api/v1/platform/schools/bulk-action', action);
  }

  // School Owners
  async getSchoolOwners(params: {
    page?: number;
    size?: number;
  } = {}): Promise<SchoolOwner[]> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());

    return await api.get(`/api/v1/platform/school-owners?${queryParams}`);
  }

  async createSchoolOwner(ownerData: SchoolOwnerCreate): Promise<SchoolOwner> {
    return await api.post('/api/v1/platform/school-owners', ownerData);
  }

  async updateSchoolOwner(ownerId: string, updateData: Partial<SchoolOwnerCreate>): Promise<void> {
    await api.put(`/api/v1/platform/school-owners/${ownerId}`, updateData);
  }

  async deleteSchoolOwner(ownerId: string): Promise<void> {
    await api.delete(`/api/v1/platform/school-owners/${ownerId}`);
  }


}

export default new PlatformAdminService();
