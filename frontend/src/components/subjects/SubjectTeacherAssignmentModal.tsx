import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Subject, TeacherSubjectAssignment, User } from '../../types';
import { userService } from '../../services/userService';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SubjectTeacherAssignmentModalProps {
  subject: Subject;
  currentAssignments: TeacherSubjectAssignment[];
  onClose: () => void;
  onSuccess: () => void;
}

const SubjectTeacherAssignmentModal: React.FC<SubjectTeacherAssignmentModalProps> = ({
  subject,
  currentAssignments,
  onClose,
  onSuccess
}) => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [headOfSubject, setHeadOfSubject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadTeachers();
    initializeSelections();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const teachersData = await userService.getUsers({
        role: 'teacher',
        size: 100
      });
      setTeachers(teachersData.users || teachersData);
    } catch (error) {
      console.error('Error loading teachers:', error);
      showError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const initializeSelections = () => {
    // Set currently assigned teachers
    const assignedTeacherIds = currentAssignments.map(a => a.teacher_id);
    setSelectedTeachers(assignedTeacherIds);
    
    // Set current head of subject
    const currentHead = currentAssignments.find(a => a.is_head_of_subject);
    if (currentHead) {
      setHeadOfSubject(currentHead.teacher_id);
    }
  };

  const handleTeacherToggle = (teacherId: string) => {
    if (selectedTeachers.includes(teacherId)) {
      const newSelected = selectedTeachers.filter(id => id !== teacherId);
      setSelectedTeachers(newSelected);
      
      // If removing the head of subject, clear that field
      if (headOfSubject === teacherId) {
        setHeadOfSubject('');
      }
    } else {
      setSelectedTeachers([...selectedTeachers, teacherId]);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Get teachers to add and remove
      const currentTeacherIds = currentAssignments.map(a => a.teacher_id);
      const teachersToAdd = selectedTeachers.filter(id => !currentTeacherIds.includes(id));
      const teachersToRemove = currentTeacherIds.filter(id => !selectedTeachers.includes(id));

      // Remove teachers that are no longer selected
      for (const teacherId of teachersToRemove) {
        const assignment = currentAssignments.find(a => a.teacher_id === teacherId);
        if (assignment) {
          await academicService.removeTeacherSubjectAssignment(assignment.id);
        }
      }

      // Add new teachers
      for (const teacherId of teachersToAdd) {
        const assignmentData = {
          teacher_id: teacherId,
          subject_id: subject.id,
          is_head_of_subject: headOfSubject === teacherId
        };
        await academicService.assignSubjectToTeacher(teacherId, assignmentData);
      }

      // Update head of subject status for existing assignments
      for (const assignment of currentAssignments) {
        if (selectedTeachers.includes(assignment.teacher_id)) {
          const shouldBeHead = headOfSubject === assignment.teacher_id;
          if (assignment.is_head_of_subject !== shouldBeHead) {
            await academicService.updateTeacherSubjectAssignment(assignment.id, {
              is_head_of_subject: shouldBeHead
            });
          }
        }
      }

      showSuccess('Teacher assignments updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating teacher assignments:', error);
      showError('Failed to update teacher assignments');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Assign Teachers to {subject.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {teachers.map((teacher) => {
                        const isSelected = selectedTeachers.includes(teacher.id);
                        const isHead = headOfSubject === teacher.id;

                        return (
                          <div
                            key={teacher.id}
                            className={`border rounded-lg p-3 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTeacherToggle(teacher.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {teacher.first_name} {teacher.last_name}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                    ({teacher.email})
                                  </span>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name="head_of_subject"
                                    checked={isHead}
                                    onChange={() => setHeadOfSubject(teacher.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                  />
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Head of Subject
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedTeachers.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Selected Teachers ({selectedTeachers.length}):
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTeachers.map((teacherId) => {
                            const teacher = teachers.find(t => t.id === teacherId);
                            const isHead = headOfSubject === teacherId;
                            
                            return teacher ? (
                              <span
                                key={teacherId}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isHead 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                }`}
                              >
                                {teacher.first_name} {teacher.last_name}
                                {isHead && ' (Head)'}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        {submitting && <LoadingSpinner size="sm" />}
                        <span>Update Assignments</span>
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SubjectTeacherAssignmentModal;
