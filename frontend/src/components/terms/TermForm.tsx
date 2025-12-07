import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Term, TermType, CreateTermForm, UpdateTermForm } from '../../types';
import { AcademicSession } from '../../types/session';
import { academicService } from '../../services/academicService';
import { sessionService } from '../../services/sessionService';
import { termUtils } from '../../utils/termUtils';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TermFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  term?: Term | null;
  mode: 'create' | 'edit';
}

// Extend CreateTermForm to include academic_session_id
interface ExtendedCreateTermForm extends CreateTermForm {
  academic_session_id?: string;
}

const TermForm: React.FC<TermFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  term,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    clearErrors
  } = useForm<ExtendedCreateTermForm | UpdateTermForm>();

  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');
  const watchedAcademicSession = watch('academic_session');

  // Reset form when modal opens/closes or term changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && term) {
        reset({
          name: term.name,
          type: term.type,
          academic_session: term.academic_session,
          start_date: term.start_date,
          end_date: term.end_date,
          is_active: term.is_active,
        });
      } else {
        reset({
          name: '',
          type: TermType.FIRST_TERM,
          academic_session: '',
          academic_session_id: '',
          start_date: '',
          end_date: '',
          is_active: true,
        });
        // Load sessions for dropdown
        loadSessions();
      }
    }
  }, [isOpen, mode, term, reset]);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await sessionService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // When session is selected, auto-fill academic_session field
  const watchedSessionId = watch('academic_session_id');
  useEffect(() => {
    if (watchedSessionId && mode === 'create') {
      const selectedSession = sessions.find(s => s.id === watchedSessionId);
      if (selectedSession) {
        setValue('academic_session', selectedSession.name);
      }
    }
  }, [watchedSessionId, sessions, setValue, mode]);

  // Validate dates when they change
  useEffect(() => {
    if (watchedStartDate && watchedEndDate) {
      const dateErrors = termUtils.validateTermDates(watchedStartDate, watchedEndDate);
      if (dateErrors.length > 0) {
        // Set custom validation errors
        dateErrors.forEach(error => {
          if (error.includes('End date')) {
            setValue('end_date', watchedEndDate);
          }
        });
      } else {
        clearErrors(['start_date', 'end_date']);
      }
    }
  }, [watchedStartDate, watchedEndDate, setValue, clearErrors]);

  // Validate academic session when it changes
  useEffect(() => {
    if (watchedAcademicSession) {
      const sessionErrors = termUtils.validateAcademicSession(watchedAcademicSession);
      if (sessionErrors.length === 0) {
        clearErrors('academic_session');
      }
    }
  }, [watchedAcademicSession, clearErrors]);

  const onSubmit = async (data: CreateTermForm | UpdateTermForm) => {
    try {
      setLoading(true);

      // Additional validation
      if ('start_date' in data && 'end_date' in data) {
        const dateErrors = termUtils.validateTermDates(data.start_date!, data.end_date!);
        if (dateErrors.length > 0) {
          showError(dateErrors[0]);
          return;
        }
      }

      if ('academic_session' in data) {
        const sessionErrors = termUtils.validateAcademicSession(data.academic_session!);
        if (sessionErrors.length > 0) {
          showError(sessionErrors[0]);
          return;
        }
      }

      if (mode === 'create') {
        await academicService.createTerm(data as CreateTermForm);
        showSuccess('Term created successfully');
      } else if (mode === 'edit' && term) {
        await academicService.updateTerm(term.id, data as UpdateTermForm);
        showSuccess('Term updated successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving term:', error);
      const errorMessage = error.response?.data?.detail || `Failed to ${mode} term`;
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create New Term' : 'Edit Term'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Term Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Term Name *
          </label>
          <input
            type="text"
            {...register('name', {
              required: 'Term name is required',
              minLength: {
                value: 2,
                message: 'Term name must be at least 2 characters long'
              },
              maxLength: {
                value: 50,
                message: 'Term name cannot exceed 50 characters'
              }
            })}
            className="input"
            placeholder="e.g., First Term"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Term Type */}
        {mode === 'create' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Term Type *
            </label>
            <select
              {...register('type', { required: 'Term type is required' })}
              className="input"
            >
              <option value="">Select term type</option>
              {Object.values(TermType).map((type) => (
                <option key={type} value={type}>
                  {termUtils.formatTermType(type)}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>
        )}

        {/* Academic Session Dropdown */}
        {mode === 'create' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Academic Session *
            </label>
            {loadingSessions ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-500">Loading sessions...</span>
              </div>
            ) : (
              <select
                {...register('academic_session_id', { required: 'Please select an academic session' })}
                className="input"
              >
                <option value="">Select a session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} ({session.term_count} terms)
                  </option>
                ))}
              </select>
            )}
            {(errors as any).academic_session_id && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).academic_session_id.message}</p>
            )}
            {sessions.length === 0 && !loadingSessions && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                No sessions available. Please create a session first.
              </p>
            )}
            {/* Hidden input for academic_session (derived from selected session) */}
            <input type="hidden" {...register('academic_session')} />
          </div>
        )}

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              {...register('start_date', {
                required: 'Start date is required'
              })}
              className="input"
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date *
            </label>
            <input
              type="date"
              {...register('end_date', {
                required: 'End date is required'
              })}
              className="input"
            />
            {errors.end_date && (
              <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
            )}
          </div>
        </div>

        {/* Duration Display */}
        {watchedStartDate && watchedEndDate && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Duration: {termUtils.getTermDuration({ start_date: watchedStartDate, end_date: watchedEndDate } as Term)} days
            </p>
          </div>
        )}

        {/* Active Status (Edit mode only) */}
        {mode === 'edit' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Active term
            </label>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Create Term' : 'Update Term'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TermForm;
