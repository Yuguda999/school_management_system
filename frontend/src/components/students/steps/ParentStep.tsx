import React from 'react';
import { useForm } from 'react-hook-form';
import { StudentParentForm, CreateStudentForm } from '../../../types';

interface ParentStepProps {
  data: Partial<CreateStudentForm>;
  onUpdate: (data: Partial<CreateStudentForm>) => void;
}

const ParentStep: React.FC<ParentStepProps> = ({ data, onUpdate }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<StudentParentForm>({
    defaultValues: {
      parent_id: data.parent_id || '',
      guardian_name: data.guardian_name || '',
      guardian_phone: data.guardian_phone || '',
      guardian_email: data.guardian_email || '',
      guardian_relationship: data.guardian_relationship || '',
    },
  });

  // Watch form changes and update parent component
  React.useEffect(() => {
    const subscription = watch((value) => {
      onUpdate(value as Partial<CreateStudentForm>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onUpdate]);

  const relationshipOptions = [
    { value: 'father', label: 'Father' },
    { value: 'mother', label: 'Mother' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'grandfather', label: 'Grandfather' },
    { value: 'grandmother', label: 'Grandmother' },
    { value: 'uncle', label: 'Uncle' },
    { value: 'aunt', label: 'Aunt' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Parent/Guardian Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Please provide information about the student's parent or guardian. This information is optional but recommended for communication purposes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Guardian/Parent Name
          </label>
          <input
            {...register('guardian_name', {
              minLength: {
                value: 2,
                message: 'Guardian name must be at least 2 characters'
              }
            })}
            type="text"
            className="mt-1 input"
            placeholder="Enter full name of parent/guardian"
          />
          {errors.guardian_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.guardian_name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Guardian Phone Number
          </label>
          <input
            {...register('guardian_phone', {
              pattern: {
                value: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
              }
            })}
            type="tel"
            className="mt-1 input"
            placeholder="Enter guardian's phone number"
          />
          {errors.guardian_phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.guardian_phone.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Guardian Email Address
          </label>
          <input
            {...register('guardian_email', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address'
              }
            })}
            type="email"
            className="mt-1 input"
            placeholder="Enter guardian's email address"
          />
          {errors.guardian_email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.guardian_email.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Relationship to Student
          </label>
          <select
            {...register('guardian_relationship')}
            className="mt-1 input"
          >
            <option value="">Select relationship</option>
            {relationshipOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Parent/Guardian Information
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                While this information is optional, providing parent/guardian details helps us:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Send important school communications</li>
                <li>Contact in case of emergencies</li>
                <li>Coordinate parent-teacher meetings</li>
                <li>Share academic progress updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentStep;
