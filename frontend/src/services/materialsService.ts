/**
 * Materials Service for Smart Resource Library & AI Search (P3.2)
 */

import { apiService as api } from './api';

// ============== Types ==============

export type MaterialType = 'document' | 'presentation' | 'video' | 'audio' | 'image' | 'link' | 'other';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

export interface Material {
  id: string;
  title: string;
  description?: string;
  material_type: MaterialType;
  file_name?: string;
  original_file_name?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  subject_id?: string;
  subject_name?: string;
  class_id?: string;
  class_name?: string;
  term_id?: string;
  grade_level?: string;
  topic?: string;
  tags: string[];
  difficulty_level?: DifficultyLevel;
  exam_type?: string;
  is_published: boolean;
  view_count: number;
  download_count: number;
  is_favorite: boolean;
  created_at: string;
}

export interface MaterialCreate {
  title: string;
  description?: string;
  subject_id?: string;
  class_id?: string;
  term_id?: string;
  grade_level?: string;
  topic?: string;
  tags?: string[];
  difficulty_level?: DifficultyLevel;
  exam_type?: string;
  is_published?: boolean;
}

export interface MaterialSearchRequest {
  query: string;
  subject_id?: string;
  class_id?: string;
  grade_level?: string;
  difficulty_level?: DifficultyLevel;
  exam_type?: string;
  material_type?: MaterialType;
  limit?: number;
}

export interface MaterialSearchResult {
  id: string;
  title: string;
  description?: string;
  material_type: string;
  subject_name?: string;
  class_name?: string;
  grade_level?: string;
  topic?: string;
  tags: string[];
  difficulty_level?: string;
  exam_type?: string;
  view_count: number;
  download_count: number;
  uploader_name?: string;
  created_at: string;
}

export interface MaterialFolder {
  id: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  color?: string;
  icon?: string;
  material_count: number;
  subfolder_count: number;
  created_at: string;
}

export interface MaterialStats {
  total_materials: number;
  published_materials: number;
  draft_materials: number;
  total_storage_mb: number;
  materials_by_type: Record<string, number>;
  total_views: number;
  total_downloads: number;
}

export interface TagInfo {
  tag: string;
  count: number;
}

// ============== API Functions ==============

const materialsService = {
  // Materials CRUD
  listMaterials: async (schoolCode: string, filters?: {
    subject_id?: string;
    class_id?: string;
    term_id?: string;
    material_type?: MaterialType;
    is_published?: boolean;
    is_favorite?: boolean;
    difficulty_level?: DifficultyLevel;
    exam_type?: string;
    limit?: number;
    offset?: number;
  }) => {
    return await api.get<Material[]>(`/school/${schoolCode}/materials`, { params: filters });
  },

  getMaterial: async (schoolCode: string, materialId: string) => {
    return await api.get<Material>(`/school/${schoolCode}/materials/${materialId}`);
  },

  updateMaterial: async (schoolCode: string, materialId: string, data: Partial<MaterialCreate>) => {
    return await api.put(`/school/${schoolCode}/materials/${materialId}`, data);
  },

  deleteMaterial: async (schoolCode: string, materialId: string) => {
    await api.delete(`/school/${schoolCode}/materials/${materialId}`);
  },

  // Smart Search (P3.2)
  smartSearch: async (schoolCode: string, request: MaterialSearchRequest) => {
    return await api.post<{ results: MaterialSearchResult[]; count: number }>(`/school/${schoolCode}/materials/search`, request);
  },

  getRelatedMaterials: async (schoolCode: string, materialId: string, limit?: number) => {
    const params = limit ? { limit } : {};
    return await api.get<MaterialSearchResult[]>(`/school/${schoolCode}/materials/${materialId}/related`, { params });
  },

  getLessonSuggestions: async (schoolCode: string, subjectId: string, classId?: string, topic?: string, limit?: number) => {
    const params: Record<string, string | number> = { subject_id: subjectId };
    if (classId) params.class_id = classId;
    if (topic) params.topic = topic;
    if (limit) params.limit = limit;
    return await api.get<MaterialSearchResult[]>(`/school/${schoolCode}/materials/suggestions/lesson`, { params });
  },

  // Tags
  addTags: async (schoolCode: string, materialId: string, tags: string[]) => {
    return await api.post(`/school/${schoolCode}/materials/${materialId}/tags`, { tags });
  },

  removeTags: async (schoolCode: string, materialId: string, tags: string[]) => {
    return await api.delete(`/school/${schoolCode}/materials/${materialId}/tags`, { data: { tags } });
  },

  getAllTags: async (schoolCode: string) => {
    return await api.get<{ tags: TagInfo[] }>(`/school/${schoolCode}/materials/tags/all`);
  },

  // Statistics
  getStatistics: async (schoolCode: string) => {
    return await api.get<MaterialStats>(`/school/${schoolCode}/materials/stats/summary`);
  },

  // Folders
  listFolders: async (schoolCode: string, parentFolderId?: string) => {
    const params = parentFolderId ? { parent_folder_id: parentFolderId } : {};
    return await api.get<MaterialFolder[]>(`/school/${schoolCode}/materials/folders`, { params });
  },

  createFolder: async (schoolCode: string, data: {
    name: string;
    description?: string;
    parent_folder_id?: string;
    color?: string;
    icon?: string;
  }) => {
    return await api.post(`/school/${schoolCode}/materials/folders`, data);
  },

  addMaterialToFolder: async (schoolCode: string, folderId: string, materialId: string, position?: number) => {
    const params = position !== undefined ? { position } : {};
    return await api.post(`/school/${schoolCode}/materials/folders/${folderId}/materials/${materialId}`, null, { params });
  },

  removeMaterialFromFolder: async (schoolCode: string, folderId: string, materialId: string) => {
    await api.delete(`/school/${schoolCode}/materials/folders/${folderId}/materials/${materialId}`);
  },
};

export default materialsService;

