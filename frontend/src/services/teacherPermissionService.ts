import { apiService as api } from './api';
import { TeacherPermission, TeacherPermissionCreate, TeacherPermissionBulkCreate, TeacherPermissionUpdate, PermissionTypeInfo } from '../types';

export const teacherPermissionService = {
    /**
     * Grant a single permission to a teacher
     */
    grantPermission: async (data: TeacherPermissionCreate): Promise<TeacherPermission> => {
        const response = await api.post<TeacherPermission>('/teacher-permissions/', data);
        return response;
    },

    /**
     * Grant multiple permissions to a teacher at once
     */
    grantBulkPermissions: async (data: TeacherPermissionBulkCreate): Promise<TeacherPermission[]> => {
        const response = await api.post<TeacherPermission[]>('/teacher-permissions/bulk', data);
        return response;
    },

    /**
     * Get all permission assignments for the school
     */
    getAllPermissions: async (params?: { skip?: number; limit?: number }): Promise<TeacherPermission[]> => {
        const response = await api.get<TeacherPermission[]>('/teacher-permissions/', { params });
        return response;
    },

    /**
     * Get permissions for a specific teacher
     */
    getTeacherPermissions: async (teacherId: string, includeInactive: boolean = false): Promise<TeacherPermission[]> => {
        const response = await api.get<TeacherPermission[]>(`/teacher-permissions/teacher/${teacherId}`, {
            params: { include_inactive: includeInactive }
        });
        return response;
    },

    /**
     * Get current user's delegated permissions (for teachers)
     */
    getMyPermissions: async (): Promise<TeacherPermission[]> => {
        const response = await api.get<TeacherPermission[]>('/teacher-permissions/my-permissions');
        return response;
    },

    /**
     * Update a permission (enable/disable or change expiration)
     */
    updatePermission: async (permissionId: string, data: TeacherPermissionUpdate): Promise<TeacherPermission> => {
        const response = await api.put<TeacherPermission>(`/teacher-permissions/${permissionId}`, data);
        return response;
    },

    /**
     * Revoke a permission
     */
    revokePermission: async (permissionId: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/teacher-permissions/${permissionId}`);
        return response;
    },

    /**
     * Get all available permission types
     */
    getPermissionTypes: async (): Promise<PermissionTypeInfo[]> => {
        const response = await api.get<PermissionTypeInfo[]>('/teacher-permissions/types');
        return response;
    }
};
