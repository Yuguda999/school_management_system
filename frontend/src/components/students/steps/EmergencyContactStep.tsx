import React from 'react';
import { useForm } from 'react-hook-form';
import { StudentEmergencyContactForm, CreateStudentForm } from '../../../types';

interface EmergencyContactStepProps {
  data: Partial<CreateStudentForm>;
  onUpdate: (data: Partial<CreateStudentForm>) => void;
  validationErrors?: Record<string, string>;
}

const EmergencyContactStep: React.FC<EmergencyContactStepProps> = ({ data, onUpdate, validationErrors = {} }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<StudentEmergencyContactForm>({
    defaultValues: {
      emergency_contact_name: data.emergency_contact_name || '',
      emergency_contact_phone: data.emergency_contact_phone || '',
      emergency_contact_relationship: data.emergency_contact_relationship || '',
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
    { value: 'family_friend', label: 'Family Friend' },
    { value: 'neighbor', label: 'Neighbor' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Emergency Contact Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Please provide emergency contact details. This person should be someone who can be reached 
          immediately in case of an emergency when the primary guardian is not available.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Emergency Contact Name
          </label>
          <input
            {...register('emergency_contact_name', {
              minLength: {
                value: 2,
                message: 'Emergency contact name must be at least 2 characters'
              }
            })}
            type="text"
            className="mt-1 input"
            placeholder="Enter full name of emergency contact"
          />
          {errors.emergency_contact_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.emergency_contact_name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Emergency Contact Phone
          </label>
          <input
            {...register('emergency_contact_phone', {
              pattern: {
                value: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
              }
            })}
            type="tel"
            className="mt-1 input"
            placeholder="Enter emergency contact phone number"
          />
          {errors.emergency_contact_phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.emergency_contact_phone.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Relationship to Student
          </label>
          <select
            {...register('emergency_contact_relationship')}
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

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Emergency Contact Guidelines
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>
                Please ensure the emergency contact:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Is available during school hours</li>
                <li>Lives within reasonable distance from the school</li>
                <li>Is authorized to make decisions for the student if needed</li>
                <li>Has been informed they are listed as an emergency contact</li>
                <li>Is different from the primary guardian when possible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          When will this contact be used?
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Medical emergencies when primary guardian cannot be reached</li>
          <li>• Unexpected school closures or early dismissals</li>
          <li>• Student illness or injury requiring immediate attention</li>
          <li>• Any situation requiring immediate student pickup</li>
        </ul>
      </div>
    </div>
  );
};

export default EmergencyContactStep;
