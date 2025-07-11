import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  DocumentTextIcon,
  PrinterIcon,
  PencilIcon,
  CalendarIcon,
  TrophyIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { ReportCard as ReportCardType, Student, Class, Term, GradeScale } from '../../types';
import GradeService, { ReportCardCreateData, ReportCardUpdateData } from '../../services/gradeService';
import { studentService } from '../../services/studentService';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';

interface ReportCardProps {
  reportCard?: ReportCardType;
  onSubmit?: (reportCard: ReportCardType) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit' | 'view';
}

interface ReportCardFormData {
  student_id: string;
  class_id: string;
  term_id: string;
  teacher_comment?: string;
  principal_comment?: string;
  next_term_begins?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  reportCard,
  onSubmit,
  onCancel,
  mode = 'view'
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ReportCardFormData>({
    defaultValues: reportCard ? {
      student_id: reportCard.student_id,
      class_id: reportCard.class_id,
      term_id: reportCard.term_id,
      teacher_comment: reportCard.teacher_comment || '',
      principal_comment: reportCard.principal_comment || '',
      next_term_begins: reportCard.next_term_begins?.split('T')[0] || ''
    } : {}
  });

  useEffect(() => {
    if (mode === 'create' || mode === 'edit') {
      fetchData();
    }
  }, [mode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsResponse, classesData, termsData] = await Promise.all([
        studentService.getStudents({ status: 'active' }),
        academicService.getClasses({ is_active: true }),
        academicService.getTerms({ is_current: true })
      ]);

      setStudents(studentsResponse.items);
      setClasses(classesData);
      setTerms(termsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const onFormSubmit = async (data: ReportCardFormData) => {
    try {
      setSubmitting(true);
      
      if (reportCard && mode === 'edit') {
        // Update existing report card
        const updateData: ReportCardUpdateData = {
          teacher_comment: data.teacher_comment,
          principal_comment: data.principal_comment,
          next_term_begins: data.next_term_begins
        };
        
        const updatedReportCard = await GradeService.updateReportCard(reportCard.id, updateData);
        showSuccess('Report card updated successfully');
        onSubmit?.(updatedReportCard);
      } else if (mode === 'create') {
        // Create new report card
        const createData: ReportCardCreateData = {
          student_id: data.student_id,
          class_id: data.class_id,
          term_id: data.term_id,
          teacher_comment: data.teacher_comment,
          principal_comment: data.principal_comment,
          next_term_begins: data.next_term_begins
        };
        
        const newReportCard = await GradeService.createReportCard(createData);
        showSuccess('Report card created successfully');
        onSubmit?.(newReportCard);
      }
    } catch (error: any) {
      console.error('Error saving report card:', error);
      showError(error.response?.data?.detail || 'Failed to save report card');
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

  const handlePrint = () => {
    window.print();
  };

  if (mode === 'view' && reportCard) {
    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 print:bg-white">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block text-center mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">ACADEMIC REPORT CARD</h1>
          <p className="text-gray-600 mt-2">Academic Session: {reportCard.term_name}</p>
        </div>

        {/* Header Actions - Hidden when printing */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Report Card
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="btn btn-secondary"
            >
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="btn btn-primary"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Student Information */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Student Information
              </h3>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{reportCard.student_name}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">Class:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{reportCard.class_name}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">Term:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{reportCard.term_name}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Overall Performance
              </h3>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-600 dark:text-gray-400">Total Score:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{reportCard.overall_score}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-600 dark:text-gray-400">Percentage:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{reportCard.overall_percentage.toFixed(1)}%</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-600 dark:text-gray-400">Grade:</span>
                  <span className={`text-sm font-medium ${getGradeColor(reportCard.overall_grade)}`}>
                    {reportCard.overall_grade || 'N/A'}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-600 dark:text-gray-400">Position:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {reportCard.position} of {reportCard.total_students}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Grades */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Subject Grades
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subject
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
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {reportCard.grades.map((grade) => (
                  <tr key={grade.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {grade.subject_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
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
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {grade.remarks || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {reportCard.teacher_comment && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Class Teacher's Comment
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {reportCard.teacher_comment}
              </p>
            </div>
          )}
          
          {reportCard.principal_comment && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Principal's Comment
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {reportCard.principal_comment}
              </p>
            </div>
          )}
        </div>

        {/* Footer Information */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Generated by:</span>
              <p className="text-gray-900 dark:text-white">{reportCard.generator_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Date Generated:</span>
              <p className="text-gray-900 dark:text-white">
                {new Date(reportCard.generated_date).toLocaleDateString()}
              </p>
            </div>
            {reportCard.next_term_begins && (
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Next Term Begins:</span>
                <p className="text-gray-900 dark:text-white">
                  {new Date(reportCard.next_term_begins).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Form mode (create/edit)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {mode === 'create' ? 'Create Report Card' : 'Edit Report Card'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {mode === 'create' 
            ? 'Generate a new report card for a student'
            : 'Update report card comments and information'
          }
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading form data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {mode === 'create' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student *
                </label>
                <select
                  {...register('student_id', { required: 'Student is required' })}
                  className="input"
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.admission_number})
                    </option>
                  ))}
                </select>
                {errors.student_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.student_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class *
                </label>
                <select
                  {...register('class_id', { required: 'Class is required' })}
                  className="input"
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                {errors.class_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.class_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Term *
                </label>
                <select
                  {...register('term_id', { required: 'Term is required' })}
                  className="input"
                >
                  <option value="">Select term</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name} ({term.academic_year})
                    </option>
                  ))}
                </select>
                {errors.term_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.term_id.message}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Class Teacher's Comment
              </label>
              <textarea
                {...register('teacher_comment')}
                rows={4}
                className="input"
                placeholder="Enter class teacher's comment about the student's performance..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Principal's Comment
              </label>
              <textarea
                {...register('principal_comment')}
                rows={4}
                className="input"
                placeholder="Enter principal's comment about the student's overall performance..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Next Term Begins
            </label>
            <input
              type="date"
              {...register('next_term_begins')}
              className="input max-w-xs"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting 
                ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                : (mode === 'create' ? 'Create Report Card' : 'Update Report Card')
              }
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportCard;
