/**
 * Session Service - API calls for academic sessions and promotions
 */

import { apiService } from './api';
import {
    AcademicSession,
    AcademicSessionWithTerms,
    CreateAcademicSessionRequest,
    UpdateAcademicSessionRequest,
    SessionStatus,
    BulkPromotionRequest,
    BulkPromotionResult,
    PromotionPreviewResponse,
    PromotionCandidate,
    ClassProgression,
} from '../types/session';

const getSchoolCode = (): string | null => {
    return localStorage.getItem('selectedSchoolCode');
};

const getBaseUrl = (): string => {
    const schoolCode = getSchoolCode();
    return schoolCode ? `/api/v1/school/${schoolCode}` : '/api/v1';
};

// ===================
// Session API
// ===================

export const sessionService = {
    /**
     * Create a new academic session
     */
    createSession: async (data: CreateAcademicSessionRequest): Promise<AcademicSession> => {
        const response = await apiService.api.post(`${getBaseUrl()}/sessions/`, data);
        return response.data;
    },

    /**
     * Get all academic sessions
     */
    getSessions: async (
        statusFilter?: SessionStatus,
        isCurrent?: boolean
    ): Promise<AcademicSession[]> => {
        const params: Record<string, string | boolean> = {};
        if (statusFilter) params.status_filter = statusFilter;
        if (isCurrent !== undefined) params.is_current = isCurrent;

        const response = await apiService.api.get(`${getBaseUrl()}/sessions/`, { params });
        return response.data;
    },

    /**
     * Get the current active session
     */
    getCurrentSession: async (): Promise<AcademicSessionWithTerms | null> => {
        try {
            const response = await apiService.api.get(`${getBaseUrl()}/sessions/current`);
            return response.data;
        } catch (error: unknown) {
            if ((error as { response?: { status?: number } }).response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Get a specific session by ID
     */
    getSession: async (sessionId: string): Promise<AcademicSessionWithTerms> => {
        const response = await apiService.api.get(`${getBaseUrl()}/sessions/${sessionId}`);
        return response.data;
    },

    /**
     * Update a session
     */
    updateSession: async (
        sessionId: string,
        data: UpdateAcademicSessionRequest
    ): Promise<AcademicSession> => {
        const response = await apiService.api.put(`${getBaseUrl()}/sessions/${sessionId}`, data);
        return response.data;
    },

    /**
     * Start/activate a session
     */
    startSession: async (sessionId: string): Promise<{ message: string; session_id: string }> => {
        const response = await apiService.api.post(`${getBaseUrl()}/sessions/${sessionId}/start`);
        return response.data;
    },

    /**
     * Complete a session
     */
    completeSession: async (
        sessionId: string
    ): Promise<{ message: string; session_id: string; next_step: string }> => {
        const response = await apiService.api.post(`${getBaseUrl()}/sessions/${sessionId}/complete`);
        return response.data;
    },

    /**
     * Archive a session
     */
    archiveSession: async (sessionId: string): Promise<{ message: string; session_id: string }> => {
        const response = await apiService.api.post(`${getBaseUrl()}/sessions/${sessionId}/archive`);
        return response.data;
    },

    /**
     * Set a session as current
     */
    setCurrentSession: async (
        sessionId: string
    ): Promise<{ message: string; session_id: string }> => {
        const response = await apiService.api.post(`${getBaseUrl()}/sessions/${sessionId}/set-current`);
        return response.data;
    },

    /**
     * Link existing terms to a session (data migration)
     */
    linkTermsToSession: async (
        sessionId: string
    ): Promise<{ message: string; terms_linked: number }> => {
        const response = await apiService.api.post(`${getBaseUrl()}/sessions/${sessionId}/link-terms`);
        return response.data;
    },

    /**
     * Delete a session
     */
    deleteSession: async (sessionId: string): Promise<{ message: string }> => {
        const response = await apiService.api.delete(`${getBaseUrl()}/sessions/${sessionId}`);
        return response.data;
    },
};

// ===================
// Promotion API
// ===================

export const promotionService = {
    /**
     * Get promotion candidates for a session
     */
    getPromotionCandidates: async (
        sessionId: string,
        classId?: string
    ): Promise<{
        session_id: string;
        total_candidates: number;
        candidates: PromotionCandidate[];
    }> => {
        const params: Record<string, string> = { session_id: sessionId };
        if (classId) params.class_id = classId;

        const response = await apiService.api.get(`${getBaseUrl()}/promotions/candidates`, { params });
        return response.data;
    },

    /**
     * Preview promotions before executing
     */
    previewPromotions: async (
        sessionId: string,
        classId?: string
    ): Promise<PromotionPreviewResponse> => {
        const params: Record<string, string> = { session_id: sessionId };
        if (classId) params.class_id = classId;

        const response = await apiService.api.get(`${getBaseUrl()}/promotions/preview`, { params });
        return response.data;
    },

    /**
     * Execute bulk promotions
     */
    executePromotions: async (data: BulkPromotionRequest): Promise<BulkPromotionResult> => {
        const response = await apiService.api.post(`${getBaseUrl()}/promotions/execute`, data);
        return response.data;
    },

    /**
     * Auto-promote based on school rules
     */
    autoPromote: async (sessionId: string): Promise<BulkPromotionResult> => {
        const response = await apiService.api.post(`${getBaseUrl()}/promotions/auto-promote`, null, {
            params: { session_id: sessionId },
        });
        return response.data;
    },

    /**
     * Get class progression map
     */
    getClassProgression: async (): Promise<{
        progression_map: ClassProgression[];
    }> => {
        const response = await apiService.api.get(`${getBaseUrl()}/promotions/class-progression`);
        return response.data;
    },

    // ===================
    // Approval Workflow
    // ===================

    /**
     * Submit promotion decisions for approval (used by teachers)
     */
    submitForApproval: async (data: BulkPromotionRequest): Promise<{
        id: string;
        status: string;
        message: string;
        total_decisions: number;
    }> => {
        const response = await apiService.api.post(`${getBaseUrl()}/promotions/submit`, data);
        return response.data;
    },

    /**
     * Get pending promotion approvals (admin only)
     */
    getPendingApprovals: async (sessionId?: string): Promise<{
        pending_requests: PendingPromotionRequest[];
        total: number;
    }> => {
        const params: Record<string, string> = {};
        if (sessionId) params.session_id = sessionId;

        const response = await apiService.api.get(`${getBaseUrl()}/promotions/pending`, { params });
        return response.data;
    },

    /**
     * Approve a pending promotion request
     */
    approveRequest: async (requestId: string): Promise<BulkPromotionResult> => {
        const response = await apiService.api.post(`${getBaseUrl()}/promotions/${requestId}/approve`);
        return response.data;
    },

    /**
     * Reject a pending promotion request
     */
    rejectRequest: async (requestId: string, reason?: string): Promise<{
        id: string;
        status: string;
        reason: string;
        message: string;
    }> => {
        const params: Record<string, string> = {};
        if (reason) params.reason = reason;

        const response = await apiService.api.post(`${getBaseUrl()}/promotions/${requestId}/reject`, null, { params });
        return response.data;
    },
};

// Type for pending promotion requests
export interface PendingPromotionRequest {
    id: string;
    session_id: string;
    session_name: string;
    class_id: string | null;
    class_name: string;
    submitted_by: string;
    submitter_name: string;
    submitted_at: string;
    total_decisions: number;
    decisions: Array<{
        student_id: string;
        action: string;
        next_class_id?: string;
    }>;
}

export default { sessionService, promotionService };
