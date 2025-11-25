import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/authService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface ForgotPasswordForm {
  email: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset(data.email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-400/20 blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-md w-full space-y-8 relative z-10 animate-scale-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Check your email
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                We've sent a password reset link to your email address. Please check your inbox and spam folder.
              </p>

              <div className="space-y-4">
                <Link
                  to="/login"
                  className="block w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                >
                  Return to Login
                </Link>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="block w-full py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                >
                  Didn't receive the email? Try again
                </button>
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
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497294815431-9365093b7331?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>

        {/* Animated Shapes */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 flex flex-col justify-center items-center px-12 text-white w-full text-center">
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Secure Account Recovery
            </h1>
            <p className="text-primary-100 text-lg max-w-md mx-auto leading-relaxed">
              Don't worry, it happens to the best of us. We'll help you get back into your account in no time.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-gray-900 relative">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in-up delay-100">
          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200 mb-6"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to login
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Forgot password?
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-100 dark:border-red-800 animate-scale-in">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Request failed</h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="block w-full pl-10 pr-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200"
                    placeholder="Enter your email"
                  />
                  <EnvelopeIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200" />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 animate-slide-in-left">
                    {errors.email.message}
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
                'Send reset link'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
