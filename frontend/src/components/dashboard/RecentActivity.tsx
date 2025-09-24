import React, { useState, useEffect } from 'react';
import {
  UserPlusIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';

interface Activity {
  id: string;
  type: 'enrollment' | 'payment' | 'grade' | 'message';
  title: string;
  description: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
}

const RecentActivity: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // In a real implementation, you would fetch activities based on currentTerm
    // For now, we'll use mock data that could vary by term
    const baseActivities: Activity[] = [
      {
        id: '1',
        type: 'enrollment',
        title: 'New Student Enrolled',
        description: 'Sarah Johnson joined Grade 10-A',
        time: '2 hours ago',
        icon: UserPlusIcon,
        iconColor: 'text-green-600',
      },
  {
    id: '2',
    type: 'payment',
    title: 'Fee Payment Received',
    description: 'John Smith paid $500 for tuition fees',
    time: '4 hours ago',
    icon: CurrencyDollarIcon,
    iconColor: 'text-primary-600',
  },
  {
    id: '3',
    type: 'grade',
    title: 'Grades Updated',
    description: 'Math test results published for Grade 9-B',
    time: '6 hours ago',
    icon: AcademicCapIcon,
    iconColor: 'text-secondary-600',
  },
  {
    id: '4',
    type: 'message',
    title: 'New Announcement',
    description: 'Parent-teacher meeting scheduled for next week',
    time: '1 day ago',
    icon: ChatBubbleLeftRightIcon,
    iconColor: 'text-orange-600',
  },
];

    // Modify activities based on current term
    if (currentTerm) {
      const termSpecificActivities = baseActivities.map(activity => ({
        ...activity,
        description: `${activity.description} (${currentTerm.name})`
      }));
      setActivities(termSpecificActivities);
    } else {
      setActivities(baseActivities);
    }
  }, [currentTerm]);

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
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4">
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${activity.iconColor}`}>
                <activity.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-center">
        <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium">
          View all activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
