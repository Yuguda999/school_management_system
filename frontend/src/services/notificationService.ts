import { apiService as api } from './api';
import { Notification } from '../types';

export const notificationService = {
    getNotifications: async (skip = 0, limit = 20, unreadOnly = false) => {
        const response = await api.get<Notification[]>('/api/v1/notifications/', {
            params: { skip, limit, unread_only: unreadOnly },
        });
        return response;
    },

    markAsRead: async (id: string) => {
        const response = await api.put<Notification>(`/api/v1/notifications/${id}/read`);
        return response;
    },

    markAllAsRead: async () => {
        const response = await api.put('/api/v1/notifications/read-all');
        return response;
    },
};
