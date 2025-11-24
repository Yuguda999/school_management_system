import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { cbtService } from '../../services/cbtService';
import { academicService } from '../../services/academicService';
import { Class, Student } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ScheduleTestModalProps {
  testId: string;
  testTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ScheduleTestModal: React.FC<ScheduleTestModalProps> = ({
  testId,
  testTitle,
  onClose,
  onSuccess
}) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [scheduleForWholeClass, setScheduleForWholeClass] = useState(true);
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadClasses();
    // Set default dates (now to 1 week from now)
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartDateTime(formatDateTimeLocal(now));
    setEndDateTime(formatDateTimeLocal(oneWeekLater));
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents();
    }
  }, [selectedClassId]);

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await academicService.getClasses({ is_active: true });
      setClasses(data);
    } catch (error: any) {
      showError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await academicService.getStudentsByClass(selectedClassId);
      setStudents(data);
      setSelectedStudentIds([]);
    } catch (error: any) {
      showError('Failed to load students');
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const handleSubmit = async () => {
    if (!selectedClassId) {
      showError('Please select a class');
      return;
    }

    if (!startDateTime || !endDateTime) {
      showError('Please select start and end date/time');
      return;
    }

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      showError('End date/time must be after start date/time');
      return;
    }

    if (!scheduleForWholeClass && selectedStudentIds.length === 0) {
      showError('Please select at least one student');
      return;
    }

    try {
      setSubmitting(true);
      await cbtService.createSchedule({
        test_id: testId,
        start_datetime: new Date(startDateTime).toISOString(),
        end_datetime: new Date(endDateTime).toISOString(),
        class_id: scheduleForWholeClass ? selectedClassId : undefined,
        student_ids: scheduleForWholeClass ? undefined : selectedStudentIds,
      });
      showSuccess('Test scheduled successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to schedule test');
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
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Schedule Test: {testTitle}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="space-y-4">
                    {/* Date/Time Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={startDateTime}
                          onChange={(e) => setStartDateTime(e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          End Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={endDateTime}
                          onChange={(e) => setEndDateTime(e.target.value)}
                          className="input w-full"
                        />
                      </div>
                    </div>

                    {/* Class Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Class
                      </label>
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="input w-full"
                      >
                        <option value="">Select a class...</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Schedule Type */}
                    {selectedClassId && (
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={scheduleForWholeClass}
                            onChange={(e) => setScheduleForWholeClass(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Schedule for entire class
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Student Selection */}
                    {selectedClassId && !scheduleForWholeClass && students.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Students ({selectedStudentIds.length} selected)
                          </label>
                          <button
                            onClick={handleSelectAll}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
                          {students.map((student) => (
                            <label
                              key={student.id}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => handleStudentToggle(student.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {student.first_name} {student.last_name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        disabled={submitting}
                      >
                        {submitting ? 'Scheduling...' : 'Schedule Test'}
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

export default ScheduleTestModal;

