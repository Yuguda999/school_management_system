import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  UserGroupIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { Subject, CreateSubjectForm, TeacherSubjectAssignment, Class } from '../../types';
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
  const { schoolCode } = useParams();
  const { canManageSubjects } = usePermissions();
  const { showSuccess, showError } = useToast();
  const { confirm, confirmState, handleClose, handleConfirm } = useConfirm();
  const navigate = useNavigate();

  // Data states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCore, setFilterCore] = useState<boolean | undefined>(undefined);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classSubjectIds, setClassSubjectIds] = useState<Set<string> | null>(null);

  // Sort state
  const [sortField, setSortField] = useState<keyof Subject>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    fetchClasses();
  }, [filterCore, filterActive]);

  useEffect(() => {
    const fetchClassSubjects = async () => {
      if (!selectedClassId) {
        setClassSubjectIds(null);
        return;
      }

      try {
        setLoading(true);
        const assignments = await academicService.getClassSubjects(selectedClassId);
        const subjectIds = new Set(assignments.map(a => a.subject_id));
        setClassSubjectIds(subjectIds);
      } catch (error) {
        console.error('Failed to fetch class subjects:', error);
        showError('Failed to filter by class');
      } finally {
        setLoading(false);
      }
    };

    fetchClassSubjects();
  }, [selectedClassId]);

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

  const fetchClasses = async () => {
    try {
      const data = await academicService.getClasses({ is_active: true, size: 100 });
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
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

  const handleSort = (field: keyof Subject) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = classSubjectIds ? classSubjectIds.has(subject.id) : true;

    return matchesSearch && matchesClass;
  }).sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortDirection === 'asc'
        ? (aValue === bValue ? 0 : aValue ? -1 : 1)
        : (aValue === bValue ? 0 : aValue ? 1 : -1);
    }

    return 0;
  });

  const SortIcon = ({ field }: { field: keyof Subject }) => {
    if (sortField !== field) return <div className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            className="btn btn-primary flex items-center justify-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Subject
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 uppercase tracking-wider">Class</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-white dark:bg-gray-800 border-0 rounded-md text-sm focus:ring-2 focus:ring-primary-500 py-1.5 pl-3 pr-8 min-w-[150px]"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 uppercase tracking-wider">Type</span>
              <select
                value={filterCore === undefined ? 'all' : filterCore.toString()}
                onChange={(e) => setFilterCore(e.target.value === 'all' ? undefined : e.target.value === 'true')}
                className="bg-white dark:bg-gray-800 border-0 rounded-md text-sm focus:ring-2 focus:ring-primary-500 py-1.5 pl-3 pr-8"
              >
                <option value="all">All Types</option>
                <option value="true">Core</option>
                <option value="false">Elective</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 uppercase tracking-wider">Status</span>
              <select
                value={filterActive === undefined ? 'all' : filterActive.toString()}
                onChange={(e) => setFilterActive(e.target.value === 'all' ? undefined : e.target.value === 'true')}
                className="bg-white dark:bg-gray-800 border-0 rounded-md text-sm focus:ring-2 focus:ring-primary-500 py-1.5 pl-3 pr-8"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Subject Name</span>
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={() => handleSort('code')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Code</span>
                      <SortIcon field="code" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={() => handleSort('is_core')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      <SortIcon field="is_core" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={() => handleSort('credit_units')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Units</span>
                      <SortIcon field="credit_units" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={() => handleSort('is_active')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <SortIcon field="is_active" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${subject.is_core
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400'
                          }`}>
                          {subject.is_core ? (
                            <AcademicCapIcon className="h-5 w-5" />
                          ) : (
                            <BookOpenIcon className="h-5 w-5" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {subject.name}
                          </div>
                          {subject.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {subject.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                        {subject.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subject.is_core
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-100 dark:border-primary-800'
                        : 'bg-secondary-50 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300 border border-secondary-100 dark:border-secondary-800'
                        }`}>
                        {subject.is_core ? 'Core' : 'Elective'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {subject.credit_units}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subject.is_active
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-800'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-100 dark:border-red-800'
                        }`}>
                        {subject.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {canManageSubjects() && (
                          <>
                            <button
                              onClick={() => navigate(`/${schoolCode}/subjects/${subject.id}`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="View details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openTeacherAssignModal(subject)}
                              className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Assign teachers"
                            >
                              <UserGroupIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(subject)}
                              className="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                              title="Edit subject"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(subject)}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete subject"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <BookOpenIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No subjects found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {searchTerm || selectedClassId
                ? 'No subjects match your search criteria. Try adjusting your filters.'
                : 'Get started by adding your first academic subject.'}
            </p>
            {(searchTerm || selectedClassId) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCore(undefined);
                  setFilterActive(undefined);
                  setSelectedClassId('');
                }}
                className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

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
            <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white">
                      Create New Subject
                    </Dialog.Title>
                    <button
                      onClick={() => setIsCreateModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
            <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white">
                      Edit Subject
                    </Dialog.Title>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
