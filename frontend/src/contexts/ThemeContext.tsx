import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme } from '../types';
import { apiService } from '../services/api';

interface ThemeContextType {
  theme: Theme;
  toggleDarkMode: () => Promise<void>;
  updateThemeColors: (primaryColor: string, secondaryColor: string) => Promise<void>;
  setSchoolTheme: (schoolTheme: { primary_color?: string; secondary_color?: string; dark_mode_enabled?: boolean }) => void;
  clearSchoolTheme: () => void;
  isSchoolThemeActive: boolean;
}

const defaultTheme: Theme = {
  mode: 'light',
  primaryColor: '#0ea5e9', // primary-500
  secondaryColor: '#8b5cf6', // secondary-500
};

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Helper function to generate color palette from base color
const generateColorPalette = (baseColor: string) => {
  const rgb = hexToRgb(baseColor);
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
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        // Validate that it's a proper theme object
        if (parsedTheme && typeof parsedTheme === 'object' && parsedTheme.mode) {
          return parsedTheme;
        }
      } catch (error) {
        console.warn('Invalid theme data in localStorage, using default theme');
        // Clear invalid data
        localStorage.removeItem('theme');
      }
    }

    // Check user's system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return { ...defaultTheme, mode: 'dark' };
    }

    return defaultTheme;
  });

  const [isSchoolThemeActive, setIsSchoolThemeActive] = useState(false);

  useEffect(() => {
    // Always apply dark mode toggle - this is the user's preference
    const isDark = theme.mode === 'dark';
    document.documentElement.classList.toggle('dark', isDark);

    // Only apply colors if no school theme is active
    if (!isSchoolThemeActive) {
      // Generate and apply primary color palette
      const primaryPalette = generateColorPalette(theme.primaryColor);
      Object.entries(primaryPalette).forEach(([shade, rgb]) => {
        document.documentElement.style.setProperty(`--color-primary-${shade}`, rgb);
      });

      // Generate and apply secondary color palette
      const secondaryPalette = generateColorPalette(theme.secondaryColor);
      Object.entries(secondaryPalette).forEach(([shade, rgb]) => {
        document.documentElement.style.setProperty(`--color-secondary-${shade}`, rgb);
      });

      // Keep legacy variables for backward compatibility
      document.documentElement.style.setProperty('--color-primary', theme.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', theme.secondaryColor);
    }

    // Always save theme to localStorage for user preferences
    localStorage.setItem('theme', JSON.stringify(theme));
  }, [theme, isSchoolThemeActive]);

  const toggleDarkMode = async () => {
    const newMode = theme.mode === 'light' ? 'dark' : 'light';
    setTheme(prev => ({
      ...prev,
      mode: newMode,
    }));

    // Mark that the user has manually set their preference
    localStorage.setItem('theme_preference_manually_set', 'true');
  };

  const updateThemeColors = async (primaryColor: string, secondaryColor: string) => {
    setTheme(prev => ({
      ...prev,
      primaryColor,
      secondaryColor,
    }));

    // Check if user is logged in by checking for token
    if (localStorage.getItem('access_token')) {
      try {
        await apiService.put('/api/v1/schools/me/settings', {
          primary_color: primaryColor,
          secondary_color: secondaryColor
        });
      } catch (error) {
        console.error('Failed to save theme colors:', error);
      }
    }
  };

  const setSchoolTheme = (schoolTheme: { primary_color?: string; secondary_color?: string; dark_mode_enabled?: boolean }) => {
    setIsSchoolThemeActive(true);

    // Check if user has manually set their theme preference
    const hasManualPreference = localStorage.getItem('theme_preference_manually_set') === 'true';

    // Update theme state to reflect school theme
    // Only update dark mode if explicitly provided in school theme AND user hasn't manually set a preference
    setTheme(prev => ({
      ...prev,
      primaryColor: schoolTheme.primary_color || prev.primaryColor,
      secondaryColor: schoolTheme.secondary_color || prev.secondaryColor,
      mode: hasManualPreference
        ? prev.mode
        : (schoolTheme.dark_mode_enabled !== undefined
          ? (schoolTheme.dark_mode_enabled ? 'dark' : 'light')
          : prev.mode),
    }));
  };

  const clearSchoolTheme = () => {
    setIsSchoolThemeActive(false);
    // Theme will be reapplied by the useEffect when isSchoolThemeActive changes
  };

  const value: ThemeContextType = {
    theme,
    toggleDarkMode,
    updateThemeColors,
    setSchoolTheme,
    clearSchoolTheme,
    isSchoolThemeActive,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
