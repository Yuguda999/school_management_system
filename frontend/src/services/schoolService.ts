import { apiService } from './api';

export interface SchoolUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  description?: string;
  motto?: string;
  established_year?: string;
  current_session?: string;
  current_term?: string;
}

export interface SchoolThemeSettings {
  primary_color?: string;
  secondary_color?: string;
  dark_mode_enabled?: boolean;
  custom_css?: string;
}

export interface SchoolSettings {
  academic_calendar?: Record<string, any>;
  grading_system?: Record<string, any>;
  fee_settings?: Record<string, any>;
  communication_settings?: Record<string, any>;
  general_settings?: Record<string, any>;
  theme_settings?: SchoolThemeSettings;
}

export interface LogoUploadResponse {
  message: string;
  logo_url: string;
}

export interface ThemeUpdateResponse {
  message: string;
  theme_settings: SchoolThemeSettings;
}

export interface SettingsUpdateResponse {
  message: string;
  settings: SchoolSettings;
}

class SchoolService {
  /**
   * Update current school information
   */
  async updateSchool(data: SchoolUpdateData): Promise<any> {
    return await apiService.put('/api/v1/schools/me', data);
  }

  /**
   * Upload school logo
   */
  async uploadLogo(file: File): Promise<LogoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiService.post('/api/v1/schools/me/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Delete school logo
   */
  async deleteLogo(): Promise<{ message: string }> {
    return await apiService.delete('/api/v1/schools/me/logo');
  }

  /**
   * Update school theme settings
   */
  async updateTheme(themeSettings: SchoolThemeSettings): Promise<ThemeUpdateResponse> {
    return await apiService.put('/api/v1/schools/me/theme', themeSettings);
  }

  /**
   * Update school settings
   */
  async updateSettings(settings: SchoolSettings): Promise<SettingsUpdateResponse> {
    return await apiService.put('/api/v1/schools/me/settings', settings);
  }

  /**
   * Get school settings
   */
  async getSettings(): Promise<SchoolSettings> {
    return await apiService.get('/api/v1/schools/me/settings');
  }

  /**
   * Get current school information
   */
  async getCurrentSchool(): Promise<any> {
    return await apiService.get('/api/v1/schools/me');
  }

  /**
   * Get school statistics
   */
  async getSchoolStats(): Promise<any> {
    return await apiService.get('/api/v1/schools/me/stats');
  }

  /**
   * Validate logo file before upload
   */
  validateLogoFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload PNG, JPEG, GIF, or WebP images only.'
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Maximum size is 5MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Validate theme color
   */
  validateColor(color: string): boolean {
    // Check if it's a valid hex color
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  /**
   * Get default theme colors
   */
  getDefaultTheme(): SchoolThemeSettings {
    return {
      primary_color: '#0ea5e9',
      secondary_color: '#8b5cf6',
      dark_mode_enabled: false
    };
  }

  /**
   * Generate color palette from primary color
   */
  generateColorPalette(primaryColor: string): Record<string, string> {
    // This is a simplified version - in a real app you might use a color manipulation library
    const colors: Record<string, string> = {};

    // Extract RGB values
    const hex = primaryColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Generate lighter and darker variants using the same logic as ThemeContext
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
   * Apply theme to document
   */
  applyThemeToDocument(theme: SchoolThemeSettings): void {
    if (!theme) return;

    const root = document.documentElement;

    // Apply primary color
    if (theme.primary_color) {
      root.style.setProperty('--color-primary', theme.primary_color);

      // Generate and apply color palette
      const palette = this.generateColorPalette(theme.primary_color);
      Object.entries(palette).forEach(([shade, color]) => {
        root.style.setProperty(`--color-primary-${shade}`, color);
      });
    }

    // Apply secondary color
    if (theme.secondary_color) {
      root.style.setProperty('--color-secondary', theme.secondary_color);

      // Generate and apply color palette
      const palette = this.generateColorPalette(theme.secondary_color);
      Object.entries(palette).forEach(([shade, color]) => {
        root.style.setProperty(`--color-secondary-${shade}`, color);
      });
    }

    // Apply dark mode only if explicitly set in theme
    // Otherwise, respect the current theme context dark mode setting
    if (theme.dark_mode_enabled !== undefined) {
      root.classList.toggle('dark', theme.dark_mode_enabled);
    }

    // Apply custom CSS
    if (theme.custom_css) {
      let styleElement = document.getElementById('school-custom-css');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'school-custom-css';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = theme.custom_css;
    }
  }

  /**
   * Remove custom theme from document
   */
  removeThemeFromDocument(): void {
    const root = document.documentElement;
    
    // Remove custom CSS
    const styleElement = document.getElementById('school-custom-css');
    if (styleElement) {
      styleElement.remove();
    }

    // Reset to default colors (you might want to store defaults)
    const defaultTheme = this.getDefaultTheme();
    this.applyThemeToDocument(defaultTheme);
  }
}

export const schoolService = new SchoolService();
