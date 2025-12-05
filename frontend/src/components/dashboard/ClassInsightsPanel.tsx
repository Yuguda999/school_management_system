/**
 * Class Insights Panel Component (P1.3)
 * Displays class performance analytics for teachers
 */

import React, { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import analyticsService, { ClassAnalytics } from '../../services/analyticsService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';

interface ClassInsightsPanelProps {
  classId?: string;
  termId?: string;
}

const ClassInsightsPanel: React.FC<ClassInsightsPanelProps> = ({ classId, termId }) => {
  const schoolCode = useSchoolCode();
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedClassId = classId;

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!schoolCode || !selectedClassId) return;
      try {
        setLoading(true);
        const data = await analyticsService.getClassAnalytics(schoolCode, selectedClassId, termId);
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load class analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [schoolCode, selectedClassId, termId]);

  if (!selectedClassId) {
    return (
      <Card className="p-6 text-center">
        <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Select a class to view insights</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="p-6 text-center text-red-500">
        {error || 'No analytics data available'}
      </Card>
    );
  }

  const gradeColors: Record<string, string> = {
    'A': 'bg-green-500',
    'B': 'bg-blue-500',
    'C': 'bg-yellow-500',
    'D': 'bg-orange-500',
    'F': 'bg-red-500'
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.total_students}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
              <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Grade</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.average_grade.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <AcademicCapIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.average_attendance.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">At-Risk Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.at_risk_students.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grade Distribution</h3>
        <div className="flex items-end space-x-2 h-32">
          {Object.entries(analytics.grade_distribution).map(([grade, count]) => {
            const maxCount = Math.max(...Object.values(analytics.grade_distribution));
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={grade} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full ${gradeColors[grade] || 'bg-gray-500'} rounded-t transition-all duration-300`}
                  style={{ height: `${height}%`, minHeight: count > 0 ? '8px' : '0' }}
                />
                <span className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">{grade}</span>
                <span className="text-xs text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Top Performers
          </h3>
          <div className="space-y-3">
            {analytics.top_performers.slice(0, 5).map((student, index) => (
              <div key={student.student_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{student.student_name}</span>
                </div>
                <span className="text-green-600 font-semibold">{student.average_grade.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* At-Risk Students */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-500" />
            At-Risk Students
          </h3>
          <div className="space-y-3">
            {analytics.at_risk_students.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No at-risk students identified</p>
            ) : (
              analytics.at_risk_students.slice(0, 5).map((student) => (
                <div key={student.student_id} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="font-medium text-gray-900 dark:text-white">{student.student_name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {student.risk_factors.map((factor, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subject Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-sm font-medium text-gray-500 dark:text-gray-400">Subject</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500 dark:text-gray-400">Average</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500 dark:text-gray-400">Pass Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.subject_performance.map((subject) => (
                <tr key={subject.subject_id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 text-gray-900 dark:text-white">{subject.subject_name}</td>
                  <td className="py-3 text-right font-medium text-gray-900 dark:text-white">{subject.average_grade.toFixed(1)}%</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subject.pass_rate >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                      subject.pass_rate >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {subject.pass_rate.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ClassInsightsPanel;

