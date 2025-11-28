import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Class, Subject, ClassSubjectAssignment } from '../../types';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ClassSubjectManagementProps {
  classData: Class;
  onClose: () => void;
}

const ClassSubjectManagement: React.FC<ClassSubjectManagementProps> = ({
  classData,
  onClose,
}) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectAssignment[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [classData.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all subjects
      const subjectsResponse = await academicService.getSubjects({
        is_active: true,
        page: 1,
        size: 100,
      });
      setSubjects(subjectsResponse);

      // Fetch class subjects
      const classSubjectsResponse = await academicService.getClassSubjects(classData.id);
      setClassSubjects(classSubjectsResponse);

      // Calculate available subjects (not yet assigned to class)
      const assignedSubjectIds = classSubjectsResponse.map(cs => cs.subject_id);
      const available = subjectsResponse.filter(s => !assignedSubjectIds.includes(s.id));
      setAvailableSubjects(available);

    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load class subjects data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubjects = async () => {
    if (selectedSubjects.length === 0) {
      showError('Please select at least one subject');
      return;
    }

    try {
      setSubmitting(true);

      // Create subject assignments
      const assignments = selectedSubjects.map(subjectId => ({
        class_id: classData.id,
        subject_id: subjectId,
        is_core: false, // Default to false, can be updated later
      }));

      await academicService.bulkAssignSubjectsToClass(classData.id, {
        class_id: classData.id,
        subject_assignments: assignments,
      });

      showSuccess(`Successfully assigned ${selectedSubjects.length} subject${selectedSubjects.length !== 1 ? 's' : ''} to ${classData.name}. Students have been automatically enrolled.`);
      setSelectedSubjects([]);
      setShowAddModal(false);
      await fetchData(); // Refresh data

    } catch (error) {
      console.error('Error assigning subjects:', error);
      showError('Failed to assign subjects to class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSubject = async (assignmentId: string, subjectName: string) => {
    try {
      setSubmitting(true);
      await academicService.removeSubjectFromClass(classData.id, assignmentId);
      showSuccess(`Removed ${subjectName} from ${classData.name}. Student enrollments have been updated.`);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing subject:', error);
      showError('Failed to remove subject from class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCore = async (assignment: ClassSubjectAssignment) => {
    try {
      setSubmitting(true);
      await academicService.updateClassSubjectAssignment(
        classData.id,
        assignment.id,
        { is_core: !assignment.is_core }
      );
      showSuccess(`Updated ${assignment.subject_name} core status`);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating subject:', error);
      showError('Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };



  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Class Subject Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={`Manage Subjects - ${classData.name}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BookOpenIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {classSubjects.length} subjects assigned
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddModal(true)}
                disabled={submitting || availableSubjects.length === 0}
                className="btn btn-primary btn-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Subjects
              </button>
            </div>
          </div>

          {/* Current Subjects */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Assigned Subjects</h3>
            {classSubjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpenIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No subjects assigned to this class yet.</p>
                <p className="text-sm">Click "Add Subjects" to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {classSubjects.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpenIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{assignment.subject_name}</span>
                          {assignment.is_core && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Core
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Code: {assignment.subject_code}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleCore(assignment)}
                        disabled={submitting}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${assignment.is_core
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        {assignment.is_core ? 'Core' : 'Elective'}
                      </button>
                      <button
                        onClick={() => handleRemoveSubject(assignment.id, assignment.subject_name)}
                        disabled={submitting}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium">Automatic Student Enrollment</p>
                <p>
                  Students are automatically enrolled in all subjects assigned to their class.
                  When you add or remove subjects from this class, student enrollments are
                  updated automatically for the current term.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Subjects Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Subjects to Class"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select subjects to assign to {classData.name}:
          </p>

          {availableSubjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>All subjects are already assigned to this class.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableSubjects.map((subject) => (
                <label
                  key={subject.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubjects([...selectedSubjects, subject.id]);
                      } else {
                        setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  />
                  <div>
                    <div className="font-medium">{subject.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Code: {subject.code} | {subject.is_core ? 'Core' : 'Elective'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => setShowAddModal(false)}
              disabled={submitting}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSubjects}
              disabled={submitting || selectedSubjects.length === 0}
              className="btn btn-primary"
            >
              {submitting ? 'Adding...' : `Add ${selectedSubjects.length} Subject${selectedSubjects.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClassSubjectManagement;
