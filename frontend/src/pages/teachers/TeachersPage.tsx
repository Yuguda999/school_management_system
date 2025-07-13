import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  CalendarIcon,
  MapPinIcon,
  IdentificationIcon,
  BriefcaseIcon,
  PaperAirplaneIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Teacher, User, TeacherSubjectAssignment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/Layout/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import UserForm from '../../components/ui/UserForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import MultiStepTeacherModal from '../../components/teachers/MultiStepTeacherModal';
import TeacherInvitationModal from '../../components/teachers/TeacherInvitationModal';
import TeacherInvitationsPage from './TeacherInvitationsPage';
import TeacherSubjectsView from '../../components/teachers/TeacherSubjectsView';
import { apiService } from '../../services/api';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';

const TeachersPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubjectAssignment[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState<'teachers' | 'invitations'>('teachers');
  const [showViewModal, setShowViewModal] = useState(false);

  // Helper function to get full name
  const getFullName = (user: any) => {
    return user.full_name || `${user.first_name} ${user.last_name}`.trim();
  };

  const fetchTeacherSubjects = async (teacherId: string) => {
    try {
      setLoadingSubjects(true);
      const subjects = await academicService.getTeacherSubjects(teacherId);
      setTeacherSubjects(subjects);
    } catch (error: any) {
      console.error('Failed to fetch teacher subjects:', error);

      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      showError('Failed to load teacher subjects');
      setTeacherSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleViewTeacher = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
    await fetchTeacherSubjects(teacher.id);
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
    } catch (error: any) {
      console.error('Failed to fetch teachers:', error);

      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

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

      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

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

  const tabs = [
    {
      id: 'teachers' as const,
      name: 'Teachers',
      icon: UsersIcon,
      description: 'Manage teaching staff'
    },
    {
      id: 'invitations' as const,
      name: 'Invitations',
      icon: EnvelopeIcon,
      description: 'Manage teacher invitations'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Management"
        description="Manage teaching staff and invitations"
        actions={
          user?.role === 'super_admin' || user?.role === 'admin' ? (
            <div className="flex space-x-3">
              {activeTab === 'teachers' && (
                <>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn btn-secondary"
                  >
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Invite Teacher
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Teacher
                  </button>
                </>
              )}
              {activeTab === 'invitations' && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="btn btn-primary"
                >
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  Send Invitation
                </button>
              )}
            </div>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon
                className={`-ml-0.5 mr-2 h-5 w-5 ${
                  activeTab === tab.id
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`}
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'teachers' && (
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
                onClick={() => handleViewTeacher(teacher)}
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
      )}

      {activeTab === 'invitations' && (
        <TeacherInvitationsPage
          showInviteModal={showInviteModal}
          onCloseInviteModal={() => setShowInviteModal(false)}
        />
      )}

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

      {/* Teacher Invitation Modal - Only show when on teachers tab */}
      {activeTab === 'teachers' && (
        <TeacherInvitationModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            // Optionally refresh teachers list or show success message
          }}
        />
      )}

      {/* View Teacher Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTeacher(null);
          setTeacherSubjects([]);
        }}
        title="Teacher Details"
        size="4xl"
      >
        {selectedTeacher && (
          <div className="space-y-8">
            {/* Header with Photo and Basic Info */}
            <div className="flex items-start space-x-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl">
              <div className="h-20 w-20 flex-shrink-0">
                {selectedTeacher.user.profile_picture_url ? (
                  <img
                    src={selectedTeacher.user.profile_picture_url}
                    alt={getFullName(selectedTeacher.user)}
                    className="h-20 w-20 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-lg">
                    <UserIcon className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getFullName(selectedTeacher.user)}
                </h3>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <BriefcaseIcon className="h-4 w-4 mr-1" />
                    {selectedTeacher.user.position || 'Teacher'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <IdentificationIcon className="h-4 w-4 mr-1" />
                    {selectedTeacher.employee_id}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTeacher.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {selectedTeacher.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {selectedTeacher.department || 'General Department'}
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

            {/* Teacher Subjects Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Subject Assignments
                </h4>
                {loadingSubjects && <LoadingSpinner size="sm" />}
              </div>

              {loadingSubjects ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : teacherSubjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teacherSubjects.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {assignment.subject_name}
                          </h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Code: {assignment.subject_code}
                          </p>
                        </div>
                        {assignment.is_head_of_subject && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Head of Subject
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No subjects assigned</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    This teacher has not been assigned any subjects yet.
                  </p>
                </div>
              )}
            </div>

            {/* Detailed Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Full Name</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {getFullName(selectedTeacher.user)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Employee ID</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedTeacher.employee_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Email</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedTeacher.user.email}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Phone</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedTeacher.user.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  {(selectedTeacher.user.date_of_birth || selectedTeacher.user.gender) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedTeacher.user.date_of_birth && (
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Date of Birth</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                            {new Date(selectedTeacher.user.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedTeacher.user.gender && (
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Gender</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 capitalize">{selectedTeacher.user.gender}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BriefcaseIcon className="h-5 w-5 mr-2 text-green-600" />
                  Professional Information
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Department</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedTeacher.department || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Position</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedTeacher.user.position || 'Teacher'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Hire Date</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {new Date(selectedTeacher.hire_date).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedTeacher.user.experience_years && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Experience</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedTeacher.user.experience_years} years</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Status</span>
                      <p className="text-sm mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedTeacher.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {selectedTeacher.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Account Status</span>
                      <p className="text-sm mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedTeacher.user.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {selectedTeacher.user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            {(selectedTeacher.user.address_line1 || selectedTeacher.user.city || selectedTeacher.user.state) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Address Information
                </h4>
                <div className="space-y-4">
                  {selectedTeacher.user.address_line1 && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Address</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {selectedTeacher.user.address_line1}
                        {selectedTeacher.user.address_line2 && (
                          <>
                            <br />
                            {selectedTeacher.user.address_line2}
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedTeacher.user.city && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">City</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedTeacher.user.city}</p>
                      </div>
                    )}
                    {selectedTeacher.user.state && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">State</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedTeacher.user.state}</p>
                      </div>
                    )}
                    {selectedTeacher.user.postal_code && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Postal Code</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{selectedTeacher.user.postal_code}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Qualifications and Bio */}
            {(selectedTeacher.user.qualification || selectedTeacher.user.bio) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedTeacher.user.qualification && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <AcademicCapIcon className="h-5 w-5 mr-2 text-indigo-600" />
                      Qualifications
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                        {selectedTeacher.user.qualification}
                      </p>
                    </div>
                  </div>
                )}
                {selectedTeacher.user.bio && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-orange-600" />
                      Biography
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                        {selectedTeacher.user.bio}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Additional Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <IdentificationIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Account Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Account Created</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedTeacher.user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Last Updated</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedTeacher.user.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedTeacher.user.last_login && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Last Login</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(selectedTeacher.user.last_login).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email Verified</span>
                    <span className={`text-sm ${selectedTeacher.user.is_verified ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedTeacher.user.is_verified ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Teaching Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Subjects Assigned</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {teacherSubjects.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Head of Subjects</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {teacherSubjects.filter(s => s.is_head_of_subject).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Years of Service</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {Math.floor((new Date().getTime() - new Date(selectedTeacher.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedTeacher(null);
                  setTeacherSubjects([]);
                }}
                className="btn btn-ghost"
              >
                Close
              </button>

              {(user?.role === 'super_admin' || user?.role === 'admin') && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShowEditModal(true);
                    }}
                    className="btn btn-primary flex items-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Teacher
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleDeleteTeacher(selectedTeacher);
                    }}
                    className="btn btn-danger flex items-center"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Teacher
                  </button>
                </div>
              )}
            </div>
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
