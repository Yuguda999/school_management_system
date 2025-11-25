import React, { useState, useEffect } from 'react';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
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
    <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
      {/* Left Side - Hero/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-600">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-700 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay"></div>

        {/* Animated Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white w-full">
          <div className="mb-8 animate-fade-in-up">
            <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/30">
              <span className="text-3xl font-bold">S</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Manage Your School <br />
              <span className="text-primary-200">With Excellence</span>
            </h1>
            <p className="text-xl text-primary-100 max-w-lg leading-relaxed">
              A comprehensive platform designed to streamline administrative tasks, enhance learning, and foster growth.
            </p>
          </div>

          <div className="flex space-x-4 animate-fade-in-up delay-200">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-primary-600 bg-gray-300 overflow-hidden z-${10 - i}`}>
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-semibold">Trusted by 500+ Schools</span>
              <span className="text-xs text-primary-200">Join the community today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-gray-900 relative">
        {/* Mobile Header (visible only on small screens) */}
        <div className="lg:hidden absolute top-0 left-0 w-full p-6 flex items-center justify-between">
          <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in-up delay-100">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please enter your details to sign in.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-100 dark:border-red-800 animate-scale-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Login failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
                  Email address
                </label>
                <div className="relative">
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
                    className="block w-full px-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200 ease-in-out hover:border-gray-400 dark:hover:border-gray-500"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-slide-in-left">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="group">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
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
                    className="block w-full px-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200 ease-in-out hover:border-gray-400 dark:hover:border-gray-500 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-slide-in-left">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <>
                  Sign in
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors hover:underline"
                >
                  Register your school
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} School Management System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
