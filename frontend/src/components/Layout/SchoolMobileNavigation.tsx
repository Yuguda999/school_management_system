import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const SchoolMobileNavigation: React.FC = () => {
  const { user } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      roles: ['school_owner', 'school_admin', 'teacher', 'student', 'parent']
    },
    {
      name: 'Students',
      href: '/students',
      icon: AcademicCapIcon,
      roles: ['school_owner', 'school_admin']
    },
    {
      name: 'Teachers',
      href: '/teachers',
      icon: UserGroupIcon,
      roles: ['school_owner', 'school_admin']
    },
    {
      name: 'Classes',
      href: '/classes',
      icon: CalendarIcon,
      roles: ['school_owner', 'school_admin', 'teacher']
    },
    {
      name: 'Grades',
      href: '/grades',
      icon: ChartBarIcon,
      roles: ['school_owner', 'school_admin', 'teacher', 'student', 'parent']
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: DocumentTextIcon,
      roles: ['school_owner']
    },
    {
      name: 'Messages',
      href: '/communication',
      icon: ChatBubbleLeftRightIcon,
      roles: ['school_owner', 'school_admin', 'teacher', 'student', 'parent']
    },
  ];

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
      <div className={`grid py-2 ${filteredNavigation.length <= 4 ? 'grid-cols-4' : filteredNavigation.length <= 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
        {filteredNavigation.map((item) => (
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

export default SchoolMobileNavigation;
