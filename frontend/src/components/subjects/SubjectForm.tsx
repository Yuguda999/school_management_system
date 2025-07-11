import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreateSubjectForm } from '../../types';

interface SubjectFormProps {
  onSubmit: (data: CreateSubjectForm) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateSubjectForm>;
  isLoading?: boolean;
}

const SubjectForm: React.FC<SubjectFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateSubjectForm>({
    defaultValues: {
      is_core: false,
      credit_units: 1,
      ...initialData
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        is_core: false,
        credit_units: 1,
        ...initialData
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: CreateSubjectForm) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g., Mathematics"
              {...register('name', {
                required: 'Subject name is required',
                minLength: {
                  value: 2,
                  message: 'Subject name must be at least 2 characters'
                }
              })}
            />
            {errors.name && (
              <p className="error-text">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">
              Subject Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`input ${errors.code ? 'input-error' : ''}`}
              placeholder="e.g., MATH101"
              {...register('code', {
                required: 'Subject code is required',
                pattern: {
                  value: /^[A-Z0-9]+$/,
                  message: 'Subject code must contain only uppercase letters and numbers'
                }
              })}
            />
            {errors.code && (
              <p className="error-text">{errors.code.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label">
          Description
        </label>
        <textarea
          className={`input ${errors.description ? 'input-error' : ''}`}
          rows={3}
          placeholder="Brief description of the subject..."
          {...register('description')}
        />
        {errors.description && (
          <p className="error-text">{errors.description.message}</p>
        )}
      </div>

      {/* Subject Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Subject Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Credit Units <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="10"
              className={`input ${errors.credit_units ? 'input-error' : ''}`}
              placeholder="e.g., 3"
              {...register('credit_units', {
                required: 'Credit units is required',
                min: {
                  value: 1,
                  message: 'Credit units must be at least 1'
                },
                max: {
                  value: 10,
                  message: 'Credit units cannot exceed 10'
                }
              })}
            />
            {errors.credit_units && (
              <p className="error-text">{errors.credit_units.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-4 pt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                {...register('is_core')}
              />
              <span className="ml-2">Core Subject</span>
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Subject' : 'Create Subject'}
        </button>
      </div>
    </form>
  );
};

export default SubjectForm;
