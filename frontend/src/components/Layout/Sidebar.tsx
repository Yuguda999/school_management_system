import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  LinkIcon,
  EyeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacherPermissions } from '../../hooks/useTeacherPermissions';

interface SidebarProps {
  onClose?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: string[];
  description: string;
  teacherCondition?: 'hasAssignedClasses' | 'isClassTeacher';
  subItems?: NavigationItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { hasAssignedClasses, isClassTeacher } = useTeacherPermissions();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Platform Admin']);

  const navigation: NavigationItem[] = [
    {
      name: 'Platform Admin',
      href: '/platform',
      icon: BuildingOfficeIcon,
      roles: ['platform_super_admin'],
      description: 'Platform administration',
      subItems: [
        {
          name: 'Dashboard',
          href: '/platform',
          icon: HomeIcon,
          roles: ['platform_super_admin'],
          description: 'Platform overview'
        },
        {
          name: 'All Schools',
          href: '/platform/schools',
          icon: EyeIcon,
          roles: ['platform_super_admin'],
          description: 'View and manage all schools'
        },
        {
          name: 'School Owners',
          href: '/platform/school-owners',
          icon: UserGroupIcon,
          roles: ['platform_super_admin'],
          description: 'Manage school owners'
        },

        {
          name: 'Analytics',
          href: '/platform/analytics',
          icon: ChartBarIcon,
          roles: ['platform_super_admin'],
          description: 'Platform analytics and reports'
        },
        {
          name: 'Settings',
          href: '/platform/settings',
          icon: Cog6ToothIcon,
          roles: ['platform_super_admin'],
          description: 'Platform configuration'
        }
      ]
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher', 'student', 'parent'],
      description: 'Overview and analytics'
    },
    {
      name: 'Students',
      href: '/students',
      icon: AcademicCapIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin'],
      description: 'Manage student records'
    },
    {
      name: 'Teachers',
      href: '/teachers',
      icon: UserGroupIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin'],
      description: 'Manage teaching staff'
    },
    {
      name: 'Classroom',
      href: '/classes',
      icon: CalendarIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher'],
      description: 'Classroom management',
      teacherCondition: 'isClassTeacher' // Only show for teachers who are class teachers
    },
    {
      name: 'Subjects',
      href: '/subjects',
      icon: BookOpenIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher'],
      description: 'Subject management'
    },

    {
      name: 'Fees',
      href: '/fees',
      icon: CurrencyDollarIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin'],
      description: 'Fee management'
    },
    {
      name: 'Grades',
      href: '/grades',
      icon: ChartBarIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher', 'student', 'parent'],
      description: 'Academic performance'
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: DocumentTextIcon,
      roles: ['school_owner'],
      description: 'Report card templates'
    },
    {
      name: 'Communication',
      href: '/communication',
      icon: ChatBubbleLeftRightIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin', 'teacher', 'student', 'parent'],
      description: 'Messages and announcements'
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: DocumentChartBarIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin'],
      description: 'Analytics and reports'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      roles: ['platform_super_admin', 'school_owner', 'school_admin'],
      description: 'System preferences'
    },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (!user || !item.roles.includes(user.role)) {
      return false;
    }

    // Special condition for teachers
    if (user.role === 'teacher' && item.teacherCondition) {
      if (item.teacherCondition === 'hasAssignedClasses') {
        return hasAssignedClasses;
      } else if (item.teacherCondition === 'isClassTeacher') {
        return isClassTeacher;
      }
    }

    return true;
  });

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isExpanded = (itemName: string) => expandedItems.includes(itemName);

  const renderNavigationItem = (item: NavigationItem, isSubItem = false) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isCurrentlyExpanded = isExpanded(item.name);
    const isActive = location.pathname === item.href ||
      (hasSubItems && item.subItems?.some(subItem => location.pathname === subItem.href));

    return (
      <div key={item.name}>
        {hasSubItems ? (
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
            } ${isSubItem ? 'ml-6' : ''}`}
          >
            <item.icon
              className="mr-3 flex-shrink-0 h-6 w-6"
              aria-hidden="true"
            />
            <span className="flex-1 text-left">{item.name}</span>
            {isCurrentlyExpanded ? (
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            ) : (
              <ChevronRightIcon className="ml-2 h-4 w-4" />
            )}
          </button>
        ) : (
          <NavLink
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              } ${isSubItem ? 'ml-6' : ''}`
            }
            onClick={onClose}
          >
            <item.icon
              className="mr-3 flex-shrink-0 h-6 w-6"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        )}

        {hasSubItems && isCurrentlyExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.subItems?.map(subItem => renderNavigationItem(subItem, true))}
          </div>
        )}
      </div>
    );
  };

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
          {filteredNavigation.map((item) => renderNavigationItem(item))}
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
