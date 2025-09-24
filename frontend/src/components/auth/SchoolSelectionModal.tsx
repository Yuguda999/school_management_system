import React, { useState } from 'react';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as CrownIcon
} from '@heroicons/react/24/solid';
import { SchoolOption } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SchoolSelectionModalProps {
  schools: SchoolOption[];
  onSelectSchool: (schoolId: string) => Promise<void>;
  isLoading?: boolean;
}

const SchoolSelectionModal: React.FC<SchoolSelectionModalProps> = ({
  schools,
  onSelectSchool,
  isLoading = false
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedSchoolId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSelectSchool(selectedSchoolId);
    } catch (error) {
      console.error('Failed to select school:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchoolClick = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
            Loading your schools...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900">
              <BuildingOfficeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Select Your School
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Please select which school you'd like to manage.
            </p>
          </div>

          {/* School List */}
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {schools.map((school) => (
              <div
                key={school.id}
                onClick={() => handleSchoolClick(school.id)}
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedSchoolId === school.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* School Logo/Icon */}
                  <div className="flex-shrink-0">
                    {school.logo_url ? (
                      <img
                        src={school.logo_url}
                        alt={`${school.name} logo`}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* School Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {school.name}
                      </h4>
                      {school.is_primary && (
                        <CrownIcon className="h-4 w-4 text-yellow-500" title="Primary School" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Code: {school.code}
                    </p>
                    
                    {/* Subscription Status */}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        school.subscription_status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : school.subscription_status === 'trial'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {school.subscription_plan === 'trial' ? 'Trial' : school.subscription_plan}
                      </span>
                      
                      {school.is_trial && school.trial_expires_at && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Expires {new Date(school.trial_expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedSchoolId === school.id && (
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleSubmit}
              disabled={!selectedSchoolId || isSubmitting}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Selecting...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You can switch between schools anytime from the settings page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolSelectionModal;
