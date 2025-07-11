import React from 'react';
import { useForm } from 'react-hook-form';
import { StudentAcademicForm, CreateStudentForm, Class } from '../../../types';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface AcademicStepProps {
  data: Partial<CreateStudentForm>;
  onUpdate: (data: Partial<CreateStudentForm>) => void;
  classes: Class[];
  loadingClasses: boolean;
}

const AcademicStep: React.FC<AcademicStepProps> = ({ 
  data, 
  onUpdate, 
  classes, 
  loadingClasses 
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<StudentAcademicForm>({
    defaultValues: {
      admission_date: data.admission_date || new Date().toISOString().split('T')[0],
      current_class_id: data.current_class_id || '',
      notes: data.notes || '',
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
          Academic Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Please provide the student's academic details and any additional notes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Admission Date <span className="text-red-500">*</span>
          </label>
          <input
            {...register('admission_date', { 
              required: 'Admission date is required',
              validate: (value) => {
                const admissionDate = new Date(value);
                const today = new Date();
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(today.getFullYear() - 1);
                const oneYearFromNow = new Date();
                oneYearFromNow.setFullYear(today.getFullYear() + 1);
                
                if (admissionDate < oneYearAgo) {
                  return 'Admission date cannot be more than 1 year in the past';
                }
                if (admissionDate > oneYearFromNow) {
                  return 'Admission date cannot be more than 1 year in the future';
                }
                return true;
              }
            })}
            type="date"
            className="mt-1 input"
          />
          {errors.admission_date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.admission_date.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Class Assignment
          </label>
          {loadingClasses ? (
            <div className="mt-1 flex items-center justify-center h-10 border border-gray-300 dark:border-gray-600 rounded-md">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-500">Loading classes...</span>
            </div>
          ) : (
            <select
              {...register('current_class_id')}
              className="mt-1 input"
            >
              <option value="">Select a class (optional)</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.level.replace('_', ' ').toUpperCase()}
                  {classItem.section && ` (Section ${classItem.section})`}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Class can be assigned later if not decided yet
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Additional Notes
        </label>
        <textarea
          {...register('notes')}
          rows={4}
          className="mt-1 input"
          placeholder="Any additional information about the student that might be helpful for teachers and staff..."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Include any special considerations, learning preferences, behavioral notes, etc.
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Ready to Submit
            </h3>
            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
              <p>
                You've completed all the required information for student registration. 
                Review the details and click "Create Student" to complete the registration process.
              </p>
            </div>
          </div>
        </div>
      </div>

      {classes.length === 0 && !loadingClasses && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                No Classes Available
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  No active classes are currently available for assignment. 
                  You can create the student without a class assignment and assign them to a class later.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicStep;
