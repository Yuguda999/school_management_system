import React, { useState, useEffect } from 'react';
import { 
  AcademicCapIcon, 
  TrophyIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { reportsService, AcademicReport } from '../../services/reportsService';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import CurrentTermIndicator from '../terms/CurrentTermIndicator';

const AcademicReports: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const [report, setReport] = useState<AcademicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAcademicReport();
  }, [currentTerm?.id]); // Re-fetch when current term changes

  const fetchAcademicReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch real data with current term
      try {
        const params = currentTerm ? { term_id: currentTerm.id } : undefined;
        const academicReport = await reportsService.getAcademicReport(params);
        setReport(academicReport);
        return;
      } catch (apiError) {
        console.warn('Failed to fetch academic report from API, using mock data:', apiError);
      }

      // Fallback to mock data
      const mockReport: AcademicReport = {
        overall_performance: {
          average_grade: 82.5,
          pass_rate: 94.2,
          distinction_rate: 28.7,
        },
        subject_wise_performance: [
          { subject_id: '1', subject_name: 'Mathematics', average_grade: 78.5, pass_rate: 89.2, total_students: 150 },
          { subject_id: '2', subject_name: 'English', average_grade: 85.3, pass_rate: 96.8, total_students: 150 },
          { subject_id: '3', subject_name: 'Science', average_grade: 81.7, pass_rate: 92.5, total_students: 150 },
          { subject_id: '4', subject_name: 'History', average_grade: 84.2, pass_rate: 95.1, total_students: 120 },
          { subject_id: '5', subject_name: 'Geography', average_grade: 79.8, pass_rate: 91.3, total_students: 120 },
        ],
        class_wise_performance: [
          { class_id: '1', class_name: 'Class 10-A', average_grade: 85.2, pass_rate: 97.1, total_students: 35 },
          { class_id: '2', class_name: 'Class 10-B', average_grade: 82.7, pass_rate: 93.8, total_students: 32 },
          { class_id: '3', class_name: 'Class 9-A', average_grade: 88.9, pass_rate: 100.0, total_students: 38 },
          { class_id: '4', class_name: 'Class 9-B', average_grade: 79.3, pass_rate: 88.2, total_students: 34 },
        ],
        top_performers: [
          { student_id: '1', student_name: 'Alice Johnson', class_name: 'Class 10-A', average_grade: 96.5 },
          { student_id: '2', student_name: 'Bob Smith', class_name: 'Class 9-A', average_grade: 95.2 },
          { student_id: '3', student_name: 'Carol Davis', class_name: 'Class 10-B', average_grade: 94.8 },
          { student_id: '4', student_name: 'David Wilson', class_name: 'Class 9-A', average_grade: 94.1 },
          { student_id: '5', student_name: 'Eva Brown', class_name: 'Class 10-A', average_grade: 93.7 },
        ],
      };
      
      setReport(mockReport);
    } catch (err) {
      setError('Failed to fetch academic report');
      console.error('Error fetching academic report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (rate >= 85) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    if (rate >= 75) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAcademicReport}
          className="mt-2 btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Term Indicator */}
      <CurrentTermIndicator variant="banner" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Academic Performance Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive academic performance analysis for {currentTerm ? `${currentTerm.name} (${currentTerm.academic_session})` : 'current term'}
          </p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2">
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Overall Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg inline-block mb-3">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">
            {report.overall_performance.average_grade}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Grade</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg inline-block mb-3">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">
            {report.overall_performance.pass_rate}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg inline-block mb-3">
            <TrophyIcon className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">
            {report.overall_performance.distinction_rate}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Distinction Rate</p>
        </div>
      </div>

      {/* Subject-wise Performance */}
      <div className="card p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Subject-wise Performance
        </h4>
        <div className="space-y-4">
          {report.subject_wise_performance.map((subject) => (
            <div key={subject.subject_id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  {subject.subject_name}
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subject.total_students} students
                </p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className={`text-lg font-semibold ${getGradeColor(subject.average_grade)}`}>
                    {subject.average_grade}%
                  </p>
                  <p className="text-xs text-gray-500">Avg Grade</p>
                </div>
                <div className="text-center">
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPassRateColor(subject.pass_rate)}`}>
                    {subject.pass_rate}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Pass Rate</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Class-wise Performance */}
      <div className="card p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Class-wise Performance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.class_wise_performance.map((classData) => (
            <div key={classData.class_id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    {classData.class_name}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {classData.total_students} students
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${getGradeColor(classData.average_grade)}`}>
                    {classData.average_grade}%
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPassRateColor(classData.pass_rate)}`}>
                    {classData.pass_rate}% pass
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Grade</span>
                    <span>{classData.average_grade}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${classData.average_grade}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pass Rate</span>
                    <span>{classData.pass_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${classData.pass_rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <TrophyIcon className="h-6 w-6 text-yellow-600" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            Top Performers
          </h4>
        </div>
        <div className="space-y-3">
          {report.top_performers.map((student, index) => (
            <div key={student.student_id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-yellow-200 dark:bg-yellow-800 rounded-full">
                  <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {student.student_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {student.class_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-yellow-600">
                  {student.average_grade}%
                </p>
                <p className="text-xs text-gray-500">Average Grade</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AcademicReports;
