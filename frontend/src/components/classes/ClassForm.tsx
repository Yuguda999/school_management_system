import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Class, Teacher, ClassLevel, CreateClassForm, UpdateClassForm } from '../../types';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface ClassFormData {
  name: string;
  level: ClassLevel;
  section?: string;
  teacher_id?: string;
  academic_session: string;
  capacity: number;
  description?: string;
}

interface ClassFormProps {
  classData?: Class;
  onSubmit: (data: ClassFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ClassForm: React.FC<ClassFormProps> = ({
  classData,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const { showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<ClassFormData>({
    defaultValues: classData ? {
      name: classData.name,
      level: classData.level,
      section: classData.section || '',
      teacher_id: classData.teacher_id || '',
      academic_session: classData.academic_session,
      capacity: classData.capacity,
      description: classData.description || ''
    } : {
      name: '',
      level: ClassLevel.PRIMARY_1,
      section: '',
      teacher_id: '',
      academic_session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      capacity: 30,
      description: ''
    }
  });

  const level = watch('level');
  const section = watch('section');

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    // Auto-generate class name based on level and section
    if (level && section) {
      const levelDisplay = level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      setValue('name', `${levelDisplay}-${section}`);
    }
  }, [level, section, setValue]);

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const teachersData = await apiService.get<any[]>('/api/v1/users/teachers');

      // Transform the user data to match the Teacher interface
      const transformedTeachers: Teacher[] = teachersData.map((user: any) => ({
        id: user.id,
        user_id: user.id,
        employee_id: user.employee_id || '',
        department: user.department || '',
        hire_date: user.created_at,
        salary: 0, // Not available in user data
        status: user.is_active ? 'active' : 'inactive',
        user: {
          ...user,
          // Ensure full_name is available
          full_name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
        },
        subjects: [],
        classes: [],
      }));

      setTeachers(transformedTeachers);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      showError('Failed to load teachers');
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const academicSessions = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`
  ];

  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class Level */}
        <div>
          <label className="label">
            Class Level *
          </label>
          <select
            className={`input ${errors.level ? 'input-error' : ''}`}
            {...register('level', {
              required: 'Class level is required'
            })}
          >
            <option value="">Select Class Level</option>
            <option value={ClassLevel.NURSERY_1}>Nursery 1</option>
            <option value={ClassLevel.NURSERY_2}>Nursery 2</option>
            <option value={ClassLevel.PRIMARY_1}>Primary 1</option>
            <option value={ClassLevel.PRIMARY_2}>Primary 2</option>
            <option value={ClassLevel.PRIMARY_3}>Primary 3</option>
            <option value={ClassLevel.PRIMARY_4}>Primary 4</option>
            <option value={ClassLevel.PRIMARY_5}>Primary 5</option>
            <option value={ClassLevel.PRIMARY_6}>Primary 6</option>
            <option value={ClassLevel.JSS_1}>JSS 1</option>
            <option value={ClassLevel.JSS_2}>JSS 2</option>
            <option value={ClassLevel.JSS_3}>JSS 3</option>
            <option value={ClassLevel.SS_1}>SS 1</option>
            <option value={ClassLevel.SS_2}>SS 2</option>
            <option value={ClassLevel.SS_3}>SS 3</option>
          </select>
          {errors.level && (
            <p className="error-text">{errors.level.message}</p>
          )}
        </div>

        {/* Section */}
        <div>
          <label className="label">
            Section
          </label>
          <select
            className={`input ${errors.section ? 'input-error' : ''}`}
            {...register('section')}
          >
            <option value="">Select Section (Optional)</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>
          {errors.section && (
            <p className="error-text">{errors.section.message}</p>
          )}
        </div>
      </div>

      {/* Class Name */}
      <div>
        <label className="label">
          Class Name *
        </label>
        <input
          type="text"
          className={`input ${errors.name ? 'input-error' : ''}`}
          {...register('name', {
            required: 'Class name is required',
            minLength: {
              value: 2,
              message: 'Class name must be at least 2 characters'
            }
          })}
        />
        {errors.name && (
          <p className="error-text">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class Teacher */}
        <div>
          <label className="label">
            Class Teacher
          </label>
          <select
            className="input"
            {...register('teacher_id')}
            disabled={loadingTeachers}
          >
            <option value="">Select Teacher (Optional)</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user.full_name} - {teacher.department}
              </option>
            ))}
          </select>
          {loadingTeachers && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Loading teachers...
            </p>
          )}
        </div>

        {/* Academic Session */}
        <div>
          <label className="label">
            Academic Session *
          </label>
          <input
            type="text"
            placeholder="e.g., 2024/2025"
            className={`input ${errors.academic_session ? 'input-error' : ''}`}
            {...register('academic_session', {
              required: 'Academic session is required',
              pattern: {
                value: /^\d{4}\/\d{4}$/,
                message: 'Academic session must be in format YYYY/YYYY'
              }
            })}
          />
          {errors.academic_session && (
            <p className="error-text">{errors.academic_session.message}</p>
          )}
        </div>
      </div>

      {/* Capacity */}
      <div>
        <label className="label">
          Class Capacity *
        </label>
        <input
          type="number"
          min="1"
          max="100"
          className={`input ${errors.capacity ? 'input-error' : ''}`}
          {...register('capacity', {
            required: 'Class capacity is required',
            valueAsNumber: true,
            min: {
              value: 1,
              message: 'Must have at least 1 student capacity'
            },
            max: {
              value: 100,
              message: 'Cannot exceed 100 students'
            }
          })}
        />
        {errors.capacity && (
          <p className="error-text">{errors.capacity.message}</p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Recommended: 20-35 students per class
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="label">
          Description
        </label>
        <textarea
          rows={3}
          className={`input ${errors.description ? 'input-error' : ''}`}
          placeholder="Optional class description..."
          {...register('description')}
        />
        {errors.description && (
          <p className="error-text">{errors.description.message}</p>
        )}
      </div>

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
          {loading ? 'Saving...' : classData ? 'Update Class' : 'Create Class'}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
