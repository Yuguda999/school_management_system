import React, { useState } from 'react';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
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
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-fade-in">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-scale-in">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-center text-gray-600 dark:text-gray-400 font-medium">
            Loading your schools...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-fade-in">
      <div className="relative mx-auto p-0 border border-gray-200 dark:border-gray-700 w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-2xl rounded-2xl bg-white dark:bg-gray-800 overflow-hidden animate-scale-in">
        {/* Header Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary-600 to-secondary-600 opacity-10"></div>

        <div className="relative p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/50 mb-4 shadow-inner">
              <BuildingOfficeIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Select Your School
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Please select which school you'd like to manage.
            </p>
          </div>

          {/* School List */}
          <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {schools.map((school) => (
              <div
                key={school.id}
                onClick={() => handleSchoolClick(school.id)}
                className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 group ${selectedSchoolId === school.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md transform scale-[1.01]'
                    : 'border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
              >
                <div className="flex items-start space-x-4">
                  {/* School Logo/Icon */}
                  <div className="flex-shrink-0">
                    {school.logo_url ? (
                      <img
                        src={school.logo_url}
                        alt={`${school.name} logo`}
                        className="h-14 w-14 rounded-xl object-cover shadow-sm"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-sm">
                        <BuildingOfficeIcon className="h-7 w-7 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* School Info */}
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                        {school.name}
                      </h4>
                      {school.is_primary && (
                        <CrownIcon className="h-5 w-5 text-yellow-500 drop-shadow-sm" title="Primary School" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                      {school.code}
                    </p>

                    {/* Subscription Status */}
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${school.subscription_status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : school.subscription_status === 'trial'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                        {school.subscription_plan === 'trial' ? 'Trial Plan' : school.subscription_plan}
                      </span>

                      {school.is_trial && school.trial_expires_at && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          Expires {new Date(school.trial_expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className={`flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full border-2 transition-colors duration-200 ${selectedSchoolId === school.id
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-primary-400'
                    }`}>
                    {selectedSchoolId === school.id && (
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleSubmit}
              disabled={!selectedSchoolId || isSubmitting}
              className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span className="ml-2">Accessing School...</span>
                </>
              ) : (
                <span>Continue to Dashboard</span>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              You can switch between schools anytime from the settings page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolSelectionModal;
