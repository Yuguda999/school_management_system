import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const PlatformMobileNavigation: React.FC = () => {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/platform',
      icon: HomeIcon,
    },
    {
      name: 'Schools',
      href: '/platform/schools',
      icon: BuildingOfficeIcon,
    },
    {
      name: 'Owners',
      href: '/platform/school-owners',
      icon: UserGroupIcon,
    },

    {
      name: 'Analytics',
      href: '/platform/analytics',
      icon: ChartBarIcon,
    },
    {
      name: 'Settings',
      href: '/platform/settings',
      icon: Cog6ToothIcon,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
      <div className="grid grid-cols-5 py-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors duration-200 ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`
            }
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default PlatformMobileNavigation;
