import React, { useState, useEffect, useRef } from 'react';
import {
    PhotoIcon,
    ArrowUpTrayIcon,
    TrashIcon,
    CheckIcon,
    ArrowPathIcon,
    SwatchIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';
import { getSchoolLogoUrl } from '../../utils/imageUrl';
import { PREDEFINED_THEMES, PredefinedTheme } from '../../constants/themes';
import Card from '../ui/Card';

interface ThemeSettings {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    dark_mode_enabled?: boolean;
    theme_preset_id?: string;
}

const AppearanceSettings: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { setSchoolTheme } = useTheme();
    const { showSuccess, showError } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Logo state
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [deletingLogo, setDeletingLogo] = useState(false);

    // Theme state
    const [selectedPreset, setSelectedPreset] = useState<PredefinedTheme | null>(null);
    const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
    const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
    const [accentColor, setAccentColor] = useState('#f59e0b');
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [savingTheme, setSavingTheme] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load current settings
    useEffect(() => {
        if (user?.school) {
            setLogoUrl(user.school.logo_url || null);

            const themeSettings = user.school.settings?.theme_settings as ThemeSettings;
            if (themeSettings) {
                setPrimaryColor(themeSettings.primary_color || '#0ea5e9');
                setSecondaryColor(themeSettings.secondary_color || '#8b5cf6');
                setAccentColor(themeSettings.accent_color || '#f59e0b');
                setDarkModeEnabled(themeSettings.dark_mode_enabled || false);

                if (themeSettings.theme_preset_id) {
                    const preset = PREDEFINED_THEMES.find(t => t.id === themeSettings.theme_preset_id);
                    setSelectedPreset(preset || null);
                }
            }
        }
    }, [user]);

    // Track changes
    useEffect(() => {
        const originalSettings = user?.school?.settings?.theme_settings as ThemeSettings;
        const originalPrimary = originalSettings?.primary_color || '#0ea5e9';
        const originalSecondary = originalSettings?.secondary_color || '#8b5cf6';
        const originalAccent = originalSettings?.accent_color || '#f59e0b';
        const originalDarkMode = originalSettings?.dark_mode_enabled || false;
        const originalPreset = originalSettings?.theme_preset_id || null;

        const changed =
            primaryColor !== originalPrimary ||
            secondaryColor !== originalSecondary ||
            accentColor !== originalAccent ||
            darkModeEnabled !== originalDarkMode ||
            selectedPreset?.id !== originalPreset;

        setHasChanges(changed);
    }, [primaryColor, secondaryColor, accentColor, darkModeEnabled, selectedPreset, user]);

    // Logo upload handler
    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showError('Please upload a PNG, JPG, SVG, or WebP image');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('Logo must be less than 5MB');
            return;
        }

        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiService.post<{ logo_url: string }>('/api/v1/schools/me/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setLogoUrl(response.logo_url);
            showSuccess('Logo uploaded successfully');
            updateUser?.();
        } catch (error) {
            console.error('Failed to upload logo:', error);
            showError('Failed to upload logo');
        } finally {
            setUploadingLogo(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Logo delete handler
    const handleDeleteLogo = async () => {
        if (!logoUrl) return;

        setDeletingLogo(true);
        try {
            await apiService.delete('/api/v1/schools/me/logo');
            setLogoUrl(null);
            showSuccess('Logo removed successfully');
            updateUser?.();
        } catch (error) {
            console.error('Failed to delete logo:', error);
            showError('Failed to remove logo');
        } finally {
            setDeletingLogo(false);
        }
    };

    // Theme preset selection
    const handlePresetSelect = (preset: PredefinedTheme) => {
        setSelectedPreset(preset);
        setPrimaryColor(preset.primary_color);
        setSecondaryColor(preset.secondary_color);

        // Apply preview immediately
        setSchoolTheme({
            primary_color: preset.primary_color,
            secondary_color: preset.secondary_color,
        });
    };

    // Color change handlers with live preview
    const handlePrimaryColorChange = (color: string) => {
        setPrimaryColor(color);
        setSelectedPreset(null); // Clear preset when custom color is used
        setSchoolTheme({ primary_color: color, secondary_color: secondaryColor });
    };

    const handleSecondaryColorChange = (color: string) => {
        setSecondaryColor(color);
        setSelectedPreset(null);
        setSchoolTheme({ primary_color: primaryColor, secondary_color: color });
    };

    // Reset to defaults
    const handleResetToDefault = () => {
        const defaultPreset = PREDEFINED_THEMES[0];
        setSelectedPreset(defaultPreset);
        setPrimaryColor(defaultPreset.primary_color);
        setSecondaryColor(defaultPreset.secondary_color);
        setAccentColor('#f59e0b');
        setDarkModeEnabled(false);

        setSchoolTheme({
            primary_color: defaultPreset.primary_color,
            secondary_color: defaultPreset.secondary_color,
            dark_mode_enabled: false,
        });
    };

    // Save theme settings
    const handleSaveTheme = async () => {
        setSavingTheme(true);
        try {
            await apiService.put('/api/v1/schools/me/theme', {
                primary_color: primaryColor,
                secondary_color: secondaryColor,
                accent_color: accentColor,
                dark_mode_enabled: darkModeEnabled,
                theme_preset_id: selectedPreset?.id || null,
            });

            showSuccess('Appearance settings saved successfully');
            updateUser?.();
            setHasChanges(false);

            // Reload page to apply theme changes deeply
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Failed to save theme settings:', error);
            showError('Failed to save appearance settings');
        } finally {
            setSavingTheme(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Logo Section */}
            <Card variant="glass">
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white mr-3">
                            <PhotoIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                School Logo
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Upload your school logo for branding
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-6">
                        {/* Logo Preview */}
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                                {logoUrl ? (
                                    <img
                                        src={getSchoolLogoUrl(logoUrl)}
                                        alt="School Logo"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <PhotoIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">No logo</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Upload a high-quality logo for best results. Recommended size: 512x512px.
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Supported formats: PNG, JPG, SVG, WebP (max 5MB)
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingLogo}
                                    className="btn btn-primary flex items-center"
                                >
                                    {uploadingLogo ? (
                                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                                    )}
                                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                                </button>

                                {logoUrl && (
                                    <button
                                        onClick={handleDeleteLogo}
                                        disabled={deletingLogo}
                                        className="btn btn-outline-danger flex items-center"
                                    >
                                        {deletingLogo ? (
                                            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <TrashIcon className="h-4 w-4 mr-2" />
                                        )}
                                        {deletingLogo ? 'Removing...' : 'Remove'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Theme Presets Section */}
            <Card variant="glass">
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white mr-3">
                            <SwatchIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Theme Presets
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Choose a predefined color scheme for your school
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {PREDEFINED_THEMES.map((preset) => {
                            const isSelected = selectedPreset?.id === preset.id;

                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => handlePresetSelect(preset)}
                                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-left ${isSelected
                                        ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    {/* Color Preview */}
                                    <div className="h-12 rounded-lg mb-2 overflow-hidden flex">
                                        <div
                                            className="w-1/2 h-full"
                                            style={{ backgroundColor: preset.primary_color }}
                                        />
                                        <div
                                            className="w-1/2 h-full"
                                            style={{ backgroundColor: preset.secondary_color }}
                                        />
                                    </div>

                                    {/* Theme Name */}
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {preset.name}
                                    </p>

                                    {/* Selected Indicator */}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-primary-500 rounded-full p-1">
                                            <CheckIcon className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Custom Colors Section */}
            <Card variant="glass">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white mr-3">
                                <SwatchIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Custom Colors
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Fine-tune your school's color palette
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleResetToDefault}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center"
                        >
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            Reset to Default
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Primary Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Primary Color
                            </label>
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => handlePrimaryColorChange(e.target.value)}
                                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-600"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => handlePrimaryColorChange(e.target.value)}
                                    className="input flex-1 font-mono text-sm"
                                    placeholder="#0ea5e9"
                                />
                            </div>
                        </div>

                        {/* Secondary Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Secondary Color
                            </label>
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={secondaryColor}
                                        onChange={(e) => handleSecondaryColorChange(e.target.value)}
                                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-600"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={secondaryColor}
                                    onChange={(e) => handleSecondaryColorChange(e.target.value)}
                                    className="input flex-1 font-mono text-sm"
                                    placeholder="#8b5cf6"
                                />
                            </div>
                        </div>

                        {/* Accent Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Accent Color
                            </label>
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-600"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="input flex-1 font-mono text-sm"
                                    placeholder="#f59e0b"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Display Preferences */}
            <Card variant="glass">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Display Preferences
                    </h3>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 pr-4">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    Default Dark Mode
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Enable dark mode by default for all users in this school. Users can still override this in their personal settings.
                                </p>
                            </div>
                            <button
                                onClick={() => setDarkModeEnabled(!darkModeEnabled)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${darkModeEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                role="switch"
                                aria-checked={darkModeEnabled}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${darkModeEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Preview Section */}
            <Card variant="glass">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Preview
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        See how your colors look with different UI elements
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div
                            className="p-4 rounded-xl text-white text-center font-medium shadow-lg"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Primary
                        </div>
                        <div
                            className="p-4 rounded-xl text-white text-center font-medium shadow-lg"
                            style={{ backgroundColor: secondaryColor }}
                        >
                            Secondary
                        </div>
                        <div
                            className="p-4 rounded-xl text-white text-center font-medium shadow-lg"
                            style={{ backgroundColor: accentColor }}
                        >
                            Accent
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center font-medium shadow-lg">
                            Success
                        </div>
                    </div>

                    {/* Sample Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            className="px-4 py-2 rounded-lg text-white font-medium shadow-lg transition-transform hover:scale-105"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Primary Button
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg text-white font-medium shadow-lg transition-transform hover:scale-105"
                            style={{ backgroundColor: secondaryColor }}
                        >
                            Secondary Button
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg border-2 font-medium transition-transform hover:scale-105"
                            style={{ borderColor: primaryColor, color: primaryColor }}
                        >
                            Outline Button
                        </button>
                    </div>
                </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSaveTheme}
                    disabled={savingTheme || !hasChanges}
                    className={`btn btn-primary flex items-center ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {savingTheme ? (
                        <>
                            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Save Appearance Settings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AppearanceSettings;
