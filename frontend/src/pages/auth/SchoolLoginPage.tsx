import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, ArrowRightIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types';
import { schoolService, SchoolPublicInfo } from '../../services/schoolService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SchoolSelectionModal from '../../components/auth/SchoolSelectionModal';
import { useToast } from '../../hooks/useToast';
import { getSchoolLogoUrl } from '../../utils/imageUrl';

const SchoolLoginPage: React.FC = () => {
  const { schoolCode } = useParams<{ schoolCode: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<SchoolPublicInfo | null>(null);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [schoolNotFound, setSchoolNotFound] = useState(false);

  const { schoolLogin, studentLogin, user, isAuthenticated, requiresSchoolSelection, availableSchools, selectSchool, clearAuthState } = useAuth();
  const { showError } = useToast();
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
      await schoolLogin(schoolCode!, data);
    } catch (error: any) {
      console.error('Login error:', error);
      handleLoginError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitStudent = async (data: { admission_number: string; first_name: string }) => {
    setIsLoading(true);
    setError('');

    try {
      await studentLogin(data, schoolCode);
    } catch (err: any) {
      console.error('Student login failed:', err);
      if (err.response?.status === 403) {
        clearAuthState();
      }
      handleLoginError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = (error: any) => {
    if (error.response?.status === 404) {
      const message = 'School not found or inactive. Please check the school code.';
      setError(message);
      showError(message, 'School Not Found');
    } else if (error.response?.status === 401) {
      const errorDetail = error.response?.data?.detail;
      if (errorDetail === 'Incorrect email or password' || errorDetail === 'Invalid admission number or first name') {
        const message = 'Invalid credentials. Please check and try again.';
        setError(message);
        showError(message, 'Login Failed');
      } else {
        const message = 'Authentication failed. Please check your credentials.';
        setError(message);
        showError(message, 'Login Failed');
      }
    } else if (error.response?.status === 403) {
      clearAuthState();
      const errorDetail = error.response?.data?.detail || 'You do not have access to this school.';
      setError(errorDetail);
      showError(errorDetail, 'Access Denied');
    } else if (error.response?.status === 500) {
      const message = 'Server error occurred. Please try again later.';
      setError(message);
      showError(message, 'Server Error');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      const message = 'Network error. Please check your internet connection.';
      setError(message);
      showError(message, 'Network Error');
    } else {
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      setError(message);
      showError(message, 'Login Failed');
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
      className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900"
      style={schoolTheme}
    >
      {/* Left Side - School Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: schoolInfo?.primary_color || '#3B82F6' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/30"></div>

        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center px-12 text-white w-full text-center">
          <div className="mb-8 animate-fade-in-up">
            <div className="flex justify-center mb-8 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-64 h-64 opacity-20 text-white fill-current animate-pulse-slow">
                  <path d="M42.7,-72.8C56.1,-66.3,68.3,-57.8,77.8,-46.7C87.3,-35.6,94.1,-21.9,93.3,-8.4C92.5,5.1,84.1,18.4,74.1,29.8C64.1,41.2,52.5,50.7,40.2,57.1C27.9,63.5,14.9,66.8,1.4,64.4C-12.1,62,-26.1,53.9,-38.1,45.2C-50.1,36.5,-60.1,27.2,-66.8,15.7C-73.5,4.2,-76.9,-9.5,-72.9,-21.8C-68.9,-34.1,-57.5,-45,-45.3,-52.1C-33.1,-59.2,-20.1,-62.5,-7.2,-61.4" transform="translate(100 100)" />
                </svg>
              </div>
              {schoolInfo?.logo_url ? (
                <img
                  src={getSchoolLogoUrl(schoolInfo.logo_url)}
                  alt={`${schoolInfo.name} logo`}
                  className="h-48 w-auto object-contain relative z-10"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-6xl font-bold text-white drop-shadow-lg">
                  {schoolInfo?.name?.charAt(0) || 'S'}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Welcome to <br />
              <span className="text-white/90">{schoolInfo?.name || 'School Portal'}</span>
            </h1>
            {schoolInfo?.motto && (
              <p className="text-xl text-white/80 italic max-w-lg mx-auto">
                "{schoolInfo.motto}"
              </p>
            )}
          </div>

          <div className="mt-12 animate-fade-in-up delay-200">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
              System Operational
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-gray-900 relative">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-0 left-0 w-full p-6 flex items-center justify-end">
          {schoolInfo?.logo_url ? (
            <div className="h-12 w-12 flex items-center justify-center">
              <img
                src={getSchoolLogoUrl(schoolInfo.logo_url)}
                alt={`${schoolInfo.name} logo`}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: schoolInfo?.primary_color || '#3B82F6' }}
            >
              {schoolInfo?.name?.charAt(0) || 'S'}
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in-up delay-100">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {isStudentLogin ? 'Student Login' : 'Staff Login'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isStudentLogin
                ? 'Enter your admission number to continue.'
                : 'Please enter your credentials to sign in.'}
            </p>
          </div>

          {/* Login Type Toggle */}
          <div className="mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl flex relative">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-all duration-300 ease-in-out"
              style={{
                left: isStudentLogin ? 'calc(50% + 2px)' : '4px',
              }}
            ></div>
            <button
              type="button"
              onClick={() => setIsStudentLogin(false)}
              className={`flex-1 relative z-10 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center ${!isStudentLogin
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <UserGroupIcon className="w-4 h-4 mr-2" />
              Staff
            </button>
            <button
              type="button"
              onClick={() => { setIsStudentLogin(true); setError(''); resetStudentForm(); }}
              className={`flex-1 relative z-10 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center ${isStudentLogin
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <AcademicCapIcon className="w-4 h-4 mr-2" />
              Student
            </button>
          </div>

          {/* Staff Login Form */}
          {!isStudentLogin && (
            <form className="space-y-6 animate-fade-in" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-100 dark:border-red-800 animate-scale-in">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Login failed</h3>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="block w-full px-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200"
                    placeholder="Enter your email"
                    style={{ '--tw-ring-color': schoolInfo?.primary_color } as React.CSSProperties}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600 animate-slide-in-left">{errors.email.message}</p>}
                </div>

                <div className="group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <a href="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: schoolInfo?.primary_color || '#3B82F6' }}>
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      {...register('password', { required: 'Password is required' })}
                      type={showPassword ? 'text' : 'password'}
                      className="block w-full px-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200 pr-10"
                      placeholder="Enter your password"
                      style={{ '--tw-ring-color': schoolInfo?.primary_color } as React.CSSProperties}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600 animate-slide-in-left">{errors.password.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: schoolInfo?.primary_color || '#3B82F6',
                  '--tw-ring-color': schoolInfo?.primary_color || '#3B82F6'
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
                {isLoading ? <LoadingSpinner size="sm" color="white" /> : (
                  <>
                    Sign in
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Student Login Form */}
          {isStudentLogin && (
            <form className="space-y-6 animate-fade-in" onSubmit={handleSubmitStudent(onSubmitStudent)}>
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-100 dark:border-red-800 animate-scale-in">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Login failed</h3>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admission Number</label>
                  <input
                    {...registerStudent('admission_number', { required: 'Admission number is required' })}
                    type="text"
                    className="block w-full px-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200"
                    placeholder="Enter your admission number"
                    style={{ '--tw-ring-color': schoolInfo?.primary_color } as React.CSSProperties}
                  />
                  {studentErrors.admission_number && <p className="mt-1 text-sm text-red-600 animate-slide-in-left">{studentErrors.admission_number.message}</p>}
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input
                    {...registerStudent('first_name', { required: 'First name is required' })}
                    type="text"
                    className="block w-full px-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200"
                    placeholder="Enter your first name"
                    style={{ '--tw-ring-color': schoolInfo?.primary_color } as React.CSSProperties}
                  />
                  {studentErrors.first_name && <p className="mt-1 text-sm text-red-600 animate-slide-in-left">{studentErrors.first_name.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: schoolInfo?.primary_color || '#3B82F6',
                  '--tw-ring-color': schoolInfo?.primary_color || '#3B82F6'
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
                {isLoading ? <LoadingSpinner size="sm" color="white" /> : (
                  <>
                    Login as Student
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            {schoolInfo?.website && (
              <p className="mb-2">
                <a
                  href={schoolInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline transition-colors duration-200"
                  style={{ color: schoolInfo?.primary_color || '#3B82F6' }}
                >
                  Visit School Website
                </a>
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Powered by Edix
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolLoginPage;
