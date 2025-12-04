import { apiService } from './api';
import {
    ComponentMapping,
    ComponentMappingCreate,
    ComponentMappingUpdate,
    ExamTypeInfo,
    MappingPreview
} from '../types';

class ComponentMappingService {
    /**
     * Create a new component mapping
     */
    async createMapping(data: ComponentMappingCreate): Promise<ComponentMapping> {
        return await apiService.post('/api/v1/component-mappings/', data);
    }

    /**
     * Get all mappings for a teacher/subject/term
     */
    async getMappings(subjectId: string, termId: string): Promise<ComponentMapping[]> {
        return await apiService.get('/api/v1/component-mappings/', {
            params: { subject_id: subjectId, term_id: termId }
        });
    }

    /**
     * Update a component mapping
     */
    async updateMapping(id: string, data: ComponentMappingUpdate): Promise<ComponentMapping> {
        return await apiService.put(`/api/v1/component-mappings/${id}`, data);
    }

    /**
     * Delete a component mapping
     */
    async deleteMapping(id: string): Promise<void> {
        await apiService.delete(`/api/v1/component-mappings/${id}`);
    }

    /**
     * Get available exam types with mapping status
     */
    async getExamTypes(subjectId: string, termId: string): Promise<ExamTypeInfo[]> {
        return await apiService.get('/api/v1/component-mappings/exam-types', {
            params: { subject_id: subjectId, term_id: termId }
        });
    }

    /**
     * Preview grade calculation with current mappings
     */
    async getMappingPreview(
        subjectId: string,
        termId: string,
        templateId: string
    ): Promise<MappingPreview[]> {
        return await apiService.get('/api/v1/component-mappings/preview', {
            params: { subject_id: subjectId, term_id: termId, template_id: templateId }
        });
    }
}

export default new ComponentMappingService();
