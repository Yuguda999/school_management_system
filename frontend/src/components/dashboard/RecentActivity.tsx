import React, { useState, useEffect } from 'react';
import {
  UserPlusIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { useNavigate } from 'react-router-dom';
import { buildSchoolRouteUrl, getSchoolCodeFromUrl } from '../../utils/schoolCode';

import { RecentActivity as RecentActivityType } from '../../services/reportsService';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  activities?: RecentActivityType[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities = [] }) => {
  const { currentTerm } = useCurrentTerm();
  const navigate = useNavigate();

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'enrollment':
        return { icon: UserPlusIcon, color: 'text-green-600' };
      case 'payment':
        return { icon: CurrencyDollarIcon, color: 'text-primary-600' };
      case 'grade':
        return { icon: AcademicCapIcon, color: 'text-secondary-600' };
      case 'message':
      case 'announcement':
        return { icon: ChatBubbleLeftRightIcon, color: 'text-orange-600' };
      default:
        return { icon: UserPlusIcon, color: 'text-gray-600' };
    }
  };

  const handleViewAll = () => {
    const schoolCode = getSchoolCodeFromUrl();
    if (schoolCode) {
      navigate(buildSchoolRouteUrl(schoolCode, 'audit-logs'));
    }
  };

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Recent Activity
          {currentTerm && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({currentTerm.name})
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Latest updates from your school
        </p>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities.map((activity) => {
          const { icon: Icon, color } = getIconConfig(activity.type);
          return (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${color}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-center">
        <button
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium transition-colors"
          onClick={handleViewAll}
        >
          View all activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
