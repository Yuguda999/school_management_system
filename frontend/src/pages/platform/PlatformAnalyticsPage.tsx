import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../hooks/useToast';
import { useCurrency } from '../../contexts/CurrencyContext';
import platformAdminService, { PlatformStatistics } from '../../services/platformAdminService';

interface AnalyticsMetric {
  name: string;
  value: number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

interface TimeSeriesData {
  date: string;
  schools: number;
  students: number;
  teachers: number;
  revenue: number;
}

const PlatformAnalyticsPage: React.FC = () => {
  const { canManagePlatform } = usePermissions();
  const { showError } = useToast();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStatistics | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [timeSeriesData] = useState<TimeSeriesData[]>([
    { date: '2024-01-01', schools: 45, students: 1200, teachers: 180, revenue: 25000 },
    { date: '2024-01-15', schools: 48, students: 1350, teachers: 195, revenue: 28000 },
    { date: '2024-02-01', schools: 52, students: 1480, teachers: 210, revenue: 31000 },
    { date: '2024-02-15', schools: 55, students: 1620, teachers: 225, revenue: 34000 },
    { date: '2024-03-01', schools: 58, students: 1750, teachers: 240, revenue: 37000 },
    { date: '2024-03-15', schools: 62, students: 1890, teachers: 255, revenue: 40000 }
  ]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await platformAdminService.getDashboardData();
      setStats(data.statistics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      showError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (!canManagePlatform()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  const metrics: AnalyticsMetric[] = stats ? [
    {
      name: 'Total Schools',
      value: stats.total_schools,
      change: stats.growth_metrics?.schools || '0%',
      changeType: (stats.growth_metrics?.schools || '').startsWith('+') ? 'increase' : 'decrease',
      icon: BuildingOfficeIcon,
      color: 'text-blue-600'
    },
    {
      name: 'Total Students',
      value: stats.total_students,
      change: stats.growth_metrics?.students || '0%',
      changeType: (stats.growth_metrics?.students || '').startsWith('+') ? 'increase' : 'decrease',
      icon: AcademicCapIcon,
      color: 'text-green-600'
    },
    {
      name: 'Total Teachers',
      value: stats.total_teachers,
      change: stats.growth_metrics?.teachers || '0%',
      changeType: (stats.growth_metrics?.teachers || '').startsWith('+') ? 'increase' : 'decrease',
      icon: UserGroupIcon,
      color: 'text-purple-600'
    },
    {
      name: 'School Owners',
      value: stats.total_school_owners,
      change: stats.growth_metrics?.owners || '0%',
      changeType: (stats.growth_metrics?.owners || '').startsWith('+') ? 'increase' : 'decrease',
      icon: UserGroupIcon,
      color: 'text-orange-600'
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Comprehensive analytics and insights for the entire platform.
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.name} className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <metric.icon className={`h-8 w-8 ${metric.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {metric.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {(metric.value || 0).toLocaleString()}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${metric.changeType === 'increase'
                          ? 'text-green-600'
                          : metric.changeType === 'decrease'
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}>
                        {metric.changeType === 'increase' ? (
                          <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4 mr-1" />
                        ) : metric.changeType === 'decrease' ? (
                          <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4 mr-1" />
                        ) : null}
                        {metric.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Platform Growth
            </h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Growth chart visualization would go here
              </p>
              <p className="text-xs text-gray-400">
                Integration with charting library needed
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Revenue Trends
            </h3>
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Revenue chart visualization would go here
              </p>
              <p className="text-xs text-gray-400">
                Integration with charting library needed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Performance */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Top Performing Schools
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Greenwood High School', students: 450, growth: '+12%' },
              { name: 'Riverside Academy', students: 380, growth: '+8%' },
              { name: 'Oakwood Elementary', students: 320, growth: '+15%' },
              { name: 'Sunset Middle School', students: 290, growth: '+5%' },
              { name: 'Pine Valley School', students: 275, growth: '+10%' }
            ].map((school, index) => (
              <div key={school.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {school.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {school.students} students
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {school.growth}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            System Health
          </h3>
          <div className="space-y-4">
            {[
              { metric: 'Server Uptime', value: '99.9%', status: 'excellent' },
              { metric: 'Response Time', value: '120ms', status: 'good' },
              { metric: 'Error Rate', value: '0.1%', status: 'excellent' },
              { metric: 'Database Performance', value: '95%', status: 'good' },
              { metric: 'Storage Usage', value: '68%', status: 'warning' }
            ].map((item) => (
              <div key={item.metric} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.metric}
                </span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                    {item.value}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${item.status === 'excellent'
                      ? 'bg-green-500'
                      : item.status === 'good'
                        ? 'bg-blue-500'
                        : 'bg-yellow-500'
                    }`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Activity Summary
          </h3>
          <div className="space-y-4">
            {[
              { action: 'New school registrations', count: 3, period: 'Today' },
              { action: 'Teacher invitations sent', count: 15, period: 'This week' },
              { action: 'Student enrollments', count: 127, period: 'This week' },
              { action: 'System updates', count: 2, period: 'This month' },
              { action: 'Support tickets', count: 8, period: 'This week' }
            ].map((activity) => (
              <div key={activity.action} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.period}
                  </p>
                </div>
                <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                  {activity.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Historical Data
          </h3>
          <button className="btn btn-secondary">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Schools
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Teachers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {timeSeriesData.slice(-6).map((data) => (
                <tr key={data.date} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {data.schools}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(data.students || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {data.teachers || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(data.revenue || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalyticsPage;
