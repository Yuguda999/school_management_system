import { apiService } from './api';

export interface RubricRequest {
  assignment_title: string;
  subject: string;
  grade_level: string;
  rubric_type: string;
  criteria_count: number;
  performance_levels: number;
  learning_objectives: string;
  additional_context?: string;
  files?: File[];
}

export interface SaveRubricRequest {
  title: string;
  content: string;
  assignment_title: string;
  subject: string;
  grade_level: string;
  rubric_type: string;
  folder_id?: string;
}

class RubricBuilderService {
  /**
   * Generate a rubric with streaming response
   */
  async generateRubricStream(
    request: RubricRequest,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('assignment_title', request.assignment_title);
      formData.append('subject', request.subject);
      formData.append('grade_level', request.grade_level);
      formData.append('rubric_type', request.rubric_type);
      formData.append('criteria_count', request.criteria_count.toString());
      formData.append('performance_levels', request.performance_levels.toString());
      formData.append('learning_objectives', request.learning_objectives);
      
      if (request.additional_context) {
        formData.append('additional_context', request.additional_context);
      }
      
      // Add files if any
      if (request.files && request.files.length > 0) {
        request.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      // Get token from localStorage (same as axios interceptor does)
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${apiService.api.defaults.baseURL}/api/v1/teacher/tools/rubric-builder/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        onChunk(accumulatedText);
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  /**
   * Save a generated rubric to materials
   */
  async saveRubric(data: SaveRubricRequest): Promise<any> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('assignment_title', data.assignment_title);
    formData.append('subject', data.subject);
    formData.append('grade_level', data.grade_level);
    formData.append('rubric_type', data.rubric_type);
    
    if (data.folder_id) {
      formData.append('folder_id', data.folder_id);
    }

    return await apiService.post<any>('/api/v1/teacher/tools/rubric-builder/save', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Check health of rubric builder service
   */
  async checkHealth(): Promise<any> {
    return await apiService.get<any>('/api/v1/teacher/tools/rubric-builder/health');
  }
}

export default new RubricBuilderService();

