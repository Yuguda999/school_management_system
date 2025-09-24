import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  XMarkIcon,
  PhotoIcon,
  TrashIcon,
  SwatchIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CloudArrowUpIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { schoolService, SchoolUpdateData, SchoolThemeSettings } from '../../services/schoolService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';
import ModernButton from '../ui/ModernButton';
import ThemeAwareLogo from '../ui/ThemeAwareLogo';
import ThemeSelector from '../ui/ThemeSelector';
import { PREDEFINED_THEMES, PredefinedTheme, getThemeById } from '../../constants/themes';

interface EditSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SchoolFormData extends SchoolUpdateData {
  // Additional form-specific fields if needed
}

const EditSchoolModal: React.FC<EditSchoolModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { theme, updateThemeColors, setSchoolTheme } = useTheme();
  const { showSuccess, showError } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const themeApplyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'theme' | 'advanced'>('basic');
  
  const [themeSettings, setThemeSettings] = useState<SchoolThemeSettings>({
    primary_color: theme.primaryColor,
    secondary_color: theme.secondaryColor,
    dark_mode_enabled: theme.mode === 'dark'
  });
  const [selectedPredefinedTheme, setSelectedPredefinedTheme] = useState<PredefinedTheme | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<SchoolFormData>();

  const loadSchoolData = async () => {
    if (isOpen) {
      try {
        setInitialLoading(true);
        // Get fresh school data from API
        const schoolData = await schoolService.getCurrentSchool();

        // Check if schoolData is valid
        if (!schoolData) {
          throw new Error('No school data received');
        }

        // Populate form with current school data
        setValue('name', schoolData.name || '');
        setValue('email', schoolData.email || '');
        setValue('phone', schoolData.phone || '');
        setValue('website', schoolData.website || '');
        setValue('address_line1', schoolData.address_line1 || '');
        setValue('address_line2', schoolData.address_line2 || '');
        setValue('city', schoolData.city || '');
        setValue('state', schoolData.state || '');
        setValue('postal_code', schoolData.postal_code || '');
        setValue('country', schoolData.country || '');
        setValue('description', schoolData.description || '');
        setValue('motto', schoolData.motto || '');
        setValue('established_year', schoolData.established_year || '');
        setValue('current_session', schoolData.current_session || '');
        setValue('current_term', schoolData.current_term || '');

        // Set logo preview if exists
        if (schoolData.logo_url) {
          setLogoPreview(`http://localhost:8000${schoolData.logo_url}`);
        } else {
          setLogoPreview(null);
        }

        // Load theme settings - use current theme as fallback
        const schoolTheme = schoolData.settings?.theme_settings;
        if (schoolTheme) {
          const newThemeSettings = {
            primary_color: schoolTheme.primary_color || theme.primaryColor,
            secondary_color: schoolTheme.secondary_color || theme.secondaryColor,
            dark_mode_enabled: schoolTheme.dark_mode_enabled ?? (theme.mode === 'dark')
          };
          setThemeSettings(newThemeSettings);

          // Check if this matches a predefined theme
          const matchingTheme = PREDEFINED_THEMES.find(t =>
            t.primary_color === newThemeSettings.primary_color &&
            t.secondary_color === newThemeSettings.secondary_color
          );
          setSelectedPredefinedTheme(matchingTheme || null);
        } else {
          // Set default theme if no theme settings exist - use current theme values
          const defaultSettings = {
            primary_color: theme.primaryColor,
            secondary_color: theme.secondaryColor,
            dark_mode_enabled: theme.mode === 'dark'
          };
          setThemeSettings(defaultSettings);

          // Check if this matches a predefined theme
          const matchingTheme = PREDEFINED_THEMES.find(t =>
            t.primary_color === defaultSettings.primary_color &&
            t.secondary_color === defaultSettings.secondary_color
          );
          setSelectedPredefinedTheme(matchingTheme || null);
        }
      } catch (error) {
        console.error('Failed to load school data:', error);
        showError('Failed to load school information');
      } finally {
        setInitialLoading(false);
      }
    }
  };

  // Load school data only when modal opens (not on every dependency change)
  useEffect(() => {
    if (isOpen) {
      loadSchoolData();
    }
  }, [isOpen]); // Only depend on isOpen to avoid infinite loops

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setLogoFile(null);
      setLogoPreview(null);
      setActiveTab('basic');
      setInitialLoading(false);

      // Clear any pending theme preview timeouts
      if (themeApplyTimeoutRef.current) {
        clearTimeout(themeApplyTimeoutRef.current);
        themeApplyTimeoutRef.current = null;
      }

      // Reset theme settings to current theme when modal closes
      setThemeSettings({
        primary_color: theme.primaryColor,
        secondary_color: theme.secondaryColor,
        dark_mode_enabled: theme.mode === 'dark'
      });
      setSelectedPredefinedTheme(null);
    }
  }, [isOpen, reset, theme]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (themeApplyTimeoutRef.current) {
        clearTimeout(themeApplyTimeoutRef.current);
      }
    };
  }, []);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = schoolService.validateLogoFile(file);
    if (!validation.valid) {
      showError(validation.error!);
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    try {
      setUploadingLogo(true);
      const response = await schoolService.uploadLogo(logoFile);
      showSuccess('Logo uploaded successfully!');
      setLogoFile(null);
      setLogoPreview(`http://localhost:8000${response.logo_url}`);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      showError(error.response?.data?.detail || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    try {
      setUploadingLogo(true);
      await schoolService.deleteLogo();
      showSuccess('Logo deleted successfully!');
      setLogoPreview(null);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to delete logo:', error);
      showError(error.response?.data?.detail || 'Failed to delete logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Debounced theme application for preview
  const applyThemePreview = (newThemeSettings: SchoolThemeSettings) => {
    if (themeApplyTimeoutRef.current) {
      clearTimeout(themeApplyTimeoutRef.current);
    }

    themeApplyTimeoutRef.current = setTimeout(() => {
      // For preview, don't change dark mode - only apply colors
      const previewSettings = {
        ...newThemeSettings,
        dark_mode_enabled: undefined // Don't override current dark mode during preview
      };
      schoolService.applyThemeToDocument(previewSettings);
    }, 150); // 150ms debounce
  };

  const handlePredefinedThemeSelect = (theme: PredefinedTheme) => {
    setSelectedPredefinedTheme(theme);
    const newThemeSettings = {
      ...themeSettings,
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color
    };
    setThemeSettings(newThemeSettings);

    // Apply theme immediately for preview - only use school service
    applyThemePreview(newThemeSettings);
  };

  const handleThemeUpdate = async () => {
    try {
      setLoading(true);

      // Validate colors before sending
      const validatedThemeSettings = {
        ...themeSettings,
        primary_color: themeSettings.primary_color || '#0ea5e9',
        secondary_color: themeSettings.secondary_color || '#8b5cf6'
      };

      console.log('Updating theme with settings:', validatedThemeSettings);

      await schoolService.updateTheme(validatedThemeSettings);

      // Apply theme to document and update global theme context
      schoolService.applyThemeToDocument(validatedThemeSettings);

      // Update the theme context to reflect the school theme
      setSchoolTheme(validatedThemeSettings);

      showSuccess('Theme updated successfully!');

      // Add a small delay to ensure backend has processed the update
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error: any) {
      console.error('Failed to update theme:', error);
      showError(error.response?.data?.detail || 'Failed to update theme');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SchoolFormData) => {
    try {
      setLoading(true);
      await schoolService.updateSchool(data);
      showSuccess('School information updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update school:', error);
      showError(error.response?.data?.detail || 'Failed to update school');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Edit School Information
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'basic', name: 'Basic Info', icon: BuildingOfficeIcon },
                  { id: 'theme', name: 'Theme & Branding', icon: SwatchIcon },
                  { id: 'advanced', name: 'Advanced', icon: GlobeAltIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {initialLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading school information...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <>
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      School Name *
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'School name is required' })}
                      className="input"
                      placeholder="Enter school name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register('email', { required: 'Email is required' })}
                      className="input"
                      placeholder="school@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="input"
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      {...register('website')}
                      className="input"
                      placeholder="https://www.school.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      {...register('address_line1', { required: 'Address is required' })}
                      className="input"
                      placeholder="Street address"
                    />
                    {errors.address_line1 && (
                      <p className="mt-1 text-sm text-red-600">{errors.address_line1.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      {...register('address_line2')}
                      className="input"
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      {...register('city', { required: 'City is required' })}
                      className="input"
                      placeholder="City"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      {...register('state', { required: 'State is required' })}
                      className="input"
                      placeholder="State"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      {...register('postal_code', { required: 'Postal code is required' })}
                      className="input"
                      placeholder="Postal code"
                    />
                    {errors.postal_code && (
                      <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      {...register('country', { required: 'Country is required' })}
                      className="input"
                      placeholder="Country"
                    />
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      School Motto
                    </label>
                    <input
                      type="text"
                      {...register('motto')}
                      className="input"
                      placeholder="School motto or slogan"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="input"
                      placeholder="Brief description of the school"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Established Year
                    </label>
                    <input
                      type="text"
                      {...register('established_year')}
                      className="input"
                      placeholder="e.g., 1995"
                    />
                  </div>
                </div>
              )}

              {/* Theme & Branding Tab */}
              {activeTab === 'theme' && (
                <div className="space-y-6">
                  {/* Logo Upload Section */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                        <PhotoIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          School Logo & Branding
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Upload your school logo to personalize the interface
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 border-2 border-dashed border-primary-300 dark:border-primary-600 rounded-2xl flex items-center justify-center bg-white dark:bg-gray-800 shadow-inner">
                          {logoPreview ? (
                            <ThemeAwareLogo
                              logoUrl={logoPreview}
                              schoolName="School"
                              size="xl"
                              className="w-full h-full"
                            />
                          ) : (
                            <div className="text-center">
                              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">No logo</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap gap-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                          <ModernButton
                            variant="outline"
                            size="md"
                            icon={<PhotoIcon className="h-5 w-5" />}
                            onClick={() => {
                              fileInputRef.current?.click();
                            }}
                          >
                            Choose Logo
                          </ModernButton>

                          {logoFile && (
                            <ModernButton
                              variant="primary"
                              size="md"
                              loading={uploadingLogo}
                              onClick={handleLogoUpload}
                              icon={<CloudArrowUpIcon className="h-5 w-5" />}
                            >
                              Save Logo
                            </ModernButton>
                          )}

                          {logoPreview && !logoFile && (
                            <ModernButton
                              variant="danger"
                              size="md"
                              loading={uploadingLogo}
                              onClick={handleLogoDelete}
                              icon={<TrashIcon className="h-5 w-5" />}
                            >
                              Remove Logo
                            </ModernButton>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          PNG, JPEG, GIF or WebP. Max 5MB. Recommended: 500x500px
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Predefined Themes Section */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Choose a Theme
                    </h4>
                    <ThemeSelector
                      selectedTheme={selectedPredefinedTheme}
                      onThemeSelect={handlePredefinedThemeSelect}
                      disabled={loading}
                    />
                  </div>

                  {/* Custom Theme Colors Section */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Custom Colors
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Primary Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={themeSettings.primary_color || '#0ea5e9'}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              const newThemeSettings = {
                                ...themeSettings,
                                primary_color: newColor
                              };
                              setThemeSettings(newThemeSettings);
                              setSelectedPredefinedTheme(null); // Clear predefined selection
                              applyThemePreview(newThemeSettings);
                            }}
                            className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={themeSettings.primary_color || '#0ea5e9'}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              const newThemeSettings = {
                                ...themeSettings,
                                primary_color: newColor
                              };
                              setThemeSettings(newThemeSettings);
                              setSelectedPredefinedTheme(null); // Clear predefined selection

                              // Apply theme immediately if valid hex color
                              if (newColor.match(/^#[0-9A-F]{6}$/i)) {
                                applyThemePreview(newThemeSettings);
                              }
                            }}
                            className="input flex-1"
                            placeholder="#0ea5e9"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Secondary Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={themeSettings.secondary_color || '#8b5cf6'}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              const newThemeSettings = {
                                ...themeSettings,
                                secondary_color: newColor
                              };
                              setThemeSettings(newThemeSettings);
                              setSelectedPredefinedTheme(null); // Clear predefined selection
                              applyThemePreview(newThemeSettings);
                            }}
                            className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={themeSettings.secondary_color || '#8b5cf6'}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              const newThemeSettings = {
                                ...themeSettings,
                                secondary_color: newColor
                              };
                              setThemeSettings(newThemeSettings);
                              setSelectedPredefinedTheme(null); // Clear predefined selection

                              // Apply theme immediately if valid hex color
                              if (newColor.match(/^#[0-9A-F]{6}$/i)) {
                                applyThemePreview(newThemeSettings);
                              }
                            }}
                            className="input flex-1"
                            placeholder="#8b5cf6"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <ModernButton
                        variant="primary"
                        size="lg"
                        loading={loading}
                        onClick={handleThemeUpdate}
                        icon={<PaintBrushIcon className="h-5 w-5" />}
                        fullWidth
                      >
                        Apply Theme Changes
                      </ModernButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Academic Session *
                    </label>
                    <input
                      type="text"
                      {...register('current_session', { required: 'Academic session is required' })}
                      className="input"
                      placeholder="e.g., 2024/2025"
                    />
                    {errors.current_session && (
                      <p className="mt-1 text-sm text-red-600">{errors.current_session.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Term *
                    </label>
                    <select
                      {...register('current_term', { required: 'Current term is required' })}
                      className="input"
                    >
                      <option value="">Select term</option>
                      <option value="First Term">First Term</option>
                      <option value="Second Term">Second Term</option>
                      <option value="Third Term">Third Term</option>
                    </select>
                    {errors.current_term && (
                      <p className="mt-1 text-sm text-red-600">{errors.current_term.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              {(activeTab === 'basic' || activeTab === 'advanced') && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <ModernButton
                    variant="ghost"
                    size="md"
                    onClick={onClose}
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    size="md"
                    type="submit"
                    loading={loading}
                  >
                    Save Changes
                  </ModernButton>
                </div>
              )}
                </>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSchoolModal;
