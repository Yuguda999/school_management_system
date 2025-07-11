import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Student, Grade, Subject, Term } from '../../types';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useForm } from 'react-hook-form';

interface AcademicRecordsProps {
  student: Student;
  onUpdate?: () => void;
}

interface GradeFormData {
  subject_id: string;
  term_id: string;
  assignment_type: string;
  score: number;
  max_score: number;
  comments?: string;
}

const AcademicRecords: React.FC<AcademicRecordsProps> = ({
  student,
  onUpdate
}) => {
  const { currentTerm, allTerms } = useCurrentTerm();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>(currentTerm?.id || 'all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<GradeFormData>();

  // Update selected term when current term changes
  useEffect(() => {
    if (currentTerm?.id && selectedTerm !== currentTerm.id && selectedTerm === 'all') {
      setSelectedTerm(currentTerm.id);
    }
  }, [currentTerm?.id]);

  useEffect(() => {
    fetchGrades();
    fetchSubjects();
  }, [student.id]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockGrades: Grade[] = [
        {
          id: '1',
          student_id: student.id,
          subject_id: 'math1',
          term_id: 'term1',
          assignment_type: 'Test',
          score: 85,
          max_score: 100,
          date_recorded: '2024-01-15T00:00:00Z',
          comments: 'Good performance in algebra',
          student,
          subject: {
            id: 'math1',
            name: 'Mathematics',
            code: 'MATH101',
            credits: 3,
            school_id: student.user.school_id,
          },
          term: {
            id: 'term1',
            name: 'First Term',
            start_date: '2024-01-01',
            end_date: '2024-03-31',
            academic_year: '2024',
            school_id: student.user.school_id,
            is_current: true,
          },
        },
        {
          id: '2',
          student_id: student.id,
          subject_id: 'sci1',
          term_id: 'term1',
          assignment_type: 'Assignment',
          score: 92,
          max_score: 100,
          date_recorded: '2024-01-20T00:00:00Z',
          comments: 'Excellent understanding of concepts',
          student,
          subject: {
            id: 'sci1',
            name: 'Science',
            code: 'SCI101',
            credits: 3,
            school_id: student.user.school_id,
          },
          term: {
            id: 'term1',
            name: 'First Term',
            start_date: '2024-01-01',
            end_date: '2024-03-31',
            academic_year: '2024',
            school_id: student.user.school_id,
            is_current: true,
          },
        },
      ];
      setGrades(mockGrades);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      // Mock data - replace with actual API call
      const mockSubjects: Subject[] = [
        {
          id: 'math1',
          name: 'Mathematics',
          code: 'MATH101',
          credits: 3,
          school_id: student.user.school_id,
        },
        {
          id: 'sci1',
          name: 'Science',
          code: 'SCI101',
          credits: 3,
          school_id: student.user.school_id,
        },
        {
          id: 'eng1',
          name: 'English',
          code: 'ENG101',
          credits: 3,
          school_id: student.user.school_id,
        },
      ];
      setSubjects(mockSubjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };



  const handleAddGrade = () => {
    setEditingGrade(null);
    reset();
    setShowAddModal(true);
  };

  const handleEditGrade = (grade: Grade) => {
    setEditingGrade(grade);
    setValue('subject_id', grade.subject_id);
    setValue('term_id', grade.term_id);
    setValue('assignment_type', grade.assignment_type);
    setValue('score', grade.score);
    setValue('max_score', grade.max_score);
    setValue('comments', grade.comments || '');
    setShowAddModal(true);
  };

  const handleDeleteGrade = (gradeId: string) => {
    setGradeToDelete(gradeId);
    setShowDeleteModal(true);
  };

  const confirmDeleteGrade = async () => {
    if (!gradeToDelete) return;

    try {
      // Mock API call - replace with actual implementation
      console.log('Deleting grade:', gradeToDelete);
      fetchGrades();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete grade:', error);
    } finally {
      setShowDeleteModal(false);
      setGradeToDelete(null);
    }
  };

  const onSubmit = async (data: GradeFormData) => {
    try {
      if (editingGrade) {
        // Mock API call for updating grade
        console.log('Updating grade:', { ...data, id: editingGrade.id });
      } else {
        // Mock API call for creating grade
        console.log('Creating grade:', { ...data, student_id: student.id });
      }
      setShowAddModal(false);
      fetchGrades();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to save grade:', error);
    }
  };

  const filteredGrades = selectedTerm === 'all' 
    ? grades 
    : grades.filter(grade => grade.term_id === selectedTerm);

  const calculateGPA = () => {
    if (filteredGrades.length === 0) return 'N/A';
    const totalPoints = filteredGrades.reduce((sum, grade) => sum + (grade.score / grade.max_score) * 4, 0);
    return (totalPoints / filteredGrades.length).toFixed(2);
  };

  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current GPA</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {calculateGPA()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-secondary-600 dark:text-secondary-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Grades</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {filteredGrades.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Term</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {terms.find(t => t.is_current)?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by term:
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Terms</option>
            {allTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} ({term.academic_session})
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleAddGrade}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Grade
        </button>
      </div>

      {/* Grades Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Subject</th>
                <th className="table-header-cell">Term</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Score</th>
                <th className="table-header-cell">Percentage</th>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Comments</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredGrades.length > 0 ? (
                filteredGrades.map((grade) => (
                  <tr key={grade.id}>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {grade.subject.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {grade.subject.code}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {grade.term.name}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-primary">
                        {grade.assignment_type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`font-medium ${getGradeColor(grade.score, grade.max_score)}`}>
                        {grade.score}/{grade.max_score}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`font-medium ${getGradeColor(grade.score, grade.max_score)}`}>
                        {((grade.score / grade.max_score) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="table-cell">
                      {new Date(grade.date_recorded).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {grade.comments || '-'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditGrade(grade)}
                          className="btn btn-ghost btn-sm"
                          title="Edit Grade"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGrade(grade.id)}
                          className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                          title="Delete Grade"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="table-cell text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                      No grades found for the selected term
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Grade Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingGrade ? 'Edit Grade' : 'Add New Grade'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Subject *</label>
              <select
                className={`input ${errors.subject_id ? 'input-error' : ''}`}
                {...register('subject_id', { required: 'Subject is required' })}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              {errors.subject_id && (
                <p className="error-text">{errors.subject_id.message}</p>
              )}
            </div>

            <div>
              <label className="label">Term *</label>
              <select
                className={`input ${errors.term_id ? 'input-error' : ''}`}
                {...register('term_id', { required: 'Term is required' })}
              >
                <option value="">Select Term</option>
                {allTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name} ({term.academic_session})
                  </option>
                ))}
              </select>
              {errors.term_id && (
                <p className="error-text">{errors.term_id.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label">Assignment Type *</label>
            <select
              className={`input ${errors.assignment_type ? 'input-error' : ''}`}
              {...register('assignment_type', { required: 'Assignment type is required' })}
            >
              <option value="">Select Type</option>
              <option value="Test">Test</option>
              <option value="Quiz">Quiz</option>
              <option value="Assignment">Assignment</option>
              <option value="Project">Project</option>
              <option value="Exam">Exam</option>
            </select>
            {errors.assignment_type && (
              <p className="error-text">{errors.assignment_type.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Score *</label>
              <input
                type="number"
                min="0"
                step="0.1"
                className={`input ${errors.score ? 'input-error' : ''}`}
                {...register('score', { 
                  required: 'Score is required',
                  min: { value: 0, message: 'Score must be positive' }
                })}
              />
              {errors.score && (
                <p className="error-text">{errors.score.message}</p>
              )}
            </div>

            <div>
              <label className="label">Max Score *</label>
              <input
                type="number"
                min="1"
                step="0.1"
                className={`input ${errors.max_score ? 'input-error' : ''}`}
                {...register('max_score', { 
                  required: 'Max score is required',
                  min: { value: 1, message: 'Max score must be at least 1' }
                })}
              />
              {errors.max_score && (
                <p className="error-text">{errors.max_score.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label">Comments</label>
            <textarea
              rows={3}
              className="input"
              placeholder="Optional comments about the grade..."
              {...register('comments')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingGrade ? 'Update Grade' : 'Add Grade'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Grade Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setGradeToDelete(null);
        }}
        onConfirm={confirmDeleteGrade}
        title="Delete Grade"
        message="Are you sure you want to delete this grade?\n\nThis action cannot be undone."
        confirmText="Delete Grade"
        type="danger"
      />
    </div>
  );
};

export default AcademicRecords;
