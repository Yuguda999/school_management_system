/**
 * Finance Analytics Panel Component (P1.2)
 * Displays financial performance analytics for admins
 */

import React, { useEffect, useState } from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import analyticsService, { FinanceAnalytics } from '../../services/analyticsService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';

interface FinanceAnalyticsPanelProps {
  termId?: string;
}

const FinanceAnalyticsPanel: React.FC<FinanceAnalyticsPanelProps> = ({ termId }) => {
  const schoolCode = useSchoolCode();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<FinanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = user?.school?.settings?.currency || '$';

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!schoolCode) return;
      try {
        setLoading(true);
        const data = await analyticsService.getFinanceAnalytics(schoolCode, termId);
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load finance analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [schoolCode, termId]);

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
        {error || 'No finance data available'}
      </Card>
    );
  }

  const formatCurrency = (amount: number) => `${currency}${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expected</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(analytics.total_revenue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Collected</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(analytics.total_collected)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Collection Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{analytics.overall_collection_rate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(analytics.total_pending)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Aging Buckets */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aging Analysis</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.aging_buckets.map((bucket, index) => {
            const colors = [
              'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-green-700 dark:text-green-300',
              'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400 text-yellow-700 dark:text-yellow-300',
              'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-orange-700 dark:text-orange-300',
              'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-red-700 dark:text-red-300'
            ];
            const colorClass = colors[index] || colors[3];
            const [bg, border, textLabel, textValue] = colorClass.split(' '); // Simplified for logic, actual class string used below

            return (
              <div key={bucket.bucket_name} className={`p-4 rounded-lg border ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
                <p className={`text-sm ${colorClass.split(' ').slice(2, 4).join(' ')}`}>{bucket.bucket_name}</p>
                <p className={`text-2xl font-bold ${colorClass.split(' ').slice(4).join(' ')}`}>{formatCurrency(bucket.amount)}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Revenue by Term */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Term</h3>
        <div className="space-y-4">
          {analytics.revenue_by_term.map((term) => {
            const percentage = term.target_revenue > 0 ? (term.actual_revenue / term.target_revenue) * 100 : 0;
            return (
              <div key={term.term_id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{term.term_name}</span>
                  <span className="text-sm text-gray-500">{formatCurrency(term.actual_revenue)} / {formatCurrency(term.target_revenue)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Revenue by Fee Type */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Fee Type</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.fee_type_breakdown.map((type) => (
            <div key={type.fee_type} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{type.fee_type.replace(/_/g, ' ')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(type.collected)}</p>
              <p className="text-xs text-gray-400">Assigned: {formatCurrency(type.total_assigned)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FinanceAnalyticsPanel;

