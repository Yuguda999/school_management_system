import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { PREDEFINED_THEMES, PredefinedTheme } from '../../constants/themes';

interface ThemeSelectorProps {
  selectedTheme?: PredefinedTheme;
  onThemeSelect: (theme: PredefinedTheme) => void;
  disabled?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedTheme,
  onThemeSelect,
  disabled = false
}) => {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PREDEFINED_THEMES.map((theme) => {
          const isSelected = selectedTheme?.id === theme.id;
          const isHovered = hoveredTheme === theme.id;

          return (
            <div
              key={theme.id}
              className={`
                relative cursor-pointer rounded-lg border-2 transition-all duration-200
                ${isSelected
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !disabled && onThemeSelect(theme)}
              onMouseEnter={() => setHoveredTheme(theme.id)}
              onMouseLeave={() => setHoveredTheme(null)}
            >
              {/* Theme Preview */}
              <div className="p-3">
                <div 
                  className="h-16 rounded-md mb-3 relative overflow-hidden"
                  style={{ backgroundColor: theme.preview_colors.background }}
                >
                  {/* Header bar */}
                  <div 
                    className="h-4 w-full"
                    style={{ backgroundColor: theme.primary_color }}
                  />
                  
                  {/* Content area */}
                  <div className="p-2 space-y-1">
                    <div 
                      className="h-1 w-3/4 rounded"
                      style={{ backgroundColor: theme.preview_colors.text }}
                    />
                    <div 
                      className="h-1 w-1/2 rounded"
                      style={{ backgroundColor: theme.secondary_color }}
                    />
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm">
                      <CheckIcon className="h-3 w-3 text-blue-500" />
                    </div>
                  )}
                </div>

                {/* Theme info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {theme.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {theme.description}
                  </p>
                </div>

                {/* Color swatches */}
                <div className="flex space-x-2 mt-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: theme.primary_color }}
                    title="Primary Color"
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: theme.secondary_color }}
                    title="Secondary Color"
                  />
                </div>
              </div>

              {/* Hover effect */}
              {isHovered && !disabled && (
                <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 rounded-lg opacity-50" />
              )}
            </div>
          );
        })}
      </div>

      {/* Custom theme option */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Or customize your own colors below:
        </p>
      </div>
    </div>
  );
};

export default ThemeSelector;
