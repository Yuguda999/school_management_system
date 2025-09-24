import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SchoolFormData {
  name: string;
  code: string;
  email: string;
  phone?: string;
  website?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description?: string;
  motto?: string;
  established_year?: string;
  current_session: string;
  current_term: string;
}

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddSchoolModal: React.FC<AddSchoolModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SchoolFormData>({
    defaultValues: {
      country: 'Nigeria',
      current_session: '2024/2025',
      current_term: 'First Term',
      postal_code: '00000'
    }
  });

  const onSubmit = async (data: SchoolFormData) => {
    setIsSubmitting(true);
    try {
      await apiService.post('/api/v1/schools/register-additional', data);
      showSuccess('School registered successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to register school:', error);
      const message = error.response?.data?.detail || 'Failed to register school';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Register New School
          </h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  School Name *
                </label>
                <input
                  {...register('name', { required: 'School name is required' })}
                  className="input w-full"
                  placeholder="Enter school name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  School Code *
                </label>
                <input
                  {...register('code', { 
                    required: 'School code is required',
                    minLength: { value: 3, message: 'Code must be at least 3 characters' }
                  })}
                  className="input w-full"
                  placeholder="Enter school code"
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="input w-full"
                  placeholder="school@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  {...register('phone')}
                  className="input w-full"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website
                </label>
                <input
                  {...register('website')}
                  className="input w-full"
                  placeholder="https://www.school.com"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Address
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 1 *
                </label>
                <input
                  {...register('address_line1', { required: 'Address is required' })}
                  className="input w-full"
                  placeholder="Enter street address"
                />
                {errors.address_line1 && (
                  <p className="mt-1 text-sm text-red-600">{errors.address_line1.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 2
                </label>
                <input
                  {...register('address_line2')}
                  className="input w-full"
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City *
                </label>
                <input
                  {...register('city', { required: 'City is required' })}
                  className="input w-full"
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State *
                </label>
                <input
                  {...register('state', { required: 'State is required' })}
                  className="input w-full"
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Postal Code *
                </label>
                <input
                  {...register('postal_code', { required: 'Postal code is required' })}
                  className="input w-full"
                  placeholder="Enter postal code"
                />
                {errors.postal_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country *
                </label>
                <select
                  {...register('country', { required: 'Country is required' })}
                  className="input w-full"
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Other">Other</option>
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Academic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Session *
                </label>
                <input
                  {...register('current_session', { required: 'Current session is required' })}
                  className="input w-full"
                  placeholder="2024/2025"
                />
                {errors.current_session && (
                  <p className="mt-1 text-sm text-red-600">{errors.current_session.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Term *
                </label>
                <select
                  {...register('current_term', { required: 'Current term is required' })}
                  className="input w-full"
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
                {errors.current_term && (
                  <p className="mt-1 text-sm text-red-600">{errors.current_term.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register School</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSchoolModal;
