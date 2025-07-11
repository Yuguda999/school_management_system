import React from 'react';
import { useForm } from 'react-hook-form';
import { TeacherBasicInfoForm, CreateTeacherForm, Gender } from '../../../types';

interface BasicInfoStepProps {
  data: Partial<CreateTeacherForm>;
  onUpdate: (data: Partial<CreateTeacherForm>) => void;
  isEdit?: boolean;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, onUpdate, isEdit = false }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TeacherBasicInfoForm>({
    defaultValues: {
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      middle_name: data.middle_name || '',
      email: data.email || '',
      phone: data.phone || '',
      date_of_birth: data.date_of_birth || '',
      gender: data.gender || 'male',
      password: data.password || '',
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
          Basic Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Enter the teacher's personal information and contact details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label className="label">
            First Name *
          </label>
          <input
            type="text"
            className={`input ${errors.first_name ? 'input-error' : ''}`}
            {...register('first_name', {
              required: 'First name is required',
              minLength: {
                value: 2,
                message: 'First name must be at least 2 characters'
              }
            })}
          />
          {errors.first_name && (
            <p className="error-text">{errors.first_name.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="label">
            Last Name *
          </label>
          <input
            type="text"
            className={`input ${errors.last_name ? 'input-error' : ''}`}
            {...register('last_name', {
              required: 'Last name is required',
              minLength: {
                value: 2,
                message: 'Last name must be at least 2 characters'
              }
            })}
          />
          {errors.last_name && (
            <p className="error-text">{errors.last_name.message}</p>
          )}
        </div>

        {/* Middle Name */}
        <div>
          <label className="label">
            Middle Name
          </label>
          <input
            type="text"
            className="input"
            {...register('middle_name')}
          />
        </div>

        {/* Email */}
        <div>
          <label className="label">
            Email Address *
          </label>
          <input
            type="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />
          {errors.email && (
            <p className="error-text">{errors.email.message}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Must be unique within the school
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="label">
            Phone Number
          </label>
          <input
            type="tel"
            className={`input ${errors.phone ? 'input-error' : ''}`}
            {...register('phone', {
              pattern: {
                value: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Invalid phone number'
              }
            })}
          />
          {errors.phone && (
            <p className="error-text">{errors.phone.message}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="label">
            Date of Birth
          </label>
          <input
            type="date"
            className="input"
            {...register('date_of_birth')}
          />
        </div>

        {/* Gender */}
        <div>
          <label className="label">
            Gender
          </label>
          <select
            className="input"
            {...register('gender')}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Password */}
        {!isEdit && (
          <div className="md:col-span-2">
            <label className="label">
              Password (Optional)
            </label>
            <input
              type="password"
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="Leave empty to auto-generate"
              {...register('password', {
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
            />
            {errors.password && (
              <p className="error-text">{errors.password.message}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Leave empty to auto-generate password using email and first name
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicInfoStep;
