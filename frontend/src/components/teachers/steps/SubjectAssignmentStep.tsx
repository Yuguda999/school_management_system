import React, { useState, useEffect } from 'react';
import { CreateTeacherForm, Subject } from '../../../types';
import { academicService } from '../../../services/academicService';
import { useToast } from '../../../hooks/useToast';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface SubjectAssignmentStepProps {
  formData: CreateTeacherForm;
  updateFormData: (data: Partial<CreateTeacherForm>) => void;
  errors: Record<string, string>;
}

const SubjectAssignmentStep: React.FC<SubjectAssignmentStepProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const subjectsData = await academicService.getSubjects({ is_active: true });
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading subjects:', error);
      showError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    const currentSubjects = formData.subject_ids || [];
    let updatedSubjects: string[];

    if (currentSubjects.includes(subjectId)) {
      updatedSubjects = currentSubjects.filter(id => id !== subjectId);
      // If removing the head of subject, clear that field
      if (formData.head_of_subject_id === subjectId) {
        updateFormData({ 
          subject_ids: updatedSubjects,
          head_of_subject_id: undefined
        });
        return;
      }
    } else {
      updatedSubjects = [...currentSubjects, subjectId];
    }

    updateFormData({ subject_ids: updatedSubjects });
  };

  const handleHeadOfSubjectChange = (subjectId: string) => {
    updateFormData({ head_of_subject_id: subjectId });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Subject Assignments</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the subjects this teacher will teach. You can also designate them as head of a subject.
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No subjects available. Please create subjects first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {subjects.map((subject) => {
              const isSelected = formData.subject_ids?.includes(subject.id) || false;
              const isHeadOfSubject = formData.head_of_subject_id === subject.id;

              return (
                <div
                  key={subject.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`subject-${subject.id}`}
                        checked={isSelected}
                        onChange={() => handleSubjectToggle(subject.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <label
                          htmlFor={`subject-${subject.id}`}
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {subject.name}
                        </label>
                        <p className="text-xs text-gray-500">
                          Code: {subject.code} | {subject.is_core ? 'Core' : 'Elective'} | {subject.credit_units} units
                        </p>
                        {subject.description && (
                          <p className="text-xs text-gray-600 mt-1">{subject.description}</p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`head-${subject.id}`}
                          name="head_of_subject"
                          checked={isHeadOfSubject}
                          onChange={() => handleHeadOfSubjectChange(subject.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor={`head-${subject.id}`}
                          className="text-xs text-gray-700 cursor-pointer"
                        >
                          Head of Subject
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {formData.subject_ids && formData.subject_ids.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Subjects:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.subject_ids.map((subjectId) => {
                  const subject = subjects.find(s => s.id === subjectId);
                  const isHead = formData.head_of_subject_id === subjectId;
                  
                  return subject ? (
                    <span
                      key={subjectId}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isHead 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {subject.name}
                      {isHead && ' (Head)'}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-4">
            <p>• You can assign multiple subjects to a teacher</p>
            <p>• Only one teacher can be head of each subject</p>
            <p>• Subject assignments can be modified later</p>
          </div>
        </div>
      )}

      {errors.subject_ids && (
        <p className="text-sm text-red-600">{errors.subject_ids}</p>
      )}
    </div>
  );
};

export default SubjectAssignmentStep;
