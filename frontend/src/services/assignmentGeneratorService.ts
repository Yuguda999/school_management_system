import { apiService } from './api';

export interface AssignmentRequest {
  subject: string;
  grade_level: string;
  topic: string;
  assignment_type: string;
  difficulty_level: string;
  duration: string;
  learning_objectives: string;
  additional_context?: string;
  standards?: string;
  files?: File[];
}

export interface SaveAssignmentRequest {
  title: string;
  content: string;
  subject: string;
  grade_level: string;
  topic: string;
  assignment_type: string;
  folder_id?: string;
}

class AssignmentGeneratorService {
  /**
   * Generate an assignment with streaming response
   */
  async generateAssignmentStream(
    request: AssignmentRequest,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('subject', request.subject);
      formData.append('grade_level', request.grade_level);
      formData.append('topic', request.topic);
      formData.append('assignment_type', request.assignment_type);
      formData.append('difficulty_level', request.difficulty_level);
      formData.append('duration', request.duration);
      formData.append('learning_objectives', request.learning_objectives);
      
      if (request.additional_context) {
        formData.append('additional_context', request.additional_context);
      }
      
      if (request.standards) {
        formData.append('standards', request.standards);
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

      const response = await fetch(`${apiService.api.defaults.baseURL}/api/v1/teacher/tools/assignment-generator/generate`, {
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
   * Save a generated assignment to materials
   */
  async saveAssignment(data: SaveAssignmentRequest): Promise<any> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('subject', data.subject);
    formData.append('grade_level', data.grade_level);
    formData.append('topic', data.topic);
    formData.append('assignment_type', data.assignment_type);
    
    if (data.folder_id) {
      formData.append('folder_id', data.folder_id);
    }

    return await apiService.post<any>('/api/v1/teacher/tools/assignment-generator/save', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Check health of assignment generator service
   */
  async checkHealth(): Promise<any> {
    return await apiService.get<any>('/api/v1/teacher/tools/assignment-generator/health');
  }
}

export default new AssignmentGeneratorService();

