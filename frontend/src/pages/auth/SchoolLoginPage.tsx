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

  const { login, isAuthenticated, requiresSchoolSelection, availableSchools, selectSchool } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

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

  // Handle navigation after authentication
  useEffect(() => {
    if (isAuthenticated && !requiresSchoolSelection) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, requiresSchoolSelection, navigate, location.state?.from?.pathname]);

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

  if (isAuthenticated && !requiresSchoolSelection) {
    const from = location.state?.from?.pathname || '/dashboard';
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
      // Use school-specific login
      const response = await schoolService.schoolLogin(schoolCode!, data);
      
      await login({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: 'bearer',
        user_id: response.user_id,
        email: response.user_email,
        role: response.user_role,
        school_id: response.school_id,
        full_name: response.full_name
      });

      // Navigation will be handled by useEffect
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate CSS variables for school theming
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
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
            {schoolInfo?.logo_url ? (
              <img 
                src={schoolInfo.logo_url} 
                alt={`${schoolInfo.name} logo`}
                className="h-12 w-12 rounded-lg object-cover"
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
            Don't have an account?{' '}
            <a
              href="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Contact your school administrator
            </a>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
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
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
        
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
                  className="hover:text-primary-500"
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
