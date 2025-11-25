import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/authService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    setError('');

    try {
      await authService.resetPassword(token!, data.password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 animate-scale-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <ExclamationTriangleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Invalid Link
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="block w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-green-400/20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-md w-full space-y-8 relative z-10 animate-scale-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Password Reset Successful
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Your password has been successfully updated. Redirecting you to login...
              </p>

              <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 overflow-hidden">
                <div className="bg-green-600 h-1.5 rounded-full animate-[width_3s_ease-in-out_forwards]" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
      {/* Left Side - Hero/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-600">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-800"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>

        {/* Animated Shapes */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 flex flex-col justify-center items-center px-12 text-white w-full text-center">
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Create New Password
            </h1>
            <p className="text-primary-100 text-lg max-w-md mx-auto leading-relaxed">
              Choose a strong password to secure your account.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-gray-900 relative">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in-up delay-100">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your new password below.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-100 dark:border-red-800 animate-scale-in">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Reset failed</h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full px-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200 pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 animate-slide-in-left">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === password || 'Passwords do not match',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="block w-full px-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200 pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 animate-slide-in-left">
                    {errors.confirmPassword.message}
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
                  Reset Password
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
