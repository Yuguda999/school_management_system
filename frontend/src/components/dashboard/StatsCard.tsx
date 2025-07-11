import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface StatsCardProps {
  name: string;
  value: string;
  icon: React.ElementType;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
}

const StatsCard: React.FC<StatsCardProps> = ({
  name,
  value,
  icon: Icon,
  change,
  changeType,
}) => {
  return (
    <div className="card p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {name}
            </dt>
            <dd>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {value}
              </div>
            </dd>
          </dl>
        </div>
      </div>
      <div className="mt-4">
        <div
          className={`flex items-center text-sm ${
            changeType === 'increase'
              ? 'text-green-600 dark:text-green-400'
              : changeType === 'decrease'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {changeType === 'increase' ? (
            <ArrowUpIcon className="h-4 w-4 flex-shrink-0 mr-1.5" aria-hidden="true" />
          ) : changeType === 'decrease' ? (
            <ArrowDownIcon className="h-4 w-4 flex-shrink-0 mr-1.5" aria-hidden="true" />
          ) : null}
          <span className="font-medium">{change}</span>
          <span className="ml-1">from last month</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
