import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Subject, TeacherSubjectAssignment } from '../../types';
import { academicService } from '../../services/academicService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SubjectTeacherAssignmentModal from '../../components/subjects/SubjectTeacherAssignmentModal';
import {
  BookOpenIcon,
  UserGroupIcon,
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const SubjectDetailPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (subjectId) {
      loadSubjectData();
    }
  }, [subjectId]);

  const loadSubjectData = async () => {
    try {
      setLoading(true);
      const [subjectData, teachersData] = await Promise.all([
        academicService.getSubject(subjectId!),
        academicService.getSubjectTeachers(subjectId!)
      ]);
      
      setSubject(subjectData);
      setTeacherAssignments(teachersData);
    } catch (error) {
      console.error('Error loading subject data:', error);
      showError('Failed to load subject information');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeacher = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this teacher assignment?')) {
      return;
    }

    try {
      await academicService.removeTeacherSubjectAssignment(assignmentId);
      showSuccess('Teacher assignment removed successfully');
      loadSubjectData();
    } catch (error) {
      console.error('Error removing teacher assignment:', error);
      showError('Failed to remove teacher assignment');
    }
  };

  const canManageAssignments = user && ['super_admin', 'admin'].includes(user.role);
  const headOfSubject = teacherAssignments.find(t => t.is_head_of_subject);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Subject not found</p>
        <button
          onClick={() => navigate('/subjects')}
          className="mt-4 btn btn-primary"
        >
          Back to Subjects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/subjects')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {subject.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Subject Code: {subject.code}
            </p>
          </div>
        </div>
        {canManageAssignments && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Assign Teachers</span>
          </button>
        )}
      </div>

      {/* Subject Info Card */}
      <div className="card p-6">
        <div className="flex items-start space-x-4">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
            subject.is_core 
              ? 'bg-primary-100 dark:bg-primary-900' 
              : 'bg-secondary-100 dark:bg-secondary-900'
          }`}>
            <BookOpenIcon className={`h-6 w-6 ${
              subject.is_core 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-secondary-600 dark:text-secondary-400'
            }`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                subject.is_core 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {subject.is_core ? 'Core Subject' : 'Elective'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {subject.credit_units} {subject.credit_units === 1 ? 'Unit' : 'Units'}
              </span>
            </div>
            {subject.description && (
              <p className="text-gray-600 dark:text-gray-300">{subject.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Teachers Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <UserGroupIcon className="h-6 w-6 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Assigned Teachers
            </h2>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm">
              {teacherAssignments.length}
            </span>
          </div>
        </div>

        {teacherAssignments.length === 0 ? (
          <div className="text-center py-8">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No teachers assigned</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No teachers have been assigned to this subject yet.
            </p>
            {canManageAssignments && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Assign Teachers</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {teacherAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {assignment.teacher_name}
                      </h4>
                      {assignment.is_head_of_subject && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Head of Subject
                        </span>
                      )}
                    </div>
                  </div>
                  {canManageAssignments && (
                    <button
                      onClick={() => handleRemoveTeacher(assignment.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Remove assignment"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {teacherAssignments.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Teachers Assigned</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {headOfSubject ? 1 : 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Head of Subject</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {subject.credit_units}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Credit Units</div>
        </div>
      </div>

      {/* Teacher Assignment Modal */}
      {showAssignModal && (
        <SubjectTeacherAssignmentModal
          subject={subject}
          currentAssignments={teacherAssignments}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            loadSubjectData();
          }}
        />
      )}
    </div>
  );
};

export default SubjectDetailPage;
