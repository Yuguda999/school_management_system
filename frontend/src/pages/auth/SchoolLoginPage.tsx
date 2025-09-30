import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types';
import { schoolService, SchoolPublicInfo } from '../../services/schoolService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SchoolSelectionModal from '../../components/auth/SchoolSelectionModal';

const SchoolLoginPage: React.FC = () => {
  const { schoolCode } = useParams<{ schoolCode: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<SchoolPublicInfo | null>(null);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [schoolNotFound, setSchoolNotFound] = useState(false);

  const { schoolLogin, studentLogin, user, isAuthenticated, requiresSchoolSelection, availableSchools, selectSchool, clearAuthState } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  // Student login form state
  const [isStudentLogin, setIsStudentLogin] = useState(false);
  const {
    register: registerStudent,
    handleSubmit: handleSubmitStudent,
    formState: { errors: studentErrors },
    reset: resetStudentForm
  } = useForm<{ admission_number: string; first_name: string }>();

  // Load school information
  useEffect(() => {
    const loadSchoolInfo = async () => {
      if (!schoolCode) {
        setSchoolNotFound(true);
        setLoadingSchool(false);
        return;
      }

      try {
        setLoadingSchool(true);
        const school = await schoolService.getSchoolPublicInfo(schoolCode);
        console.log('School data received:', school);
        setSchoolInfo(school);
      } catch (error: any) {
        console.error('Error loading school info:', error);
        if (error.response?.status === 404) {
          setSchoolNotFound(true);
        } else {
          setError('Failed to load school information');
        }
      } finally {
        setLoadingSchool(false);
      }
    };

    loadSchoolInfo();
  }, [schoolCode]);

  // Apply theme colors to document root for global CSS variable usage
  useEffect(() => {
    if (schoolInfo) {
      const root = document.documentElement;
      if (schoolInfo.primary_color) {
        root.style.setProperty('--primary-color', schoolInfo.primary_color);
      }
      if (schoolInfo.secondary_color) {
        root.style.setProperty('--secondary-color', schoolInfo.secondary_color);
      }
      if (schoolInfo.accent_color) {
        root.style.setProperty('--accent-color', schoolInfo.accent_color);
      }
    }
    
    // Cleanup function to reset theme when component unmounts
    return () => {
      const root = document.documentElement;
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--secondary-color');
      root.style.removeProperty('--accent-color');
    };
  }, [schoolInfo]);

  // Note: School validation is now handled entirely by the backend
  // If a user doesn't belong to a school, the backend will return a 403 error
  // and prevent authentication from completing, avoiding partial auth states


  // Handle navigation after authentication
  useEffect(() => {
    // Only redirect if user is authenticated AND has a school_id that matches the current school
    if (isAuthenticated && !requiresSchoolSelection && user?.school_id && schoolInfo?.id === user.school_id) {
      // Students go to student dashboard, others go to regular dashboard
      // Use school code in the URL
      const from = location.state?.from?.pathname || (user.role === 'student' ? `/${schoolCode}/student/dashboard` : `/${schoolCode}/dashboard`);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, requiresSchoolSelection, user?.school_id, user?.role, schoolInfo?.id, schoolCode, navigate, location.state?.from?.pathname]);

  if (loadingSchool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (schoolNotFound || !schoolCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              School Not Found
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              The school code "{schoolCode}" does not exist or is inactive.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => navigate('/home')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (isAuthenticated && !requiresSchoolSelection && user?.school_id && schoolInfo?.id === user.school_id) {
    const from = location.state?.from?.pathname || (user.role === 'student' ? `/${schoolCode}/student/dashboard` : `/${schoolCode}/dashboard`);
    return <Navigate to={from} replace />;
  }

  // Show school selection modal if required
  if (requiresSchoolSelection && availableSchools.length > 0) {
    return (
      <SchoolSelectionModal
        schools={availableSchools}
        onSelectSchool={selectSchool}
      />
    );
  }

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError('');

    try {
      // Use the school login method from AuthContext
      await schoolLogin(schoolCode!, data);

      // Navigation will be handled by useEffect
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        setError('School not found or inactive. Please check the school code.');
      } else if (error.response?.status === 401) {
        const errorDetail = error.response?.data?.detail;
        if (errorDetail === 'Incorrect email or password') {
          setError('Incorrect email or password. Please verify your credentials.');
        } else if (errorDetail === 'User account is inactive') {
          setError('Your account is inactive. Please contact your school administrator.');
        } else {
          setError('Authentication failed. Please check your credentials.');
        }
      } else if (error.response?.status === 403) {
        // Clear any partial authentication state
        clearAuthState();
        const errorDetail = error.response?.data?.detail || 'You do not have access to this school. Please contact your school administrator.';
        setError(errorDetail);
      } else if (error.response?.status === 500) {
        setError('Server error occurred. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message === 'No refresh token') {
        // This happens when API interceptor tries to refresh token for auth endpoints
        setError('Authentication failed. Please check your credentials.');
      } else {
        setError(error.response?.data?.detail || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitStudent = async (data: { admission_number: string; first_name: string }) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🎓 Starting student login for school:', schoolInfo?.id);
      await studentLogin(data, schoolCode);
      console.log('✅ Student login successful');
      // Navigation will be handled by useEffect when user state updates
    } catch (err: any) {
      console.error('❌ Student login failed:', err);
      
      // Clear any partial authentication state on errors
      if (err.response?.status === 403) {
        clearAuthState();
      }
      
      const errorMessage = err.response?.data?.detail;
      console.log('🎓 Student login error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        errorMessage
      });
      
      if (errorMessage) {
        setError(errorMessage);
      } else if (err.response?.status === 401) {
        setError('Invalid admission number or first name.');
      } else if (err.response?.status === 403) {
        setError('You do not have access to this school. Please contact your school administrator.');
      } else if (err.response?.status === 404) {
        setError('School not found or inactive. Please check the school code.');
      } else if (err.response?.status === 500) {
        setError('Server error occurred. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError(`An unexpected error occurred: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate CSS variables for school theming and apply theme colors
  const schoolTheme = schoolInfo ? {
    '--school-primary': schoolInfo.primary_color || '#3B82F6',
    '--school-secondary': schoolInfo.secondary_color || '#1E40AF',
    '--school-accent': schoolInfo.accent_color || '#60A5FA',
  } as React.CSSProperties : {};

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
      style={schoolTheme}
    >
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* School Logo or Initials */}
          <div 
            className="mx-auto h-16 w-16 rounded-lg flex items-center justify-center mb-4"
            style={{
              backgroundColor: schoolInfo?.primary_color || '#3B82F6'
            }}
          >
            {schoolInfo?.logo_url ? (
              <img 
                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${schoolInfo.logo_url}`} 
                alt={`${schoolInfo.name} logo`}
                className="h-12 w-12 rounded-lg object-cover"
                onError={(e) => {
                  console.log('Logo image failed to load:', schoolInfo.logo_url);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => console.log('Logo image loaded successfully:', schoolInfo.logo_url)}
              />
            ) : (
              <span className="text-white font-bold text-xl">
                {schoolInfo?.name?.charAt(0) || 'S'}
              </span>
            )}
          </div>
          
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome to {schoolInfo?.name || 'School'}
          </h2>
          
          {schoolInfo?.motto && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 italic">
              "{schoolInfo.motto}"
            </p>
          )}
          
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
          
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account? Contact your school administrator.
          </p>
        </div>

        {/* Login Type Toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setIsStudentLogin(false)}
              className={`px-4 py-2 text-sm font-medium border rounded-l-md ${
                !isStudentLogin 
                  ? 'text-white border-transparent' 
                  : 'bg-white text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
              }`}
              style={{
                backgroundColor: !isStudentLogin ? (schoolInfo?.primary_color || '#3B82F6') : undefined,
              }}
            >
              Staff Login
            </button>
            <button
              type="button"
              onClick={() => { setIsStudentLogin(true); setError(''); resetStudentForm(); }}
              className={`px-4 py-2 text-sm font-medium border rounded-r-md ${
                isStudentLogin 
                  ? 'text-white border-transparent' 
                  : 'bg-white text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
              }`}
              style={{
                backgroundColor: isStudentLogin ? (schoolInfo?.primary_color || '#3B82F6') : undefined,
              }}
            >
              Student Login
            </button>
          </div>
        </div>
        
        {!isStudentLogin && (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="px-4 py-3 rounded-md text-sm bg-red-50 border border-red-200 text-red-600">
              <p className="font-medium">Login Error</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                autoComplete="email"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a
                href="/forgot-password"
                className="font-medium hover:underline transition-colors duration-200"
                style={{
                  color: schoolInfo?.primary_color || '#3B82F6',
                }}
                onMouseEnter={(e) => {
                  if (schoolInfo?.secondary_color) {
                    e.currentTarget.style.color = schoolInfo.secondary_color;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = schoolInfo?.primary_color || '#3B82F6';
                }}
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              style={{
                backgroundColor: schoolInfo?.primary_color || '#3B82F6',
                '--tw-ring-color': schoolInfo?.primary_color || '#3B82F6',
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (!isLoading && schoolInfo?.secondary_color) {
                  e.currentTarget.style.backgroundColor = schoolInfo.secondary_color;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = schoolInfo?.primary_color || '#3B82F6';
                }
              }}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
        )}

        {isStudentLogin && (
        <form className="mt-8 space-y-6" onSubmit={handleSubmitStudent(onSubmitStudent)}>
          {error && (
            <div className="px-4 py-3 rounded-md text-sm bg-red-50 border border-red-200 text-red-600">
              <p className="font-medium">Login Error</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="admission_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Admission Number
              </label>
              <input
                {...registerStudent('admission_number', { required: 'Admission number is required' })}
                type="text"
                autoComplete="off"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your admission number"
              />
              {studentErrors.admission_number && (
                <p className="mt-1 text-sm text-red-600">{studentErrors.admission_number.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <input
                {...registerStudent('first_name', { required: 'First name is required' })}
                type="text"
                autoComplete="off"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your first name"
              />
              {studentErrors.first_name && (
                <p className="mt-1 text-sm text-red-600">{studentErrors.first_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              style={{
                backgroundColor: schoolInfo?.primary_color || '#3B82F6',
                '--tw-ring-color': schoolInfo?.primary_color || '#3B82F6',
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (!isLoading && schoolInfo?.secondary_color) {
                  e.currentTarget.style.backgroundColor = schoolInfo.secondary_color;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = schoolInfo?.primary_color || '#3B82F6';
                }
              }}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Login as Student'
              )}
            </button>
          </div>
          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Students can log in with their admission number and first name.
          </p>
        </form>
        )}
        
        {/* School Footer */}
        {schoolInfo && (
          <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>{schoolInfo.name}</p>
            {schoolInfo.website && (
              <p>
                <a 
                  href={schoolInfo.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline transition-colors duration-200"
                  style={{
                    color: schoolInfo.primary_color || '#3B82F6',
                  }}
                  onMouseEnter={(e) => {
                    if (schoolInfo.secondary_color) {
                      e.currentTarget.style.color = schoolInfo.secondary_color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = schoolInfo.primary_color || '#3B82F6';
                  }}
                >
                  {schoolInfo.website}
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolLoginPage;
