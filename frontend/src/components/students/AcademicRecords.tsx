import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Student, Subject } from '../../types';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useForm } from 'react-hook-form';
import GradeService, { Grade, Exam } from '../../services/gradeService';
import { academicService } from '../../services/academicService';

interface AcademicRecordsProps {
  student: Student;
  onUpdate?: () => void;
}

interface GradeFormData {
  subject_id: string;
  term_id: string;
  exam_id: string;
  score: number;
  comments?: string;
}

const AcademicRecords: React.FC<AcademicRecordsProps> = ({
  student,
  onUpdate
}) => {
  const { currentTerm, allTerms } = useCurrentTerm();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>(currentTerm?.id || 'all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<GradeFormData>();

  const selectedSubjectId = watch('subject_id');
  const selectedTermId = watch('term_id');
  const selectedExamId = watch('exam_id');

  const selectedExam = exams.find(e => e.id === selectedExamId);

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

  // Fetch exams when subject or term changes in the form
  useEffect(() => {
    if (selectedSubjectId && selectedTermId) {
      fetchExams(selectedSubjectId, selectedTermId);
    } else {
      setExams([]);
    }
  }, [selectedSubjectId, selectedTermId]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const fetchedGrades = await GradeService.getGrades({
        student_id: student.id,
        // Show all grades for admin/teacher view
      });
      setGrades(fetchedGrades);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const fetchedSubjects = await academicService.getSubjects({ is_active: true });
      setSubjects(fetchedSubjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchExams = async (subjectId: string, termId: string) => {
    try {
      const fetchedExams = await GradeService.getExams({
        subject_id: subjectId,
        term_id: termId,
        class_id: student.current_class_id, // Filter by student's class
        is_active: true
      });
      setExams(fetchedExams);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      setExams([]);
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
    // We need to fetch exams for this grade's subject/term so the exam dropdown works
    fetchExams(grade.subject_id, grade.term_id).then(() => {
      setValue('exam_id', grade.exam_id);
    });
    setValue('score', grade.score);
    setValue('comments', grade.remarks || '');
    setShowAddModal(true);
  };

  const handleDeleteGrade = (gradeId: string) => {
    setGradeToDelete(gradeId);
    setShowDeleteModal(true);
  };

  const confirmDeleteGrade = async () => {
    if (!gradeToDelete) return;

    try {
      await GradeService.deleteGrade(gradeToDelete);
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
      // Find the selected exam to get total marks
      const exam = exams.find(e => e.id === data.exam_id);
      if (!exam) {
        console.error('Selected exam not found');
        return;
      }

      if (editingGrade) {
        await GradeService.updateGrade(editingGrade.id, {
          score: Number(data.score),
          remarks: data.comments
        });
      } else {
        await GradeService.createGrade({
          student_id: student.id,
          subject_id: data.subject_id,
          term_id: data.term_id,
          exam_id: data.exam_id,
          score: Number(data.score),
          total_marks: exam.total_marks,
          remarks: data.comments
        });
      }
      setShowAddModal(false);
      fetchGrades();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to save grade:', error);
    }
  };

  const filteredGrades = grades.filter(grade => {
    const matchesTerm = selectedTerm === 'all' || grade.term_id === selectedTerm;
    const matchesSearch =
      grade.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.exam_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTerm && matchesSearch;
  });

  const calculateGPA = () => {
    if (filteredGrades.length === 0) return 'N/A';
    const totalPoints = filteredGrades.reduce((sum, grade) => sum + (grade.score / grade.total_marks) * 4, 0);
    return (totalPoints / filteredGrades.length).toFixed(2);
  };

  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBarColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
              <ChartBarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average GPA</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {calculateGPA()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900/20">
              <DocumentTextIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {filteredGrades.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Term</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate max-w-[150px]" title={allTerms.find(t => t.is_current)?.name}>
                {allTerms.find(t => t.is_current)?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects or exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input w-full sm:w-64"
            />
          </div>

          <div className="relative">
            <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="pl-10 input w-full sm:w-48 appearance-none"
            >
              <option value="all">All Terms</option>
              {allTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAddGrade}
          className="btn btn-primary w-full sm:w-auto flex items-center justify-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Grade
        </button>
      </div>

      {/* Grades List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading grades...</p>
          </div>
        ) : filteredGrades.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredGrades.map((grade) => {
                    const percentage = (grade.score / grade.total_marks) * 100;
                    return (
                      <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                              {grade.subject_name?.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{grade.subject_name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {subjects.find(s => s.id === grade.subject_id)?.code || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{grade.exam_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {allTerms.find(t => t.id === grade.term_id)?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full max-w-xs">
                            <div className="flex justify-between items-end mb-1">
                              <span className={`text-sm font-bold ${getGradeColor(grade.score, grade.total_marks)}`}>
                                {grade.score} <span className="text-gray-400 text-xs font-normal">/ {grade.total_marks}</span>
                              </span>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getProgressBarColor(grade.score, grade.total_marks)}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(grade.graded_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditGrade(grade)}
                              className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGrade(grade.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-4 p-4">
              {filteredGrades.map((grade) => {
                const percentage = (grade.score / grade.total_marks) * 100;
                return (
                  <div key={grade.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                          {grade.subject_name?.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{grade.subject_name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{grade.exam_name}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditGrade(grade)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 bg-white dark:bg-gray-800 rounded-md shadow-sm"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGrade(grade.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-gray-800 rounded-md shadow-sm"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Score</span>
                          <span className={`text-sm font-bold ${getGradeColor(grade.score, grade.total_marks)}`}>
                            {grade.score} <span className="text-gray-400 text-xs font-normal">/ {grade.total_marks}</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressBarColor(grade.score, grade.total_marks)}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span>{allTerms.find(t => t.id === grade.term_id)?.name}</span>
                        <span>{new Date(grade.graded_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600">
              <DocumentTextIcon />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No grades found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search or filters, or add a new grade.
            </p>
          </div>
        )}
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
                disabled={!!editingGrade}
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
                disabled={!!editingGrade}
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
            <label className="label">Exam *</label>
            <select
              className={`input ${errors.exam_id ? 'input-error' : ''}`}
              {...register('exam_id', { required: 'Exam is required' })}
              disabled={!!editingGrade || !selectedSubjectId || !selectedTermId}
            >
              <option value="">Select Exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} ({exam.exam_type}) - Max: {exam.total_marks}
                </option>
              ))}
            </select>
            {errors.exam_id && (
              <p className="error-text">{errors.exam_id.message}</p>
            )}
            {!selectedSubjectId || !selectedTermId ? (
              <p className="text-xs text-gray-500 mt-1">Select Subject and Term first</p>
            ) : exams.length === 0 ? (
              <p className="text-xs text-orange-500 mt-1">No exams found for this subject/term</p>
            ) : null}
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
                  min: { value: 0, message: 'Score must be positive' },
                  validate: (value) => {
                    if (selectedExam && value > selectedExam.total_marks) {
                      return `Score cannot exceed max marks (${selectedExam.total_marks})`;
                    }
                    return true;
                  }
                })}
              />
              {errors.score && (
                <p className="error-text">{errors.score.message}</p>
              )}
            </div>

            <div>
              <label className="label">Max Score</label>
              <input
                type="number"
                className="input bg-gray-100"
                value={selectedExam?.total_marks || ''}
                readOnly
              />
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
