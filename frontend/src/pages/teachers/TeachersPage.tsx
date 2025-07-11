import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { Teacher, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/Layout/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import UserForm from '../../components/ui/UserForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import MultiStepTeacherModal from '../../components/teachers/MultiStepTeacherModal';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const TeachersPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Helper function to get full name
  const getFullName = (user: any) => {
    return user.full_name || `${user.first_name} ${user.last_name}`.trim();
  };


  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const teachersData = await apiService.get<any[]>('/api/v1/users/teachers');

      // Transform the user data to match the Teacher interface
      const transformedTeachers: Teacher[] = teachersData.map((user: any) => ({
        id: user.id,
        user_id: user.id,
        employee_id: user.employee_id || '',
        department: user.department || '',
        hire_date: user.created_at,
        salary: 0, // Not available in user data
        status: user.is_active ? 'active' : 'inactive',
        user: {
          ...user,
          // Ensure full_name is available
          full_name: getFullName(user),
        },
        subjects: [],
        classes: [],
      }));

      setTeachers(transformedTeachers);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      // Keep empty array on error
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteTeacher = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    try {
      await apiService.delete(`/api/v1/users/${teacherToDelete.user.id}`);
      showSuccess(`Teacher ${getFullName(teacherToDelete.user)} deleted successfully`);
      fetchTeachers(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to delete teacher:', error);
      showError(error.response?.data?.detail || 'Failed to delete teacher');
    } finally {
      setShowDeleteModal(false);
      setTeacherToDelete(null);
    }
  };

  const columns: Column<Teacher>[] = [
    {
      key: 'user.full_name',
      header: 'Name',
      sortable: true,
      render: (teacher) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {getFullName(teacher.user)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {teacher.employee_id}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'user.email',
      header: 'Contact',
      render: (teacher) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
            <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
            {teacher.user.email}
          </div>
          {teacher.user.phone && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
              {teacher.user.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (teacher) => (
        <span className="badge badge-primary">
          {teacher.department || 'Not assigned'}
        </span>
      ),
    },
    {
      key: 'hire_date',
      header: 'Hire Date',
      sortable: true,
      render: (teacher) => new Date(teacher.hire_date).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (teacher) => (
        <span className={`badge ${
          teacher.status === 'active' ? 'badge-success' : 'badge-error'
        }`}>
          {teacher.status}
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
        title="Teachers"
        description="Manage teacher records and information"
        actions={
          user?.role === 'super_admin' || user?.role === 'admin' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Teacher
            </button>
          ) : null
        }
      />

      <DataTable
        data={teachers}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search teachers..."
        emptyMessage="No teachers found"
        actions={(teacher) => (
          <>
            <button
              onClick={() => {
                setSelectedTeacher(teacher);
                setShowViewModal(true);
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
                    setSelectedTeacher(teacher);
                    setShowEditModal(true);
                  }}
                  className="btn btn-ghost btn-sm"
                  title="Edit Teacher"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTeacher(teacher)}
                  className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                  title="Delete Teacher"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </>
        )}
      />

      {/* Create Teacher Modal */}
      {showCreateModal && (
        <MultiStepTeacherModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false);
            fetchTeachers(); // Refresh the list
          }}
        />
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTeacher && (
        <MultiStepTeacherModal
          teacher={selectedTeacher}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTeacher(null);
          }}
          onSave={() => {
            setShowEditModal(false);
            setSelectedTeacher(null);
            fetchTeachers(); // Refresh the list
          }}
        />
      )}

      {/* View Teacher Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTeacher(null);
        }}
        title="Teacher Details"
        size="xl"
      >
        {selectedTeacher && (
          <div className="space-y-6">
            {/* Header with Photo and Basic Info */}
            <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="h-16 w-16 flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {getFullName(selectedTeacher.user)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedTeacher.department || 'General'} • {selectedTeacher.user.position || 'Teacher'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Employee ID: {selectedTeacher.employee_id}
                </p>
              </div>
              <div>
                <span className={`badge ${
                  selectedTeacher.status === 'active' ? 'badge-success' : 'badge-error'
                }`}>
                  {selectedTeacher.status}
                </span>
              </div>
            </div>

            {/* Detailed Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Personal Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Full Name</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {getFullName(selectedTeacher.user)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedTeacher.user.email}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedTeacher.user.phone || 'Not provided'}</p>
                  </div>
                  {selectedTeacher.user.date_of_birth && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date of Birth</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(selectedTeacher.user.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedTeacher.user.gender && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Gender</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{selectedTeacher.user.gender}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Professional Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Employee ID</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedTeacher.employee_id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Department</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedTeacher.department || 'Not assigned'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Position</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedTeacher.user.position || 'Teacher'}</p>
                  </div>
                  {selectedTeacher.user.experience_years && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Experience</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{selectedTeacher.user.experience_years} years</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hire Date</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedTeacher.hire_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            {(selectedTeacher.user.address_line1 || selectedTeacher.user.city || selectedTeacher.user.state) && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTeacher.user.address_line1 && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Address</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedTeacher.user.address_line1}
                        {selectedTeacher.user.address_line2 && <br />}
                        {selectedTeacher.user.address_line2}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTeacher.user.city && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">City</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedTeacher.user.city}</p>
                      </div>
                    )}
                    {selectedTeacher.user.state && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">State</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedTeacher.user.state}</p>
                      </div>
                    )}
                  </div>
                  {selectedTeacher.user.postal_code && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Postal Code</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{selectedTeacher.user.postal_code}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Qualifications and Bio */}
            {(selectedTeacher.user.qualification || selectedTeacher.user.bio) && (
              <div className="grid grid-cols-1 gap-6">
                {selectedTeacher.user.qualification && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                      Qualifications
                    </h4>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {selectedTeacher.user.qualification}
                    </p>
                  </div>
                )}
                {selectedTeacher.user.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                      Bio
                    </h4>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {selectedTeacher.user.bio}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {(user?.role === 'super_admin' || user?.role === 'admin') && (
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                  }}
                  className="btn btn-secondary"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Teacher
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleDeleteTeacher(selectedTeacher);
                  }}
                  className="btn btn-danger"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Teacher
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Teacher Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTeacherToDelete(null);
        }}
        onConfirm={confirmDeleteTeacher}
        title="Delete Teacher"
        message={teacherToDelete ? `Are you sure you want to delete ${getFullName(teacherToDelete.user)}?\n\nThis action cannot be undone.` : ''}
        confirmText="Delete Teacher"
        type="danger"
      />
    </div>
  );
};

export default TeachersPage;
