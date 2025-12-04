import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Student } from '../../types';
import { studentService } from '../../services/studentService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StudentProfile from '../../components/students/StudentProfile';
import MultiStepStudentModal from '../../components/students/MultiStepStudentModal';
import { ReportCardViewer } from '../../components/reports/ReportCardViewer';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const StudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      const studentData = await studentService.getStudentById(studentId);
      setStudent(studentData);
    } catch (error: any) {
      console.error('Failed to fetch student:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to load student details.';
      showError(errorMessage);
      // Navigate back to students list if student not found
      if (error.response?.status === 404) {
        navigate('/students');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    setShowEditModal(false);
    fetchStudent(); // Refresh student data
    showSuccess('Student information updated successfully');
  };

  const handleBack = () => {
    navigate('/students');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Student Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The student you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBack}
            className="btn-primary"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Student Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage student information
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowReportCard(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <DocumentTextIcon className="h-4 w-4" />
            <span>View Report Card</span>
          </button>
          <button
            onClick={handleEdit}
            className="btn-primary flex items-center space-x-2"
          >
            <PencilIcon className="h-4 w-4" />
            <span>Edit Student</span>
          </button>
        </div>
      </div>

      {/* Student Profile */}
      <div className="card">
        <StudentProfile
          student={student}
          onEdit={handleEdit}
        />
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <MultiStepStudentModal
          student={student}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
        />
      )}

      {showReportCard && student && (
        <ReportCardViewer
          isOpen={showReportCard}
          onClose={() => setShowReportCard(false)}
          studentId={student.id}
          classId={student.current_class_id}
        />
      )}
    </div>
  );
};

export default StudentDetailPage;
