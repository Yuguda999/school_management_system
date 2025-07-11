import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Student, PaginatedResponse } from '../../types';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StudentTable from '../../components/students/StudentTable';
import MultiStepStudentModal from '../../components/students/MultiStepStudentModal';
import FilterPanel from '../../components/students/FilterPanel';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
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
        school_id: user?.school_id,
      });
      setStudents(response);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to load students. Please try again.';
      showError(errorMessage, 'Loading Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = () => {
    setEditingStudent(null);
    setShowModal(true);
  };

  const handleViewStudent = (student: Student) => {
    navigate(`/students/${student.id}`);
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
      const errorMessage = error.response?.data?.detail || `Failed to ${action} students. Please try again.`;
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
    return <LoadingSpinner className="h-64" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage student records and information
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={handleCreateStudent}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="btn-outline"
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedStudents.length} student(s) selected
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="text-sm text-green-600 hover:text-green-500"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="text-sm text-yellow-600 hover:text-yellow-500"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner className="h-32" />
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
          />
        )}
      </div>

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
    </div>
  );
};

export default StudentsPage;
