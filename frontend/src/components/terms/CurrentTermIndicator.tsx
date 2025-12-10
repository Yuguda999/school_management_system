import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { termUtils } from '../../utils/termUtils';
import LoadingSpinner from '../ui/LoadingSpinner';

interface CurrentTermIndicatorProps {
  variant?: 'card' | 'banner' | 'compact' | 'inline';
  showDetails?: boolean;
  className?: string;
}

const CurrentTermIndicator: React.FC<CurrentTermIndicatorProps> = ({
  variant = 'card',
  showDetails = true,
  className = ''
}) => {
  const { currentTerm, loading, error, hasCurrentTerm } = useCurrentTerm();
  const { schoolCode } = useParams<{ schoolCode: string }>();

  // Build the link to the sessions page where terms can be managed
  const sessionsLink = schoolCode ? `/school/${schoolCode}/sessions` : '/sessions';

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading current term...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
        <ExclamationTriangleIcon className="h-5 w-5" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!hasCurrentTerm || !currentTerm) {
    const noTermContent = (
      <>
        <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <div>
          <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
            No Current Term Set
          </div>
          {showDetails && (
            <div className="text-xs text-amber-600 dark:text-amber-300">
              <Link
                to={sessionsLink}
                className="inline-flex items-center gap-1 underline hover:text-amber-800 dark:hover:text-amber-100 transition-colors"
              >
                Set up academic sessions and terms
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </>
    );

    switch (variant) {
      case 'banner':
        return (
          <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 ${className}`}>
            <div className="flex items-center space-x-3">
              {noTermContent}
            </div>
          </div>
        );
      case 'compact':
        return (
          <div className={`flex items-center space-x-2 text-amber-600 ${className}`}>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm">No current term</span>
          </div>
        );
      case 'inline':
        return (
          <span className={`inline-flex items-center space-x-1 text-amber-600 ${className}`}>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm">No current term</span>
          </span>
        );
      default:
        return (
          <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 ${className}`}>
            <div className="flex items-center space-x-3">
              {noTermContent}
            </div>
          </div>
        );
    }
  }

  const termInfo = {
    ...currentTerm,
    status: termUtils.getTermStatus(currentTerm),
    statusText: termUtils.getTermStatusText(currentTerm),
    statusColor: termUtils.getTermStatusColor(currentTerm),
    formattedType: termUtils.formatTermType(currentTerm.type),
    formattedSession: termUtils.formatAcademicSession(currentTerm.academic_session),
    formattedDateRange: termUtils.formatDateRange(currentTerm.start_date, currentTerm.end_date),
    duration: termUtils.getTermDuration(currentTerm),
  };

  const termContent = (
    <>
      <div className="flex-shrink-0">
        <AcademicCapIcon className="h-6 w-6 text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {termInfo.name}
          </h3>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${termInfo.statusColor}`}>
            {termInfo.statusText}
          </span>
        </div>

        {showDetails && (
          <div className="mt-1 space-y-1">
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <CalendarIcon className="h-3 w-3" />
                <span>{termInfo.formattedType}</span>
              </span>
              <span>{termInfo.formattedSession}</span>
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <ClockIcon className="h-3 w-3" />
                <span>{termInfo.formattedDateRange}</span>
              </span>
              <span>({termInfo.duration} days)</span>
            </div>
          </div>
        )}
      </div>
    </>
  );

  switch (variant) {
    case 'banner':
      return (
        <div className={`bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 ${className}`}>
          <div className="flex items-start space-x-3">
            {termContent}
          </div>
        </div>
      );

    case 'compact':
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <AcademicCapIcon className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {termInfo.name}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${termInfo.statusColor}`}>
            {termInfo.statusText}
          </span>
        </div>
      );

    case 'inline':
      return (
        <span className={`inline-flex items-center space-x-1 ${className}`}>
          <AcademicCapIcon className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {termInfo.name}
          </span>
          {showDetails && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({termInfo.formattedSession})
            </span>
          )}
        </span>
      );

    default: // card
      return (
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm ${className}`}>
          <div className="flex items-start space-x-3">
            {termContent}
          </div>

          {showDetails && termInfo.status !== 'current' && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <InformationCircleIcon className="h-4 w-4 text-primary-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {termInfo.status === 'upcoming'
                    ? 'This term has not started yet.'
                    : 'This term has ended.'
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      );
  }
};

export default CurrentTermIndicator;
