import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { Class, Teacher, Student, CreateClassForm, UpdateClassForm, ClassLevel } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/Layout/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ClassForm from '../../components/classes/ClassForm';
import ClassDetails from '../../components/classes/ClassDetails';
import ClassSubjectManagement from '../../components/classes/ClassSubjectManagement';

const ClassesPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSubjectManagementModal, setShowSubjectManagementModal] = useState(false);
  const [classForSubjectManagement, setClassForSubjectManagement] = useState<Class | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);



  const fetchClasses = async () => {
    try {
      setLoading(true);
      console.log('Fetching classes for user:', user);
      const classesData = await academicService.getClasses({
        is_active: true,
        page: 1,
        size: 100
      });
      console.log('Fetched classes:', classesData);
      setClasses(classesData);
    } catch (error: any) {
      console.error('Failed to fetch classes:', error);
      console.error('Error response:', error.response?.data);

      // If backend is not available, show empty state instead of error
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.log('Backend not available, showing empty state');
        setClasses([]);
      } else {
        // Show error message to user for other errors
        const errorMsg = error.response?.data?.detail || 'Failed to load classes. Please try again.';
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (classData: CreateClassForm) => {
    try {
      setFormLoading(true);
      console.log('Creating class with data:', classData);

      // Validate the data format
      if (!classData.name || !classData.level || !classData.academic_session) {
        showError('Please fill in all required fields', 'Validation Error');
        return;
      }

      showInfo('Creating class...', 'Please wait');
      const newClass = await academicService.createClass(classData);
      setShowCreateModal(false);
      fetchClasses(); // Refresh the list
      showSuccess(
        `Class "${newClass.name}" has been created successfully and is now available for student enrollment.`,
        'Class Created!'
      );
    } catch (error: any) {
      console.error('Failed to create class:', error);
      console.error('Error response:', error.response?.data);

      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        showError('Backend server is not available. Please start the backend server and try again.');
      } else {
        const errorMsg = error.response?.data?.detail || 'Failed to create class. Please try again.';
        showError(errorMsg);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClass = async (classData: UpdateClassForm) => {
    if (!selectedClass) return;

    try {
      setFormLoading(true);
      const updatedClass = await academicService.updateClass(selectedClass.id, classData);
      setShowEditModal(false);
      setSelectedClass(null);
      fetchClasses(); // Refresh the list
      showSuccess(
        `Class "${updatedClass.name}" has been updated successfully. All changes have been saved.`,
        'Class Updated!'
      );
    } catch (error) {
      console.error('Failed to update class:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to update class. Please try again.';
      showError(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClass = (classItem: Class) => {
    setClassToDelete(classItem);
    setShowDeleteModal(true);
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      await academicService.deleteClass(classToDelete.id);
      fetchClasses(); // Refresh the list
      showSuccess(
        `Class "${classToDelete.name}" has been permanently deleted. All associated data has been removed.`,
        'Class Deleted!'
      );
    } catch (error: any) {
      console.error('Failed to delete class:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to delete class. Please try again.';
      showError(errorMsg);
    } finally {
      setShowDeleteModal(false);
      setClassToDelete(null);
    }
  };

  const getClassLevelDisplay = (level: ClassLevel): string => {
    const levelMap: Record<ClassLevel, string> = {
      [ClassLevel.NURSERY_1]: 'Nursery 1',
      [ClassLevel.NURSERY_2]: 'Nursery 2',
      [ClassLevel.PRIMARY_1]: 'Primary 1',
      [ClassLevel.PRIMARY_2]: 'Primary 2',
      [ClassLevel.PRIMARY_3]: 'Primary 3',
      [ClassLevel.PRIMARY_4]: 'Primary 4',
      [ClassLevel.PRIMARY_5]: 'Primary 5',
      [ClassLevel.PRIMARY_6]: 'Primary 6',
      [ClassLevel.JSS_1]: 'JSS 1',
      [ClassLevel.JSS_2]: 'JSS 2',
      [ClassLevel.JSS_3]: 'JSS 3',
      [ClassLevel.SS_1]: 'SS 1',
      [ClassLevel.SS_2]: 'SS 2',
      [ClassLevel.SS_3]: 'SS 3',
    };
    return levelMap[level] || level;
  };

  const columns: Column<Class>[] = [
    {
      key: 'name',
      header: 'Class',
      sortable: true,
      render: (classItem) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {classItem.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {getClassLevelDisplay(classItem.level)}{classItem.section ? ` - Section ${classItem.section}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'teacher_name',
      header: 'Class Teacher',
      render: (classItem) => (
        <div className="flex items-center">
          {classItem.teacher_name ? (
            <>
              <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {classItem.teacher_name}
                </div>
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">Not assigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'student_count',
      header: 'Students',
      render: (classItem) => (
        <div className="flex items-center">
          <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {classItem.student_count || 0}/{classItem.capacity}
          </span>
        </div>
      ),
    },
    {
      key: 'academic_session',
      header: 'Academic Session',
      sortable: true,
      render: (classItem) => (
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="badge badge-secondary">{classItem.academic_session}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (classItem) => (
        <span className={`badge ${classItem.is_active ? 'badge-success' : 'badge-error'}`}>
          {classItem.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="Classes"
        description="Manage class schedules, assignments, and student enrollment"
        actions={
          user?.role === 'super_admin' || user?.role === 'admin' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Class
            </button>
          ) : null
        }
      />

      <DataTable
        data={classes}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search classes..."
        emptyMessage="No classes found"
        actions={(classItem) => (
          <>
            <button
              onClick={() => {
                setSelectedClass(classItem);
                setShowDetailsModal(true);
              }}
              className="btn btn-ghost btn-sm"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            {(user?.role === 'super_admin' || user?.role === 'admin') && (
              <>
                <button
                  onClick={() => {
                    setClassForSubjectManagement(classItem);
                    setShowSubjectManagementModal(true);
                  }}
                  className="btn btn-ghost btn-sm"
                  title="Manage Subjects"
                >
                  <AcademicCapIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedClass(classItem);
                    setShowEditModal(true);
                  }}
                  className="btn btn-ghost btn-sm"
                  title="Edit Class"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteClass(classItem)}
                  className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                  title="Delete Class"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </>
        )}
      />

      {/* Create Class Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Class"
        size="lg"
      >
        <ClassForm
          onSubmit={handleCreateClass}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClass(null);
        }}
        title="Edit Class"
        size="lg"
      >
        {selectedClass && (
          <ClassForm
            classData={selectedClass}
            onSubmit={handleEditClass}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedClass(null);
            }}
            loading={formLoading}
          />
        )}
      </Modal>

      {/* Class Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedClass(null);
        }}
        title="Class Details"
        size="3xl"
      >
        {selectedClass && (
          <ClassDetails
            classData={selectedClass}
            onEdit={() => {
              setShowDetailsModal(false);
              setShowEditModal(true);
            }}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedClass(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setClassToDelete(null);
        }}
        onConfirm={confirmDeleteClass}
        title="Delete Class"
        message={classToDelete ? `Are you sure you want to delete the class "${classToDelete.name}"?\n\nThis action cannot be undone and will affect all students enrolled in this class.` : ''}
        confirmText="Delete Class"
        type="danger"
      />

      {/* Class Subject Management Modal */}
      {showSubjectManagementModal && classForSubjectManagement && (
        <ClassSubjectManagement
          classData={classForSubjectManagement}
          onClose={() => {
            setShowSubjectManagementModal(false);
            setClassForSubjectManagement(null);
          }}
        />
      )}
    </div>
  );
};

export default ClassesPage;
