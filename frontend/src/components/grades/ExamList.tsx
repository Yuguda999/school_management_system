import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Exam, ExamType, Class, Subject, Term } from '../../types';
import GradeService from '../../services/gradeService';
import { academicService } from '../../services/academicService';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import ExamForm from './ExamForm';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';

interface ExamListProps {
  onExamSelect?: (exam: Exam) => void;
}

const ExamList: React.FC<ExamListProps> = ({ onExamSelect }) => {
  const { user } = useAuth();
  const { canManageGrades } = usePermissions();
  const { currentTerm, allTerms } = useCurrentTerm();
  const { showSuccess, showError } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);

  // Filters - Initialize with current term
  const [filters, setFilters] = useState({
    subject_id: '',
    class_id: '',
    term_id: currentTerm?.id || '',
    exam_type: '' as ExamType | '',
    is_published: undefined as boolean | undefined
  });

  // Update term filter when current term changes
  useEffect(() => {
    if (currentTerm?.id && filters.term_id !== currentTerm.id) {
      setFilters(prev => ({ ...prev, term_id: currentTerm.id }));
    }
  }, [currentTerm?.id]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [classesData, subjectsData] = await Promise.all([
        academicService.getClasses({ is_active: true }),
        academicService.getSubjects({ is_active: true })
      ]);

      setClasses(classesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load data');
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value !== undefined)
      );
      const examsData = await GradeService.getExams(params);
      setExams(examsData);
    } catch (error) {
      console.error('Error fetching exams:', error);
      showError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = () => {
    setSelectedExam(null);
    setShowCreateModal(true);
  };

  const handleEditExam = (exam: Exam) => {
    setSelectedExam(exam);
    setShowEditModal(true);
  };

  const handleDeleteExam = (examId: string) => {
    setExamToDelete(examId);
    setShowDeleteModal(true);
  };

  const confirmDeleteExam = async () => {
    if (!examToDelete) return;

    try {
      await GradeService.deleteExam(examToDelete);
      showSuccess('Exam deleted successfully');
      fetchExams();
    } catch (error: any) {
      console.error('Error deleting exam:', error);
      showError(error.response?.data?.detail || 'Failed to delete exam');
    } finally {
      setShowDeleteModal(false);
      setExamToDelete(null);
    }
  };

  const handleExamSubmit = (exam: Exam) => {
    fetchExams();
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedExam(null);
  };

  const getExamTypeLabel = (examType: ExamType): string => {
    const labels: Record<ExamType, string> = {
      continuous_assessment: 'Continuous Assessment',
      mid_term: 'Mid-term Exam',
      final_exam: 'Final Exam',
      quiz: 'Quiz',
      assignment: 'Assignment',
      project: 'Project',
      practical: 'Practical',
      oral: 'Oral Exam'
    };
    return labels[examType] || examType;
  };

  const getStatusBadge = (exam: Exam) => {
    if (!exam.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          <XCircleIcon className="w-3 h-3 mr-1" />
          Inactive
        </span>
      );
    }
    
    if (exam.is_published) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Published
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
        <ClockIcon className="w-3 h-3 mr-1" />
        Draft
      </span>
    );
  };

  // Permission check is now handled by the usePermissions hook

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Exams
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage exams and assessments
          </p>
        </div>
        {canManageGrades() && (
          <button
            onClick={handleCreateExam}
            className="btn btn-primary"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Exam
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <select
              value={filters.subject_id}
              onChange={(e) => setFilters({ ...filters, subject_id: e.target.value })}
              className="input"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Class
            </label>
            <select
              value={filters.class_id}
              onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
              className="input"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Term
            </label>
            <select
              value={filters.term_id}
              onChange={(e) => setFilters({ ...filters, term_id: e.target.value })}
              className="input"
            >
              <option value="">All Terms</option>
              {allTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={filters.exam_type}
              onChange={(e) => setFilters({ ...filters, exam_type: e.target.value as ExamType | '' })}
              className="input"
            >
              <option value="">All Types</option>
              <option value="continuous_assessment">Continuous Assessment</option>
              <option value="mid_term">Mid-term Exam</option>
              <option value="final_exam">Final Exam</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
              <option value="practical">Practical</option>
              <option value="oral">Oral Exam</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.is_published === undefined ? '' : filters.is_published.toString()}
              onChange={(e) => setFilters({ 
                ...filters, 
                is_published: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="input"
            >
              <option value="">All Status</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exam List */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center">
            <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No exams found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {canManageGrades() ? 'Create your first exam to get started.' : 'No exams available at the moment.'}
            </p>
            {canManageGrades() && (
              <button
                onClick={handleCreateExam}
                className="btn btn-primary"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Exam
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Exam Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Academic Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {exam.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getExamTypeLabel(exam.exam_type)}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {exam.total_marks} marks • Pass: {exam.pass_marks}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {exam.subject_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {exam.class_name}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {exam.term_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {new Date(exam.exam_date).toLocaleDateString()}
                      </div>
                      {exam.start_time && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {exam.start_time}
                          {exam.duration_minutes && ` (${exam.duration_minutes}min)`}
                        </div>
                      )}
                      {exam.venue && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {exam.venue}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {exam.graded_students || 0} / {exam.total_students || 0} graded
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${exam.total_students ? ((exam.graded_students || 0) / exam.total_students) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(exam)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onExamSelect?.(exam)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="View grades"
                        >
                          <ChartBarIcon className="w-4 h-4" />
                        </button>
                        {canManageGrades() && (
                          <>
                            <button
                              onClick={() => handleEditExam(exam)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit exam"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete exam"
                            >
                              <TrashIcon className="w-4 h-4" />
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
        )}
      </div>

      {/* Create Exam Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Exam"
        size="xl"
      >
        <ExamForm
          onSubmit={handleExamSubmit}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Exam Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Exam"
        size="xl"
      >
        {selectedExam && (
          <ExamForm
            exam={selectedExam}
            onSubmit={handleExamSubmit}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteExam}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone and will also delete all associated grades."
        confirmText="Delete"
        confirmButtonClass="btn-danger"
      />
    </div>
  );
};

export default ExamList;
