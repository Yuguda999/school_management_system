import React from 'react';
import { useForm } from 'react-hook-form';
import { StudentBasicInfoForm, CreateStudentForm, Gender } from '../../../types';

interface BasicInfoStepProps {
  data: Partial<CreateStudentForm>;
  onUpdate: (data: Partial<CreateStudentForm>) => void;
  isEdit?: boolean;
  validationErrors?: Record<string, string>;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, onUpdate, isEdit = false, validationErrors = {} }) => {
  // Generate a suggested admission number if not editing and no admission number exists
  const generateSuggestedAdmissionNumber = () => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${year}${timestamp}${randomNum}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StudentBasicInfoForm>({
    defaultValues: {
      admission_number: data.admission_number || (!isEdit ? generateSuggestedAdmissionNumber() : ''),
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      middle_name: data.middle_name || '',
      date_of_birth: data.date_of_birth || '',
      gender: data.gender || 'male',
      phone: data.phone || '',
      email: data.email || '',
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
          Basic Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Please provide the student's basic personal information.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Admission Number <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              {...register('admission_number', {
                required: 'Admission number is required',
                pattern: {
                  value: /^[A-Za-z0-9-_]+$/,
                  message: 'Admission number can only contain letters, numbers, hyphens, and underscores'
                }
              })}
              type="text"
              className={`flex-1 rounded-r-none ${validationErrors.admission_number ? 'input-error' : 'input'}`}
              placeholder="Enter admission number"
              disabled={isEdit}
            />
            {!isEdit && (
              <button
                type="button"
                onClick={() => {
                  const newAdmissionNumber = generateSuggestedAdmissionNumber();
                  setValue('admission_number', newAdmissionNumber);
                  onUpdate({ admission_number: newAdmissionNumber });
                }}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Generate
              </button>
            )}
          </div>
          {(errors.admission_number || validationErrors.admission_number) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.admission_number?.message || validationErrors.admission_number}
            </p>
          )}
          {isEdit ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Admission number cannot be changed after creation
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter a unique admission number or click "Generate" for a suggestion
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('first_name', {
              required: 'First name is required',
              minLength: {
                value: 2,
                message: 'First name must be at least 2 characters'
              }
            })}
            type="text"
            className={`mt-1 ${validationErrors.first_name ? 'input-error' : 'input'}`}
            placeholder="Enter first name"
          />
          {(errors.first_name || validationErrors.first_name) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.first_name?.message || validationErrors.first_name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('last_name', {
              required: 'Last name is required',
              minLength: {
                value: 2,
                message: 'Last name must be at least 2 characters'
              }
            })}
            type="text"
            className={`mt-1 ${validationErrors.last_name ? 'input-error' : 'input'}`}
            placeholder="Enter last name"
          />
          {(errors.last_name || validationErrors.last_name) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.last_name?.message || validationErrors.last_name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Middle Name
          </label>
          <input
            {...register('middle_name')}
            type="text"
            className="mt-1 input"
            placeholder="Enter middle name (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            {...register('date_of_birth', {
              required: 'Date of birth is required',
              validate: (value) => {
                const birthDate = new Date(value);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                if (age < 3 || age > 25) {
                  return 'Student age must be between 3 and 25 years';
                }
                return true;
              }
            })}
            type="date"
            className={`mt-1 ${validationErrors.date_of_birth ? 'input-error' : 'input'}`}
            max={new Date().toISOString().split('T')[0]}
          />
          {(errors.date_of_birth || validationErrors.date_of_birth) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.date_of_birth?.message || validationErrors.date_of_birth}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            {...register('gender', { required: 'Gender is required' })}
            className={`mt-1 ${validationErrors.gender ? 'input-error' : 'input'}`}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {(errors.gender || validationErrors.gender) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.gender?.message || validationErrors.gender}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number
          </label>
          <input
            {...register('phone', {
              pattern: {
                value: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
              }
            })}
            type="tel"
            className="mt-1 input"
            placeholder="Enter phone number (optional)"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <input
            {...register('email', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address'
              }
            })}
            type="email"
            className="mt-1 input"
            placeholder="Enter email address (optional)"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Email is optional but recommended for communication
          </p>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
