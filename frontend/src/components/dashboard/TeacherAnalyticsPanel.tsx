/**
 * Teacher Analytics Panel Component (P2.4)
 * Displays teacher performance and workload insights
 */

import React, { useEffect, useState } from 'react';
import {
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import analyticsService, { TeacherAnalytics } from '../../services/analyticsService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';

interface TeacherAnalyticsPanelProps {
  teacherId?: string; // If not provided, shows all teachers (admin view)
  termId?: string;
}

const TeacherAnalyticsPanel: React.FC<TeacherAnalyticsPanelProps> = ({ teacherId, termId }) => {
  const schoolCode = useSchoolCode();
  const [analytics, setAnalytics] = useState<TeacherAnalytics | TeacherAnalytics[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!schoolCode) return;
      try {
        setLoading(true);
        if (teacherId) {
          const data = await analyticsService.getTeacherAnalytics(schoolCode, teacherId, termId);
          setAnalytics(data);
        } else {
          const data = await analyticsService.getAllTeachersAnalytics(schoolCode, termId);
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Failed to load teacher analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [schoolCode, teacherId, termId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6 text-center text-gray-500">
        No analytics data available
      </Card>
    );
  }

  // Single teacher view
  if (!Array.isArray(analytics)) {
    const teacher = analytics;
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <UserIcon className="h-6 w-6 mr-2 text-primary-500" />
          {teacher.teacher_name} - Performance Insights
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <AcademicCapIcon className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.classes_count}</p>
            <p className="text-sm text-gray-500">Classes</p>
          </Card>
          <Card className="p-4 text-center">
            <UserIcon className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.total_students}</p>
            <p className="text-sm text-gray-500">Students</p>
          </Card>
          <Card className="p-4 text-center">
            <ChartBarIcon className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.average_class_performance.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Avg Performance</p>
          </Card>
          <Card className="p-4 text-center">
            <ClockIcon className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.workload_hours}h</p>
            <p className="text-sm text-gray-500">Weekly Hours</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Activity Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Lesson Plans Created</span>
                <span className="font-medium">{teacher.lesson_plans_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Materials Uploaded</span>
                <span className="font-medium">{teacher.materials_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Attendance Rate</span>
                <span className="font-medium">{teacher.attendance_rate.toFixed(1)}%</span>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Subjects Taught</h3>
            <p className="text-3xl font-bold text-primary-600">{teacher.subjects_count}</p>
            <p className="text-sm text-gray-500 mt-1">Active subjects this term</p>
          </Card>
        </div>
      </div>
    );
  }

  // All teachers view (admin)
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
        <UserIcon className="h-6 w-6 mr-2 text-primary-500" />
        Teacher Performance Overview
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Classes</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Students</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Performance</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Workload</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lesson Plans</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {analytics.map((teacher) => (
              <tr key={teacher.teacher_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{teacher.teacher_name}</td>
                <td className="px-4 py-3 text-center">{teacher.classes_count}</td>
                <td className="px-4 py-3 text-center">{teacher.total_students}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    teacher.average_class_performance >= 70 ? 'bg-green-100 text-green-700' :
                    teacher.average_class_performance >= 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {teacher.average_class_performance.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{teacher.workload_hours}h/week</td>
                <td className="px-4 py-3 text-center">{teacher.lesson_plans_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherAnalyticsPanel;

