import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { Student, CreateStudentForm, Class } from '../../types';
import { studentService } from '../../services/studentService';
import { academicService } from '../../services/academicService';
import LoadingSpinner from '../ui/LoadingSpinner';

interface StudentModalProps {
  student?: Student | null;
  onClose: () => void;
  onSave: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ student, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateStudentForm>({
    defaultValues: student ? {
      first_name: student.user.first_name,
      last_name: student.user.last_name,
      email: student.user.email,
      student_id: student.student_id,
      class_id: student.class_id || '',
      admission_date: student.admission_date.split('T')[0],
    } : {
      class_id: '',
      admission_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await academicService.getClasses();
        setClasses(data);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };
    fetchClasses();

    if (student) {
      reset({
        first_name: student.user.first_name,
        last_name: student.user.last_name,
        email: student.user.email,
        student_id: student.student_id,
        class_id: student.class_id || '',
        admission_date: student.admission_date.split('T')[0],
      });
    }
  }, [student, reset]);

  const onSubmit = async (data: CreateStudentForm) => {
    setLoading(true);
    setError('');

    try {
      if (student) {
        await studentService.updateStudent(student.id, data);
      } else {
        await studentService.createStudent(data);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save student');
    } finally {
      setLoading(false);
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
                    {student ? 'Edit Student' : 'Add New Student'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900 p-4">
                    <div className="text-sm text-red-700 dark:text-red-200">
                      {error}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        First Name
                      </label>
                      <input
                        {...register('first_name', { required: 'First name is required' })}
                        type="text"
                        className="mt-1 input"
                        placeholder="Enter first name"
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.first_name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                      </label>
                      <input
                        {...register('last_name', { required: 'Last name is required' })}
                        type="text"
                        className="mt-1 input"
                        placeholder="Enter last name"
                      />
                      {errors.last_name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.last_name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <input
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        type="email"
                        className="mt-1 input"
                        placeholder="Enter email address"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Student ID
                      </label>
                      <input
                        {...register('student_id', { required: 'Student ID is required' })}
                        type="text"
                        className="mt-1 input"
                        placeholder="Enter student ID"
                      />
                      {errors.student_id && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.student_id.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Class (Optional)
                      </label>
                      <select
                        {...register('class_id')}
                        className="mt-1 input"
                      >
                        <option value="">Select a class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Admission Date
                      </label>
                      <input
                        {...register('admission_date', { required: 'Admission date is required' })}
                        type="date"
                        className="mt-1 input"
                      />
                      {errors.admission_date && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.admission_date.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        student ? 'Update Student' : 'Create Student'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default StudentModal;
