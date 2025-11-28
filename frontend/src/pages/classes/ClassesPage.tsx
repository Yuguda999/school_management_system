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
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { Class, CreateClassForm, UpdateClassForm, ClassLevel } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
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
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

const ClassesPage: React.FC = () => {
  const { user } = useAuth();
  const { canManageClasses } = usePermissions();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();
  const schoolCode = getSchoolCodeFromUrl();

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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const classesData = await academicService.getClasses({
        is_active: true,
        page: 1,
        size: 100
      });
      setClasses(classesData);
    } catch (error: any) {
      console.error('Failed to fetch classes:', error);
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        setClasses([]);
      } else {
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
      if (!classData.name || !classData.level || !classData.academic_session) {
        showError('Please fill in all required fields', 'Validation Error');
        return;
      }

      showInfo('Creating class...', 'Please wait');
      const newClass = await academicService.createClass(classData);
      setShowCreateModal(false);
      fetchClasses();
      showSuccess(
        `Class "${newClass.name}" has been created successfully.`,
        'Class Created!'
      );
    } catch (error: any) {
      console.error('Failed to create class:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to create class. Please try again.';
      showError(errorMsg);
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
      fetchClasses();
      showSuccess(
        `Class "${updatedClass.name}" has been updated successfully.`,
        'Class Updated!'
      );
    } catch (error: any) {
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
      fetchClasses();
      showSuccess(
        `Class "${classToDelete.name}" has been deleted.`,
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center shadow-sm">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
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
              <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {classItem.teacher_name}
              </span>
            </>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
              Unassigned
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'student_count',
      header: 'Students',
      render: (classItem) => (
        <div className="flex items-center">
          <div className="w-full max-w-[100px]">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">{classItem.student_count || 0}</span>
              <span className="text-gray-500">/ {classItem.capacity}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((classItem.student_count || 0) / classItem.capacity) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'academic_session',
      header: 'Session',
      sortable: true,
      render: (classItem) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
          <CalendarIcon className="h-3 w-3 mr-1" />
          {classItem.academic_session}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (classItem) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classItem.is_active
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
          {classItem.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalStudents = classes.reduce((acc, curr) => acc + (curr.student_count || 0), 0);
  const totalCapacity = classes.reduce((acc, curr) => acc + curr.capacity, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Class Management"
        description="Manage class schedules, assignments, and student enrollment"
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="border-l-4 border-l-indigo-500">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{classes.length}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="border-l-4 border-l-blue-500">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="border-l-4 border-l-teal-500">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-teal-100 dark:bg-teal-900/30">
              <ChartBarIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{occupancyRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions & Search */}
      <Card variant="glass">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 bg-gray-50 dark:bg-gray-900 border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex gap-3">
            {user?.role === 'teacher' && (
              <button
                onClick={() => navigate(`/${schoolCode}/teacher/attendance/class`)}
                className="btn btn-secondary"
              >
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                Take Attendance
              </button>
            )}
            {canManageClasses() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Class
              </button>
            )}
          </div>
        </div>
      </Card>

      <DataTable
        data={classes.filter(c =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )}
        columns={columns}
        loading={loading}
        searchable={false} // We handle search externally
        emptyMessage="No classes found"
        actions={(classItem) => (
          <>
            <button
              onClick={() => {
                setSelectedClass(classItem);
                setShowDetailsModal(true);
              }}
              className="p-1 rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              title="View Details"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            {canManageClasses() && (
              <>
                <button
                  onClick={() => {
                    setClassForSubjectManagement(classItem);
                    setShowSubjectManagementModal(true);
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  title="Manage Subjects"
                >
                  <AcademicCapIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedClass(classItem);
                    setShowEditModal(true);
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Edit Class"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteClass(classItem)}
                  className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete Class"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </>
        )}
      />

      {/* Modals */}
      {showCreateModal && (
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
      )}

      {showEditModal && selectedClass && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClass(null);
          }}
          title="Edit Class"
          size="lg"
        >
          <ClassForm
            classData={selectedClass}
            onSubmit={handleEditClass}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedClass(null);
            }}
            loading={formLoading}
          />
        </Modal>
      )}

      {showDetailsModal && selectedClass && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedClass(null);
          }}
          title="Class Details"
          size="3xl"
        >
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
        </Modal>
      )}

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
