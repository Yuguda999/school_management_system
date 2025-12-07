import { apiService } from './api';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface EscalationRequest {
    issue_description: string;
    chat_history: ChatMessage[];
}

export interface TextToActionResult {
    success: boolean;
    query_type: string;
    natural_language_answer: string;
    data?: Record<string, unknown>[];
    row_count?: number;
    generated_sql?: string;
    error?: string;
}

export interface TextToActionStatus {
    text_to_action_enabled: boolean;
    feature_available: boolean;
}

export const aiSupportService = {
    /**
     * Stream chat response from AI
     * Note: This returns the URL for the EventSource, not a promise
     */
    getChatStreamUrl(schoolCode?: string): string {
        const baseUrl = apiService.api.defaults.baseURL || '';
        const endpoint = schoolCode
            ? `/api/v1/school/${schoolCode}/support/chat/stream`
            : '/api/v1/support/chat/stream';

        // We need to append the auth token to the URL for EventSource
        const token = localStorage.getItem('access_token');
        return `${baseUrl}${endpoint}?token=${token}`;
    },

    /**
     * Send a message to the chat API (for non-streaming or initial setup if needed)
     * Currently we use EventSource for the actual streaming interaction
     */
    async sendMessage(message: string, history: ChatMessage[], schoolCode?: string, context?: string) {
        const endpoint = schoolCode
            ? `/api/v1/school/${schoolCode}/support/chat/stream`
            : '/api/v1/support/chat/stream';

        return apiService.post(endpoint, {
            message,
            history,
            context
        }, {
            responseType: 'stream'
        });
    },

    /**
     * Escalate issue to human support
     */
    async escalateIssue(data: EscalationRequest, schoolCode?: string) {
        const endpoint = schoolCode
            ? `/api/v1/school/${schoolCode}/support/escalate`
            : '/api/v1/support/escalate';

        return apiService.post(endpoint, data);
    },

    /**
     * Get text-to-action feature status for a school
     */
    async getTextToActionStatus(schoolCode: string): Promise<TextToActionStatus> {
        const endpoint = `/api/v1/school/${schoolCode}/support/text-to-action/status`;
        const response = await apiService.get<TextToActionStatus>(endpoint);
        return response;
    },

    /**
     * Toggle text-to-action feature for a school
     */
    async toggleTextToAction(schoolCode: string, enabled: boolean): Promise<{ status: string; text_to_action_enabled: boolean; message: string }> {
        const endpoint = `/api/v1/school/${schoolCode}/support/text-to-action/toggle`;
        const response = await apiService.patch<{ status: string; text_to_action_enabled: boolean; message: string }>(endpoint, { enabled });
        return response;
    },

    /**
     * Execute a text-to-action query
     */
    async executeTextToActionQuery(schoolCode: string, query: string, context?: string): Promise<TextToActionResult> {
        const endpoint = `/api/v1/school/${schoolCode}/support/text-to-action`;
        const response = await apiService.post<TextToActionResult>(endpoint, { query, context });
        return response;
    }
};

