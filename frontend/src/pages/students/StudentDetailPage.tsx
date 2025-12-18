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
import CertificateGeneratorModal from '../../components/students/CertificateGeneratorModal';
import StudentCredentials from '../../components/students/StudentCredentials';
import { DocumentTextIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const StudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials'>('profile');

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
            onClick={() => setShowCertificateModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Generate Certificate</span>
          </button>
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
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`${activeTab === 'profile'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`${activeTab === 'credentials'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <ShieldCheckIcon className="h-4 w-4 mr-2" />
              Credentials (VCs)
            </button>
          </nav>
        </div>

        <div className="p-6 pt-0">
          {activeTab === 'profile' ? (
            <StudentProfile
              student={student}
              onEdit={handleEdit}
            />
          ) : (
            <StudentCredentials studentId={student.id} studentName={student.full_name} />
          )}
        </div>
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
          classId={student.current_class_id || ""}
        />
      )}

      {showCertificateModal && student && (
        <CertificateGeneratorModal
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          studentId={student.id}
          studentName={student.full_name}
        />
      )}
    </div>
  );
};

export default StudentDetailPage;
