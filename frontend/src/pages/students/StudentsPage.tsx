import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, DocumentArrowUpIcon, UserGroupIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Student, PaginatedResponse } from '../../types';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../hooks/useToast';
import { getSchoolCodeFromUrl, buildSchoolRouteUrl } from '../../utils/schoolCode';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StudentTable from '../../components/students/StudentTable';
import MultiStepStudentModal from '../../components/students/MultiStepStudentModal';
import FilterPanel from '../../components/students/FilterPanel';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import CSVImportModal from '../../components/students/CSVImportModal';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/ui/Card';

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const { canManageStudents } = usePermissions();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [students, setStudents] = useState<PaginatedResponse<Student> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [filters, setFilters] = useState({
    class_id: '',
    status: '',
    page: 1,
    size: 10,
  });

  useEffect(() => {
    if (user?.school_id) {
      fetchStudents();
    }
  }, [filters, searchTerm, user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudents({
        ...filters,
        search: searchTerm || undefined,
        school_id: user?.school_id || undefined,
      });
      setStudents(response);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      const errorMessage = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : 'Failed to load students. Please try again.';
      showError(errorMessage, 'Loading Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      showInfo('Generating export...', 'Please wait');
      const blob = await studentService.exportStudents({
        class_id: filters.class_id || undefined,
        status: filters.status || undefined,
        search: searchTerm || undefined,
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('Students exported successfully!', 'Export Complete');
    } catch (error: any) {
      console.error('Export failed:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to export students. Please try again.';
      showError(errorMessage, 'Export Failed');
    }
  };

  const handleCreateStudent = () => {
    setEditingStudent(null);
    setShowModal(true);
  };

  const handleViewStudent = (student: Student) => {
    const schoolCode = getSchoolCodeFromUrl();
    if (schoolCode) {
      navigate(buildSchoolRouteUrl(schoolCode, `students/${student.id}`));
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowModal(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudentToDelete(studentId);
    setShowDeleteModal(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      showInfo('Deleting student...', 'Please wait');
      await studentService.deleteStudent(studentToDelete);
      fetchStudents();
      showSuccess('Student has been successfully deleted.', 'Student Deleted!');
    } catch (error: any) {
      console.error('Failed to delete student:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete student. Please try again.';
      showError(errorMessage, 'Delete Failed');
    } finally {
      setShowDeleteModal(false);
      setStudentToDelete(null);
    }
  };

  const confirmBulkDeleteStudents = async () => {
    try {
      showInfo('Deleting students...', 'Please wait');
      await Promise.all(selectedStudents.map(id => studentService.deleteStudent(id)));
      setSelectedStudents([]);
      fetchStudents();
      showSuccess(
        `Successfully deleted ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}.`,
        'Students Deleted!'
      );
    } catch (error: any) {
      console.error('Failed to delete students:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete students. Please try again.';
      showError(errorMessage, 'Delete Failed');
    } finally {
      setShowBulkDeleteModal(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedStudents.length === 0) {
      showWarning('Please select at least one student to perform this action.', 'No Selection');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          setShowBulkDeleteModal(true);
          break;
        case 'activate':
          showInfo('Activating students...', 'Please wait');
          await studentService.bulkUpdateStudents(selectedStudents, { status: 'active' });
          setSelectedStudents([]);
          fetchStudents();
          showSuccess(
            `Successfully activated ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}.`,
            'Students Activated!'
          );
          break;
        case 'deactivate':
          showInfo('Deactivating students...', 'Please wait');
          await studentService.bulkUpdateStudents(selectedStudents, { status: 'inactive' });
          setSelectedStudents([]);
          fetchStudents();
          showSuccess(
            `Successfully deactivated ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}.`,
            'Students Deactivated!'
          );
          break;
      }
    } catch (error: any) {
      console.error('Bulk action failed:', error);
      const errorMessage = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : `Failed to ${action} students. Please try again.`;
      showError(errorMessage, 'Bulk Action Failed');
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  if (loading && !students) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Students"
          description="Manage student records and information"
        />
        {canManageStudents() && (
          <div className="flex space-x-3">
            {(user?.role === 'platform_super_admin' || user?.role === 'school_owner' || user?.role === 'school_admin') && (
              <>
                <button
                  type="button"
                  onClick={() => setShowCSVImportModal(true)}
                  className="btn btn-secondary"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  Import CSV
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="btn btn-outline"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Export CSV
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleCreateStudent}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Student
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="border-l-4 border-l-blue-500">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{students?.total || 0}</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="border-l-4 border-l-green-500">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {students?.items?.filter(s => s.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="border-l-4 border-l-purple-500">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <UserGroupIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Page</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{students?.items?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card variant="glass">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, email, or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 bg-gray-50 dark:bg-gray-900 border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}
      </Card>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && canManageStudents() && (
        <Card variant="glass" className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {selectedStudents.length} student(s) selected
            </span>
            <div className="space-x-3">
              <button
                onClick={() => handleBulkAction('activate')}
                className="text-sm font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="text-sm font-medium text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Students Table */}
      {loading ? (
        <Card>
          <LoadingSpinner className="h-32" />
        </Card>
      ) : (
        <StudentTable
          students={students?.items || []}
          selectedStudents={selectedStudents}
          onSelectionChange={setSelectedStudents}
          onView={handleViewStudent}
          onEdit={handleEditStudent}
          onDelete={handleDeleteStudent}
          pagination={{
            page: students?.page || 1,
            pages: students?.pages || 1,
            total: students?.total || 0,
            onPageChange: handlePageChange,
          }}
          showActions={true}
        />
      )}

      {/* Student Modal */}
      {showModal && (
        <MultiStepStudentModal
          student={editingStudent}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchStudents();
            if (editingStudent) {
              showSuccess('Student information has been updated successfully.', 'Student Updated!');
            } else {
              showSuccess('New student has been added successfully.', 'Student Created!');
            }
          }}
        />
      )}

      {/* Delete Student Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setStudentToDelete(null);
        }}
        onConfirm={confirmDeleteStudent}
        title="Delete Student"
        message="Are you sure you want to delete this student?\n\nThis action cannot be undone and will permanently remove all student data including grades, attendance records, and fee information."
        confirmText="Delete Student"
        type="danger"
      />

      {/* Bulk Delete Students Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmBulkDeleteStudents}
        title="Delete Students"
        message={`Are you sure you want to delete ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}?\n\nThis action cannot be undone and will permanently remove all student data.`}
        confirmText={`Delete ${selectedStudents.length} Student${selectedStudents.length > 1 ? 's' : ''}`}
        type="danger"
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showCSVImportModal}
        onClose={() => setShowCSVImportModal(false)}
        onImportComplete={fetchStudents}
      />
    </div>
  );
};

export default StudentsPage;
