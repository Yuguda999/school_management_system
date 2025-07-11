import { apiService } from './api';
import { PaginatedResponse } from '../types';

export interface MessageType {
  EMAIL: 'email';
  SMS: 'sms';
  NOTIFICATION: 'notification';
}

export interface MessageStatus {
  DRAFT: 'draft';
  SCHEDULED: 'scheduled';
  SENT: 'sent';
  DELIVERED: 'delivered';
  READ: 'read';
  FAILED: 'failed';
}

export interface RecipientType {
  INDIVIDUAL: 'individual';
  CLASS: 'class';
  ROLE: 'role';
  ALL: 'all';
}

export interface Message {
  id: string;
  subject: string;
  content: string;
  message_type: keyof MessageType;
  status: keyof MessageStatus;
  is_urgent: boolean;
  sender_id: string;
  sender_name: string;
  recipient_type: keyof RecipientType;
  recipient_class_id?: string;
  recipient_role?: string;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
  recipients_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
}

export interface MessageCreate {
  subject: string;
  content: string;
  message_type: keyof MessageType;
  recipient_type: keyof RecipientType;
  recipient_class_id?: string;
  recipient_role?: string;
  is_urgent?: boolean;
  scheduled_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  is_public: boolean;
  priority: 'low' | 'medium' | 'high';
  publisher_id: string;
  publisher_name: string;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementCreate {
  title: string;
  content: string;
  category: string;
  is_published?: boolean;
  is_public?: boolean;
  priority?: 'low' | 'medium' | 'high';
  published_at?: string;
  expires_at?: string;
}

export interface MessageStatistics {
  total_messages: number;
  sent_messages: number;
  delivered_messages: number;
  read_messages: number;
  failed_messages: number;
  scheduled_messages: number;
  messages_by_type: Record<string, number>;
  recent_activity: Array<{
    date: string;
    count: number;
    type: string;
  }>;
}

class CommunicationService {
  // Message Management
  async getMessages(params?: {
    message_type?: keyof MessageType;
    status?: keyof MessageStatus;
    is_urgent?: boolean;
    sender_id?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Message>> {
    const queryParams = new URLSearchParams();
    
    if (params?.message_type) queryParams.append('message_type', params.message_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.is_urgent !== undefined) queryParams.append('is_urgent', params.is_urgent.toString());
    if (params?.sender_id) queryParams.append('sender_id', params.sender_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/communication/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<PaginatedResponse<Message>>(url);
  }

  async createMessage(messageData: MessageCreate): Promise<Message> {
    return apiService.post<Message>('/api/v1/communication/messages', messageData);
  }

  async getMessage(messageId: string): Promise<Message> {
    return apiService.get<Message>(`/api/v1/communication/messages/${messageId}`);
  }

  async updateMessage(messageId: string, messageData: Partial<MessageCreate>): Promise<Message> {
    return apiService.put<Message>(`/api/v1/communication/messages/${messageId}`, messageData);
  }

  async deleteMessage(messageId: string): Promise<void> {
    return apiService.delete<void>(`/api/v1/communication/messages/${messageId}`);
  }

  async sendMessage(messageId: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`/api/v1/communication/messages/${messageId}/send`);
  }

  async markAsRead(messageId: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`/api/v1/communication/messages/${messageId}/read`);
  }

  // Announcement Management
  async getAnnouncements(params?: {
    is_published?: boolean;
    is_public?: boolean;
    category?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Announcement>> {
    const queryParams = new URLSearchParams();
    
    if (params?.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());
    if (params?.is_public !== undefined) queryParams.append('is_public', params.is_public.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());

    const url = `/api/v1/communication/announcements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<PaginatedResponse<Announcement>>(url);
  }

  async createAnnouncement(announcementData: AnnouncementCreate): Promise<Announcement> {
    return apiService.post<Announcement>('/api/v1/communication/announcements', announcementData);
  }

  async getAnnouncement(announcementId: string): Promise<Announcement> {
    return apiService.get<Announcement>(`/api/v1/communication/announcements/${announcementId}`);
  }

  async updateAnnouncement(announcementId: string, announcementData: Partial<AnnouncementCreate>): Promise<Announcement> {
    return apiService.put<Announcement>(`/api/v1/communication/announcements/${announcementId}`, announcementData);
  }

  async deleteAnnouncement(announcementId: string): Promise<void> {
    return apiService.delete<void>(`/api/v1/communication/announcements/${announcementId}`);
  }

  // Statistics
  async getStatistics(days: number = 30): Promise<MessageStatistics> {
    return apiService.get<MessageStatistics>(`/api/v1/communication/statistics?days=${days}`);
  }
}

export const communicationService = new CommunicationService();
