import React from 'react';
import { useForm } from 'react-hook-form';
import { TeacherAddressInfoForm, CreateTeacherForm } from '../../../types';

interface AddressInfoStepProps {
  data: Partial<CreateTeacherForm>;
  onUpdate: (data: Partial<CreateTeacherForm>) => void;
}

const AddressInfoStep: React.FC<AddressInfoStepProps> = ({ data, onUpdate }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TeacherAddressInfoForm>({
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
      onUpdate(value as Partial<CreateTeacherForm>);
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
          Enter the teacher's residential address details (optional).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Address Line 1 */}
        <div>
          <label className="label">
            Address Line 1
          </label>
          <input
            type="text"
            className="input"
            placeholder="Street address, building number"
            {...register('address_line1')}
          />
        </div>

        {/* Address Line 2 */}
        <div>
          <label className="label">
            Address Line 2
          </label>
          <input
            type="text"
            className="input"
            placeholder="Apartment, suite, unit, building, floor, etc."
            {...register('address_line2')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* City */}
          <div>
            <label className="label">
              City
            </label>
            <input
              type="text"
              className="input"
              placeholder="City"
              {...register('city')}
            />
          </div>

          {/* State */}
          <div>
            <label className="label">
              State/Province
            </label>
            <input
              type="text"
              className="input"
              placeholder="State or Province"
              {...register('state')}
            />
          </div>

          {/* Postal Code */}
          <div>
            <label className="label">
              Postal Code
            </label>
            <input
              type="text"
              className={`input ${errors.postal_code ? 'input-error' : ''}`}
              placeholder="ZIP/Postal Code"
              {...register('postal_code', {
                pattern: {
                  value: /^[A-Za-z0-9\s-]{3,10}$/,
                  message: 'Invalid postal code format'
                }
              })}
            />
            {errors.postal_code && (
              <p className="error-text">{errors.postal_code.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
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
                Address information is optional but can be useful for:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Emergency contact purposes</li>
                <li>Official correspondence</li>
                <li>Administrative records</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressInfoStep;
