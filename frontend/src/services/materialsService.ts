import { apiService } from './api';

export interface MaterialFolder {
  id: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  teacher_id: string;
  school_id: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveLessonPlanRequest {
  title: string;
  content: string;
  subject: string;
  grade_level: string;
  topic: string;
  folder_id?: string;
}

export interface SaveLessonPlanResponse {
  message: string;
  material_id: string;
  folder_id?: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  parent_folder_id?: string;
  color?: string;
  icon?: string;
}

class MaterialsService {
  /**
   * Get all folders for the current teacher
   */
  async getFolders(): Promise<MaterialFolder[]> {
    return await apiService.get<MaterialFolder[]>('/api/v1/materials/folders');
  }

  /**
   * Create a new folder
   */
  async createFolder(data: CreateFolderRequest): Promise<MaterialFolder> {
    return await apiService.post<MaterialFolder>('/api/v1/materials/folders', data);
  }

  /**
   * Save a lesson plan as a material
   */
  async saveLessonPlan(data: SaveLessonPlanRequest): Promise<SaveLessonPlanResponse> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('subject', data.subject);
    formData.append('grade_level', data.grade_level);
    formData.append('topic', data.topic);

    if (data.folder_id) {
      formData.append('folder_id', data.folder_id);
    }

    return await apiService.post<SaveLessonPlanResponse>('/api/v1/teacher/tools/lesson-planner/save', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Preview a material (returns blob for supported file types)
   */
  async previewMaterial(materialId: string): Promise<Blob> {
    const response = await apiService.api.get(`/api/v1/materials/${materialId}/preview`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Download a material
   */
  async downloadMaterial(materialId: string): Promise<Blob> {
    const response = await apiService.api.get(`/api/v1/materials/${materialId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new MaterialsService();

