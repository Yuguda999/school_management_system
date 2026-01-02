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
  updatedAt: string;
  creatorName: string;
  assignmentsCount: number;
  elements?: any[];
  fields?: any[]; // Raw backend fields for preview
}

export class TemplateService {
  static async getTemplates(): Promise<ReportCardTemplate[]> {
    const response = await apiService.get<ReportCardTemplate[]>('/api/v1/templates/');
    console.log('📥 Fetched templates from backend:', response?.length);
    const mapped = (response || []).map(this.mapBackendToFrontend);
    mapped.forEach((t, i) => {
      console.log(`📥 Template ${i} "${t.name}": ${t.elements?.length} elements, IDs:`,
        t.elements?.slice(0, 3).map(e => ({ id: e.id, type: e.type })));
    });
    return mapped;
  }

  static async getTemplate(id: string): Promise<ReportCardTemplate | null> {
    const response = await apiService.get<any>(`/api/v1/templates/${id}`);
    console.log('📥 Fetched template from backend:', { id, fieldCount: response?.fields?.length });
    console.log('📥 Sample field IDs:', response?.fields?.slice(0, 3).map((f: any) => ({ id: f.id, type: f.field_type })));
    const mapped = response ? this.mapBackendToFrontend(response) : null;
    console.log('📥 After mapping to frontend - element IDs:', mapped?.elements?.slice(0, 3).map((e: any) => ({ id: e.id, type: e.type })));
    return mapped;
  }

  static async createTemplate(data: Partial<ReportCardTemplate>): Promise<ReportCardTemplate | null> {
    const backendData = this.mapFrontendToBackend(data);
    const response = await apiService.post<any>('/api/v1/templates/', backendData);
    return response ? this.mapBackendToFrontend(response) : null;
  }

  static async updateTemplate(id: string, data: Partial<ReportCardTemplate>): Promise<ReportCardTemplate | null> {
    const backendData = this.mapFrontendToBackend(data);
    const response = await apiService.put<any>(`/api/v1/templates/${id}`, backendData);
    return response ? this.mapBackendToFrontend(response) : null;
  }

  static async deleteTemplate(id: string): Promise<boolean> {
    await apiService.delete(`/api/v1/templates/${id}`);
    return true;
  }

  // Helper to map backend fields to frontend elements
  private static mapBackendToFrontend(template: any): ReportCardTemplate {
    return {
      ...template,
      fields: template.fields, // Keep raw backend fields for preview
      elements: template.fields?.map((field: any) => ({
        id: field.id, // Use database ID
        type: field.field_type.toLowerCase(), // Convert to lowercase for frontend
        content: field.default_value || field.label || '',
        x: field.x_position * 96, // Convert inches to pixels (approx)
        y: field.y_position * 96,
        width: field.width * 96,
        height: field.height * 96,
        fontSize: field.font_size,
        fontFamily: field.font_family,
        fontWeight: field.font_weight?.toLowerCase(),
        fontStyle: field.font_style?.toLowerCase(),
        color: field.text_color || 'transparent',
        backgroundColor: field.background_color || 'transparent',
        borderColor: field.border_color || 'transparent',
        borderWidth: field.border_width,
        borderStyle: field.border_style,
        textAlign: field.text_align?.toLowerCase(),
        zIndex: field.z_index,
        visible: field.is_visible,
        // Map other properties from JSON
        ...field.properties,
        properties: field.properties // Enable nested access for new features
      })) || []
    };
  }

  // Helper to map frontend elements to backend fields
  private static mapFrontendToBackend(template: Partial<ReportCardTemplate>): any {
    const { elements, ...rest } = template;

    const backendPayload: any = {
      name: template.name,
      description: template.description,
      version: template.version || '1.0',
      paper_size: template.paperSize || 'A4',
      orientation: template.orientation || 'portrait',
      is_active: template.isActive ?? true,
      is_default: template.isDefault ?? false,
      is_published: template.isPublished ?? false,

      // Map margins if they exist
      page_margin_top: (template as any).pageMarginTop ?? 1.0,
      page_margin_bottom: (template as any).pageMarginBottom ?? 1.0,
      page_margin_left: (template as any).pageMarginLeft ?? 1.0,
      page_margin_right: (template as any).pageMarginRight ?? 1.0,
    };

    // Only add fields if elements exist
    if (elements && elements.length > 0) {
      backendPayload.fields = elements.map((el: any) => ({
        // Always send the ID if it exists - the backend will handle UUID validation
        // This is critical for updates to work correctly
        id: el.id,
        field_id: el.id,
        field_type: el.type.toUpperCase(), // Convert to UPPERCASE to match backend enum
        label: el.type === 'text' ? 'Text Block' : el.type,

        // Position and Size (pixels to inches)
        x_position: el.x / 96,
        y_position: el.y / 96,
        width: el.width / 96,
        height: el.height / 96,

        // Styling
        font_family: el.fontFamily,
        font_size: el.fontSize,
        font_weight: (el.fontWeight || 'NORMAL').toUpperCase(),
        font_style: (el.fontStyle || 'NORMAL').toUpperCase(),
        text_color: el.color && el.color !== 'transparent' ? el.color : null,
        background_color: el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : null,
        border_color: el.borderColor && el.borderColor !== 'transparent' ? el.borderColor : null,
        border_width: el.borderWidth || 0,
        border_style: el.borderStyle || 'solid',

        // Text Properties
        text_align: (el.textAlign || 'LEFT').toUpperCase(),

        // Configuration
        default_value: el.content,
        is_visible: el.visible !== false,
        z_index: el.zIndex || 0,

        // Store extra properties in JSON
        // Read from properties object first (where editor stores them),
        // fallback to top-level for backward compatibility
        properties: {
          showRemarks: el.properties?.showRemarks ?? el.showRemarks,
          striped: el.properties?.striped ?? el.striped,
          compact: el.properties?.compact ?? el.compact,
          headerBackgroundColor: el.properties?.headerBackgroundColor ?? el.headerBackgroundColor,
          headerTextColor: el.properties?.headerTextColor ?? el.headerTextColor,
          // Additional table properties stored in properties object
          showTotal: el.properties?.showTotal,
          showGrade: el.properties?.showGrade,
          showComponentColumns: el.properties?.showComponentColumns,
          visibleComponents: el.properties?.visibleComponents,
          headerOverrides: el.properties?.headerOverrides,
          columnWidths: el.properties?.columnWidths,
          // General element properties
          rotation: el.properties?.rotation ?? el.rotation,
          opacity: el.properties?.opacity ?? el.opacity,
          locked: el.properties?.locked ?? el.locked,
          boxShadow: el.properties?.boxShadow ?? el.boxShadow,
          borderRadius: el.properties?.borderRadius ?? el.borderRadius
        }
      }));
    }

    return backendPayload;
  }
}