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
  BuildingOfficeIcon,
  AcademicCapIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  ChevronRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import NotificationSettings from '../../components/settings/NotificationSettings';
import SystemConfiguration from '../../components/settings/SystemConfiguration';
import SchoolSettings from '../../components/settings/SchoolSettings';
import BlockchainSettings from '../../components/settings/BlockchainSettings';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/ui/Card';

type SettingsTab = 'profile' | 'theme' | 'notifications' | 'school' | 'blockchain' | 'system';

interface SettingsNavItem {
  id: SettingsTab;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  allowedRoles: string[];
  category: 'personal' | 'school';
}

const SettingsPage: React.FC = () => {
  const { theme, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const settingsNavItems: SettingsNavItem[] = [
    {
      id: 'profile',
      name: 'Profile',
      icon: UserIcon,
      description: 'Personal information and account settings',
      allowedRoles: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'school_owner', 'school_admin'],
      category: 'personal',
    },
    {
      id: 'theme',
      name: 'Appearance',
      icon: PaintBrushIcon,
      description: 'Theme and display preferences',
      allowedRoles: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'school_owner', 'school_admin'],
      category: 'personal',
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: BellIcon,
      description: 'Notification preferences',
      allowedRoles: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'school_owner', 'school_admin'],
      category: 'personal',
    },
    {
      id: 'school',
      name: 'School',
      icon: BuildingOfficeIcon,
      description: 'School settings and configuration',
      allowedRoles: ['platform_super_admin', 'school_owner', 'school_admin'],
      category: 'school',
    },
    {
      id: 'blockchain',
      name: 'Blockchain & Identity',
      icon: ShieldCheckIcon,
      description: 'Manage school identity and credentials',
      allowedRoles: ['school_owner', 'school_admin'],
      category: 'school',
    },
    {
      id: 'system',
      name: 'System',
      icon: Cog6ToothIcon,
      description: 'Advanced system configuration',
      allowedRoles: ['platform_super_admin', 'school_owner'],
      category: 'school',
    },
  ];

  const availableNavItems = settingsNavItems.filter(item =>
    item.allowedRoles.includes(user?.role || '')
  );

  const personalSettings = availableNavItems.filter(item => item.category === 'personal');
  const schoolSettings = availableNavItems.filter(item => item.category === 'school');

  const renderNavItem = (item: SettingsNavItem) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`w-full group flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200 ${isActive
          ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-200 dark:border-primary-800/50 shadow-sm'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
      >
        <div className={`flex-shrink-0 p-2 rounded-lg transition-colors duration-200 ${isActive
          ? 'bg-gradient-to-br from-primary-500 to-secondary-600 text-white shadow-lg shadow-primary-500/30'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
          }`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive
            ? 'text-primary-700 dark:text-primary-300'
            : 'text-gray-900 dark:text-gray-100'
            }`}>
            {item.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {item.description}
          </p>
        </div>
        <ChevronRightIcon className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isActive
          ? 'text-primary-500 translate-x-1'
          : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400'
          }`} />
      </button>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your personal information</p>
              </div>
            </div>

            <Card variant="glass" className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-20 w-20 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user?.first_name} {user?.last_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 mt-1 capitalize">
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.first_name}
                      className="input"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.last_name}
                      className="input"
                      readOnly
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="input"
                      readOnly
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
                    To update your profile information, please visit the <a href={`/${user?.school_code}/profile`} className="text-primary-600 dark:text-primary-400 hover:underline">Profile Page</a>.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'theme':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30">
                <PaintBrushIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the app looks</p>
              </div>
            </div>

            <Card variant="glass">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme Mode</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => theme.mode !== 'light' && toggleDarkMode()}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${theme.mode === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`p-4 rounded-xl mb-3 ${theme.mode === 'light'
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}>
                        <SunIcon className="h-8 w-8" />
                      </div>
                      <span className={`font-medium ${theme.mode === 'light'
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300'
                        }`}>Light</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bright and clean</span>
                    </div>
                    {theme.mode === 'light' && (
                      <div className="absolute top-3 right-3">
                        <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => theme.mode !== 'dark' && toggleDarkMode()}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${theme.mode === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`p-4 rounded-xl mb-3 ${theme.mode === 'dark'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}>
                        <MoonIcon className="h-8 w-8" />
                      </div>
                      <span className={`font-medium ${theme.mode === 'dark'
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300'
                        }`}>Dark</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Easy on the eyes</span>
                    </div>
                    {theme.mode === 'dark' && (
                      <div className="absolute top-3 right-3">
                        <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </Card>

            <Card variant="glass">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Preview</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  See how different elements look with your current theme
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-primary-500 text-white text-center">
                    <span className="text-sm font-medium">Primary</span>
                  </div>
                  <div className="p-4 rounded-xl bg-green-500 text-white text-center">
                    <span className="text-sm font-medium">Success</span>
                  </div>
                  <div className="p-4 rounded-xl bg-yellow-500 text-white text-center">
                    <span className="text-sm font-medium">Warning</span>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500 text-white text-center">
                    <span className="text-sm font-medium">Danger</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30">
                <BellIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your notification preferences</p>
              </div>
            </div>
            <NotificationSettings />
          </div>
        );

      case 'school':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
                <BuildingOfficeIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">School Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure your school information and preferences</p>
              </div>
            </div>
            <SchoolSettings />
          </div>
        );

      case 'blockchain':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Blockchain & Identity</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your school's sovereign identity and credentials</p>
              </div>
            </div>
            <BlockchainSettings />
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 text-white shadow-lg shadow-gray-500/30">
                <Cog6ToothIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Configuration</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Advanced system settings and configuration</p>
              </div>
            </div>
            <SystemConfiguration />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        description="Manage your preferences and school configuration"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <Card variant="glass" className="sticky top-6">
            <div className="p-4">
              {/* User Quick Info */}
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Personal Settings */}
              {personalSettings.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Personal
                  </h3>
                  <div className="space-y-1">
                    {personalSettings.map(renderNavItem)}
                  </div>
                </div>
              )}

              {/* School Settings */}
              {schoolSettings.length > 0 && (
                <div>
                  <h3 className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Administration
                  </h3>
                  <div className="space-y-1">
                    {schoolSettings.map(renderNavItem)}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
