import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  MoonIcon,
  SunIcon,
  UserIcon,
  PaintBrushIcon,
  BellIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import NotificationSettings from '../../components/settings/NotificationSettings';
import SystemConfiguration from '../../components/settings/SystemConfiguration';
import SchoolSettings from '../../components/settings/SchoolSettings';

type SettingsTab = 'profile' | 'theme' | 'notifications' | 'school' | 'system';

const SettingsPage: React.FC = () => {
  const { theme, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Profile Settings
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Profile settings will be implemented here.</p>
          </div>
        );
      case 'theme':
        return (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Theme Settings
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dark Mode
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Toggle between light and dark themes
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  theme.mode === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme.mode === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );
      case 'notifications':
        return <NotificationSettings />;
      case 'school':
        return <SchoolSettings />;
      case 'system':
        return <SystemConfiguration />;
      default:
        return (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Settings
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Select a settings category from the tabs above.</p>
          </div>
        );
    }
  };

  const settingsTabs = [
    {
      id: 'profile' as SettingsTab,
      name: 'Profile',
      icon: UserIcon,
      description: 'Personal information and account settings',
      allowedRoles: ['super_admin', 'admin', 'teacher', 'student', 'parent'],
    },
    {
      id: 'theme' as SettingsTab,
      name: 'Theme',
      icon: PaintBrushIcon,
      description: 'Appearance and theme customization',
      allowedRoles: ['super_admin', 'admin', 'teacher', 'student', 'parent'],
    },
    {
      id: 'notifications' as SettingsTab,
      name: 'Notifications',
      icon: BellIcon,
      description: 'Notification preferences and settings',
      allowedRoles: ['super_admin', 'admin', 'teacher', 'student', 'parent'],
    },
    {
      id: 'school' as SettingsTab,
      name: 'School',
      icon: BuildingOfficeIcon,
      description: 'School information and settings',
      allowedRoles: ['platform_super_admin', 'school_owner', 'school_admin'],
    },
    {
      id: 'system' as SettingsTab,
      name: 'System',
      icon: Cog6ToothIcon,
      description: 'System configuration and advanced settings',
      allowedRoles: ['platform_super_admin', 'school_owner'],
    },
  ];

  const availableTabs = settingsTabs.filter(tab =>
    tab.allowedRoles.includes(user?.role || '')
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your preferences and school settings
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    isActive
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                  }`}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SettingsPage;
