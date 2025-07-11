import React, { useState, useEffect } from 'react';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { communicationService, MessageStatistics } from '../../services/communicationService';

const CommunicationStats: React.FC = () => {
  const [stats, setStats] = useState<MessageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await communicationService.getStatistics(selectedDays);
      setStats(data);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedDays]);

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
          onClick={fetchStats}
          className="mt-2 btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Messages',
      value: stats.total_messages,
      icon: EnvelopeIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Sent Messages',
      value: stats.sent_messages,
      icon: PaperAirplaneIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Delivered',
      value: stats.delivered_messages,
      icon: CheckCircleIcon,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      title: 'Read Messages',
      value: stats.read_messages,
      icon: EyeIcon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Failed Messages',
      value: stats.failed_messages,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    },
    {
      title: 'Scheduled',
      value: stats.scheduled_messages,
      icon: ClockIcon,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
    },
  ];

  const deliveryRate = stats.sent_messages > 0 
    ? ((stats.delivered_messages / stats.sent_messages) * 100).toFixed(1)
    : '0';

  const readRate = stats.delivered_messages > 0 
    ? ((stats.read_messages / stats.delivered_messages) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Communication Statistics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Overview of messaging activity
          </p>
        </div>
        <div>
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="input text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery & Read Rates */}
        <div className="card p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Performance Metrics
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Delivery Rate
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {deliveryRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${deliveryRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Read Rate
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {readRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${readRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages by Type */}
        <div className="card p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Messages by Type
          </h4>
          <div className="space-y-3">
            {Object.entries(stats.messages_by_type).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {type === 'email' && <EnvelopeIcon className="h-4 w-4 text-blue-600" />}
                  {type === 'sms' && <span className="text-green-600">📱</span>}
                  {type === 'notification' && <BellIcon className="h-4 w-4 text-purple-600" />}
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {type}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recent_activity && stats.recent_activity.length > 0 && (
        <div className="card p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h4>
          <div className="space-y-3">
            {stats.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex justify-between items-center py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.count} {activity.type} messages
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {activity.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationStats;
