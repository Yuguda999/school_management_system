import React, { useState, useEffect } from 'react';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SchoolSelectionModal from '../../components/auth/SchoolSelectionModal';
import { useToast } from '../../hooks/useToast';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated, requiresSchoolSelection, availableSchools, selectSchool, user } = useAuth();
  const { showError } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  // Handle navigation after authentication
  useEffect(() => {
    if (isAuthenticated && !requiresSchoolSelection && user) {
      // Get school code from user object
      const schoolCode = user.school?.code || user.school_code || localStorage.getItem('school_code');

      if (schoolCode) {
        // If we have a school code, redirect to school-specific dashboard
        const from = location.state?.from?.pathname || `/${schoolCode}/dashboard`;
        navigate(from, { replace: true });
      } else {
        // Fallback to generic dashboard (shouldn't happen for school users)
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, requiresSchoolSelection, user, navigate, location.state?.from?.pathname]);

  if (isAuthenticated && !requiresSchoolSelection && user) {
    // Get school code from user object
    const schoolCode = user.school?.code || user.school_code || localStorage.getItem('school_code');

    if (schoolCode) {
      // If we have a school code, redirect to school-specific dashboard
      const from = location.state?.from?.pathname || `/${schoolCode}/dashboard`;
      return <Navigate to={from} replace />;
    } else {
      // Fallback to generic dashboard (shouldn't happen for school users)
      const from = location.state?.from?.pathname || '/dashboard';
      return <Navigate to={from} replace />;
    }
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
      await login(data);
    } catch (err: any) {
      // Use the specific error message from the backend
      const errorMessage = err.response?.data?.detail;

      // Handle specific error cases with both inline error and toast notification
      if (errorMessage) {
        setError(errorMessage);
        showError(errorMessage, 'Login Failed');
      } else {
        // Provide more specific fallback messages based on the error type
        if (err.response?.status === 401) {
          const message = 'Invalid email or password. Please check your credentials and try again.';
          setError(message);
          showError(message, 'Login Failed');
        } else if (err.response?.status === 403) {
          const message = 'Access denied. Please use your school\'s login page.';
          setError(message);
          showError(message, 'Access Denied');
        } else if (err.response?.status === 500) {
          const message = 'Server error occurred. Please try again later.';
          setError(message);
          showError(message, 'Server Error');
        } else if (err.code === 'NETWORK_ERROR' || !err.response) {
          const message = 'Unable to connect to the server. Please check your internet connection.';
          setError(message);
          showError(message, 'Network Error');
        } else {
          const message = 'An unexpected error occurred. Please try again.';
          setError(message);
          showError(message, 'Login Failed');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            School Management System
          </p>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Register your school
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
              <div className="text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
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
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                autoComplete="email"
                className="mt-1 input"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pr-10"
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
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
      </div>
    </div>
  );
};

export default LoginPage;
