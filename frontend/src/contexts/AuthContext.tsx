import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse, LoginCredentials, SchoolOption } from '../types';
import { authService } from '../services/authService';
import { schoolSelectionService } from '../services/schoolSelectionService';
import { schoolService } from '../services/schoolService';
import { useTheme } from './ThemeContext';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  schoolLogin: (schoolCode: string, credentials: LoginCredentials) => Promise<void>;
  studentLogin: (data: { admission_number: string; first_name: string }, schoolCode?: string) => Promise<void>;
  logout: () => void;
  clearAuthState: () => void;
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
  const [loginSource, setLoginSource] = useState<'platform' | 'school' | null>(null);
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
  const { setSchoolTheme, clearSchoolTheme } = useTheme();

  // Load and apply school theme settings
  const loadSchoolTheme = async () => {
    try {
      // Only try to load school theme if user has a school_id
      if (!user?.school_id) {
        console.log('No school_id found, skipping theme load');
        return;
      }

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

        console.log('✅ School theme applied:', themeSettings);
      } else {
        console.log('ℹ️ No school theme settings found, using default theme');
        clearSchoolTheme();
      }
    } catch (error: any) {
      console.error('❌ Failed to load school theme:', error);
      // Don't clear theme on error, just log it
      // This prevents theme flickering during network issues
      if (error.response?.status === 404) {
        console.log('ℹ️ School not found (404), using default theme');
        clearSchoolTheme();
      }
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

  // Set up authentication error callback for API service
  useEffect(() => {
    const handleAuthError = () => {
      console.log('🔐 Authentication error detected, logging out user');
      // Only logout if user is actually logged in and not a student
      // Students might have different token refresh behavior
      if (user && !loading && user.role !== 'student') {
        logout();
      } else if (user && user.role === 'student') {
        console.log('🎓 Student authentication error - not logging out automatically');
      }
    };

    // Set the callback in the API service
    apiService.setAuthErrorCallback(handleAuthError);

    // Cleanup function to clear the callback
    return () => {
      apiService.clearAuthErrorCallback();
    };
  }, [user, loading]);

  // Load school theme when user changes
  useEffect(() => {
    console.log('🔄 useEffect triggered - user school changed:', {
      schoolId: user?.school_id,
      schoolName: user?.school?.name,
      hasSchool: !!user?.school,
      hasSettings: !!user?.school?.settings
    });

    if (user?.school_id && user?.school?.id) {
      console.log('🎨 Loading school theme from useEffect...');
      loadSchoolTheme();
    } else if (user?.school_id && !user?.school) {
      console.log('⚠️ User has school_id but no school object, skipping theme load');
      // Don't clear theme if user has school_id but school object is not loaded yet
    } else {
      console.log('❌ No school data found, clearing theme...');
      clearSchoolTheme();
    }
  }, [user?.school_id, user?.school?.id, user?.school?.settings]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response: AuthResponse = await authService.login(credentials);

      // Always store the access token for API requests
      localStorage.setItem('access_token', response.access_token);

      // Track login source
      setLoginSource('platform');
      setSchoolCode(null);

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
      
      // Fetch complete user data with school information
      try {
        const completeUserData = await authService.getCurrentUser();
        console.log('🏫 AuthContext: Complete user data with school:', completeUserData);
        setUser(completeUserData);
      } catch (error) {
        console.error('🏫 AuthContext: Failed to fetch complete user data:', error);
        // Continue with basic user data if complete data fetch fails
      }
    } catch (error: any) {
      // Clear any authentication state on 403 errors
      if (error.response?.status === 403) {
        authService.logout();
        setUser(null);
        setRequiresSchoolSelection(false);
        setAvailableSchools([]);
      }
      throw error;
    }
  };

  const schoolLogin = async (schoolCode: string, credentials: LoginCredentials) => {
    try {
      console.log('🏫 AuthContext: Starting school login...', { schoolCode });
      const response = await schoolService.schoolLogin(schoolCode, credentials);
      console.log('🏫 AuthContext: School login response:', {
        user_id: response.user_id,
        email: response.email,
        role: response.role,
        school_id: response.school_id,
        full_name: response.full_name
      });

      // Always store the access token for API requests
      localStorage.setItem('access_token', response.access_token);

      // Track login source
      setLoginSource('school');
      setSchoolCode(schoolCode);

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

      console.log('🏫 AuthContext: Setting user state:', {
        id: user.id,
        role: user.role,
        school_id: user.school_id
      });

      setUser(user);
      setRequiresSchoolSelection(false);
      setAvailableSchools([]);
      
      // Fetch complete user data with school information
      try {
        const completeUserData = await authService.getCurrentUser();
        console.log('🏫 AuthContext: Complete user data with school:', completeUserData);
        setUser(completeUserData);
      } catch (error) {
        console.error('🏫 AuthContext: Failed to fetch complete user data:', error);
        // Continue with basic user data if complete data fetch fails
      }
      
      console.log('🏫 AuthContext: School login completed successfully');
    } catch (error: any) {
      console.error('🏫 AuthContext: School login failed:', error);
      // Clear any stale authentication state when school login fails
      // Especially important for 403 errors (access denied)
      authService.logout();
      setUser(null);
      setRequiresSchoolSelection(false);
      setAvailableSchools([]);
      throw error;
    }
  };

  const studentLogin = async (data: { admission_number: string; first_name: string }, schoolCode?: string) => {
    try {
      console.log('🎓 AuthContext: Starting student login...', { schoolCode });
      const response: AuthResponse = await authService.studentLogin(data, schoolCode);
      console.log('🎓 AuthContext: Student login response:', {
        user_id: response.user_id,
        school_id: response.school_id,
        role: response.role,
        full_name: response.full_name
      });

      // Always store the access token for API requests
      localStorage.setItem('access_token', response.access_token);

      // Track login source
      if (schoolCode) {
        setLoginSource('school');
        setSchoolCode(schoolCode);
      } else {
        setLoginSource('platform');
        setSchoolCode(null);
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

      console.log('🎓 AuthContext: Setting user state:', {
        id: user.id,
        school_id: user.school_id,
        role: user.role
      });

      setUser(user);
      setRequiresSchoolSelection(false);
      setAvailableSchools([]);
      
      // Fetch complete user data with school information for students
      // This is important to get school theme, logo, and other school data
      try {
        console.log('🎓 AuthContext: Fetching complete user data for student...');
        const completeUserData = await authService.getCurrentUser();
        console.log('🎓 AuthContext: Complete user data with school:', completeUserData);
        setUser(completeUserData);
      } catch (error) {
        console.error('🎓 AuthContext: Failed to fetch complete user data for student:', error);
        // Don't clear auth state for students if this fails
        // Continue with basic user data from login response
        console.log('🎓 AuthContext: Continuing with basic user data from login response');
      }
      
      console.log('🎓 AuthContext: Student login completed successfully');
    } catch (error: any) {
      console.error('🎓 AuthContext: Student login failed:', error);
      // Clear any authentication state on 403 errors
      if (error?.response?.status === 403) {
        authService.logout();
        setUser(null);
        setRequiresSchoolSelection(false);
        setAvailableSchools([]);
      }
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

      // Update login source tracking
      setLoginSource('school');
      setSchoolCode(userData.school?.code || null);

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
    // Store login source before clearing state
    const currentLoginSource = loginSource;
    const currentSchoolCode = schoolCode;
    
    authService.logout();
    setUser(null);
    setRequiresSchoolSelection(false);
    setAvailableSchools([]);
    setLoginSource(null);
    setSchoolCode(null);
    
    // Redirect to appropriate login page
    if (currentLoginSource === 'school' && currentSchoolCode) {
      window.location.href = `/${currentSchoolCode}/login`;
    } else {
      window.location.href = '/login';
    }
  };

  const clearAuthState = () => {
    authService.logout();
    setUser(null);
    setRequiresSchoolSelection(false);
    setAvailableSchools([]);
    setLoginSource(null);
    setSchoolCode(null);
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
    schoolLogin,
    studentLogin,
    logout,
    clearAuthState,
    updateUser,
    isAuthenticated: !!user,
    requiresSchoolSelection,
    availableSchools,
    selectSchool,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
