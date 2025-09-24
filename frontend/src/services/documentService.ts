import { apiService } from './api';

export interface Document {
  id: string;
  title: string;
  description?: string;
  document_type: DocumentType;
  status: DocumentStatus;
  file_name: string;
  original_file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  student_id: string;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  expires_at?: string;
  tags?: string;
  is_public: boolean;
  school_id: string;
  created_at: string;
  updated_at: string;
  file_size_mb?: number;
  is_expired?: boolean;
  is_image?: boolean;
  is_pdf?: boolean;
  uploader_name?: string;
  verifier_name?: string;
  student_name?: string;
}

export type DocumentType = 
  | 'birth_certificate'
  | 'passport'
  | 'national_id'
  | 'medical_record'
  | 'academic_transcript'
  | 'immunization_record'
  | 'photo'
  | 'parent_id'
  | 'proof_of_address'
  | 'other';

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface DocumentUploadData {
  title: string;
  student_id: string;
  document_type: DocumentType;
  description?: string;
  expires_at?: string;
  tags?: string;
  is_public?: boolean;
}

export interface DocumentUpdateData {
  title?: string;
  description?: string;
  document_type?: DocumentType;
  expires_at?: string;
  tags?: string;
  is_public?: boolean;
  status?: DocumentStatus;
  verification_notes?: string;
}

export interface DocumentVerificationData {
  status: DocumentStatus;
  verification_notes?: string;
}

export interface DocumentUploadResponse {
  message: string;
  document_id: string;
  file_url: string;
}

export interface DocumentStats {
  total_documents: number;
  pending_documents: number;
  approved_documents: number;
  rejected_documents: number;
  expired_documents: number;
  documents_by_type: Record<string, number>;
  recent_uploads: Document[];
}

class DocumentService {
  // Upload a document
  async uploadDocument(file: File, data: DocumentUploadData): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', data.title);
    formData.append('student_id', data.student_id);
    formData.append('document_type', data.document_type);
    
    if (data.description) formData.append('description', data.description);
    if (data.expires_at) formData.append('expires_at', data.expires_at);
    if (data.tags) formData.append('tags', data.tags);
    if (data.is_public !== undefined) formData.append('is_public', data.is_public.toString());

    return apiService.post<DocumentUploadResponse>('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get documents with filtering
  async getDocuments(params?: {
    student_id?: string;
    document_type?: DocumentType;
    status?: DocumentStatus;
    skip?: number;
    limit?: number;
  }): Promise<Document[]> {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.document_type) queryParams.append('document_type', params.document_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/v1/documents/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiService.get<Document[]>(url);
  }

  // Get document by ID
  async getDocumentById(documentId: string): Promise<Document> {
    return apiService.get<Document>(`/api/v1/documents/${documentId}`);
  }

  // Get student documents
  async getStudentDocuments(studentId: string, params?: {
    document_type?: DocumentType;
    status?: DocumentStatus;
  }): Promise<Document[]> {
    const queryParams = new URLSearchParams();
    if (params?.document_type) queryParams.append('document_type', params.document_type);
    if (params?.status) queryParams.append('status', params.status);

    const url = `/api/v1/documents/student/${studentId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiService.get<Document[]>(url);
  }

  // Update document
  async updateDocument(documentId: string, data: DocumentUpdateData): Promise<Document> {
    return apiService.put<Document>(`/api/v1/documents/${documentId}`, data);
  }

  // Verify document
  async verifyDocument(documentId: string, data: DocumentVerificationData): Promise<Document> {
    return apiService.post<Document>(`/api/v1/documents/${documentId}/verify`, data);
  }

  // Delete document
  async deleteDocument(documentId: string): Promise<void> {
    return apiService.delete(`/api/v1/documents/${documentId}`);
  }



  // Download document
  async downloadDocument(documentId: string): Promise<Blob> {
    const response = await apiService.api.get(`/api/v1/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Get document statistics
  async getDocumentStats(studentId?: string): Promise<DocumentStats> {
    const queryParams = new URLSearchParams();
    if (studentId) queryParams.append('student_id', studentId);

    const url = `/api/v1/documents/stats/overview${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiService.get<DocumentStats>(url);
  }

  // Get document type display name
  getDocumentTypeDisplayName(type: DocumentType): string {
    const typeNames: Record<DocumentType, string> = {
      birth_certificate: 'Birth Certificate',
      passport: 'Passport',
      national_id: 'National ID',
      medical_record: 'Medical Record',
      academic_transcript: 'Academic Transcript',
      immunization_record: 'Immunization Record',
      photo: 'Photo',
      parent_id: 'Parent ID',
      proof_of_address: 'Proof of Address',
      other: 'Other'
    };
    return typeNames[type] || type;
  }

  // Get status display name and color
  getStatusInfo(status: DocumentStatus): { name: string; color: string } {
    const statusInfo: Record<DocumentStatus, { name: string; color: string }> = {
      pending: { name: 'Pending', color: 'yellow' },
      approved: { name: 'Approved', color: 'green' },
      rejected: { name: 'Rejected', color: 'red' },
      expired: { name: 'Expired', color: 'gray' }
    };
    return statusInfo[status] || { name: status, color: 'gray' };
  }

  // Validate file for upload
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported. Please upload PDF, DOC, DOCX, JPG, PNG, GIF, WEBP, or TXT files.' };
    }

    return { valid: true };
  }
}

export const documentService = new DocumentService();
