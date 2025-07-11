import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ColorPicker from './ColorPicker';
import ThemeToggle from './ThemeToggle';

const ThemeCustomizer: React.FC = () => {
  const { theme, updateThemeColors } = useTheme();
  const { user } = useAuth();
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(theme.secondaryColor);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Only allow theme customization for school owners/admins
  if (!user || !['super_admin', 'admin'].includes(user.role)) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Theme Settings
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Dark Mode
          </span>
          <ThemeToggle />
        </div>
      </div>
    );
  }

  const handlePreview = () => {
    if (isPreviewMode) {
      // Reset to original colors
      updateThemeColors(theme.primaryColor, theme.secondaryColor);
    } else {
      // Apply preview colors
      updateThemeColors(primaryColor, secondaryColor);
    }
    setIsPreviewMode(!isPreviewMode);
  };

  const handleSave = () => {
    updateThemeColors(primaryColor, secondaryColor);
    setIsPreviewMode(false);
    // TODO: Save to backend API
  };

  const handleReset = () => {
    const defaultPrimary = '#0ea5e9';
    const defaultSecondary = '#8b5cf6';
    setPrimaryColor(defaultPrimary);
    setSecondaryColor(defaultSecondary);
    updateThemeColors(defaultPrimary, defaultSecondary);
    setIsPreviewMode(false);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Theme Customization
        </h3>
        <ThemeToggle />
      </div>

      <div className="space-y-6">
        <ColorPicker
          label="Primary Color"
          value={primaryColor}
          onChange={setPrimaryColor}
        />

        <ColorPicker
          label="Secondary Color"
          value={secondaryColor}
          onChange={setSecondaryColor}
        />

        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePreview}
            className="btn btn-outline"
          >
            {isPreviewMode ? 'Stop Preview' : 'Preview'}
          </button>
          
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={!isPreviewMode && primaryColor === theme.primaryColor && secondaryColor === theme.secondaryColor}
          >
            Save Changes
          </button>
          
          <button
            onClick={handleReset}
            className="btn btn-secondary"
          >
            Reset to Default
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Preview
          </h4>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div 
                className="w-16 h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Primary
              </div>
              <div 
                className="w-16 h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: secondaryColor }}
              >
                Secondary
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              These colors will be applied throughout the application interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
