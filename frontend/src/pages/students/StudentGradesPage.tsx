import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { studentService } from '../../services/studentService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/Layout/PageHeader';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SubjectGrade {
  subject_id: string;
  subject_name: string;
  grades: any[];
  average_score: number;
  average_percentage: number;
  grade: string;
  position?: number;
  total_students?: number;
}

const StudentGradesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [classHistory, setClassHistory] = useState<any[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [groupedGrades, setGroupedGrades] = useState<SubjectGrade[]>([]);
  const { showError } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTermId) {
      loadGradesForTerm(selectedTermId);
    }
  }, [selectedTermId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [termsData, trendsData, historyData] = await Promise.all([
        studentService.getMyTerms(),
        studentService.getMyPerformanceTrends(),
        studentService.getMyClassHistory()
      ]);

      setTerms(termsData);
      setTrends(trendsData);
      setClassHistory(historyData);

      // Set current term as default
      const currentTerm = termsData.find((t: any) => t.is_current);
      if (currentTerm) {
        setSelectedTermId(currentTerm.id);
      } else if (termsData.length > 0) {
        setSelectedTermId(termsData[0].id);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      showError(error.response?.data?.detail || 'Failed to load grades data');
    } finally {
      setLoading(false);
    }
  };

  const loadGradesForTerm = async (termId: string) => {
    try {
      const summaryData = await studentService.getMyGradesSummary(termId);

      setSummary(summaryData);

      // Use subject summaries from backend
      if (summaryData.subject_summaries && summaryData.subject_summaries.length > 0) {
        setGroupedGrades(summaryData.subject_summaries);
      } else {
        setGroupedGrades([]);
      }
    } catch (error: any) {
      console.error('Error loading grades:', error);
      showError(error.response?.data?.detail || 'Failed to load grades for selected term');
    }
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  const getGradeColor = (grade: string): string => {
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
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') {
      return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
    } else if (trend === 'declining') {
      return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Grades"
        description="View your academic performance and grades"
      />

      {/* Term Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Term
        </label>
        <select
          value={selectedTermId}
          onChange={(e) => setSelectedTermId(e.target.value)}
          className="input w-full md:w-64"
        >
          {terms.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name} - {term.academic_session}
              {term.is_current && ' (Current)'}
            </option>
          ))}
        </select>
      </div>

      {/* Performance Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.overall_percentage?.toFixed(1)}%
                </p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overall Grade</p>
                <p className={`text-2xl font-bold ${getGradeColor(summary.overall_grade || '')}`}>
                  {summary.overall_grade || 'N/A'}
                </p>
              </div>
              <AcademicCapIcon className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Class Position</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.position ? `${summary.position}${getOrdinalSuffix(summary.position)}` : 'N/A'}
                </p>
                {summary.total_students && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    out of {summary.total_students} students
                  </p>
                )}
              </div>
              <TrophyIcon className="h-10 w-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Subjects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.total_subjects}
                </p>
              </div>
              <CalendarIcon className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Performance Trend */}
      {trends && trends.improvement_trend !== 'no_data' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Trend
            </h3>
            {getTrendIcon(trends.improvement_trend)}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Overall Average: <span className="font-semibold">{trends.overall_average?.toFixed(1)}%</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Trend: <span className="font-semibold capitalize">{trends.improvement_trend}</span>
            </p>
            {trends.best_term && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Best Term: <span className="font-semibold">{trends.best_term.term_name}</span> ({trends.best_term.average_score?.toFixed(1)}%)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Performance Charts */}
      {(classHistory && classHistory.length > 0) || (groupedGrades && groupedGrades.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trend Chart */}
          {classHistory && classHistory.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance History
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={classHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="term_name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="average_percentage"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Average %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance History
              </h3>
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No historical data available yet</p>
                  <p className="text-xs mt-1">Complete more terms to see your progress</p>
                </div>
              </div>
            </div>
          )}

          {/* Subject Performance Chart */}
          {groupedGrades && groupedGrades.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Subject Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groupedGrades}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average_percentage" fill="#10b981" name="Average %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Subject Performance
              </h3>
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No subject data available</p>
                  <p className="text-xs mt-1">Grades will appear here once published</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Subject Grades - Grouped View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subject Grades
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Click on a subject to view detailed exam scores
          </p>
        </div>

        {groupedGrades.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No grades available</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Grades for this term haven't been published yet. Check back later.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {groupedGrades.map((subject) => (
              <div key={subject.subject_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                {/* Subject Header */}
                <button
                  onClick={() => toggleSubject(subject.subject_id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <BookOpenIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {subject.subject_name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {subject.grades.length} exam{subject.grades.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {subject.average_percentage.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Grade</p>
                      <p className={`text-lg font-semibold ${getGradeColor(subject.grade)}`}>
                        {subject.grade}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Position</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {subject.position ? `${subject.position}${getOrdinalSuffix(subject.position)}` : '-'}
                      </p>
                    </div>
                  </div>

                  {expandedSubjects.has(subject.subject_id) ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400 ml-4" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400 ml-4" />
                  )}
                </button>

                {/* Expanded Exam Details */}
                {expandedSubjects.has(subject.subject_id) && (
                  <div className="px-6 pb-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Exam Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Score
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Percentage
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Grade
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Remarks
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {subject.grades.map((grade: any) => (
                            <tr key={grade.id}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {grade.exam_type?.replace('_', ' ').toUpperCase()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {grade.score} / {grade.total_marks}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {grade.percentage?.toFixed(1)}%
                              </td>
                              <td className={`px-4 py-3 text-sm font-semibold ${getGradeColor(grade.grade)}`}>
                                {grade.grade || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {grade.remarks || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGradesPage;

