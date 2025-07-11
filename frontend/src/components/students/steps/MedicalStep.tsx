import React from 'react';
import { useForm } from 'react-hook-form';
import { StudentMedicalForm, CreateStudentForm } from '../../../types';

interface MedicalStepProps {
  data: Partial<CreateStudentForm>;
  onUpdate: (data: Partial<CreateStudentForm>) => void;
}

const MedicalStep: React.FC<MedicalStepProps> = ({ data, onUpdate }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<StudentMedicalForm>({
    defaultValues: {
      medical_conditions: data.medical_conditions || '',
      allergies: data.allergies || '',
      blood_group: data.blood_group || '',
    },
  });

  // Watch form changes and update parent component
  React.useEffect(() => {
    const subscription = watch((value) => {
      onUpdate(value as Partial<CreateStudentForm>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onUpdate]);

  const bloodGroupOptions = [
    { value: '', label: 'Select blood group' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Medical Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Please provide any relevant medical information about the student. This information 
          will be kept confidential and used only for the student's safety and well-being.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Blood Group
          </label>
          <select
            {...register('blood_group')}
            className="mt-1 input"
          >
            {bloodGroupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Blood group information is helpful in case of medical emergencies
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Medical Conditions
          </label>
          <textarea
            {...register('medical_conditions')}
            rows={4}
            className="mt-1 input"
            placeholder="List any chronic medical conditions, ongoing treatments, medications, or health concerns that the school should be aware of..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Include conditions like asthma, diabetes, epilepsy, heart conditions, etc.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Allergies
          </label>
          <textarea
            {...register('allergies')}
            rows={3}
            className="mt-1 input"
            placeholder="List any known allergies including food allergies, medication allergies, environmental allergies, etc..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Include severity of allergies and any emergency medications (e.g., EpiPen)
          </p>
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
              Medical Information Privacy
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                All medical information provided will be:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Kept strictly confidential</li>
                <li>Shared only with authorized school staff on a need-to-know basis</li>
                <li>Used solely for the student's safety and well-being</li>
                <li>Stored securely in compliance with privacy regulations</li>
              </ul>
            </div>
          </div>
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
              Important Medical Information
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Please be thorough when providing medical information. This helps us:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Respond appropriately in medical emergencies</li>
                <li>Avoid triggering allergic reactions</li>
                <li>Provide proper care during school activities</li>
                <li>Coordinate with school nurses and medical staff</li>
                <li>Ensure student safety during field trips and sports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalStep;
