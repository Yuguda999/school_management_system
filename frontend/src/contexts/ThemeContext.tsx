import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  toggleDarkMode: () => void;
  updateThemeColors: (primaryColor: string, secondaryColor: string) => void;
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

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme.mode === 'dark');

    // Save theme to localStorage
    localStorage.setItem('theme', JSON.stringify(theme));

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
  }, [theme]);

  const toggleDarkMode = () => {
    setTheme(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light',
    }));
  };

  const updateThemeColors = (primaryColor: string, secondaryColor: string) => {
    setTheme(prev => ({
      ...prev,
      primaryColor,
      secondaryColor,
    }));
  };

  const value: ThemeContextType = {
    theme,
    toggleDarkMode,
    updateThemeColors,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
