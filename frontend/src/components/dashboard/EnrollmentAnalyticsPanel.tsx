/**
 * Enrollment Analytics Panel Component (P2.1)
 * Displays enrollment and cohort trends for admins
 */

import React, { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import analyticsService, { EnrollmentAnalytics } from '../../services/analyticsService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';

interface EnrollmentAnalyticsPanelProps {
  session?: string;
}

const EnrollmentAnalyticsPanel: React.FC<EnrollmentAnalyticsPanelProps> = ({ session }) => {
  const schoolCode = useSchoolCode();
  const [analytics, setAnalytics] = useState<EnrollmentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!schoolCode) return;
      try {
        setLoading(true);
        const data = await analyticsService.getEnrollmentAnalytics(schoolCode, session);
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load enrollment analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [schoolCode, session]);

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
        {error || 'No enrollment data available'}
      </Card>
    );
  }

  const isGrowthPositive = analytics.growth_rate >= 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Enrollment</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.current_enrollment}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isGrowthPositive ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
              {isGrowthPositive ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Growth Rate</p>
              <p className={`text-2xl font-bold ${isGrowthPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isGrowthPositive ? '+' : ''}{analytics.growth_rate.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <UserGroupIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Retention Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.retention_rate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Previous Year</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.previous_enrollment}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Class Capacity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Capacity Utilization</h3>
        <div className="space-y-4">
          {analytics.by_class.map((cls) => (
            <div key={cls.class_id}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cls.class_name}</span>
                <span className="text-sm text-gray-500">{cls.count} / {cls.capacity} ({cls.utilization.toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${cls.utilization >= 90 ? 'bg-red-500' :
                      cls.utilization >= 70 ? 'bg-yellow-500' :
                        'bg-green-500'
                    }`}
                  style={{ width: `${Math.min(cls.utilization, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gender Distribution</h3>
          <div className="flex items-center justify-center space-x-8">
            {Object.entries(analytics.gender_distribution).map(([gender, count]) => (
              <div key={gender} className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${gender.toLowerCase() === 'male' ? 'bg-blue-100 text-blue-600' :
                    gender.toLowerCase() === 'female' ? 'bg-pink-100 text-pink-600' :
                      'bg-gray-100 text-gray-600'
                  }`}>
                  {count}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{gender}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Enrollment Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enrollment Trends</h3>
          <div className="space-y-3">
            {analytics.enrollment_trends.map((trend, index) => {
              const prevCount = index > 0 ? analytics.enrollment_trends[index - 1].total : trend.total;
              const change = trend.total - prevCount;
              return (
                <div key={trend.period_label} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="font-medium text-gray-900 dark:text-white">{trend.period_label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">{trend.total}</span>
                    {index > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${change > 0 ? 'bg-green-100 text-green-700' :
                          change < 0 ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {change > 0 ? '+' : ''}{change}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EnrollmentAnalyticsPanel;

