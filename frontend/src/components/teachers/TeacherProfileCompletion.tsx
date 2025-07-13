import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  UserIcon,
  AcademicCapIcon,
  MapPinIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { User, Gender } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProfileCompletionData {
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  qualification?: string;
  experience_years?: string;
  bio?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface TeacherProfileCompletionProps {
  onComplete: () => void;
}

const STEPS = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Complete your personal details',
    icon: UserIcon
  },
  {
    id: 'professional',
    title: 'Professional Details',
    description: 'Add your qualifications and experience',
    icon: AcademicCapIcon
  },
  {
    id: 'address',
    title: 'Address Information',
    description: 'Provide your contact address',
    icon: MapPinIcon
  }
];

const TeacherProfileCompletion: React.FC<TeacherProfileCompletionProps> = ({ onComplete }) => {
  const { user, logout, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileCompletionData>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm<ProfileCompletionData>({
    defaultValues: formData
  });

  // Load existing user data
  useEffect(() => {
    if (user) {
      const existingData: ProfileCompletionData = {
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender as Gender || 'male',
        qualification: user.qualification || '',
        experience_years: user.experience_years || '',
        bio: user.bio || '',
        address_line1: user.address_line1 || '',
        address_line2: user.address_line2 || '',
        city: user.city || '',
        state: user.state || '',
        postal_code: user.postal_code || '',
        country: user.country || ''
      };
      
      setFormData(existingData);
      
      // Set form values
      Object.entries(existingData).forEach(([key, value]) => {
        setValue(key as keyof ProfileCompletionData, value);
      });
    }
  }, [user, setValue]);

  const updateFormData = (data: Partial<ProfileCompletionData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const validateCurrentStep = async () => {
    const currentStepId = STEPS[currentStep].id;
    let fieldsToValidate: (keyof ProfileCompletionData)[] = [];

    switch (currentStepId) {
      case 'personal':
        fieldsToValidate = ['phone', 'date_of_birth', 'gender'];
        break;
      case 'professional':
        fieldsToValidate = ['qualification', 'experience_years'];
        break;
      case 'address':
        fieldsToValidate = ['address_line1', 'city', 'state', 'postal_code'];
        break;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleSubmit(onSubmit)();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ProfileCompletionData) => {
    if (!user) return;

    setLoading(true);
    try {
      await apiService.put(`/api/v1/users/${user.id}`, data);

      // Refresh user data to get updated profile_completed status
      try {
        await updateUser();
        console.log('User data updated successfully');
      } catch (refreshError) {
        console.warn('Failed to refresh user data:', refreshError);
      }

      showSuccess('Profile completed successfully! Welcome to your teacher dashboard.');

      // Small delay to ensure user context is updated before redirect
      setTimeout(() => {
        onComplete();
      }, 100);
    } catch (error: any) {
      console.error('Error completing profile:', error);

      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      showError(error.response?.data?.detail || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalStep = () => (
    <div className="space-y-6">
      <div>
        <label className="label">Phone Number *</label>
        <input
          type="tel"
          className={`input ${errors.phone ? 'input-error' : ''}`}
          placeholder="+1234567890"
          {...register('phone', {
            required: 'Phone number is required',
            pattern: {
              value: /^[\+]?[1-9][\d]{0,15}$/,
              message: 'Please enter a valid phone number'
            }
          })}
        />
        {errors.phone && <p className="error-text">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="label">Date of Birth *</label>
        <input
          type="date"
          className={`input ${errors.date_of_birth ? 'input-error' : ''}`}
          {...register('date_of_birth', {
            required: 'Date of birth is required'
          })}
        />
        {errors.date_of_birth && <p className="error-text">{errors.date_of_birth.message}</p>}
      </div>

      <div>
        <label className="label">Gender *</label>
        <select
          className={`input ${errors.gender ? 'input-error' : ''}`}
          {...register('gender', {
            required: 'Gender is required'
          })}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && <p className="error-text">{errors.gender.message}</p>}
      </div>
    </div>
  );

  const renderProfessionalStep = () => (
    <div className="space-y-6">
      <div>
        <label className="label">Qualification *</label>
        <textarea
          className={`input ${errors.qualification ? 'input-error' : ''}`}
          rows={3}
          placeholder="e.g., Bachelor of Education, Master's in Mathematics"
          {...register('qualification', {
            required: 'Qualification is required',
            minLength: {
              value: 10,
              message: 'Please provide more details about your qualification'
            }
          })}
        />
        {errors.qualification && <p className="error-text">{errors.qualification.message}</p>}
      </div>

      <div>
        <label className="label">Years of Experience *</label>
        <input
          type="text"
          className={`input ${errors.experience_years ? 'input-error' : ''}`}
          placeholder="e.g., 5 years"
          {...register('experience_years', {
            required: 'Experience is required'
          })}
        />
        {errors.experience_years && <p className="error-text">{errors.experience_years.message}</p>}
      </div>

      <div>
        <label className="label">Bio (Optional)</label>
        <textarea
          className="input"
          rows={4}
          placeholder="Tell us about yourself, your teaching philosophy, interests..."
          {...register('bio')}
        />
      </div>
    </div>
  );

  const renderAddressStep = () => (
    <div className="space-y-6">
      <div>
        <label className="label">Address Line 1 *</label>
        <input
          type="text"
          className={`input ${errors.address_line1 ? 'input-error' : ''}`}
          placeholder="Street address"
          {...register('address_line1', {
            required: 'Address is required'
          })}
        />
        {errors.address_line1 && <p className="error-text">{errors.address_line1.message}</p>}
      </div>

      <div>
        <label className="label">Address Line 2 (Optional)</label>
        <input
          type="text"
          className="input"
          placeholder="Apartment, suite, etc."
          {...register('address_line2')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">City *</label>
          <input
            type="text"
            className={`input ${errors.city ? 'input-error' : ''}`}
            placeholder="City"
            {...register('city', {
              required: 'City is required'
            })}
          />
          {errors.city && <p className="error-text">{errors.city.message}</p>}
        </div>

        <div>
          <label className="label">State *</label>
          <input
            type="text"
            className={`input ${errors.state ? 'input-error' : ''}`}
            placeholder="State"
            {...register('state', {
              required: 'State is required'
            })}
          />
          {errors.state && <p className="error-text">{errors.state.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Postal Code *</label>
          <input
            type="text"
            className={`input ${errors.postal_code ? 'input-error' : ''}`}
            placeholder="Postal code"
            {...register('postal_code', {
              required: 'Postal code is required'
            })}
          />
          {errors.postal_code && <p className="error-text">{errors.postal_code.message}</p>}
        </div>

        <div>
          <label className="label">Country (Optional)</label>
          <input
            type="text"
            className="input"
            placeholder="Country"
            {...register('country')}
          />
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'personal':
        return renderPersonalStep();
      case 'professional':
        return renderProfessionalStep();
      case 'address':
        return renderAddressStep();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please complete your profile to access your teacher dashboard
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${isActive ? 'border-blue-600 bg-blue-600 text-white' : 
                      isCompleted ? 'border-green-600 bg-green-600 text-white' : 
                      'border-gray-300 bg-white text-gray-400'}
                  `}>
                    {isCompleted ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`
                      w-16 h-1 mx-2
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {STEPS[currentStep].title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {STEPS[currentStep].description}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-2" />
                Previous
              </button>
              
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="btn btn-primary"
              >
                {currentStep === STEPS.length - 1 ? (
                  loading ? (
                    <>
                      <LoadingSpinner />
                      Completing...
                    </>
                  ) : (
                    'Complete Profile'
                  )
                ) : (
                  <>
                    Next
                    <ChevronRightIcon className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfileCompletion;
