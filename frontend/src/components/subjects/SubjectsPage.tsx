import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BookOpenIcon,
  AcademicCapIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Subject, CreateSubjectForm, TeacherSubjectAssignment } from '../../types';
import { academicService } from '../../services/academicService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { usePermissions } from '../../hooks/usePermissions';
import SubjectForm from './SubjectForm';
import SubjectTeacherAssignmentModal from './SubjectTeacherAssignmentModal';
import ConfirmDialog from '../common/ConfirmDialog';

const SubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { canManageSubjects } = usePermissions();
  const { showSuccess, showError } = useToast();
  const { confirm, confirmState, handleClose, handleConfirm } = useConfirm();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCore, setFilterCore] = useState<boolean | undefined>(undefined);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTeacherAssignModalOpen, setIsTeacherAssignModalOpen] = useState(false);
  const [subjectForTeacherAssign, setSubjectForTeacherAssign] = useState<Subject | null>(null);
  const [currentAssignments, setCurrentAssignments] = useState<TeacherSubjectAssignment[]>([]);

  useEffect(() => {
    fetchSubjects();
  }, [filterCore, filterActive]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await academicService.getSubjects({
        is_core: filterCore,
        is_active: filterActive,
        size: 100
      });
      setSubjects(data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      showError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (data: CreateSubjectForm) => {
    try {
      setIsSubmitting(true);
      const newSubject = await academicService.createSubject(data);
      setSubjects(prev => [newSubject, ...prev]);
      setIsCreateModalOpen(false);
      showSuccess('Subject created successfully');
    } catch (error: any) {
      console.error('Failed to create subject:', error);
      showError(error.response?.data?.detail || 'Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubject = async (data: CreateSubjectForm) => {
    if (!selectedSubject) return;
    
    try {
      setIsSubmitting(true);
      const updatedSubject = await academicService.updateSubject(selectedSubject.id, data);
      setSubjects(prev => prev.map(subject => 
        subject.id === selectedSubject.id ? updatedSubject : subject
      ));
      setIsEditModalOpen(false);
      setSelectedSubject(null);
      showSuccess('Subject updated successfully');
    } catch (error: any) {
      console.error('Failed to update subject:', error);
      showError(error.response?.data?.detail || 'Failed to update subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    const confirmed = await confirm({
      title: 'Delete Subject',
      message: `Are you sure you want to delete "${subject.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      await academicService.deleteSubject(subject.id);
      setSubjects(prev => prev.filter(s => s.id !== subject.id));
      showSuccess('Subject deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete subject:', error);
      showError(error.response?.data?.detail || 'Failed to delete subject');
    }
  };

  const openEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsEditModalOpen(true);
  };

  const openTeacherAssignModal = async (subject: Subject) => {
    try {
      setSubjectForTeacherAssign(subject);
      // Load current teacher assignments for this subject
      const assignments = await academicService.getSubjectTeachers(subject.id);
      setCurrentAssignments(assignments);
      setIsTeacherAssignModalOpen(true);
    } catch (error) {
      console.error('Error loading teacher assignments:', error);
      showError('Failed to load teacher assignments');
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Permission check is now handled by the usePermissions hook

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Subjects
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage academic subjects and their configurations
          </p>
        </div>
        {canManageSubjects() && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Subject
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterCore === undefined ? 'all' : filterCore.toString()}
                onChange={(e) => setFilterCore(e.target.value === 'all' ? undefined : e.target.value === 'true')}
                className="input"
              >
                <option value="all">All Types</option>
                <option value="true">Core Subjects</option>
                <option value="false">Elective Subjects</option>
              </select>
            </div>

            <select
              value={filterActive === undefined ? 'all' : filterActive.toString()}
              onChange={(e) => setFilterActive(e.target.value === 'all' ? undefined : e.target.value === 'true')}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <div key={subject.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    subject.is_core 
                      ? 'bg-primary-100 dark:bg-primary-900' 
                      : 'bg-secondary-100 dark:bg-secondary-900'
                  }`}>
                    {subject.is_core ? (
                      <AcademicCapIcon className={`h-6 w-6 ${
                        subject.is_core 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-secondary-600 dark:text-secondary-400'
                      }`} />
                    ) : (
                      <BookOpenIcon className={`h-6 w-6 ${
                        subject.is_core 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-secondary-600 dark:text-secondary-400'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {subject.code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {canManageSubjects() && (
                    <button
                      onClick={() => navigate(`/subjects/${subject.id}`)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      title="View details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}
                  {canManageSubjects() && (
                    <button
                      onClick={() => openTeacherAssignModal(subject)}
                      className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                      title="Assign teachers"
                    >
                      <UserGroupIcon className="h-4 w-4" />
                    </button>
                  )}
                  {canManageSubjects() && (
                    <button
                      onClick={() => openEditModal(subject)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Edit subject"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                  {canManageSubjects() && (
                    <button
                      onClick={() => handleDeleteSubject(subject)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete subject"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {subject.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {subject.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Credit Units: {subject.credit_units}
                  </span>
                  <div className="flex items-center space-x-2">
                    {subject.is_core && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        Core
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      subject.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {subject.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredSubjects.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No subjects found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new subject.'}
          </p>
        </div>
      )}

      {/* Create Subject Modal */}
      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateModalOpen(false)}>
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
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Create New Subject
                    </Dialog.Title>
                    <button
                      onClick={() => setIsCreateModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <SubjectForm
                    onSubmit={handleCreateSubject}
                    onCancel={() => setIsCreateModalOpen(false)}
                    isLoading={isSubmitting}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Subject Modal */}
      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsEditModalOpen(false)}>
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
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Edit Subject
                    </Dialog.Title>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {selectedSubject && (
                    <SubjectForm
                      onSubmit={handleEditSubject}
                      onCancel={() => setIsEditModalOpen(false)}
                      initialData={{
                        name: selectedSubject.name,
                        code: selectedSubject.code,
                        description: selectedSubject.description,
                        is_core: selectedSubject.is_core,
                        credit_units: selectedSubject.credit_units
                      }}
                      isLoading={isSubmitting}
                    />
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Teacher Assignment Modal */}
      {isTeacherAssignModalOpen && subjectForTeacherAssign && (
        <SubjectTeacherAssignmentModal
          subject={subjectForTeacherAssign}
          currentAssignments={currentAssignments}
          onClose={() => {
            setIsTeacherAssignModalOpen(false);
            setSubjectForTeacherAssign(null);
            setCurrentAssignments([]);
          }}
          onSuccess={() => {
            setIsTeacherAssignModalOpen(false);
            setSubjectForTeacherAssign(null);
            setCurrentAssignments([]);
            // Optionally refresh subjects list if needed
          }}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message || ''}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
};

export default SubjectsPage;
