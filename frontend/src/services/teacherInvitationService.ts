import { apiService } from './api';
import { 
  TeacherInvitation, 
  TeacherInvitationCreate, 
  InvitationAcceptRequest,
  InvitationValidationResponse,
  InvitationStatus
} from '../types';

export interface TeacherInvitationListResponse {
  invitations: TeacherInvitation[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface InvitationAcceptResponse {
  message: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  user_email: string;
  user_role: string;
  school_id: string;
  full_name: string;
  profile_completed: boolean;
}

class TeacherInvitationService {
  private baseUrl = '/api/v1/teacher-invitations';

  /**
   * Create and send a teacher invitation
   */
  async createInvitation(invitationData: TeacherInvitationCreate): Promise<TeacherInvitation> {
    const response = await apiService.post<TeacherInvitation>(this.baseUrl, invitationData);
    return response;
  }

  /**
   * Get teacher invitations with pagination and filtering
   */
  async getInvitations(params: {
    page?: number;
    size?: number;
    status?: InvitationStatus;
    search?: string;
  } = {}): Promise<TeacherInvitationListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const response = await apiService.get<TeacherInvitationListResponse>(
      `${this.baseUrl}?${queryParams.toString()}`
    );

    // The apiService.get already returns response.data, so response is the actual data
    return response;
  }

  /**
   * Get a specific teacher invitation
   */
  async getInvitation(invitationId: string): Promise<TeacherInvitation> {
    const response = await apiService.get<TeacherInvitation>(`${this.baseUrl}/${invitationId}`);
    return response;
  }

  /**
   * Update invitation status
   */
  async updateInvitationStatus(
    invitationId: string,
    status: InvitationStatus
  ): Promise<TeacherInvitation> {
    const response = await apiService.put<TeacherInvitation>(
      `${this.baseUrl}/${invitationId}/status`,
      { status }
    );
    return response;
  }

  /**
   * Resend a teacher invitation
   */
  async resendInvitation(
    invitationId: string,
    newExpiryHours: number = 72
  ): Promise<TeacherInvitation> {
    try {
      const response = await apiService.post<TeacherInvitation>(
        `${this.baseUrl}/resend`,
        { invitation_id: invitationId, new_expiry_hours: newExpiryHours }
      );
      return response;
    } catch (error) {
      console.error('TeacherInvitationService: Error resending invitation:', error);
      throw error;
    }
  }

  /**
   * Delete a teacher invitation
   */
  async deleteInvitation(invitationId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/${invitationId}`);
    } catch (error) {
      console.error('TeacherInvitationService: Error deleting invitation:', error);
      throw error;
    }
  }

  /**
   * Validate invitation token (public endpoint)
   */
  async validateInvitationToken(token: string): Promise<InvitationValidationResponse> {
    const response = await apiService.get<InvitationValidationResponse>(
      `${this.baseUrl}/public/validate/${token}`
    );
    return response;
  }

  /**
   * Accept teacher invitation (public endpoint)
   */
  async acceptInvitation(acceptData: InvitationAcceptRequest): Promise<InvitationAcceptResponse> {
    const response = await apiService.post<InvitationAcceptResponse>(
      `${this.baseUrl}/public/accept`,
      acceptData
    );
    return response;
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<TeacherInvitation> {
    try {
      return await this.updateInvitationStatus(invitationId, 'cancelled');
    } catch (error) {
      console.error('TeacherInvitationService: Error cancelling invitation:', error);
      throw error;
    }
  }

  /**
   * Get invitation statistics
   */
  async getInvitationStats(): Promise<{
    total: number;
    pending: number;
    accepted: number;
    expired: number;
    cancelled: number;
  }> {
    // This would require a separate endpoint, but for now we can calculate from the list
    const allInvitations = await this.getInvitations({ size: 1000 });
    
    const stats = {
      total: allInvitations.total,
      pending: 0,
      accepted: 0,
      expired: 0,
      cancelled: 0
    };

    allInvitations.invitations.forEach(invitation => {
      stats[invitation.status]++;
    });

    return stats;
  }
}

export const teacherInvitationService = new TeacherInvitationService();
