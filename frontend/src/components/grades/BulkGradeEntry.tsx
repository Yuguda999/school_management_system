import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  PlusIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Exam, Grade, Student } from '../../types';
import GradeService, { BulkGradeCreateData } from '../../services/gradeService';
import { studentService } from '../../services/studentService';
import { useToast } from '../../hooks/useToast';

interface BulkGradeEntryProps {
  exam: Exam;
  onGradesSubmitted: (grades: Grade[]) => void;
  onCancel: () => void;
}

interface GradeEntryData {
  student_id: string;
  score: number;
  remarks?: string;
}

interface BulkGradeFormData {
  grades: GradeEntryData[];
}

const BulkGradeEntry: React.FC<BulkGradeEntryProps> = ({
  exam,
  onGradesSubmitted,
  onCancel
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [existingGrades, setExistingGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<BulkGradeFormData>({
    defaultValues: {
      grades: []
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'grades'
  });

  const watchedGrades = watch('grades');

  useEffect(() => {
    fetchData();
  }, [exam.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch students in the class
      const studentsResponse = await studentService.getStudents({
        class_id: exam.class_id,
        status: 'active'
      });
      const studentsData = studentsResponse.items;
      
      // Fetch existing grades for this exam
      const gradesData = await GradeService.getGrades({
        exam_id: exam.id
      });
      
      setStudents(studentsData);
      setExistingGrades(gradesData);
      
      // Initialize form with students and existing grades
      const gradeEntries: GradeEntryData[] = studentsData.map(student => {
        const existingGrade = gradesData.find(g => g.student_id === student.id);
        return {
          student_id: student.id,
          score: existingGrade?.score || 0,
          remarks: existingGrade?.remarks || ''
        };
      });
      
      replace(gradeEntries);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load students and grades');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BulkGradeFormData) => {
    try {
      setSubmitting(true);
      
      // Filter out grades with score 0 (assuming 0 means not graded)
      const validGrades = data.grades.filter(grade => grade.score > 0);
      
      if (validGrades.length === 0) {
        showError('Please enter at least one valid score');
        return;
      }

      const bulkData: BulkGradeCreateData = {
        exam_id: exam.id,
        grades: validGrades
      };

      const createdGrades = await GradeService.createBulkGrades(bulkData);
      showSuccess(`Successfully saved ${createdGrades.length} grades`);
      onGradesSubmitted(createdGrades);
    } catch (error: any) {
      console.error('Error saving grades:', error);
      showError(error.response?.data?.detail || 'Failed to save grades');
    } finally {
      setSubmitting(false);
    }
  };

  const getStudentName = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  const getGradeColor = (score: number): string => {
    const percentage = (score / exam.total_marks) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeLetter = (score: number): string => {
    const percentage = (score / exam.total_marks) * 100;
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const isExistingGrade = (studentId: string): boolean => {
    return existingGrades.some(grade => grade.student_id === studentId);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          {exam.name}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Subject:</span>
            <p className="text-blue-900 dark:text-blue-100">{exam.subject_name}</p>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Class:</span>
            <p className="text-blue-900 dark:text-blue-100">{exam.class_name}</p>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Total Marks:</span>
            <p className="text-blue-900 dark:text-blue-100">{exam.total_marks}</p>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Pass Marks:</span>
            <p className="text-blue-900 dark:text-blue-100">{exam.pass_marks}</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Grading Instructions
            </h4>
            <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
              <li>Enter scores for each student (0 to {exam.total_marks})</li>
              <li>Leave score as 0 for students who didn't take the exam</li>
              <li>Existing grades will be updated if you change them</li>
              <li>Remarks are optional but recommended for low scores</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Grade Entry Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Student Grades ({students.length} students)
            </h4>
          </div>
          
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
                    Remarks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {fields.map((field, index) => {
                  const score = watchedGrades[index]?.score || 0;
                  const percentage = score > 0 ? ((score / exam.total_marks) * 100).toFixed(1) : '0.0';
                  const gradeLetter = score > 0 ? getGradeLetter(score) : '-';
                  const isExisting = isExistingGrade(field.student_id);
                  
                  return (
                    <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getStudentName(field.student_id)}
                        </div>
                        {isExisting && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Previously graded
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          {...register(`grades.${index}.score`, {
                            min: { value: 0, message: 'Score cannot be negative' },
                            max: { value: exam.total_marks, message: `Score cannot exceed ${exam.total_marks}` }
                          })}
                          className="w-20 input"
                          placeholder="0"
                          min="0"
                          max={exam.total_marks}
                        />
                        {errors.grades?.[index]?.score && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.grades[index]?.score?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getGradeColor(score)}`}>
                          {gradeLetter}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${getGradeColor(score)}`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          {...register(`grades.${index}.remarks`)}
                          className="w-full input"
                          placeholder="Optional remarks"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {score >= exam.pass_marks ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Pass
                          </span>
                        ) : score > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Fail
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Not graded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="card p-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Grading Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {watchedGrades.filter(g => g.score > 0).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Students Graded
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {watchedGrades.filter(g => g.score >= exam.pass_marks).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Passed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {watchedGrades.filter(g => g.score > 0 && g.score < exam.pass_marks).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Failed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {watchedGrades.filter(g => g.score > 0).length > 0 
                  ? ((watchedGrades.filter(g => g.score >= exam.pass_marks).length / watchedGrades.filter(g => g.score > 0).length) * 100).toFixed(1)
                  : '0.0'
                }%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pass Rate
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving Grades...' : 'Save Grades'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BulkGradeEntry;
