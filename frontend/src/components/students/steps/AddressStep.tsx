import React from 'react';
import { useForm } from 'react-hook-form';
import { StudentAddressForm, CreateStudentForm } from '../../../types';

interface AddressStepProps {
  data: Partial<CreateStudentForm>;
  onUpdate: (data: Partial<CreateStudentForm>) => void;
  validationErrors?: Record<string, string>;
}

const AddressStep: React.FC<AddressStepProps> = ({ data, onUpdate, validationErrors = {} }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<StudentAddressForm>({
    defaultValues: {
      address_line1: data.address_line1 || '',
      address_line2: data.address_line2 || '',
      city: data.city || '',
      state: data.state || '',
      postal_code: data.postal_code || '',
    },
  });

  // Watch form changes and update parent component
  React.useEffect(() => {
    const subscription = watch((value) => {
      onUpdate(value as Partial<CreateStudentForm>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onUpdate]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Address Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Please provide the student's residential address details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('address_line1', {
              required: 'Address line 1 is required',
              minLength: {
                value: 5,
                message: 'Address must be at least 5 characters'
              }
            })}
            type="text"
            className={`mt-1 ${validationErrors.address_line1 ? 'input-error' : 'input'}`}
            placeholder="Enter street address, house number, etc."
          />
          {(errors.address_line1 || validationErrors.address_line1) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.address_line1?.message || validationErrors.address_line1}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Address Line 2
          </label>
          <input
            {...register('address_line2')}
            type="text"
            className="mt-1 input"
            placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              City <span className="text-red-500">*</span>
            </label>
            <input
              {...register('city', {
                required: 'City is required',
                minLength: {
                  value: 2,
                  message: 'City must be at least 2 characters'
                }
              })}
              type="text"
              className={`mt-1 ${validationErrors.city ? 'input-error' : 'input'}`}
              placeholder="Enter city"
            />
            {(errors.city || validationErrors.city) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.city?.message || validationErrors.city}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              State/Province <span className="text-red-500">*</span>
            </label>
            <input
              {...register('state', {
                required: 'State/Province is required',
                minLength: {
                  value: 2,
                  message: 'State must be at least 2 characters'
                }
              })}
              type="text"
              className={`mt-1 ${validationErrors.state ? 'input-error' : 'input'}`}
              placeholder="Enter state or province"
            />
            {(errors.state || validationErrors.state) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.state?.message || validationErrors.state}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              {...register('postal_code', {
                required: 'Postal code is required',
                pattern: {
                  value: /^[A-Za-z0-9\s-]{3,10}$/,
                  message: 'Please enter a valid postal code'
                }
              })}
              type="text"
              className={`mt-1 ${validationErrors.postal_code ? 'input-error' : 'input'}`}
              placeholder="Enter postal/ZIP code"
            />
            {(errors.postal_code || validationErrors.postal_code) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.postal_code?.message || validationErrors.postal_code}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Address Information
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                This address will be used for official correspondence and emergency contact purposes. 
                Please ensure all information is accurate and up to date.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressStep;
