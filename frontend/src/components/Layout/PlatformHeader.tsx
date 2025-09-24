import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

interface PlatformHeaderProps {
  onMenuClick: () => void;
}

const PlatformHeader: React.FC<PlatformHeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

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
            <div className="flex items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Platform Administration
              </h2>
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          <ThemeToggle />
          
          {/* Platform admin indicator */}
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              System Online
            </span>
          </div>
          
          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Platform Administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformHeader;
