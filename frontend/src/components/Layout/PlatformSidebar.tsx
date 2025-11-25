import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { XMarkIcon, ChevronRightIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  subItems?: NavigationItem[];
}

const PlatformSidebar: React.FC<SidebarProps> = ({ onClose, isCollapsed = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/platform',
      icon: Squares2X2Icon,
      description: 'Overview'
    },
    {
      name: 'Schools',
      href: '/platform/schools',
      icon: BuildingOfficeIcon,
      description: 'Manage schools'
    },
    {
      name: 'School Owners',
      href: '/platform/school-owners',
      icon: UserGroupIcon,
      description: 'Manage owners'
    },
    {
      name: 'Analytics',
      href: '/platform/analytics',
      icon: ChartBarIcon,
      description: 'System stats'
    },
    {
      name: 'Settings',
      href: '/platform/settings',
      icon: Cog6ToothIcon,
      description: 'Configuration'
    }
  ];

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
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
            onClick={onClose}
          >
            <item.icon
              className={`flex-shrink-0 h-5 w-5 transition-colors duration-200 ${location.pathname === item.href ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
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
              ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              } ${isSubItem ? 'ml-4 text-xs' : ''}`}
          >
            <item.icon
              className={`${isCollapsed ? '' : 'mr-3'} flex-shrink-0 h-5 w-5 transition-colors duration-200 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
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
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              } ${isSubItem ? 'ml-9 text-xs' : ''}`
            }
            onClick={onClose}
          >
            <item.icon
              className={`${isCollapsed ? '' : 'mr-3'} flex-shrink-0 h-5 w-5 transition-colors duration-200 ${location.pathname === item.href ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
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

  return (
    <div className="flex flex-col h-full border-r border-gray-200/50 dark:border-gray-800 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl">
      {/* Header */}
      <div className={`flex-shrink-0 ${isCollapsed ? 'px-3 pt-8 pb-6' : 'px-6 pt-8 pb-6'} transition-all duration-300`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          {!isCollapsed && (
            <>
              <div className="flex-shrink-0">
                <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                  Platform Admin
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 uppercase tracking-wide">
                  System Management
                </p>
              </div>
            </>
          )}
          {isCollapsed && (
            <div className="flex-shrink-0">
              <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                <span className="text-white font-bold text-lg">P</span>
              </div>
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
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} space-y-1 overflow-y-auto custom-scrollbar py-4 transition-all duration-300`}>
        {!isCollapsed && (
          <h3 className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            Main Menu
          </h3>
        )}
        {navigation.map((item) => renderNavigationItem(item))}
      </nav>

      {/* User info and logout */}
      <div className={`flex-shrink-0 border-t border-gray-100 dark:border-gray-800 ${isCollapsed ? 'p-2' : 'p-4'} bg-gray-50/30 dark:bg-gray-800/30 transition-all duration-300`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="group relative">
              <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-700">
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
              <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-700">
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
                Admin
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

export default PlatformSidebar;
