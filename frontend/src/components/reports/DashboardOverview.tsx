import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { reportsService, DashboardStats } from '../../services/reportsService';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { useCurrency } from '../../contexts/CurrencyContext';
import Card from '../ui/Card';

const DashboardOverview: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const { formatCurrency } = useCurrency();
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
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
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      borderColor: 'border-l-blue-500',
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Teachers',
      value: stats.total_teachers,
      icon: AcademicCapIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-l-green-500',
      change: '+5%',
      changeType: 'increase' as const,
    },
    {
      title: 'Active Classes',
      value: stats.total_classes,
      icon: BookOpenIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      borderColor: 'border-l-purple-500',
      change: '+2%',
      changeType: 'increase' as const,
    },
    {
      title: 'Subjects',
      value: stats.total_subjects,
      icon: BookOpenIcon,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      borderColor: 'border-l-indigo-500',
      change: '0%',
      changeType: 'neutral' as const,
    },
    {
      title: 'Pending Fees',
      value: formatCurrency(stats.pending_fees),
      icon: CurrencyDollarIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      borderColor: 'border-l-red-500',
      change: '-8%',
      changeType: 'decrease' as const,
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendance_rate}%`,
      icon: CalendarDaysIcon,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      borderColor: 'border-l-emerald-500',
      change: '+2.5%',
      changeType: 'increase' as const,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} variant="glass" className={`border-l-4 ${stat.borderColor} hover:shadow-lg transition-shadow duration-300`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-1">
                  {stat.changeType === 'increase' && (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                  )}
                  {stat.changeType === 'decrease' && (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${stat.changeType === 'increase' ? 'text-green-600 dark:text-green-400' :
                    stat.changeType === 'decrease' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                    {stat.change}
                  </span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">vs last month</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card variant="glass" className="h-full">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-primary-500" />
            Recent Activity
          </h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-green-500 rounded-full ring-4 ring-green-100 dark:ring-green-900/30"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.recent_enrollments} new student enrollments
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This month • 12% increase from last month
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-100 dark:ring-blue-900/30"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Fee collection improved by 8%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Compared to last month • Target reached
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full ring-4 ring-purple-100 dark:ring-purple-900/30"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Average attendance increased
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Now at {stats.attendance_rate}% • Best in 3 months
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Summary */}
        <Card variant="glass" className="h-full">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-primary-500" />
            Performance Summary
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Student Enrollment
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  95%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: '95%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Fee Collection
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  78%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className="bg-green-600 h-2.5 rounded-full transition-all duration-1000 ease-out delay-100" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Attendance Rate
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats.attendance_rate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-1000 ease-out delay-200" style={{ width: `${stats.attendance_rate}%` }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Items */}
      <Card variant="glass">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2 text-primary-500" />
          Action Items
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800/50 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-2">
              <CurrencyDollarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <h4 className="font-bold text-yellow-800 dark:text-yellow-200">
                Fee Collection
              </h4>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {formatCurrency(stats.pending_fees)} in pending fees requires attention
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800/50 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-2">
              <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h4 className="font-bold text-blue-800 dark:text-blue-200">
                Attendance
              </h4>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Monitor students with low attendance rates
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800/50 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <h4 className="font-bold text-green-800 dark:text-green-200">
                Enrollment
              </h4>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              {stats.recent_enrollments} new enrollments this month
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardOverview;
