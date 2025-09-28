import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Exam, ExamType, Class, Subject, Term } from '../../types';
import GradeService, { ExamCreateData, ExamUpdateData } from '../../services/gradeService';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';

interface ExamFormProps {
  exam?: Exam;
  onSubmit: (exam: Exam) => void;
  onCancel: () => void;
}

interface ExamFormData {
  name: string;
  description?: string;
  exam_type: ExamType;
  exam_date: string;
  start_time?: string;
  duration_minutes?: number;
  total_marks: number;
  pass_marks: number;
  subject_id: string;
  class_id: string;
  term_id: string;
  instructions?: string;
  venue?: string;
}

const ExamForm: React.FC<ExamFormProps> = ({ exam, onSubmit, onCancel }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const { currentTerm, allTerms } = useCurrentTerm();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<ExamFormData>({
    defaultValues: exam ? {
      name: exam.name,
      description: exam.description || '',
      exam_type: exam.exam_type,
      exam_date: exam.exam_date.split('T')[0],
      start_time: exam.start_time || '',
      duration_minutes: exam.duration_minutes || undefined,
      total_marks: exam.total_marks,
      pass_marks: exam.pass_marks,
      subject_id: exam.subject_id,
      class_id: exam.class_id,
      term_id: exam.term_id,
      instructions: exam.instructions || '',
      venue: exam.venue || ''
    } : {}
  });

  const totalMarks = watch('total_marks');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesData, subjectsData] = await Promise.all([
        academicService.getClasses({ is_active: true }),
        academicService.getSubjects({ is_active: true })
      ]);

      setClasses(classesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load form data');
    }
  };

  const onFormSubmit = async (data: ExamFormData) => {
    try {
      setLoading(true);
      
      if (exam) {
        // Update existing exam
        const updateData: ExamUpdateData = {
          name: data.name,
          description: data.description,
          exam_type: data.exam_type,
          exam_date: data.exam_date,
          start_time: data.start_time,
          duration_minutes: data.duration_minutes,
          total_marks: data.total_marks,
          pass_marks: data.pass_marks,
          instructions: data.instructions,
          venue: data.venue
        };
        
        const updatedExam = await GradeService.updateExam(exam.id, updateData);
        showSuccess('Exam updated successfully');
        onSubmit(updatedExam);
      } else {
        // Create new exam
        const createData: ExamCreateData = {
          name: data.name,
          description: data.description,
          exam_type: data.exam_type,
          exam_date: data.exam_date,
          start_time: data.start_time,
          duration_minutes: data.duration_minutes,
          total_marks: data.total_marks,
          pass_marks: data.pass_marks,
          subject_id: data.subject_id,
          class_id: data.class_id,
          term_id: data.term_id,
          instructions: data.instructions,
          venue: data.venue
        };
        
        const newExam = await GradeService.createExam(createData);
        showSuccess('Exam created successfully');
        onSubmit(newExam);
      }
    } catch (error: any) {
      console.error('Error saving exam:', error);
      
      // Extract detailed error message from response
      let errorMessage = 'Failed to save exam';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle validation errors (array of error objects)
        if (Array.isArray(data)) {
          errorMessage = data.map(err => err.msg || err.message || 'Validation error').join(', ');
        }
        // Handle single error object with detail
        else if (typeof data === 'object' && data.detail) {
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
          } else if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        }
        // Handle string error
        else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const examTypeOptions: { value: ExamType; label: string }[] = [
    { value: 'continuous_assessment', label: 'Continuous Assessment' },
    { value: 'mid_term', label: 'Mid-term Exam' },
    { value: 'final_exam', label: 'Final Exam' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'project', label: 'Project' },
    { value: 'practical', label: 'Practical' },
    { value: 'oral', label: 'Oral Exam' }
  ];

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Basic Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exam Name *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Exam name is required' })}
              className="input"
              placeholder="e.g., Mathematics Mid-term Exam"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="input"
              placeholder="Optional description of the exam"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exam Type *
            </label>
            <select
              {...register('exam_type', { required: 'Exam type is required' })}
              className="input"
            >
              <option value="">Select exam type</option>
              {examTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.exam_type && (
              <p className="mt-1 text-sm text-red-600">{errors.exam_type.message}</p>
            )}
          </div>
        </div>

        {/* Academic Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Academic Details
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject *
            </label>
            <select
              {...register('subject_id', { required: 'Subject is required' })}
              className="input"
              disabled={!!exam}
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
            {errors.subject_id && (
              <p className="mt-1 text-sm text-red-600">{errors.subject_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Class *
            </label>
            <select
              {...register('class_id', { required: 'Class is required' })}
              className="input"
              disabled={!!exam}
            >
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {errors.class_id && (
              <p className="mt-1 text-sm text-red-600">{errors.class_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Term *
            </label>
            <select
              {...register('term_id', { required: 'Term is required' })}
              className="input"
              disabled={!!exam}
            >
              <option value="">Select term</option>
              {allTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name} ({term.academic_session})
                </option>
              ))}
            </select>
            {errors.term_id && (
              <p className="mt-1 text-sm text-red-600">{errors.term_id.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Exam Schedule */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Exam Schedule
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Exam Date *
            </label>
            <input
              type="date"
              {...register('exam_date', { required: 'Exam date is required' })}
              className="input"
            />
            {errors.exam_date && (
              <p className="mt-1 text-sm text-red-600">{errors.exam_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              Start Time
            </label>
            <input
              type="time"
              {...register('start_time')}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              {...register('duration_minutes', { min: 1, max: 480 })}
              className="input"
              placeholder="e.g., 120"
            />
            {errors.duration_minutes && (
              <p className="mt-1 text-sm text-red-600">Duration must be between 1 and 480 minutes</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <MapPinIcon className="w-4 h-4 inline mr-1" />
            Venue
          </label>
          <input
            type="text"
            {...register('venue')}
            className="input"
            placeholder="e.g., Main Hall, Room 101"
          />
        </div>
      </div>

      {/* Scoring */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Scoring
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Marks *
            </label>
            <input
              type="number"
              {...register('total_marks', { 
                required: 'Total marks is required',
                min: { value: 1, message: 'Total marks must be at least 1' },
                max: { value: 1000, message: 'Total marks cannot exceed 1000' }
              })}
              className="input"
              placeholder="e.g., 100"
            />
            {errors.total_marks && (
              <p className="mt-1 text-sm text-red-600">{errors.total_marks.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pass Marks *
            </label>
            <input
              type="number"
              {...register('pass_marks', { 
                required: 'Pass marks is required',
                min: { value: 0, message: 'Pass marks cannot be negative' },
                max: { value: totalMarks || 1000, message: 'Pass marks cannot exceed total marks' }
              })}
              className="input"
              placeholder="e.g., 40"
            />
            {errors.pass_marks && (
              <p className="mt-1 text-sm text-red-600">{errors.pass_marks.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Instructions
        </label>
        <textarea
          {...register('instructions')}
          rows={4}
          className="input"
          placeholder="Special instructions for the exam (optional)"
        />
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
          {loading ? 'Saving...' : exam ? 'Update Exam' : 'Create Exam'}
        </button>
      </div>
    </form>
  );
};

export default ExamForm;
