import { apiService } from './api';
import {
  TeacherMaterial,
  MaterialCreate,
  MaterialUpdate,
  MaterialUploadResponse,
  BulkUploadResponse,
  MaterialShare,
  MaterialShareCreate,
  BulkShareCreate,
  MaterialFolder,
  MaterialFolderCreate,
  MaterialFolderUpdate,
  MaterialStats,
  MaterialAnalytics,
  StorageQuota,
  MaterialListParams,
  MaterialType,
  ShareType,
} from '../types';

class MaterialService {
  // ============================================================================
  // Material CRUD Operations
  // ============================================================================

  // Upload a single material
  async uploadMaterial(file: File, data: MaterialCreate): Promise<MaterialUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.subject_id) formData.append('subject_id', data.subject_id);
    if (data.grade_level) formData.append('grade_level', data.grade_level);
    if (data.topic) formData.append('topic', data.topic);
    if (data.tags && data.tags.length > 0) formData.append('tags', JSON.stringify(data.tags));
    if (data.is_published !== undefined) formData.append('is_published', data.is_published.toString());
    if (data.scheduled_publish_at) formData.append('scheduled_publish_at', data.scheduled_publish_at);

    return apiService.post<MaterialUploadResponse>('/api/v1/materials/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Bulk upload materials
  async bulkUploadMaterials(
    files: File[],
    data: {
      subject_id?: string;
      grade_level?: string;
      topic?: string;
      tags?: string[];
      is_published?: boolean;
    }
  ): Promise<BulkUploadResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (data.subject_id) formData.append('subject_id', data.subject_id);
    if (data.grade_level) formData.append('grade_level', data.grade_level);
    if (data.topic) formData.append('topic', data.topic);
    if (data.tags && data.tags.length > 0) formData.append('tags', JSON.stringify(data.tags));
    if (data.is_published !== undefined) formData.append('is_published', data.is_published.toString());

    return apiService.post<BulkUploadResponse>('/api/v1/materials/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get materials with filtering
  async getMaterials(params?: MaterialListParams): Promise<TeacherMaterial[]> {
    const queryParams = new URLSearchParams();
    if (params?.subject_id) queryParams.append('subject_id', params.subject_id);
    if (params?.grade_level) queryParams.append('grade_level', params.grade_level);
    if (params?.material_type) queryParams.append('material_type', params.material_type);
    if (params?.tags && params.tags.length > 0) queryParams.append('tags', params.tags.join(','));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());
    if (params?.is_favorite !== undefined) queryParams.append('is_favorite', params.is_favorite.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/v1/materials/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiService.get<TeacherMaterial[]>(url);
  }

  // Get material by ID
  async getMaterialById(materialId: string): Promise<TeacherMaterial> {
    return apiService.get<TeacherMaterial>(`/api/v1/materials/${materialId}`);
  }

  // Update material
  async updateMaterial(materialId: string, data: MaterialUpdate): Promise<TeacherMaterial> {
    return apiService.put<TeacherMaterial>(`/api/v1/materials/${materialId}`, data);
  }

  // Delete material
  async deleteMaterial(materialId: string): Promise<void> {
    return apiService.delete(`/api/v1/materials/${materialId}`);
  }

  // Download material
  async downloadMaterial(materialId: string): Promise<Blob> {
    const response = await apiService.api.get(`/api/v1/materials/${materialId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Preview material
  async previewMaterial(materialId: string): Promise<Blob> {
    const response = await apiService.api.get(`/api/v1/materials/${materialId}/preview`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ============================================================================
  // Version Control
  // ============================================================================

  // Create new version
  async createMaterialVersion(materialId: string, file: File): Promise<TeacherMaterial> {
    const formData = new FormData();
    formData.append('file', file);

    return apiService.post<TeacherMaterial>(`/api/v1/materials/${materialId}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get material versions
  async getMaterialVersions(materialId: string): Promise<TeacherMaterial[]> {
    return apiService.get<TeacherMaterial[]>(`/api/v1/materials/${materialId}/versions`);
  }

  // ============================================================================
  // Sharing
  // ============================================================================

  // Share material
  async shareMaterial(materialId: string, data: Omit<MaterialShareCreate, 'material_id'>): Promise<MaterialShare> {
    return apiService.post<MaterialShare>(`/api/v1/materials/${materialId}/share`, data);
  }

  // Bulk share materials
  async bulkShareMaterials(data: BulkShareCreate): Promise<MaterialShare[]> {
    return apiService.post<MaterialShare[]>('/api/v1/materials/bulk-share', data);
  }

  // Get material shares
  async getMaterialShares(materialId: string): Promise<MaterialShare[]> {
    return apiService.get<MaterialShare[]>(`/api/v1/materials/${materialId}/shares`);
  }

  // Remove share
  async removeShare(materialId: string, shareId: string): Promise<void> {
    return apiService.delete(`/api/v1/materials/${materialId}/shares/${shareId}`);
  }

  // Get shared materials for student
  async getSharedMaterialsForStudent(params?: { skip?: number; limit?: number }): Promise<TeacherMaterial[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/v1/materials/shared/student${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiService.get<TeacherMaterial[]>(url);
  }

  // ============================================================================
  // Folder Management
  // ============================================================================

  // Create folder
  async createFolder(data: MaterialFolderCreate): Promise<MaterialFolder> {
    return apiService.post<MaterialFolder>('/api/v1/materials/folders', data);
  }

  // Get folders
  async getFolders(): Promise<MaterialFolder[]> {
    return apiService.get<MaterialFolder[]>('/api/v1/materials/folders');
  }

  // Update folder
  async updateFolder(folderId: string, data: MaterialFolderUpdate): Promise<MaterialFolder> {
    return apiService.put<MaterialFolder>(`/api/v1/materials/folders/${folderId}`, data);
  }

  // Delete folder
  async deleteFolder(folderId: string): Promise<void> {
    return apiService.delete(`/api/v1/materials/folders/${folderId}`);
  }

  // Add material to folder
  async addMaterialToFolder(folderId: string, materialId: string): Promise<void> {
    return apiService.post(`/api/v1/materials/folders/${folderId}/materials/${materialId}`, {});
  }

  // Remove material from folder
  async removeMaterialFromFolder(folderId: string, materialId: string): Promise<void> {
    return apiService.delete(`/api/v1/materials/folders/${folderId}/materials/${materialId}`);
  }

  // Get folder materials
  async getFolderMaterials(folderId: string): Promise<TeacherMaterial[]> {
    return apiService.get<TeacherMaterial[]>(`/api/v1/materials/folders/${folderId}/materials`);
  }

  // ============================================================================
  // Statistics and Analytics
  // ============================================================================

  // Get material statistics
  async getMaterialStats(): Promise<MaterialStats> {
    return apiService.get<MaterialStats>('/api/v1/materials/stats/overview');
  }

  // Get storage quota
  async getStorageQuota(): Promise<StorageQuota> {
    return apiService.get<StorageQuota>('/api/v1/materials/stats/quota');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  // Get file icon based on material type
  getFileIcon(materialType: MaterialType): string {
    const iconMap: Record<MaterialType, string> = {
      pdf: '📄',
      document: '📝',
      presentation: '📊',
      spreadsheet: '📈',
      image: '🖼️',
      video: '🎥',
      audio: '🎵',
      archive: '📦',
      other: '📎',
    };
    return iconMap[materialType] || '📎';
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Get share type label
  getShareTypeLabel(shareType: ShareType): string {
    const labelMap: Record<ShareType, string> = {
      all_students: 'All Students',
      class: 'Specific Class',
      individual_student: 'Individual Student',
      teacher: 'Teacher',
      public: 'Public',
    };
    return labelMap[shareType] || shareType;
  }

  // Check if material can be previewed
  canPreview(material: TeacherMaterial): boolean {
    return material.can_preview || material.is_image || material.is_pdf || false;
  }

  // Get download URL
  getDownloadUrl(materialId: string): string {
    return `/api/v1/materials/${materialId}/download`;
  }

  // Get preview URL
  getPreviewUrl(materialId: string): string {
    return `/api/v1/materials/${materialId}/preview`;
  }
}

export const materialService = new MaterialService();

