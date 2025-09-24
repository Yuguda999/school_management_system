import { apiService } from './api';
import { 
  OwnedSchoolsResponse, 
  SchoolSelectionRequest, 
  SchoolSelectionResponse 
} from '../types';

class SchoolSelectionService {
  async getOwnedSchools(): Promise<OwnedSchoolsResponse> {
    return await apiService.get<OwnedSchoolsResponse>('/api/v1/school-selection/owned-schools');
  }

  async selectSchool(schoolId: string): Promise<SchoolSelectionResponse> {
    const request: SchoolSelectionRequest = { school_id: schoolId };
    return await apiService.post<SchoolSelectionResponse>('/api/v1/auth/select-school', request);
  }

  async addSchoolOwnership(userEmail: string, schoolId: string): Promise<{ message: string }> {
    return await apiService.post('/api/v1/school-selection/add-ownership', {
      user_email: userEmail,
      school_id: schoolId,
      can_manage_billing: true,
      can_manage_users: true,
      can_manage_settings: true
    });
  }

  async transferOwnership(schoolId: string, newOwnerEmail: string): Promise<{ message: string }> {
    return await apiService.post('/api/v1/school-selection/transfer-ownership', {
      school_id: schoolId,
      new_owner_email: newOwnerEmail
    });
  }

  async removeSchoolOwnership(schoolId: string): Promise<{ message: string }> {
    return await apiService.delete(`/api/v1/school-selection/remove-ownership/${schoolId}`);
  }
}

export const schoolSelectionService = new SchoolSelectionService();
