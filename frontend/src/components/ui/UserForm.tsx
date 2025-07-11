import React from 'react';
import { useForm } from 'react-hook-form';
import { User, UserRole } from '../../types';

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
}

interface UserFormProps {
  user?: User;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  allowedRoles?: UserRole[];
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  loading = false,
  allowedRoles = ['admin', 'teacher', 'student', 'parent']
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<UserFormData>({
    defaultValues: user ? {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      is_active: user.is_active
    } : {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'student',
      is_active: true
    }
  });

  const selectedRole = watch('role');

  const roleOptions = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' },
    { value: 'parent', label: 'Parent' },
  ].filter(option => allowedRoles.includes(option.value as UserRole));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role */}
        <div>
          <label className="label">
            Role *
          </label>
          <select
            className={`input ${errors.role ? 'input-error' : ''}`}
            {...register('role', { required: 'Role is required' })}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="error-text">{errors.role.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="label">
            Status
          </label>
          <div className="flex items-center space-x-3 mt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('is_active')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Role-specific information */}
      {selectedRole === 'student' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Student Information
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Additional student details can be configured after creation.
          </p>
        </div>
      )}

      {selectedRole === 'teacher' && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
            Teacher Information
          </h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            Teacher profile and subject assignments can be configured after creation.
          </p>
        </div>
      )}

      {selectedRole === 'parent' && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
            Parent Information
          </h4>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Parent-child relationships can be configured after creation.
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
