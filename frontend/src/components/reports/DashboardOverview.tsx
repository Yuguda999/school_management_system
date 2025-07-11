import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { reportsService, DashboardStats } from '../../services/reportsService';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';

const DashboardOverview: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, [currentTerm?.id]); // Re-fetch when current term changes

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardStats = await reportsService.getDashboardStats(currentTerm?.id);
      setStats(dashboardStats);
    } catch (err) {
      setError('Failed to fetch dashboard statistics');
      console.error('Error fetching dashboard stats:', err);
      // Fallback to mock data if API fails
      const mockStats: DashboardStats = {
        total_students: 1250,
        total_teachers: 85,
        total_classes: 42,
        total_subjects: 28,
        active_terms: 3,
        pending_fees: 125000,
        recent_enrollments: 45,
        attendance_rate: 92.5,
      };
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="mt-2 btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.total_students,
      icon: UserGroupIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Teachers',
      value: stats.total_teachers,
      icon: AcademicCapIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      change: '+5%',
      changeType: 'increase' as const,
    },
    {
      title: 'Active Classes',
      value: stats.total_classes,
      icon: BookOpenIcon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      change: '+2%',
      changeType: 'increase' as const,
    },
    {
      title: 'Subjects',
      value: stats.total_subjects,
      icon: BookOpenIcon,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
      change: '0%',
      changeType: 'neutral' as const,
    },
    {
      title: 'Pending Fees',
      value: `₹${stats.pending_fees.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      change: '-8%',
      changeType: 'decrease' as const,
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendance_rate}%`,
      icon: CalendarDaysIcon,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
      change: '+2.5%',
      changeType: 'increase' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {stat.changeType === 'increase' && (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                )}
                {stat.changeType === 'decrease' && (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' :
                  stat.changeType === 'decrease' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.recent_enrollments} new student enrollments
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This month
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Fee collection improved by 8%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Compared to last month
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Average attendance increased
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Now at {stats.attendance_rate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Performance Summary
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Student Enrollment
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  95%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Fee Collection
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  78%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Attendance Rate
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {stats.attendance_rate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${stats.attendance_rate}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Action Items
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Fee Collection
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              ₹{stats.pending_fees.toLocaleString()} in pending fees requires attention
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              Attendance
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Monitor students with low attendance rates
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              Enrollment
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {stats.recent_enrollments} new enrollments this month
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
