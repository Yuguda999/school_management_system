import { apiService } from './api';

export interface SchoolPublicInfo {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  motto: string | null;
  website: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
}

export interface SchoolValidationResponse {
  valid: boolean;
  school_code: string;
}

export interface SchoolCodeValidationResponse {
  available: boolean;
  message: string;
  school_code: string;
}

export interface SchoolEmailValidationResponse {
  available: boolean;
  message: string;
  email: string;
}

export interface SchoolThemeSettings {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  dark_mode_enabled?: boolean;
}

export interface SchoolData {
  id: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  website?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description?: string;
  logo_url?: string;
  motto?: string;
  established_year?: string;
  current_session: string;
  current_term: string;
  settings?: {
    theme_settings?: SchoolThemeSettings;
    [key: string]: any;
  };
  is_active: boolean;
  is_verified: boolean;
  subscription_plan: string;
  subscription_status: string;
  trial_expires_at?: string;
  max_students?: number;
  max_teachers?: number;
  max_classes?: number;
  created_at: string;
  updated_at: string;
}

class SchoolService {
  /**
   * Get public school information by school code
   */
  async getSchoolPublicInfo(schoolCode: string): Promise<SchoolPublicInfo> {
    const response = await apiService.get<SchoolPublicInfo>(
      `/api/v1/school/${schoolCode}/info`
    );
    return response;
  }

  /**
   * Validate if a school code exists and is active
   */
  async validateSchoolCode(schoolCode: string): Promise<SchoolValidationResponse> {
    const response = await apiService.get<SchoolValidationResponse>(
      `/api/v1/school/${schoolCode}/validate`
    );
    return response;
  }

  /**
   * School-specific login
   */
  async schoolLogin(schoolCode: string, credentials: { email: string; password: string }): Promise<any> {
    const response = await apiService.post(
      `/api/v1/auth/school/${schoolCode}/login`,
      credentials
    );
    return response;
  }

  /**
   * Get current school information (for authenticated users)
   */
  async getCurrentSchool(): Promise<SchoolData> {
    const response = await apiService.get<SchoolData>('/api/v1/schools/me');
    return response;
  }

  /**
   * Update school information
   */
  async updateSchool(data: Partial<SchoolData>): Promise<SchoolData> {
    const response = await apiService.put<SchoolData>('/api/v1/schools/me', data);
    return response;
  }

  /**
   * Update school theme settings
   */
  async updateTheme(themeSettings: SchoolThemeSettings): Promise<void> {
    await apiService.put('/api/v1/schools/me/settings', {
      theme_settings: themeSettings
    });
  }

  /**
   * Apply theme settings to document
   */
  /**
   * Helper function to convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Helper function to generate color palette from base color
   */
  private generateColorPalette(baseColor: string) {
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return {};

    const { r, g, b } = rgb;

    return {
      50: `${Math.min(255, r + 100)}, ${Math.min(255, g + 100)}, ${Math.min(255, b + 100)}`,
      100: `${Math.min(255, r + 80)}, ${Math.min(255, g + 80)}, ${Math.min(255, b + 80)}`,
      200: `${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)}`,
      300: `${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)}`,
      400: `${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)}`,
      500: `${r}, ${g}, ${b}`,
      600: `${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)}`,
      700: `${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}`,
      800: `${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)}`,
      900: `${Math.max(0, r - 80)}, ${Math.max(0, g - 80)}, ${Math.max(0, b - 80)}`,
      950: `${Math.max(0, r - 100)}, ${Math.max(0, g - 100)}, ${Math.max(0, b - 100)}`,
    };
  }

  /**
   * Apply theme settings to document
   */
  applyThemeToDocument(themeSettings: SchoolThemeSettings): void {
    const root = document.documentElement;

    if (themeSettings.primary_color) {
      // Set legacy variable
      root.style.setProperty('--primary-color', themeSettings.primary_color);

      // Generate and set full palette
      const primaryPalette = this.generateColorPalette(themeSettings.primary_color);
      Object.entries(primaryPalette).forEach(([shade, rgb]) => {
        root.style.setProperty(`--color-primary-${shade}`, rgb);
      });
    }

    if (themeSettings.secondary_color) {
      // Set legacy variable
      root.style.setProperty('--secondary-color', themeSettings.secondary_color);

      // Generate and set full palette
      const secondaryPalette = this.generateColorPalette(themeSettings.secondary_color);
      Object.entries(secondaryPalette).forEach(([shade, rgb]) => {
        root.style.setProperty(`--color-secondary-${shade}`, rgb);
      });
    }

    if (themeSettings.accent_color) {
      root.style.setProperty('--accent-color', themeSettings.accent_color);
    }

    // Apply dark mode if specified
    if (themeSettings.dark_mode_enabled !== undefined) {
      if (themeSettings.dark_mode_enabled) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  /**
   * Validate logo file
   */
  validateLogoFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Please upload an image smaller than 5MB.');
    }

    return true;
  }

  /**
   * Upload school logo
   */
  async uploadLogo(file: File): Promise<{ logo_url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiService.post<{ logo_url: string }>(
      '/api/v1/schools/me/logo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  }

  /**
   * Delete school logo
   */
  async deleteLogo(): Promise<void> {
    await apiService.delete('/api/v1/schools/me/logo');
  }

  /**
   * Validate school code availability
   */
  async validateSchoolCodeAvailability(schoolCode: string): Promise<SchoolCodeValidationResponse> {
    const response = await apiService.get<SchoolCodeValidationResponse>(
      `/api/v1/validate/school-code/${encodeURIComponent(schoolCode)}`
    );
    return response;
  }

  /**
   * Validate school email availability
   */
  async validateSchoolEmailAvailability(email: string): Promise<SchoolEmailValidationResponse> {
    const response = await apiService.get<SchoolEmailValidationResponse>(
      `/api/v1/validate/school-email/${encodeURIComponent(email)}`
    );
    return response;
  }

  /**
   * Enable blockchain identity for a school
   */
  async enableBlockchain(schoolId: string): Promise<{ message: string; wallet_address: string }> {
    const response = await apiService.post<{ message: string; wallet_address: string }>(
      `/api/v1/schools/${schoolId}/identity/enable`,
      {}
    );
    return response;
  }

  /**
   * Get blockchain identity status
   */
  async getBlockchainStatus(schoolId: string): Promise<{
    enabled: boolean;
    wallet_address: string | null;
    balance: number;
    network: string;
  }> {
    const response = await apiService.get<{
      enabled: boolean;
      wallet_address: string | null;
      balance: number;
      network: string;
    }>(`/api/v1/schools/${schoolId}/identity/status`);
    return response;
  }
}

export const schoolService = new SchoolService();
export default schoolService;