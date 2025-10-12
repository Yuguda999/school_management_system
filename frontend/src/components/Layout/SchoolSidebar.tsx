import React, { useState } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacherPermissions } from '../../hooks/useTeacherPermissions';
import ThemeAwareLogo from '../ui/ThemeAwareLogo';

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

const SchoolSidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { hasAssignedClasses, isClassTeacher } = useTeacherPermissions();
  const location = useLocation();
  const { schoolCode } = useParams<{ schoolCode: string }>();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Debug logging to track re-renders
  console.log('📋 SchoolSidebar render - user school:', {
    schoolId: user?.school?.id,
    schoolName: user?.school?.name,
    logoUrl: user?.school?.logo_url,
    motto: user?.school?.motto
  });

  // School-only navigation - NO platform admin items
  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: user?.role === 'student' ? `/${schoolCode}/student/dashboard` : `/${schoolCode}/dashboard`,
      icon: HomeIcon,
      roles: ['school_owner', 'school_admin', 'teacher', 'student', 'parent'],
      description: 'School overview and analytics'
    },
    {
      name: 'Students',
      href: `/${schoolCode}/students`,
      icon: AcademicCapIcon,
      roles: ['school_owner', 'school_admin'],
      description: 'Manage student records'
    },
    {
      name: 'Teachers',
      href: `/${schoolCode}/teachers`,
      icon: UserGroupIcon,
      roles: ['school_owner', 'school_admin'],
      description: 'Manage teaching staff'
    },
    {
      name: 'Classroom',
      href: `/${schoolCode}/classes`,
      icon: CalendarIcon,
      roles: ['school_owner', 'school_admin', 'teacher'],
      description: 'Classroom management',
      teacherCondition: 'isClassTeacher'
    },
    {
      name: 'Subjects',
      href: `/${schoolCode}/subjects`,
      icon: BookOpenIcon,
      roles: ['school_owner', 'school_admin', 'teacher'],
      description: 'Subject management'
    },
    {
      name: 'Materials',
      href: `/${schoolCode}/teacher/materials`,
      icon: FolderIcon,
      roles: ['teacher'],
      description: 'Educational materials management'
    },
    {
      name: 'Fees',
      href: `/${schoolCode}/fees`,
      icon: CurrencyDollarIcon,
      roles: ['school_owner', 'school_admin'],
      description: 'Fee management'
    },
    {
      name: 'Grades',
      href: user?.role === 'student' ? `/${schoolCode}/student/grades` : `/${schoolCode}/grades`,
      icon: ChartBarIcon,
      roles: ['school_owner', 'school_admin', 'teacher', 'student', 'parent'],
      description: 'Academic performance'
    },
    {
      name: 'Communication',
      href: `/${schoolCode}/communication`,
      icon: ChatBubbleLeftRightIcon,
      roles: ['school_owner', 'school_admin', 'teacher', 'student', 'parent'],
      description: 'Messages and announcements'
    },
    {
      name: 'Reports',
      href: `/${schoolCode}/reports`,
      icon: DocumentChartBarIcon,
      roles: ['school_owner', 'school_admin'],
      description: 'School analytics and reports'
    },
    {
      name: 'Settings',
      href: `/${schoolCode}/settings`,
      icon: Cog6ToothIcon,
      roles: ['school_owner', 'school_admin'],
      description: 'School preferences',
      subItems: [
        {
          name: 'General',
          href: `/${schoolCode}/settings`,
          icon: Cog6ToothIcon,
          roles: ['school_owner', 'school_admin'],
          description: 'General settings'
        },
        {
          name: 'Templates',
          href: `/${schoolCode}/settings/templates`,
          icon: DocumentTextIcon,
          roles: ['school_owner'],
          description: 'Report card templates'
        }
      ]
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getSchoolName = () => {
    return user?.school?.name || 'School Management';
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
    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ThemeAwareLogo
                logoUrl={user?.school?.logo_url ? `http://localhost:8000${user.school.logo_url}` : undefined}
                schoolName={getSchoolName()}
                size="lg"
                showFallback={true}
              />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {getSchoolName()}
              </h1>
              {user?.school?.motto && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  {user.school.motto}
                </p>
              )}
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
      
      {/* User info and logout */}
      <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div>
              <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role ? getRoleDisplayName(user.role) : 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolSidebar;
