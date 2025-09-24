import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Grade, Exam, GradeScale } from '../../types';
import GradeService from '../../services/gradeService';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

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
    fetchGrades();
  }, [exam.id]);

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
      score: grade.score,
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
        return 'text-green-600';
      case 'B+':
      case 'B':
        return 'text-blue-600';
      case 'C+':
      case 'C':
        return 'text-yellow-600';
      case 'D+':
      case 'D':
        return 'text-orange-600';
      case 'E':
      case 'F':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadge = (grade: Grade) => {
    if (grade.is_published) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Published
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
        <XCircleIcon className="w-3 h-3 mr-1" />
        Draft
      </span>
    );
  };

  const getPassFailBadge = (grade: Grade) => {
    if (grade.score >= exam.pass_marks) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          Pass
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
        Fail
      </span>
    );
  };

  // Permission check is now handled by the usePermissions hook

  const calculateStatistics = () => {
    if (grades.length === 0) return null;

    const totalStudents = grades.length;
    const passedStudents = grades.filter(g => g.score >= exam.pass_marks).length;
    const averageScore = grades.reduce((sum, g) => sum + g.score, 0) / totalStudents;
    const highestScore = Math.max(...grades.map(g => g.score));
    const lowestScore = Math.min(...grades.map(g => g.score));
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

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading grades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Info */}
      <div className="card p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {exam.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {exam.subject_name} • {exam.class_name} • {exam.term_name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Marks: {exam.total_marks} • Pass Marks: {exam.pass_marks}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Date: {new Date(exam.exam_date).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalStudents}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total Students
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {stats.passedStudents}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Passed
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {stats.passRate}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Pass Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.averageScore}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Average
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {stats.highestScore}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Highest
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {stats.lowestScore}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Lowest
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grades Table */}
      <div className="card">
        {grades.length === 0 ? (
          <div className="p-8 text-center">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No grades recorded
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No grades have been recorded for this exam yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Graded By
                  </th>
                  {canManageGrades() && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {grades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {grade.student_name}
                      </div>
                      {grade.remarks && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <DocumentTextIcon className="w-3 h-3 mr-1" />
                          {grade.remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {grade.score} / {grade.total_marks}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getGradeColor(grade.grade)}`}>
                        {grade.grade || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getGradeColor(grade.grade)}`}>
                        {grade.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPassFailBadge(grade)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(grade)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {grade.grader_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(grade.graded_date).toLocaleDateString()}
                      </div>
                    </td>
                    {canManageGrades() && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditGrade(grade)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit grade"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGrade(grade.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete grade"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Grade Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Grade"
      >
        {selectedGrade && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {selectedGrade.student_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {exam.name} • {exam.subject_name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Score (out of {exam.total_marks})
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
        confirmButtonClass="btn-danger"
      />
    </div>
  );
};

export default GradeList;
