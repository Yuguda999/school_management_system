import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { InvitationAcceptRequest, TeacherInvitation, Gender } from '../../types';
import { teacherInvitationService } from '../../services/teacherInvitationService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const TeacherSetupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [invitation, setInvitation] = useState<TeacherInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<InvitationAcceptRequest>();

  const password = watch('password');

  useEffect(() => {
    if (!token) {
      setValidationError('Invalid invitation link');
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await teacherInvitationService.validateInvitationToken(token!);
      
      if (response.valid && response.invitation) {
        setInvitation(response.invitation);
        setValue('invitation_token', token!);
      } else {
        setValidationError(response.message);
      }
    } catch (error: any) {
      console.error('Error validating token:', error);
      setValidationError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: InvitationAcceptRequest) => {
    setSubmitting(true);
    try {
      const response = await teacherInvitationService.acceptInvitation(data);
      
      // Auto-login the user
      await login({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: 'bearer',
        user_id: response.user_id,
        email: response.user_email,
        role: response.user_role as any,
        school_id: response.school_id,
        full_name: response.full_name
      });

      showSuccess('Welcome to the team! Your account has been set up successfully.');

      // Redirect based on profile completion status
      if (response.profile_completed) {
        navigate('/teacher/dashboard');
      } else {
        navigate('/teacher/complete-profile');
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      
      // Handle different error formats
      let errorMessage = 'Failed to set up account';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle validation errors (array of error objects)
        if (Array.isArray(data)) {
          errorMessage = data.map(err => err.msg || err.message || 'Validation error').join(', ');
        }
        // Handle single error object
        else if (typeof data === 'object' && data.detail) {
          errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        }
        // Handle string error
        else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (validationError || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Invalid Invitation
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {validationError || 'This invitation link is invalid or has expired.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 btn btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <AcademicCapIcon className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Welcome to the Team!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Complete your account setup to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Invitation Info */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {invitation.full_name}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {invitation.email}
                </p>
                {invitation.department && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {invitation.department}
                    {invitation.position && ` • ${invitation.position}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Password */}
            <div>
              <label className="label">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Create a strong password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                    }
                  })}
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
                <p className="error-text">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.confirm_password ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
                  {...register('confirm_password', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="error-text">{errors.confirm_password.message}</p>
              )}
            </div>

            {/* Optional: Phone */}
            <div>
              <label className="label">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                className="input"
                placeholder="+1 (555) 123-4567"
                {...register('phone')}
              />
            </div>

            {/* Optional: Gender */}
            <div>
              <label className="label">
                Gender (Optional)
              </label>
              <select
                className="input"
                {...register('gender')}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn btn-primary"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Setting up account...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Note */}
          <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Security tip:</strong> Use a strong password with at least 8 characters, 
              including uppercase and lowercase letters, numbers, and special characters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSetupPage;
