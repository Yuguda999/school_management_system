import React, { useState } from 'react';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon
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
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-fade-in">
        <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-scale-in border border-white/20 backdrop-blur-xl">
          <LoadingSpinner size="lg" />
          <p className="mt-6 text-center text-gray-600 dark:text-gray-300 font-medium tracking-wide">
            Loading your schools...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="relative w-full max-w-4xl mx-auto transform transition-all animate-scale-in">
        {/* Main Card */}
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">

          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-primary-600/20 via-primary-500/10 to-transparent opacity-60"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl"></div>

          <div className="relative flex flex-col md:flex-row h-full md:h-[600px]">

            {/* Left Panel - Branding/Info */}
            <div className="w-full md:w-1/3 p-8 md:p-10 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 flex flex-col justify-between">
              <div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-8">
                  <BuildingOfficeIcon className="h-7 w-7 text-white" />
                </div>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                  Select Your School
                </h2>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  Welcome back! Please choose the school you wish to manage or access today. You can switch between them anytime.
                </p>
              </div>

              <div className="hidden md:block">
                <div className="flex items-center space-x-2 text-sm text-gray-400 dark:text-gray-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  <span>Secure Connection</span>
                </div>
              </div>
            </div>

            {/* Right Panel - School List */}
            <div className="w-full md:w-2/3 p-6 md:p-10 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar -mr-2">
                <div className="grid gap-4">
                  {schools.map((school, index) => (
                    <div
                      key={school.id}
                      onClick={() => handleSchoolClick(school.id)}
                      className={`group relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ease-out ${selectedSchoolId === school.id
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10 scale-[1.02]'
                        : 'border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md'
                        }`}
                      style={{ animationDelay: `${index * 75}ms` }}
                    >
                      {/* Selection Checkmark */}
                      <div className={`absolute top-4 right-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedSchoolId === school.id
                        ? 'bg-primary-500 border-primary-500 scale-100 opacity-100'
                        : 'border-gray-200 dark:border-gray-600 scale-90 opacity-0 group-hover:opacity-100'
                        }`}>
                        <CheckCircleIcon className="h-4 w-4 text-white" />
                      </div>

                      {/* Logo */}
                      <div className="flex-shrink-0 mr-5">
                        {school.logo_url ? (
                          <>
                            <img
                              src={school.logo_url.startsWith('http') ? school.logo_url : `http://localhost:8000${school.logo_url}`}
                              alt={`${school.name} logo`}
                              className="h-16 w-16 rounded-2xl object-cover shadow-sm ring-1 ring-gray-100 dark:ring-gray-700"
                              onError={(e) => {
                                // Fallback to icon if image fails to load
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            {/* Fallback Icon (hidden by default) */}
                            <div className="hidden h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-sm">
                              <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          </>
                        ) : (
                          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-sm transition-colors duration-300 ${selectedSchoolId === school.id
                            ? 'bg-white dark:bg-gray-800 text-primary-600'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-primary-50 dark:group-hover:bg-gray-700 group-hover:text-primary-500'
                            }`}>
                            <BuildingOfficeIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-lg font-bold truncate transition-colors duration-200 ${selectedSchoolId === school.id ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'
                            }`}>
                            {school.name}
                          </h3>
                          {school.is_primary && (
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1 rounded-md" title="Primary School">
                              <CrownIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                          <span className="font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-xs">
                            {school.code}
                          </span>

                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${school.subscription_status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : school.subscription_status === 'trial'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {school.subscription_plan === 'trial' ? 'Trial' : school.subscription_plan}
                          </span>
                        </div>

                        {school.is_trial && school.trial_expires_at && (
                          <div className="mt-2 flex items-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg w-fit">
                            <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
                            Expires {new Date(school.trial_expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm text-gray-400 hidden sm:block">
                  {schools.length} {schools.length === 1 ? 'school' : 'schools'} available
                </p>

                <button
                  onClick={handleSubmit}
                  disabled={!selectedSchoolId || isSubmitting}
                  className={`
                    relative overflow-hidden group flex items-center justify-center py-3.5 px-8 rounded-xl font-semibold text-white shadow-lg shadow-primary-500/30 transition-all duration-300
                    ${!selectedSchoolId || isSubmitting
                      ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-70 shadow-none'
                      : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 hover:shadow-primary-500/50 transform hover:-translate-y-0.5'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" color="white" />
                      <span>Accessing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Continue to Dashboard</span>
                      <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolSelectionModal;
