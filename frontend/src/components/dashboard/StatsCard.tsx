import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';

interface StatsCardProps {
  name: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  color?: string;
  valueClassName?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  name,
  value,
  icon: Icon,
  change,
  changeType,
  color = 'bg-primary-500',
  valueClassName
}) => {
  // Extract color class for text/bg based on the input color class (assuming tailwind classes like 'bg-blue-500')
  // This is a simple heuristic, might need adjustment based on exact usage
  const getColorClasses = (colorClass: string) => {
    if (colorClass.includes('blue')) return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
    if (colorClass.includes('green')) return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
    if (colorClass.includes('red')) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' };
    if (colorClass.includes('yellow')) return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' };
    if (colorClass.includes('purple')) return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' };
    if (colorClass.includes('indigo')) return { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' };
    if (colorClass.includes('orange')) return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' };
    if (colorClass.includes('teal')) return { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' };
    return { bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-600 dark:text-primary-400' };
  };

  const { bg, text } = getColorClasses(color);

  return (
    <div className="card p-5 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${bg} ${text} shadow-sm`}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {name}
            </dt>
            <dd>
              <div className={`text-xl font-bold text-gray-900 dark:text-white ${valueClassName}`}>
                {value}
              </div>
            </dd>
          </dl>
        </div>
      </div>
      {(change || changeType) && (
        <div className="mt-4">
          <div
            className={`flex items-center text-sm ${changeType === 'increase'
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
            ) : (
              <MinusIcon className="h-4 w-4 flex-shrink-0 mr-1.5" aria-hidden="true" />
            )}
            <span className="font-medium">{change}</span>
            {change && <span className="ml-1 text-gray-400 dark:text-gray-500">from last month</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
