import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Student, Term, StudentGradesSummary, GradeScale, Class } from '../../types';
import GradeService from '../../services/gradeService';
import { studentService } from '../../services/studentService';
import { academicService } from '../../services/academicService';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';

interface StudentGradeSummaryProps {
  studentId?: string;
  termId?: string;
}

const StudentGradeSummary: React.FC<StudentGradeSummaryProps> = ({
  studentId: initialStudentId,
  termId: initialTermId
}) => {
  const { currentTerm } = useCurrentTerm();
  const { user } = useAuth();
  const { showError } = useToast();
  const [summary, setSummary] = useState<StudentGradesSummary | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || '');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState(initialTermId || currentTerm?.id || '');

  // Update selected term when current term changes
  useEffect(() => {
    if (!initialTermId && currentTerm?.id && selectedTermId !== currentTerm.id) {
      setSelectedTermId(currentTerm.id);
    }
  }, [currentTerm?.id, initialTermId, selectedTermId]);

  useEffect(() => {
    // Skip API calls for students
    if (user?.role === 'student') {
      return;
    }
    fetchData();
  }, [user?.role]);

  useEffect(() => {
    // Skip API calls for students
    if (user?.role === 'student') {
      return;
    }
    if (selectedStudentId && selectedTermId) {
      fetchSummary();
    }
  }, [selectedStudentId, selectedTermId, user?.role]);

  const fetchData = async () => {
    try {
      const [studentsResponse, termsData, classesData] = await Promise.all([
        studentService.getStudents({ status: 'active' }),
        academicService.getTerms({ is_current: true }),
        academicService.getClasses({ is_active: true })
      ]);

      setStudents(studentsResponse.items);
      setTerms(termsData);
      setClasses(classesData);

      // Set default selections if not provided
      if (!selectedStudentId && studentsResponse.items.length > 0) {
        setSelectedStudentId(studentsResponse.items[0].id);
      }
      if (!selectedTermId && termsData.length > 0) {
        setSelectedTermId(termsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load data');
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const summaryData = await GradeService.getStudentGradesSummary(
        selectedStudentId,
        selectedTermId
      );
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching summary:', error);
      showError('Failed to load student summary');
      setSummary(null);
    } finally {
      setLoading(false);
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

  const getPerformanceLevel = (percentage: number): { label: string; color: string } => {
    if (percentage >= 80) return { label: 'Excellent', color: 'text-green-600' };
    if (percentage >= 70) return { label: 'Good', color: 'text-blue-600' };
    if (percentage >= 60) return { label: 'Average', color: 'text-yellow-600' };
    if (percentage >= 50) return { label: 'Below Average', color: 'text-orange-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  const filteredStudents = selectedClassId
    ? students.filter(s => s.current_class_id === selectedClassId)
    : students;

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedTerm = terms.find(t => t.id === selectedTermId);

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Student Grade Summary
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Detailed academic performance overview for individual students
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedStudentId(''); // Reset student selection when class changes
            }}
            className="input"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="input"
          >
            <option value="">Select Student</option>
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} ({student.admission_number})
              </option>
            ))}
          </select>

          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="input"
          >
            <option value="">Select Term</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} ({term.academic_year})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading summary...</p>
        </div>
      ) : !selectedStudentId || !selectedTermId ? (
        <div className="card p-8 text-center">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select Student and Term
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a student and term to view the grade summary.
          </p>
        </div>
      ) : !summary ? (
        <div className="card p-8 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No grades found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No grade data available for the selected student and term.
          </p>
        </div>
      ) : (
        <>
          {/* Student Info Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {summary.student_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {summary.class_name} • {summary.term_name}
                  </p>
                </div>
              </div>

              <div className="text-right">
                {summary.position && (
                  <div className="flex items-center text-yellow-600">
                    <TrophyIcon className="w-5 h-5 mr-1" />
                    <span className="text-lg font-semibold">
                      Position {summary.position}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Subjects
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {summary.graded_subjects} / {summary.total_subjects}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Graded
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Score
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {summary.total_score} / {summary.total_possible}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Points
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${summary.overall_percentage >= 80 ? 'bg-green-100 text-green-600' :
                    summary.overall_percentage >= 70 ? 'bg-blue-100 text-blue-600' :
                      summary.overall_percentage >= 60 ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                    }`}>
                    <span className="text-sm font-bold">%</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Overall Percentage
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {typeof summary.overall_percentage === 'number'
                      ? summary.overall_percentage.toFixed(1)
                      : 'N/A'}%
                  </p>
                  <p className={`text-xs font-medium ${typeof summary.overall_percentage === 'number'
                    ? getPerformanceLevel(summary.overall_percentage).color
                    : 'text-gray-500'
                    }`}>
                    {typeof summary.overall_percentage === 'number'
                      ? getPerformanceLevel(summary.overall_percentage).label
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${summary.overall_grade === 'A+' || summary.overall_grade === 'A' ? 'bg-green-100 text-green-600' :
                    summary.overall_grade === 'B+' || summary.overall_grade === 'B' ? 'bg-blue-100 text-blue-600' :
                      summary.overall_grade === 'C+' || summary.overall_grade === 'C' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                    }`}>
                    <span className="text-sm font-bold">{summary.overall_grade || 'N/A'}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Overall Grade
                  </p>
                  <p className={`text-2xl font-semibold ${getGradeColor(summary.overall_grade)}`}>
                    {summary.overall_grade || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Letter Grade
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Grades */}
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Subject Grades
              </h3>
            </div>

            {summary.grades.length === 0 ? (
              <div className="p-8 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No grades recorded
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  No grades have been recorded for this student in the selected term.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Exam
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
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {summary.grades.map((grade) => (
                      <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {grade.subject_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {grade.exam_name}
                          </div>
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
                            {typeof grade.percentage === 'number'
                              ? grade.percentage.toFixed(1)
                              : 'N/A'}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            {grade.remarks || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(grade.graded_date).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentGradeSummary;
