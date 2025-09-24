import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse, LoginCredentials, SchoolOption } from '../types';
import { authService } from '../services/authService';
import { schoolSelectionService } from '../services/schoolSelectionService';
import { schoolService } from '../services/schoolService';
import { useTheme } from './ThemeContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: () => Promise<void>;
  isAuthenticated: boolean;
  requiresSchoolSelection: boolean;
  availableSchools: SchoolOption[];
  selectSchool: (schoolId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresSchoolSelection, setRequiresSchoolSelection] = useState(false);
  const [availableSchools, setAvailableSchools] = useState<SchoolOption[]>([]);
  const { updateThemeColors, setSchoolTheme, clearSchoolTheme } = useTheme();

  // Load and apply school theme settings
  const loadSchoolTheme = async () => {
    try {
      // Get fresh school data to ensure we have the latest theme settings
      const schoolData = await schoolService.getCurrentSchool();

      if (schoolData?.settings?.theme_settings) {
        const themeSettings = schoolData.settings.theme_settings;

        // Apply theme immediately to document
        schoolService.applyThemeToDocument(themeSettings);

        // Update global theme context with school theme
        // Don't override user's dark mode preference unless school theme explicitly sets it
        const schoolThemeForContext = {
          ...themeSettings,
          // Only include dark_mode_enabled if it's explicitly set in school settings
          ...(themeSettings.dark_mode_enabled !== undefined ? { dark_mode_enabled: themeSettings.dark_mode_enabled } : {})
        };
        setSchoolTheme(schoolThemeForContext);

        console.log('School theme applied:', themeSettings);
      } else {
        console.log('No school theme settings found, clearing school theme');
        clearSchoolTheme();
      }
    } catch (error) {
      console.error('Failed to load school theme:', error);
      clearSchoolTheme();
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('access_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Load school theme when user changes
  useEffect(() => {
    console.log('🔄 useEffect triggered - user school changed:', {
      schoolId: user?.school?.id,
      schoolName: user?.school?.name,
      hasSettings: !!user?.school?.settings
    });

    if (user?.school) {
      console.log('🎨 Loading school theme from useEffect...');
      loadSchoolTheme();
    } else {
      console.log('❌ No school data found, clearing theme...');
      clearSchoolTheme();
    }
  }, [user?.school?.id, user?.school?.settings]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response: AuthResponse = await authService.login(credentials);

      // Always store the access token for API requests
      localStorage.setItem('access_token', response.access_token);

      // Handle school selection requirement
      if (response.requires_school_selection && response.available_schools) {
        setRequiresSchoolSelection(true);
        setAvailableSchools(response.available_schools);
        // Don't set user yet, wait for school selection
        return;
      }

      // Convert response to User object
      const user: User = {
        id: response.user_id,
        email: response.email,
        first_name: response.full_name?.split(' ')[0] || '',
        last_name: response.full_name?.split(' ').slice(1).join(' ') || '',
        full_name: response.full_name,
        role: response.role,
        is_active: true,
        is_verified: true,
        profile_completed: response.profile_completed,
        school_id: response.school_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(user);
      setRequiresSchoolSelection(false);
      setAvailableSchools([]);
    } catch (error) {
      throw error;
    }
  };

  const selectSchool = async (schoolId: string) => {
    try {
      console.log('🔄 Starting school switch to:', schoolId);

      const response = await schoolSelectionService.selectSchool(schoolId);
      localStorage.setItem('access_token', response.access_token);

      // Get current user data from token (this will include the new school context)
      const userData = await authService.getCurrentUser();

      console.log('✅ School switched - New user data:', userData);
      console.log('🏫 School information:', userData.school);
      console.log('🎨 School settings:', userData.school?.settings);

      // Force a complete state update to trigger all re-renders
      setUser(null); // Clear first to force re-render

      // Use setTimeout to ensure the null state is processed first
      setTimeout(() => {
        console.log('🔄 Setting new user state...');
        setUser(userData);
        setRequiresSchoolSelection(false);
        setAvailableSchools([]);

        // Load school theme after state is updated
        setTimeout(() => {
          console.log('⏰ Loading school theme after state update...');
          loadSchoolTheme();
        }, 50);
      }, 10);

    } catch (error) {
      console.error('❌ Error in selectSchool:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setRequiresSchoolSelection(false);
    setAvailableSchools([]);
  };

  const updateUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);

      // Load school theme after updating user data
      if (userData?.school_id) {
        setTimeout(() => loadSchoolTheme(), 100);
      }
    } catch (error) {
      console.error('Failed to update user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    requiresSchoolSelection,
    availableSchools,
    selectSchool,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
