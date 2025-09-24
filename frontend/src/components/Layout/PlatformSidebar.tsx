import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onClose?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  subItems?: NavigationItem[];
}

const PlatformSidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Platform Management']);

  const navigation: NavigationItem[] = [
    {
      name: 'Platform Management',
      href: '/platform',
      icon: BuildingOfficeIcon,
      description: 'Platform administration',
      subItems: [
        {
          name: 'Dashboard',
          href: '/platform',
          icon: HomeIcon,
          description: 'Platform overview'
        },
        {
          name: 'All Schools',
          href: '/platform/schools',
          icon: EyeIcon,
          description: 'View and manage all schools'
        },
        {
          name: 'School Owners',
          href: '/platform/school-owners',
          icon: UserGroupIcon,
          description: 'Manage school owners'
        },

        {
          name: 'Analytics',
          href: '/platform/analytics',
          icon: ChartBarIcon,
          description: 'Platform analytics and reports'
        },
        {
          name: 'Settings',
          href: '/platform/settings',
          icon: Cog6ToothIcon,
          description: 'Platform configuration'
        }
      ]
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

  return (
    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">P</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Platform Admin
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                System Management
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
          {navigation.map((item) => renderNavigationItem(item))}
        </nav>
      </div>
      
      {/* User info and logout */}
      <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div>
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
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
                Platform Admin
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

export default PlatformSidebar;
