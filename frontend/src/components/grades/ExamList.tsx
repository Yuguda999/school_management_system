import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Exam, ExamType, Class, Subject } from '../../types';
import GradeService from '../../services/gradeService';
import { academicService } from '../../services/academicService';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import ExamForm from './ExamForm';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import DataTable, { Column } from '../ui/DataTable';
import Card from '../ui/Card';

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
  const [showFilters, setShowFilters] = useState(false);

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
    // Skip API calls for students
    if (user?.role === 'student') {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user?.role]);

  useEffect(() => {
    // Skip API calls for students
    if (user?.role === 'student') {
      return;
    }
    fetchExams();
  }, [filters, user?.role]);

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

  const columns: Column<Exam>[] = [
    {
      key: 'name',
      header: 'Exam Details',
      sortable: true,
      render: (exam) => (
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
      ),
    },
    {
      key: 'subject_name',
      header: 'Academic Info',
      sortable: true,
      render: (exam) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-white">
            {exam.subject_name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {exam.class_name}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {exam.term_name}
          </div>
        </div>
      ),
    },
    {
      key: 'exam_date',
      header: 'Schedule',
      sortable: true,
      render: (exam) => (
        <div>
          <div className="flex items-center text-sm text-gray-900 dark:text-white">
            <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
            {new Date(exam.exam_date).toLocaleDateString()}
          </div>
          {exam.start_time && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
              <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
              {exam.start_time}
              {exam.duration_minutes && ` (${exam.duration_minutes}min)`}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (exam) => (
        <div className="w-full max-w-[140px]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-700 dark:text-gray-300">
              {exam.graded_students || 0} / {exam.total_students || 0}
            </span>
            <span className="text-gray-500">
              {exam.total_students ? Math.round(((exam.graded_students || 0) / exam.total_students) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${exam.total_students ? ((exam.graded_students || 0) / exam.total_students) * 100 : 0}%`
              }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (exam) => {
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
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              Published
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <ClockIcon className="w-3 h-3 mr-1" />
            Draft
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} w-full sm:w-auto`}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {canManageGrades() && (
          <button
            onClick={handleCreateExam}
            className="btn btn-primary w-full sm:w-auto"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Exam
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card variant="glass" className="animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        </Card>
      )}

      {/* Exam List */}
      <DataTable
        data={exams}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search exams..."
        emptyMessage="No exams found"
        actions={(exam) => (
          <>
            <button
              onClick={() => onExamSelect?.(exam)}
              className="p-1 rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              title="View grades"
            >
              <ChartBarIcon className="w-5 h-5" />
            </button>
            {canManageGrades() && (
              <>
                <button
                  onClick={() => handleEditExam(exam)}
                  className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Edit exam"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete exam"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </>
            )}
          </>
        )}
      />

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
        type="danger"
      />
    </div>
  );
};

export default ExamList;
