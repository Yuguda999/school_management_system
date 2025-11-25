import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Grade, Exam, GradeScale } from '../../types';
import GradeService from '../../services/gradeService';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import DataTable, { Column } from '../ui/DataTable';
import Card from '../ui/Card';

interface GradeListProps {
  exam: Exam;
  onGradeUpdate?: () => void;
}

interface GradeEditData {
  score: number;
  remarks?: string;
  is_published?: boolean;
}

const GradeList: React.FC<GradeListProps> = ({ exam, onGradeUpdate }) => {
  const { user } = useAuth();
  const { canManageGrades } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [gradeToDelete, setGradeToDelete] = useState<string | null>(null);
  const [editData, setEditData] = useState<GradeEditData>({
    score: 0,
    remarks: '',
    is_published: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Skip API calls for students
    if (user?.role === 'student') {
      setLoading(false);
      return;
    }
    fetchGrades();
  }, [exam.id, user?.role]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const gradesData = await GradeService.getGrades({
        exam_id: exam.id
      });
      setGrades(gradesData);
    } catch (error) {
      console.error('Error fetching grades:', error);
      showError('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const handleEditGrade = (grade: Grade) => {
    setSelectedGrade(grade);
    setEditData({
      score: Number(grade.score),
      remarks: grade.remarks || '',
      is_published: grade.is_published
    });
    setShowEditModal(true);
  };

  const handleDeleteGrade = (gradeId: string) => {
    setGradeToDelete(gradeId);
    setShowDeleteModal(true);
  };

  const confirmDeleteGrade = async () => {
    if (!gradeToDelete) return;

    try {
      await GradeService.deleteGrade(gradeToDelete);
      showSuccess('Grade deleted successfully');
      fetchGrades();
      onGradeUpdate?.();
    } catch (error: any) {
      console.error('Error deleting grade:', error);
      showError(error.response?.data?.detail || 'Failed to delete grade');
    } finally {
      setShowDeleteModal(false);
      setGradeToDelete(null);
    }
  };

  const handleUpdateGrade = async () => {
    if (!selectedGrade) return;

    try {
      setSubmitting(true);
      await GradeService.updateGrade(selectedGrade.id, editData);
      showSuccess('Grade updated successfully');
      fetchGrades();
      onGradeUpdate?.();
      setShowEditModal(false);
      setSelectedGrade(null);
    } catch (error: any) {
      console.error('Error updating grade:', error);
      showError(error.response?.data?.detail || 'Failed to update grade');
    } finally {
      setSubmitting(false);
    }
  };

  const getGradeColor = (grade?: GradeScale): string => {
    if (!grade) return 'text-gray-500';

    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 dark:text-green-400';
      case 'B+':
      case 'B':
        return 'text-blue-600 dark:text-blue-400';
      case 'C+':
      case 'C':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'D+':
      case 'D':
        return 'text-orange-600 dark:text-orange-400';
      case 'E':
      case 'F':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500';
    }
  };

  const calculateStatistics = () => {
    if (grades.length === 0) return null;

    const totalStudents = grades.length;
    const passedStudents = grades.filter(g => Number(g.score) >= exam.pass_marks).length;
    const averageScore = grades.reduce((sum, g) => sum + Number(g.score), 0) / totalStudents;
    const highestScore = Math.max(...grades.map(g => Number(g.score)));
    const lowestScore = Math.min(...grades.map(g => Number(g.score)));
    const passRate = (passedStudents / totalStudents) * 100;

    return {
      totalStudents,
      passedStudents,
      averageScore: averageScore.toFixed(1),
      highestScore,
      lowestScore,
      passRate: passRate.toFixed(1)
    };
  };

  const stats = calculateStatistics();

  const columns: Column<Grade>[] = [
    {
      key: 'student_name',
      header: 'Student',
      sortable: true,
      render: (grade) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
            <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {grade.student_name}
            </div>
            {grade.remarks && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                <DocumentTextIcon className="w-3 h-3 mr-1" />
                {grade.remarks}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      sortable: true,
      render: (grade) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {grade.score} <span className="text-gray-400 font-normal">/ {grade.total_marks}</span>
        </div>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      sortable: true,
      render: (grade) => (
        <span className={`text-sm font-bold ${getGradeColor(grade.grade)}`}>
          {grade.grade || 'N/A'}
        </span>
      ),
    },
    {
      key: 'percentage',
      header: 'Percentage',
      sortable: true,
      render: (grade) => (
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mr-2">
            <div
              className={`h-1.5 rounded-full ${Number(grade.percentage) >= 70 ? 'bg-green-500' :
                  Number(grade.percentage) >= 50 ? 'bg-blue-500' :
                    Number(grade.percentage) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              style={{ width: `${Math.min(Number(grade.percentage), 100)}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {Number(grade.percentage).toFixed(1)}%
          </span>
        </div>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      render: (grade) => (
        Number(grade.score) >= exam.pass_marks ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Pass
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Fail
          </span>
        )
      ),
    },
    {
      key: 'is_published',
      header: 'Status',
      render: (grade) => (
        grade.is_published ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Draft
          </span>
        )
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass" className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <ChartBarIcon className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card variant="glass" className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.passRate}%</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card variant="glass" className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Highest Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.highestScore}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <ArrowTrendingUpIcon className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card variant="glass" className="border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Lowest Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowestScore}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <ArrowTrendingDownIcon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Grades Table */}
      <DataTable
        data={grades}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search students..."
        emptyMessage="No grades recorded yet"
        actions={(grade) => canManageGrades() ? (
          <>
            <button
              onClick={() => handleEditGrade(grade)}
              className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Edit grade"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDeleteGrade(grade.id)}
              className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete grade"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </>
        ) : null}
      />

      {/* Edit Grade Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Grade"
      >
        {selectedGrade && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedGrade.student_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {exam.name} • {exam.subject_name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Score (Max: {exam.total_marks})
              </label>
              <input
                type="number"
                value={editData.score}
                onChange={(e) => setEditData({ ...editData, score: Number(e.target.value) })}
                className="input"
                min="0"
                max={exam.total_marks}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remarks
              </label>
              <textarea
                value={editData.remarks}
                onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                className="input"
                rows={3}
                placeholder="Optional remarks"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={editData.is_published}
                onChange={(e) => setEditData({ ...editData, is_published: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Publish grade (make visible to student)
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGrade}
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Update Grade'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteGrade}
        title="Delete Grade"
        message="Are you sure you want to delete this grade? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default GradeList;
