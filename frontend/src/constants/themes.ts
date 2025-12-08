export interface PredefinedTheme {
  id: string;
  name: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  preview_colors: {
    background: string;
    text: string;
    accent: string;
  };
}

export const PREDEFINED_THEMES: PredefinedTheme[] = [
  {
    id: 'platform_default',
    name: 'Platform Default',
    description: 'Default Edix theme',
    primary_color: '#0ea5e9',
    secondary_color: '#8b5cf6',
    preview_colors: {
      background: '#f8fafc',
      text: '#1e293b',
      accent: '#0ea5e9'
    }
  },
  {
    id: 'ocean_blue',
    name: 'Ocean Blue',
    description: 'Professional blue theme with modern appeal',
    primary_color: '#0ea5e9',
    secondary_color: '#8b5cf6',
    preview_colors: {
      background: '#f8fafc',
      text: '#1e293b',
      accent: '#0ea5e9'
    }
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural green theme for eco-friendly schools',
    primary_color: '#059669',
    secondary_color: '#0d9488',
    preview_colors: {
      background: '#f0fdf4',
      text: '#1e293b',
      accent: '#059669'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Warm orange theme for creative institutions',
    primary_color: '#ea580c',
    secondary_color: '#dc2626',
    preview_colors: {
      background: '#fff7ed',
      text: '#1e293b',
      accent: '#ea580c'
    }
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    description: 'Elegant purple theme for prestigious schools',
    primary_color: '#7c3aed',
    secondary_color: '#c026d3',
    preview_colors: {
      background: '#faf5ff',
      text: '#1e293b',
      accent: '#7c3aed'
    }
  },
  {
    id: 'crimson',
    name: 'Crimson Red',
    description: 'Bold red theme for dynamic institutions',
    primary_color: '#dc2626',
    secondary_color: '#ea580c',
    preview_colors: {
      background: '#fef2f2',
      text: '#1e293b',
      accent: '#dc2626'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    description: 'Deep blue theme for academic excellence',
    primary_color: '#1e40af',
    secondary_color: '#3730a3',
    preview_colors: {
      background: '#f1f5f9',
      text: '#1e293b',
      accent: '#1e40af'
    }
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    description: 'Fresh mint green for modern schools',
    primary_color: '#10b981',
    secondary_color: '#06b6d4',
    preview_colors: {
      background: '#f0fdfa',
      text: '#1e293b',
      accent: '#10b981'
    }
  },
  {
    id: 'amber',
    name: 'Golden Amber',
    description: 'Warm amber theme for traditional schools',
    primary_color: '#f59e0b',
    secondary_color: '#d97706',
    preview_colors: {
      background: '#fffbeb',
      text: '#1e293b',
      accent: '#f59e0b'
    }
  }
];

export const getThemeById = (id: string): PredefinedTheme | undefined => {
  return PREDEFINED_THEMES.find(theme => theme.id === id);
};

export const getDefaultTheme = (): PredefinedTheme => {
  return PREDEFINED_THEMES[0]; // Ocean Blue as default
};
