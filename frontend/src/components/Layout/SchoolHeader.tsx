import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import ThemeAwareLogo from '../ui/ThemeAwareLogo';

interface SchoolHeaderProps {
  onMenuClick: () => void;
}

const SchoolHeader: React.FC<SchoolHeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  // Debug logging to track re-renders
  console.log('🏫 SchoolHeader render - user school:', {
    schoolId: user?.school?.id,
    schoolName: user?.school?.name,
    logoUrl: user?.school?.logo_url,
    motto: user?.school?.motto
  });

  const getSchoolName = () => {
    return user?.school?.name || 'School Management System';
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'school_owner': 'School Owner',
      'school_admin': 'Administrator',
      'teacher': 'Teacher',
      'student': 'Student',
      'parent': 'Parent'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
      <button
        type="button"
        className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <div className="flex items-center space-x-3">
              {/* School Logo */}
              <ThemeAwareLogo
                logoUrl={user?.school?.logo_url ? `http://localhost:8000${user.school.logo_url}` : undefined}
                schoolName={getSchoolName()}
                size="md"
                showFallback={true}
              />

              {/* School Name */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  {getSchoolName()}
                </h2>
                {user?.school?.motto && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {user.school.motto}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          <ThemeToggle />
          
          {/* School status indicator */}
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Active
            </span>
          </div>
          
          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role ? getRoleDisplayName(user.role) : 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolHeader;
