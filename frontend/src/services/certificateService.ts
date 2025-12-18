import { apiService } from './api';

export interface TransferCertificate {
    id: string;
    student_id: string;
    policy_id: string;
    asset_name: string;
    transaction_hash: string;
    record_hash: string;
    status: 'PENDING' | 'MINTED' | 'FAILED';
    created_at: string;
}

export const certificateService = {
    generateCertificate: async (studentId: string): Promise<TransferCertificate> => {
        const response = await apiService.post<TransferCertificate>(`/api/v1/certificates/generate/${studentId}`, {});
        return response;
    },

    downloadCertificate: async (certificateId: string): Promise<Blob> => {
        const response = await apiService.get<Blob>(`/api/v1/certificates/download/${certificateId}`, {
            responseType: 'blob',
        });
        return response;
    },

    verifyCertificate: async (assetId: string): Promise<any> => {
        const response = await apiService.get<any>(`/api/v1/certificates/verify/${assetId}`);
        return response;
    }
};
