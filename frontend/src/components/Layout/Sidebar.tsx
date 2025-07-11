import React from 'react';
import { NavLink } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      roles: ['super_admin', 'admin', 'teacher', 'student', 'parent'],
      description: 'Overview and analytics'
    },
    {
      name: 'Students',
      href: '/students',
      icon: AcademicCapIcon,
      roles: ['super_admin', 'admin', 'teacher'],
      description: 'Manage student records'
    },
    {
      name: 'Teachers',
      href: '/teachers',
      icon: UserGroupIcon,
      roles: ['super_admin', 'admin'],
      description: 'Manage teaching staff'
    },
    {
      name: 'Classes',
      href: '/classes',
      icon: BuildingOfficeIcon,
      roles: ['super_admin', 'admin', 'teacher'],
      description: 'Class management'
    },
    {
      name: 'Subjects',
      href: '/subjects',
      icon: BookOpenIcon,
      roles: ['super_admin', 'admin', 'teacher'],
      description: 'Subject management'
    },
    {
      name: 'Fees',
      href: '/fees',
      icon: CurrencyDollarIcon,
      roles: ['super_admin', 'admin', 'teacher'],
      description: 'Fee management'
    },
    {
      name: 'Grades',
      href: '/grades',
      icon: ChartBarIcon,
      roles: ['super_admin', 'admin', 'teacher', 'student', 'parent'],
      description: 'Academic performance'
    },
    {
      name: 'Communication',
      href: '/communication',
      icon: ChatBubbleLeftRightIcon,
      roles: ['super_admin', 'admin', 'teacher', 'student', 'parent'],
      description: 'Messages and announcements'
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: DocumentChartBarIcon,
      roles: ['super_admin', 'admin', 'teacher'],
      description: 'Analytics and reports'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      roles: ['super_admin', 'admin', 'teacher', 'student', 'parent'],
      description: 'System preferences'
    },
  ];

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                School MS
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Management System
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              className="ml-auto md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          )}
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
              onClick={onClose}
            >
              <item.icon
                className="mr-3 flex-shrink-0 h-6 w-6"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div>
            <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
