import React from 'react';
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import NotificationBell from '../Notifications/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

interface PlatformHeaderProps {
  onMenuClick: () => void;
}

const PlatformHeader: React.FC<PlatformHeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 sticky top-0">
      <button
        type="button"
        className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex-1 px-4 flex justify-between items-center">
        {/* Search Bar (Placeholder) */}
        <div className="flex-1 flex max-w-md ml-4 md:ml-0">
          <div className="relative w-full text-gray-400 focus-within:text-gray-600 dark:focus-within:text-gray-300">
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <input
              name="search"
              id="search"
              className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm bg-transparent"
              placeholder="Search platform..."
              type="search"
            />
          </div>
        </div>

        <div className="ml-4 flex items-center md:ml-6 space-x-2">
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

          {/* User info */}
          <div className="flex items-center">
            <div className="hidden md:block text-right mr-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.first_name}
              </p>
            </div>
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-800 cursor-pointer hover:ring-blue-500 transition-all">
              <span className="text-xs font-bold text-white">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformHeader;
