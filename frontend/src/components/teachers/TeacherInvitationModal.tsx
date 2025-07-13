import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { TeacherInvitationCreate } from '../../types';
import { teacherInvitationService } from '../../services/teacherInvitationService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TeacherInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TeacherInvitationModal: React.FC<TeacherInvitationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<TeacherInvitationCreate>();

  const onSubmit = async (data: TeacherInvitationCreate) => {
    setLoading(true);
    try {
      await teacherInvitationService.createInvitation(data);
      showSuccess(`Invitation sent successfully to ${data.email}`);
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error sending invitation:', error);

      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      showError(error.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center"
                  >
                    <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Invite Teacher
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="label">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className={`input ${errors.email ? 'input-error' : ''}`}
                      placeholder="teacher@example.com"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                    {errors.email && (
                      <p className="error-text">{errors.email.message}</p>
                    )}
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="label">
                      First Name *
                    </label>
                    <input
                      type="text"
                      className={`input ${errors.first_name ? 'input-error' : ''}`}
                      placeholder="John"
                      {...register('first_name', {
                        required: 'First name is required',
                        minLength: {
                          value: 2,
                          message: 'First name must be at least 2 characters'
                        }
                      })}
                    />
                    {errors.first_name && (
                      <p className="error-text">{errors.first_name.message}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="label">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      className={`input ${errors.last_name ? 'input-error' : ''}`}
                      placeholder="Doe"
                      {...register('last_name', {
                        required: 'Last name is required',
                        minLength: {
                          value: 2,
                          message: 'Last name must be at least 2 characters'
                        }
                      })}
                    />
                    {errors.last_name && (
                      <p className="error-text">{errors.last_name.message}</p>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="label">
                      Department
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Mathematics"
                      {...register('department')}
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="label">
                      Position
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Senior Teacher"
                      {...register('position')}
                    />
                  </div>

                  {/* Invitation Message */}
                  <div>
                    <label className="label">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Welcome to our school! We're excited to have you join our teaching team..."
                      {...register('invitation_message', {
                        maxLength: {
                          value: 500,
                          message: 'Message must be less than 500 characters'
                        }
                      })}
                    />
                    {errors.invitation_message && (
                      <p className="error-text">{errors.invitation_message.message}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="btn btn-ghost"
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
                          Sending...
                        </>
                      ) : (
                        <>
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Info Text */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Note:</strong> The teacher will receive an email with a link to set up their account. 
                    The invitation will expire in 72 hours.
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TeacherInvitationModal;
