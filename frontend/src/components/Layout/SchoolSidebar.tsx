import React, { useState, useEffect } from 'react';
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
  Cog6ToothIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftOnRectangleIcon,
  Squares2X2Icon,
  CubeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacherPermissions } from '../../hooks/useTeacherPermissions';
import ThemeAwareLogo from '../ui/ThemeAwareLogo';
import { getSchoolLogoUrl } from '../../utils/imageUrl';

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: string[];
  description: string;
  teacherCondition?: 'hasAssignedClasses' | 'isClassTeacher';
  permission?: string;
  subItems?: NavigationItem[];
}

interface NavigationGroup {
  name: string;
  items: NavigationItem[];
}

const SchoolSidebar: React.FC<SidebarProps> = ({ onClose, isCollapsed = false }) => {
  const { user, logout } = useAuth();
  const {
    hasAssignedClasses,
    isClassTeacher,
    permissions
  } = useTeacherPermissions();
  const location = useLocation();
  const { schoolCode } = useParams<{ schoolCode: string }>();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Academic', 'Management']);

  // Initialize expanded groups based on active route
  useEffect(() => {
    // Logic to auto-expand group containing current route could go here
  }, [location.pathname]);

  // Define navigation items
  const dashboardItem: NavigationItem = {
    name: 'Dashboard',
    href: user?.role === 'student' ? `/${schoolCode}/student/dashboard` : `/${schoolCode}/dashboard`,
    icon: Squares2X2Icon,
    roles: ['school_owner', 'school_admin', 'teacher', 'student', 'parent'],
    description: 'Overview'
  };

  const academicItems: NavigationItem[] = [
    {
      name: 'Students',
      href: `/${schoolCode}/students`,
      icon: AcademicCapIcon,
      roles: ['school_owner', 'school_admin', 'teacher'],
      permission: 'manage_students',
      description: 'Student records'
    },
    {
      name: 'Teachers',
      href: `/${schoolCode}/teachers`,
      icon: UserGroupIcon,
      roles: ['school_owner', 'school_admin'],
      description: 'Staff management'
    },
    {
      name: 'Classroom',
      href: `/${schoolCode}/classes`,
      icon: CalendarIcon,
      roles: ['school_owner', 'school_admin', 'teacher'],
      description: 'Classes',
      teacherCondition: 'isClassTeacher'
    },
    {
      name: 'Subjects',
      href: `/${schoolCode}/subjects`,
      icon: BookOpenIcon,
      roles: ['school_owner', 'school_admin', 'teacher'],
      description: 'Subjects'
    },
    {
      name: 'Grades',
      href: user?.role === 'student' ? `/${schoolCode}/student/grades` : `/${schoolCode}/grades`,
      icon: ChartBarIcon,
      roles: ['school_owner', 'school_admin', 'teacher', 'student', 'parent'],
      description: 'Performance'
    },
    {
      name: 'CBT Tests',
      href: `/${schoolCode}/cbt/tests`,
      icon: ClipboardDocumentCheckIcon,
      roles: ['teacher', 'school_admin', 'school_owner'],
      description: 'Testing'
    },
    {
      name: 'My Tests',
      href: `/${schoolCode}/cbt/student`,
      icon: ClipboardDocumentCheckIcon,
      roles: ['student'],
      description: 'Online tests'
    },

    {
      name: 'Teacher Tools',
      href: `/${schoolCode}/teacher/tools`,
      icon: WrenchScrewdriverIcon,
      roles: ['teacher'],
      description: 'Utilities'
    },
    {
      name: 'My Credentials',
      href: `/${schoolCode}/student/credentials`,
      icon: ShieldCheckIcon,
      roles: ['student'],
      description: 'Blockchain credentials'
    },
  ];

  const financeItems: NavigationItem[] = [
    {
      name: 'Fees',
      href: `/${schoolCode}/fees`,
      icon: CurrencyDollarIcon,
      roles: ['school_owner', 'school_admin', 'teacher'],
      permission: 'manage_fees',
      description: 'Fee management'
    },
    {
      name: 'My Fees',
      href: `/${schoolCode}/student/fees`,
      icon: CurrencyDollarIcon,
      roles: ['student'],
      description: 'My fees'
    },
  ];

  const managementItems: NavigationItem[] = [
    {
      name: 'Communication',
      href: `/${schoolCode}/communication`,
      icon: ChatBubbleLeftRightIcon,
      roles: ['school_owner', 'school_admin', 'teacher', 'student', 'parent'],
      description: 'Messages'
    },
    {
      name: 'Assets',
      href: `/${schoolCode}/assets`,
      icon: CubeIcon,
      roles: ['school_owner', 'school_admin', 'teacher'],
      permission: 'manage_assets',
      description: 'Physical resources'
    },
    {
      name: 'Teacher Permissions',
      href: `/${schoolCode}/settings/teacher-permissions`,
      icon: Cog6ToothIcon,
      roles: ['school_owner'],
      description: 'Delegate permissions'
    },
    {
      name: 'My Permissions',
      href: `/${schoolCode}/my-permissions`,
      icon: ShieldCheckIcon,
      roles: ['teacher'],
      description: 'View your permissions'
    },
    {
      name: 'Settings',
      href: `/${schoolCode}/settings`,
      icon: Cog6ToothIcon,
      roles: ['school_owner', 'school_admin'],
      description: 'Configuration'
    },
  ];

  // Helper to filter items based on role
  const filterItems = (items: NavigationItem[]) => {
    return items.filter(item => {
      if (!user || !item.roles.includes(user.role)) {
        return false;
      }
      if (user.role === 'teacher') {
        if (item.teacherCondition) {
          if (item.teacherCondition === 'hasAssignedClasses' && !hasAssignedClasses) return false;
          if (item.teacherCondition === 'isClassTeacher' && !isClassTeacher) return false;
        }
        if (item.permission && !permissions.includes(item.permission)) {
          return false;
        }
      }
      return true;
    });
  };

  const groups: NavigationGroup[] = [
    { name: 'Academic', items: filterItems(academicItems) },
    { name: 'Finance', items: filterItems(financeItems) },
    { name: 'Management', items: filterItems(managementItems) },
  ].filter(group => group.items.length > 0);

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

    // Don't show sub-items when sidebar is collapsed
    if (isCollapsed && hasSubItems) {
      return (
        <div key={item.name} className="mb-1">
          <NavLink
            to={item.href}
            className={({ isActive }) =>
              `group relative flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
            onClick={onClose}
          >
            <item.icon
              className={`flex-shrink-0 h-5 w-5 transition-colors duration-200 ${location.pathname === item.href ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`}
              aria-hidden="true"
            />
            <span className="tooltip">{item.name}</span>
          </NavLink>
        </div>
      );
    }

    return (
      <div key={item.name} className="mb-1">
        {hasSubItems ? (
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`group relative flex items-center w-full ${isCollapsed ? 'justify-center px-3' : 'px-3'} py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
              ? 'bg-primary-50/50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              } ${isSubItem ? 'ml-4 text-xs' : ''}`}
          >
            <item.icon
              className={`${isCollapsed ? '' : 'mr-3'} flex-shrink-0 h-5 w-5 transition-colors duration-200 ${isActive ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`}
              aria-hidden="true"
            />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronRightIcon
                  className={`ml-2 h-3 w-3 text-gray-400 transition-transform duration-200 ${isCurrentlyExpanded ? 'rotate-90' : ''}`}
                />
              </>
            )}
            {isCollapsed && <span className="tooltip">{item.name}</span>}
          </button>
        ) : (
          <NavLink
            to={item.href}
            className={({ isActive }) =>
              `group relative flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-3'} py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              } ${isSubItem ? 'ml-9 text-xs' : ''}`
            }
            onClick={onClose}
          >
            <item.icon
              className={`${isCollapsed ? '' : 'mr-3'} flex-shrink-0 h-5 w-5 transition-colors duration-200 ${location.pathname === item.href ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`}
              aria-hidden="true"
            />
            {!isCollapsed && item.name}
            {isCollapsed && <span className="tooltip">{item.name}</span>}
          </NavLink>
        )}

        {hasSubItems && isCurrentlyExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1 animate-fade-in-up">
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
    <div className="flex flex-col h-full border-r border-gray-200/50 dark:border-gray-800 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl">
      {/* Header */}
      <div className={`flex-shrink-0 ${isCollapsed ? 'px-3 pt-8 pb-6' : 'px-6 pt-8 pb-6'} transition-all duration-300`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          {!isCollapsed && (
            <>
              <div className="flex-shrink-0">
                <ThemeAwareLogo
                  logoUrl={getSchoolLogoUrl(user?.school?.logo_url)}
                  schoolName={getSchoolName()}
                  size="md"
                  showFallback={true}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                  {getSchoolName()}
                </h1>
                {user?.school?.motto && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 uppercase tracking-wide">
                    {user.school.motto}
                  </p>
                )}
              </div>
            </>
          )}
          {isCollapsed && (
            <div className="flex-shrink-0">
              <ThemeAwareLogo
                logoUrl={getSchoolLogoUrl(user?.school?.logo_url)}
                schoolName={getSchoolName()}
                size="sm"
                showFallback={true}
              />
            </div>
          )}
          {onClose && (
            <button
              type="button"
              className="md:hidden p-1 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} space-y-6 overflow-y-auto custom-scrollbar py-4 transition-all duration-300`}>
        {/* Main Dashboard Link */}
        <div>
          {renderNavigationItem(dashboardItem)}
        </div>

        {/* Grouped Links */}
        {groups.map((group) => (
          <div key={group.name} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {group.name}
              </h3>
            )}
            {group.items.map(item => renderNavigationItem(item))}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className={`flex-shrink-0 border-t border-gray-100 dark:border-gray-800 ${isCollapsed ? 'p-2' : 'p-4'} bg-gray-50/30 dark:bg-gray-800/30 transition-all duration-300`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="group relative">
              <div className="h-9 w-9 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-700">
                <span className="text-xs font-bold text-white">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <span className="tooltip">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="group relative p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Logout"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4" />
              <span className="tooltip">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-9 w-9 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-700">
                <span className="text-xs font-bold text-white">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role ? getRoleDisplayName(user.role) : 'User'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Logout"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolSidebar;
