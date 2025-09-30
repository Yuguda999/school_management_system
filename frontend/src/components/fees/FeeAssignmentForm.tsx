import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BulkFeeAssignmentForm, FeeStructure, Class, Term, Student } from '../../types';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

interface FeeAssignmentFormProps {
  onSubmit: (data: BulkFeeAssignmentForm) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const FeeAssignmentForm: React.FC<FeeAssignmentFormProps> = ({
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { showError } = useToast();
  const { user } = useAuth();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<BulkFeeAssignmentForm>();

  const watchedFeeStructureId = watch('fee_structure_id');
  const watchedClassIds = watch('class_ids');

  useEffect(() => {
    // Skip API calls for students
    if (user?.role === 'student') {
      setLoadingData(false);
      return;
    }
    fetchFormData();
  }, [user?.role]);

  useEffect(() => {
    if (watchedFeeStructureId) {
      const feeStructure = feeStructures.find(fs => fs.id === watchedFeeStructureId);
      setSelectedFeeStructure(feeStructure || null);
      
      // Auto-select classes if fee structure is for specific classes
      if (feeStructure?.applicable_to === 'specific_classes' && feeStructure.class_ids) {
        setValue('class_ids', feeStructure.class_ids);
      }
    }
  }, [watchedFeeStructureId, feeStructures, setValue]);

  useEffect(() => {
    // Skip API calls for students
    if (user?.role === 'student') {
      return;
    }
    if (watchedClassIds && watchedClassIds.length > 0) {
      fetchStudentsForClasses(watchedClassIds);
    }
  }, [watchedClassIds, user?.role]);

  const fetchFormData = async () => {
    try {
      setLoadingData(true);
      const [feeStructuresData, classesData, termsData] = await Promise.all([
        apiService.get<FeeStructure[]>('/api/v1/fees/structures?is_active=true'),
        apiService.get<Class[]>('/api/v1/classes'),
        apiService.get<Term[]>('/api/v1/terms')
      ]);

      setFeeStructures(feeStructuresData);
      setClasses(classesData);
      setTerms(termsData);
    } catch (error) {
      console.error('Failed to fetch form data:', error);
      showError('Failed to load form data');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchStudentsForClasses = async (classIds: string[]) => {
    try {
      const studentsData = await apiService.get<Student[]>(`/api/v1/students?class_ids=${classIds.join(',')}`);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleFormSubmit = async (data: BulkFeeAssignmentForm) => {
    try {
      const submitData = {
        ...data,
        discount_amount: data.discount_amount ? Number(data.discount_amount) : 0,
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
      {/* Fee Structure Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Fee Assignment Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fee Structure */}
          <div className="md:col-span-2">
            <label className="label">
              Fee Structure *
            </label>
            <select
              className={`input ${errors.fee_structure_id ? 'input-error' : ''}`}
              {...register('fee_structure_id', {
                required: 'Fee structure is required'
              })}
            >
              <option value="">Select Fee Structure</option>
              {feeStructures.map((feeStructure) => (
                <option key={feeStructure.id} value={feeStructure.id}>
                  {feeStructure.name} - ${feeStructure.amount}
                </option>
              ))}
            </select>
            {errors.fee_structure_id && (
              <p className="error-text">{errors.fee_structure_id.message}</p>
            )}
          </div>

          {/* Term */}
          <div>
            <label className="label">
              Term *
            </label>
            <select
              className={`input ${errors.term_id ? 'input-error' : ''}`}
              {...register('term_id', {
                required: 'Term is required'
              })}
            >
              <option value="">Select Term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
            {errors.term_id && (
              <p className="error-text">{errors.term_id.message}</p>
            )}
          </div>

          {/* Discount Amount */}
          <div>
            <label className="label">
              Discount Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="0.00"
              {...register('discount_amount')}
            />
          </div>
        </div>
      </div>

      {/* Class Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Target Classes
        </h3>
        
        {selectedFeeStructure?.applicable_to === 'all' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This fee structure applies to all classes. Select specific classes to assign fees to.
            </p>
          </div>
        )}

        {selectedFeeStructure?.applicable_to === 'specific_classes' && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-700 dark:text-green-300">
              This fee structure is configured for specific classes. The applicable classes have been pre-selected.
            </p>
          </div>
        )}

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
                    required: 'Please select at least one class'
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
      </div>

      {/* Students Preview */}
      {students.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Students to be Assigned ({students.length})
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {students.map((student) => (
                <div key={student.id} className="text-sm text-gray-700 dark:text-gray-300">
                  {student.user.first_name} {student.user.last_name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fee Summary */}
      {selectedFeeStructure && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Assignment Summary
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Fee Amount:</span>
                <span className="ml-2 font-medium">${selectedFeeStructure.amount}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Students:</span>
                <span className="ml-2 font-medium">{students.length}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Revenue:</span>
                <span className="ml-2 font-medium">
                  ${(selectedFeeStructure.amount * students.length).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Fee Type:</span>
                <span className="ml-2 font-medium capitalize">{selectedFeeStructure.fee_type}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
          disabled={loading || students.length === 0}
        >
          {loading && <LoadingSpinner size="sm" className="mr-2" />}
          Assign Fees to {students.length} Students
        </button>
      </div>
    </form>
  );
};

export default FeeAssignmentForm;
