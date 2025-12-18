import { apiService } from './api';

export interface Credential {
    id: string;
    title: string;
    credential_type: 'GRADE' | 'TRANSFER' | 'ATTENDANCE' | 'ACHIEVEMENT';
    description: string;
    status: 'PENDING' | 'MINTED' | 'FAILED' | 'REVOKED';
    transaction_hash: string | null;
    asset_name: string | null;
    policy_id: string | null;
    created_at: string;
}

export interface IssueCredentialRequest {
    student_id: string;
    credential_type: string;
    title: string;
    description?: string;
    claims?: Record<string, any>;
}

class CredentialService {
    /**
     * Get all credentials for a specific student
     */
    async getStudentCredentials(studentId: string): Promise<Credential[]> {
        const response = await apiService.get<Credential[]>(
            `/api/v1/credentials/student/${studentId}`
        );
        return response;
    }

    /**
     * Get credentials for the currently authenticated student
     */
    async getMyCredentials(): Promise<Credential[]> {
        const response = await apiService.get<Credential[]>(
            `/api/v1/credentials/me`
        );
        return response;
    }

    /**
     * Issue a new credential (VC)
     */
    async issueCredential(data: IssueCredentialRequest): Promise<Credential> {
        const params = new URLSearchParams({
            credential_type: data.credential_type,
            title: data.title,
        });
        if (data.description) {
            params.append('description', data.description);
        }

        const response = await apiService.post<Credential>(
            `/api/v1/credentials/issue/${data.student_id}?${params.toString()}`,
            data.claims || {}
        );
        return response;
    }

    /**
     * Verify a credential by policy ID and asset name (public endpoint)
     */
    async verifyCredential(policyId: string, assetName: string): Promise<{
        valid: boolean;
        credential?: Credential;
        onChainData?: any;
    }> {
        const response = await apiService.get<{
            valid: boolean;
            credential?: Credential;
            onChainData?: any;
        }>(`/api/v1/credentials/verify/${policyId}/${assetName}`);
        return response;
    }
}

export const credentialService = new CredentialService();
export default credentialService;
