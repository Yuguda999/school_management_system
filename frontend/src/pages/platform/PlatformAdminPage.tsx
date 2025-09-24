import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import platformAdminService, {
  PlatformDashboardData,
  PlatformStatistics
} from '../../services/platformAdminService';

const PlatformAdminPage: React.FC = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const [dashboardData, setDashboardData] = useState<PlatformDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data for user:', user);
      console.log('User role:', user?.role);
      console.log('Access token:', localStorage.getItem('access_token') ? 'Present' : 'Missing');

      const data = await platformAdminService.getDashboardData();
      console.log('Dashboard data received:', data);
      setDashboardData(data);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      showError(`Failed to load dashboard data: ${error.response?.status || 'Network Error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getStatsData = (statistics: PlatformStatistics) => [
    {
      name: 'Total Schools',
      value: formatNumber(statistics.total_schools),
      change: statistics.growth_metrics.schools,
      changeType: 'positive',
      icon: BuildingOfficeIcon,
      description: `${statistics.active_schools} active`,
    },
    {
      name: 'School Owners',
      value: formatNumber(statistics.total_school_owners),
      change: statistics.growth_metrics.school_owners,
      changeType: 'positive',
      icon: UserGroupIcon,
      description: 'Platform administrators',
    },

    {
      name: 'Monthly Growth',
      value: statistics.growth_metrics.monthly_growth,
      change: statistics.growth_metrics.monthly_growth,
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
      description: 'Platform expansion',
    },
  ];

  const quickActions = [
    {
      name: 'View All Schools',
      description: 'Manage and monitor all schools',
      href: '/platform/schools',
      icon: EyeIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Platform Analytics',
      description: 'View detailed platform analytics',
      href: '/platform/analytics',
      icon: ChartBarIcon,
      color: 'bg-orange-500',
    },
    {
      name: 'School Owners',
      description: 'Manage school owners and permissions',
      href: '/platform/school-owners',
      icon: UserGroupIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Platform Settings',
      description: 'Configure platform-wide settings',
      href: '/platform/settings',
      icon: CogIcon,
      color: 'bg-gray-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Failed to load dashboard</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Please refresh the page to try again.
        </p>
        <button
          onClick={loadDashboardData}
          className="mt-4 btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  const statsData = getStatsData(dashboardData.statistics);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Platform Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Welcome back, {user?.full_name}. Here's what's happening on your platform today.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/platform/school-owners/create"
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add School Owner
          </Link>

        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-primary-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'positive'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                      {stat.change}
                    </div>
                  </dd>
                  <dd className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trial Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Trials</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {dashboardData.trial_statistics?.total_trial_schools || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Trials</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {dashboardData.trial_statistics?.active_trials || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Converted</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {dashboardData.trial_statistics?.converted_trials || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expiring Soon</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {dashboardData.trial_statistics?.trials_expiring_soon || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="card p-6 hover:shadow-lg transition-shadow duration-200 group"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity and Schools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Platform Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recent_activity.length > 0 ? (
                dashboardData.recent_activity.map((activity, index) => {
                  const getActivityIcon = (type: string) => {
                    switch (type) {
                      case 'school_registered':
                        return BuildingOfficeIcon;
                      case 'owner_created':
                        return UserGroupIcon;
                      default:
                        return ClockIcon;
                    }
                  };

                  const getActivityColor = (type: string) => {
                    switch (type) {
                      case 'school_registered':
                        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
                      case 'owner_created':
                        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400';
                      default:
                        return 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400';
                    }
                  };

                  const ActivityIcon = getActivityIcon(activity.type);
                  const formatTime = (timestamp: string) => {
                    const date = new Date(timestamp);
                    const now = new Date();
                    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

                    if (diffInHours < 1) return 'Just now';
                    if (diffInHours < 24) return `${diffInHours} hours ago`;
                    const diffInDays = Math.floor(diffInHours / 24);
                    return `${diffInDays} days ago`;
                  };

                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                          <ActivityIcon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.description} • {formatTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Schools */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Recent Schools
              </h3>
              <Link
                to="/platform/schools"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recent_schools.length > 0 ? (
                dashboardData.recent_schools.map((school) => (
                  <div key={school.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {school.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {school.student_count} students • {school.teacher_count} teachers
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        school.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {school.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No schools registered yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformAdminPage;
