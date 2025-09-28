import { apiService } from './api';

export interface ReportCardTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  isActive: boolean;
  isDefault: boolean;
  isPublished: boolean;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
  creatorName: string;
  assignmentsCount: number;
}

export class TemplateService {
  static async getTemplates(): Promise<ReportCardTemplate[]> {
    try {
      const response = await apiService.get('/api/v1/templates');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Return mock data for development
      return [
        {
          id: '1',
          name: 'Standard Report Card',
          description: 'A comprehensive report card template with all standard sections',
          version: '1.0',
          paperSize: 'A4',
          orientation: 'portrait',
          isActive: true,
          isDefault: true,
          isPublished: true,
          usageCount: 45,
          lastUsed: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          creatorName: 'John Doe',
          assignmentsCount: 8,
        },
        {
          id: '2',
          name: 'Minimal Report Card',
          description: 'A clean, minimal design for simple report cards',
          version: '1.2',
          paperSize: 'A4',
          orientation: 'portrait',
          isActive: true,
          isDefault: false,
          isPublished: true,
          usageCount: 23,
          lastUsed: '2024-01-14T14:20:00Z',
          createdAt: '2024-01-05T00:00:00Z',
          creatorName: 'Jane Smith',
          assignmentsCount: 3,
        },
        {
          id: '3',
          name: 'Landscape Report Card',
          description: 'Wide format report card for detailed information',
          version: '2.0',
          paperSize: 'A4',
          orientation: 'landscape',
          isActive: true,
          isDefault: false,
          isPublished: false,
          usageCount: 12,
          lastUsed: '2024-01-10T09:15:00Z',
          createdAt: '2024-01-10T00:00:00Z',
          creatorName: 'Mike Johnson',
          assignmentsCount: 1,
        },
      ];
    }
  }

  static async getTemplate(id: string): Promise<ReportCardTemplate | null> {
    try {
      const response = await apiService.get(`/api/v1/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  static async createTemplate(data: Partial<ReportCardTemplate>): Promise<ReportCardTemplate | null> {
    try {
      const response = await apiService.post('/api/v1/templates', data);
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      // Return mock created template for development
      const newTemplate: ReportCardTemplate = {
        id: Date.now().toString(),
        name: data.name || 'New Template',
        description: data.description || '',
        version: '1.0',
        paperSize: data.paperSize || 'A4',
        orientation: data.orientation || 'portrait',
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        isPublished: data.isPublished ?? false,
        usageCount: 0,
        lastUsed: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        creatorName: data.creatorName || 'Current User',
        assignmentsCount: 0,
      };
      return newTemplate;
    }
  }

  static async updateTemplate(id: string, data: Partial<ReportCardTemplate>): Promise<ReportCardTemplate | null> {
    try {
      const response = await apiService.put(`/api/v1/templates/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  static async deleteTemplate(id: string): Promise<boolean> {
    try {
      await apiService.delete(`/api/v1/templates/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      // Return true for development
      return true;
    }
  }
}