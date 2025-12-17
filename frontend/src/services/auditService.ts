import { apiService as api } from './api';
import { AuditLog } from '../types';

export const auditService = {
    getAuditLogs: async (params: {
        skip?: number;
        limit?: number;
        user_id?: string;
        entity_type?: string;
        entity_id?: string;
        action?: string;
        is_delegated?: boolean;
    }) => {
        const response = await api.get<AuditLog[]>('/audit-logs/', { params });
        return response;
    },
};

