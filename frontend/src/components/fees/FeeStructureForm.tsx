import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreateFeeStructureForm, Class, Term } from '../../types';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

interface FeeStructureFormProps {
  onSubmit: (data: CreateFeeStructureForm) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateFeeStructureForm>;
  loading?: boolean;
}

const FeeStructureForm: React.FC<FeeStructureFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  loading = false
}) => {
  const { showError } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<CreateFeeStructureForm>({
    defaultValues: {
      applicable_to: 'all',
      is_mandatory: true,
      allow_installments: false,
      installment_count: 1,
      ...initialData
    }
  });

  const applicableTo = watch('applicable_to');
  const allowInstallments = watch('allow_installments');

  useEffect(() => {
    fetchFormData();
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const fetchFormData = async () => {
    try {
      setLoadingData(true);
      // Fetch classes and terms using apiService
      const [classesData, termsData] = await Promise.all([
        apiService.get<Class[]>('/api/v1/classes'),
        apiService.get<Term[]>('/api/v1/terms')
      ]);

      setClasses(classesData);
      setTerms(termsData);
    } catch (error) {
      console.error('Failed to fetch form data:', error);
      showError('Failed to load form data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleFormSubmit = async (data: CreateFeeStructureForm) => {
    try {
      // Clean up data based on applicable_to selection
      const submitData = {
        ...data,
        class_ids: data.applicable_to === 'specific_classes' ? data.class_ids : undefined,
        amount: Number(data.amount),
        late_fee_amount: data.late_fee_amount ? Number(data.late_fee_amount) : undefined,
        late_fee_days: data.late_fee_days ? Number(data.late_fee_days) : undefined,
        installment_count: data.allow_installments ? Number(data.installment_count) : 1,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fee Name */}
          <div className="md:col-span-2">
            <label className="label">
              Fee Name *
            </label>
            <input
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g., Tuition Fee - Grade 10"
              {...register('name', {
                required: 'Fee name is required',
                minLength: {
                  value: 3,
                  message: 'Fee name must be at least 3 characters'
                }
              })}
            />
            {errors.name && (
              <p className="error-text">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="label">
              Description
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Optional description of the fee"
              {...register('description')}
            />
          </div>

          {/* Fee Type */}
          <div>
            <label className="label">
              Fee Type *
            </label>
            <select
              className={`input ${errors.fee_type ? 'input-error' : ''}`}
              {...register('fee_type', {
                required: 'Fee type is required'
              })}
            >
              <option value="">Select Fee Type</option>
              <option value="tuition">Tuition</option>
              <option value="transport">Transport</option>
              <option value="library">Library</option>
              <option value="lab">Laboratory</option>
              <option value="examination">Examination</option>
              <option value="sports">Sports</option>
              <option value="uniform">Uniform</option>
              <option value="books">Books</option>
              <option value="other">Other</option>
            </select>
            {errors.fee_type && (
              <p className="error-text">{errors.fee_type.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="label">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`input ${errors.amount ? 'input-error' : ''}`}
              placeholder="0.00"
              {...register('amount', {
                required: 'Amount is required',
                min: {
                  value: 0,
                  message: 'Amount must be positive'
                }
              })}
            />
            {errors.amount && (
              <p className="error-text">{errors.amount.message}</p>
            )}
          </div>

          {/* Academic Session */}
          <div>
            <label className="label">
              Academic Session *
            </label>
            <input
              type="text"
              className={`input ${errors.academic_session ? 'input-error' : ''}`}
              placeholder="e.g., 2024-2025"
              {...register('academic_session', {
                required: 'Academic session is required'
              })}
            />
            {errors.academic_session && (
              <p className="error-text">{errors.academic_session.message}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="label">
              Due Date
            </label>
            <input
              type="date"
              className="input"
              {...register('due_date')}
            />
          </div>
        </div>
      </div>

      {/* Class Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Applicable Classes
        </h3>
        <div className="space-y-4">
          {/* Applicable To Selection */}
          <div>
            <label className="label">
              Apply To *
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="all"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  {...register('applicable_to', {
                    required: 'Please select applicable classes'
                  })}
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">All Classes</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="specific_classes"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  {...register('applicable_to')}
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">Specific Classes</span>
              </label>
            </div>
            {errors.applicable_to && (
              <p className="error-text">{errors.applicable_to.message}</p>
            )}
          </div>

          {/* Class Selection (when specific_classes is selected) */}
          {applicableTo === 'specific_classes' && (
            <div>
              <label className="label">
                Select Classes *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3">
                {classes.map((classItem) => (
                  <label key={classItem.id} className="flex items-center">
                    <input
                      type="checkbox"
                      value={classItem.id}
                      className="form-checkbox"
                      {...register('class_ids', {
                        validate: (value) => {
                          if (applicableTo === 'specific_classes' && (!value || value.length === 0)) {
                            return 'Please select at least one class';
                          }
                          return true;
                        }
                      })}
                    />
                    <span className="ml-2 text-sm">{classItem.name}</span>
                  </label>
                ))}
              </div>
              {errors.class_ids && (
                <p className="error-text">{errors.class_ids.message}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Late Fee Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Late Fee Settings (Optional)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">
              Late Fee Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="0.00"
              {...register('late_fee_amount')}
            />
          </div>
          <div>
            <label className="label">
              Late Fee After (Days)
            </label>
            <input
              type="number"
              min="1"
              className="input"
              placeholder="e.g., 30"
              {...register('late_fee_days')}
            />
          </div>
        </div>
      </div>

      {/* Installment Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Payment Settings
        </h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              {...register('allow_installments')}
            />
            <span className="ml-2">Allow Installment Payments</span>
          </label>

          {allowInstallments && (
            <div>
              <label className="label">
                Number of Installments
              </label>
              <input
                type="number"
                min="2"
                max="12"
                className={`input ${errors.installment_count ? 'input-error' : ''}`}
                placeholder="e.g., 3"
                {...register('installment_count', {
                  validate: (value) => {
                    if (allowInstallments && (!value || value < 2)) {
                      return 'Installment count must be at least 2';
                    }
                    return true;
                  }
                })}
              />
              {errors.installment_count && (
                <p className="error-text">{errors.installment_count.message}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Settings
        </h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              {...register('is_mandatory')}
            />
            <span className="ml-2">Mandatory Fee</span>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading && <LoadingSpinner size="sm" className="mr-2" />}
          {initialData ? 'Update Fee Structure' : 'Create Fee Structure'}
        </button>
      </div>
    </form>
  );
};

export default FeeStructureForm;
