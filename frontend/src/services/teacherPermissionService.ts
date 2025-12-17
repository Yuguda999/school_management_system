import { apiService as api } from './api';
import { TeacherPermission, TeacherPermissionCreate, TeacherPermissionBulkCreate, TeacherPermissionUpdate, PermissionTypeInfo } from '../types';

// Helper to get current school code from URL or localStorage
const getSchoolCode = (): string => {
    // Try to get from URL path (e.g., /schoolcode/settings/...)
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 1 && pathParts[1]) {
        return pathParts[1];
    }
    // Fallback to localStorage
    const school = localStorage.getItem('current_school');
    if (school) {
        try {
            const parsed = JSON.parse(school);
            return parsed.code || '';
        } catch {
            return '';
        }
    }
    return '';
};

const getBaseUrl = () => `/api/v1/school/${getSchoolCode()}/teacher-permissions`;

export const teacherPermissionService = {
    /**
     * Grant a single permission to a teacher
     */
    grantPermission: async (data: TeacherPermissionCreate): Promise<TeacherPermission> => {
        const response = await api.post<TeacherPermission>(`${getBaseUrl()}/`, data);
        return response;
    },

    /**
     * Grant multiple permissions to a teacher at once
     */
    grantBulkPermissions: async (data: TeacherPermissionBulkCreate): Promise<TeacherPermission[]> => {
        const response = await api.post<TeacherPermission[]>(`${getBaseUrl()}/bulk`, data);
        return response;
    },

    /**
     * Get all permission assignments for the school
     */
    getAllPermissions: async (params?: { skip?: number; limit?: number }): Promise<TeacherPermission[]> => {
        const response = await api.get<TeacherPermission[]>(`${getBaseUrl()}/`, { params });
        return response;
    },

    /**
     * Get permissions for a specific teacher
     */
    getTeacherPermissions: async (teacherId: string, includeInactive: boolean = false): Promise<TeacherPermission[]> => {
        const response = await api.get<TeacherPermission[]>(`${getBaseUrl()}/teacher/${teacherId}`, {
            params: { include_inactive: includeInactive }
        });
        return response;
    },

    /**
     * Get current user's delegated permissions (for teachers)
     */
    getMyPermissions: async (): Promise<TeacherPermission[]> => {
        const response = await api.get<TeacherPermission[]>(`${getBaseUrl()}/my-permissions`);
        return response;
    },

    /**
     * Update a permission (enable/disable or change expiration)
     */
    updatePermission: async (permissionId: string, data: TeacherPermissionUpdate): Promise<TeacherPermission> => {
        const response = await api.put<TeacherPermission>(`${getBaseUrl()}/${permissionId}`, data);
        return response;
    },

    /**
     * Revoke a permission
     */
    revokePermission: async (permissionId: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`${getBaseUrl()}/${permissionId}`);
        return response;
    },

    /**
     * Get all available permission types
     */
    getPermissionTypes: async (): Promise<PermissionTypeInfo[]> => {
        const response = await api.get<PermissionTypeInfo[]>(`${getBaseUrl()}/types`);
        return response;
    }
};
