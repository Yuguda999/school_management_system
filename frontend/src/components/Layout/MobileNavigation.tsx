import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const MobileNavigation: React.FC = () => {
  const { user } = useAuth();

  const navigation = [
    {
      name: 'Platform',
      href: '/platform',
      icon: BuildingOfficeIcon,
      roles: ['platform_super_admin']
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher', 'student', 'parent']
    },
    {
      name: 'Students',
      href: '/students',
      icon: AcademicCapIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher']
    },
    {
      name: 'Teachers',
      href: '/teachers',
      icon: UserGroupIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin']
    },
    {
      name: 'Classes',
      href: '/classes',
      icon: CalendarIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher']
    },
    {
      name: 'Fees',
      href: '/fees',
      icon: CurrencyDollarIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher']
    },
    {
      name: 'Grades',
      href: '/grades',
      icon: ChartBarIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher', 'student', 'parent']
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: DocumentTextIcon,
      roles: ['school_owner']
    },
    {
      name: 'Communication',
      href: '/communication',
      icon: ChatBubbleLeftRightIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher', 'student', 'parent']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher', 'student', 'parent']
    },
  ];

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
      <div className="grid grid-cols-4 gap-1 px-2 py-1">
        {filteredNavigation.slice(0, 4).map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 text-xs font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`
            }
          >
            <item.icon className="h-6 w-6 mb-1" aria-hidden="true" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MobileNavigation;
