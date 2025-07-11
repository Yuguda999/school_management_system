import React from 'react';
import { useForm } from 'react-hook-form';
import { TeacherProfessionalInfoForm, CreateTeacherForm } from '../../../types';

interface ProfessionalInfoStepProps {
  data: Partial<CreateTeacherForm>;
  onUpdate: (data: Partial<CreateTeacherForm>) => void;
}

const ProfessionalInfoStep: React.FC<ProfessionalInfoStepProps> = ({ data, onUpdate }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TeacherProfessionalInfoForm>({
    defaultValues: {
      employee_id: data.employee_id || '',
      department: data.department || '',
      position: data.position || '',
      qualification: data.qualification || '',
      experience_years: data.experience_years || '',
      bio: data.bio || '',
    },
  });

  // Watch form changes and update parent component
  React.useEffect(() => {
    const subscription = watch((value) => {
      onUpdate(value as Partial<CreateTeacherForm>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onUpdate]);

  // Generate suggested employee ID
  const generateSuggestedEmployeeId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TCH${year}${randomNum}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Professional Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Enter the teacher's professional details and qualifications. Employee ID, Department, and Position are required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee ID */}
        <div>
          <label className="label">
            Employee ID *
          </label>
          <input
            type="text"
            className={`input ${errors.employee_id ? 'input-error' : ''}`}
            placeholder={generateSuggestedEmployeeId()}
            {...register('employee_id', {
              required: 'Employee ID is required',
              minLength: {
                value: 3,
                message: 'Employee ID must be at least 3 characters'
              }
            })}
          />
          {errors.employee_id && (
            <p className="error-text">{errors.employee_id.message}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Unique identifier for the teacher (e.g., {generateSuggestedEmployeeId()})
          </p>
        </div>

        {/* Department */}
        <div>
          <label className="label">
            Department *
          </label>
          <select
            className={`input ${errors.department ? 'input-error' : ''}`}
            {...register('department', {
              required: 'Department is required'
            })}
          >
            <option value="">Select Department</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="Social Studies">Social Studies</option>
            <option value="Physical Education">Physical Education</option>
            <option value="Arts">Arts</option>
            <option value="Music">Music</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Languages">Languages</option>
            <option value="Special Education">Special Education</option>
            <option value="Administration">Administration</option>
            <option value="General">General</option>
            <option value="Other">Other</option>
          </select>
          {errors.department && (
            <p className="error-text">{errors.department.message}</p>
          )}
        </div>

        {/* Position */}
        <div>
          <label className="label">
            Position/Title *
          </label>
          <input
            type="text"
            className={`input ${errors.position ? 'input-error' : ''}`}
            placeholder="e.g., Teacher, Senior Teacher, Head of Department"
            {...register('position', {
              required: 'Position is required'
            })}
          />
          {errors.position && (
            <p className="error-text">{errors.position.message}</p>
          )}
        </div>

        {/* Experience Years */}
        <div>
          <label className="label">
            Years of Experience
          </label>
          <select
            className="input"
            {...register('experience_years')}
          >
            <option value="">Select Experience</option>
            <option value="0-1">0-1 years</option>
            <option value="2-5">2-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="11-15">11-15 years</option>
            <option value="16-20">16-20 years</option>
            <option value="20+">20+ years</option>
          </select>
        </div>

        {/* Qualification */}
        <div className="md:col-span-2">
          <label className="label">
            Qualifications
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder="e.g., Bachelor's in Mathematics, Master's in Education, Teaching Certificate..."
            {...register('qualification')}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            List educational qualifications, certifications, and relevant training
          </p>
        </div>

        {/* Bio */}
        <div className="md:col-span-2">
          <label className="label">
            Bio/About
          </label>
          <textarea
            className="input"
            rows={4}
            placeholder="Brief description about the teacher's background, teaching philosophy, interests..."
            {...register('bio')}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Optional: Brief professional biography or teaching philosophy
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalInfoStep;
