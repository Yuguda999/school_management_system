import React, { useState, useEffect } from 'react';
import { 
  TeacherSubjectAssignment, 
  Subject, 
  BulkTeacherSubjectAssignment 
} from '../../types';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  AcademicCapIcon 
} from '@heroicons/react/24/outline';

interface TeacherSubjectsViewProps {
  teacherId: string;
  teacherName: string;
  onUpdate?: () => void;
}

const TeacherSubjectsView: React.FC<TeacherSubjectsViewProps> = ({
  teacherId,
  teacherName,
  onUpdate
}) => {
  const [assignments, setAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [headOfSubject, setHeadOfSubject] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, subjectsData] = await Promise.all([
        academicService.getTeacherSubjects(teacherId),
        academicService.getSubjects({ is_active: true })
      ]);
      
      setAssignments(assignmentsData);
      setAllSubjects(subjectsData);
      
      // Set current selections for editing
      setSelectedSubjects(assignmentsData.map(a => a.subject_id));
      const headSubject = assignmentsData.find(a => a.is_head_of_subject);
      setHeadOfSubject(headSubject?.subject_id || '');
    } catch (error) {
      console.error('Error loading teacher subjects:', error);
      showError('Failed to load teacher subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    try {
      setSubmitting(true);
      
      const assignmentData: Omit<BulkTeacherSubjectAssignment, 'teacher_id'> = {
        subject_ids: selectedSubjects,
        head_of_subject_id: headOfSubject || undefined
      };

      await academicService.bulkAssignSubjectsToTeacher(teacherId, assignmentData);
      
      showSuccess('Subject assignments updated successfully');
      setShowAssignModal(false);
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating subject assignments:', error);
      showError('Failed to update subject assignments');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this subject assignment?')) {
      return;
    }

    try {
      await academicService.removeTeacherSubjectAssignment(assignmentId);
      showSuccess('Subject assignment removed successfully');
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing assignment:', error);
      showError('Failed to remove subject assignment');
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    if (selectedSubjects.includes(subjectId)) {
      const newSelected = selectedSubjects.filter(id => id !== subjectId);
      setSelectedSubjects(newSelected);
      
      // If removing the head of subject, clear that field
      if (headOfSubject === subjectId) {
        setHeadOfSubject('');
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Subject Assignments</h3>
          <p className="text-sm text-gray-600">
            Subjects assigned to {teacherName}
          </p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PencilIcon className="h-4 w-4" />
          <span>Manage Subjects</span>
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects assigned</h3>
          <p className="mt-1 text-sm text-gray-500">
            This teacher has not been assigned any subjects yet.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAssignModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Assign Subjects</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {assignment.subject_name}
                    </h4>
                    <span className="text-xs text-gray-500">
                      ({assignment.subject_code})
                    </span>
                    {assignment.is_head_of_subject && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Head of Subject
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAssignment(assignment.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Remove assignment"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Subject Assignments
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {allSubjects.map((subject) => {
                  const isSelected = selectedSubjects.includes(subject.id);
                  const isHead = headOfSubject === subject.id;

                  return (
                    <div
                      key={subject.id}
                      className={`border rounded-lg p-3 ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSubjectToggle(subject.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {subject.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({subject.code})
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="head_of_subject"
                              checked={isHead}
                              onChange={() => setHeadOfSubject(subject.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <label className="text-xs text-gray-700">
                              Head of Subject
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={submitting}
                  className="btn-primary flex items-center space-x-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  <span>Update Assignments</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSubjectsView;
