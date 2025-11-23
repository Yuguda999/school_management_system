/**
 * Lesson Planner Service
 * Handles AI-powered lesson plan generation with streaming support
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface LessonPlanRequest {
  subject: string;
  grade_level: string;
  topic: string;
  duration: number;
  learning_objectives: string;
  additional_context?: string;
  standards?: string;
  files?: File[];
}

export class LessonPlannerService {
  /**
   * Generate a lesson plan with streaming response
   * @param request Lesson plan request data
   * @param onChunk Callback function called for each chunk of text received
   * @param onComplete Callback function called when streaming is complete
   * @param onError Callback function called if an error occurs
   */
  static async generateLessonPlanStream(
    request: LessonPlanRequest,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const token = localStorage.getItem('access_token');

    if (!token) {
      onError(new Error('No authentication token found'));
      return;
    }

    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('subject', request.subject);
      formData.append('grade_level', request.grade_level);
      formData.append('topic', request.topic);
      formData.append('duration', request.duration.toString());
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

      const response = await fetch(`${API_BASE_URL}/api/v1/teacher/tools/lesson-planner/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for multipart/form-data
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to generate lesson plan' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        
        // Call the callback with the accumulated text
        onChunk(accumulatedText);
      }
    } catch (error) {
      console.error('Error in lesson plan generation:', error);
      onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  }

  /**
   * Check if the lesson planner service is available
   */
  static async checkHealth(): Promise<{ status: string; service: string; model: string }> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/tools/lesson-planner/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Lesson planner service is unavailable');
    }

    return response.json();
  }
}

