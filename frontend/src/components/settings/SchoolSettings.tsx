import React, { useState } from 'react';
import {
  AcademicCapIcon,
  CalendarIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';


import { useAuth } from '../../contexts/AuthContext';

import CurrentTermIndicator from '../terms/CurrentTermIndicator';
import TermSwitcher from '../terms/TermSwitcher';
import SchoolManagement from './SchoolManagement';
import { useCurrency } from '../../contexts/CurrencyContext';
import { CURRENCY_OPTIONS } from '../../utils/currency';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useEffect } from 'react';
import GradeTemplateManagement from './GradeTemplateManagement';
import SessionManagement from './SessionManagement';
import { aiSupportService } from '../../services/aiSupportService';
import Card from '../ui/Card';

type SchoolSettingsTab = 'overview' | 'schools' | 'academic' | 'general';

interface NavItem {
  id: SchoolSettingsTab;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  show: boolean;
}

const SchoolSettings: React.FC = () => {
  const { user } = useAuth();
  const { currency, setCurrency } = useCurrency();

  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<SchoolSettingsTab>('overview');

  // General Settings State
  const [schoolName, setSchoolName] = useState('');
  const [schoolType, setSchoolType] = useState('primary');
  const [loadingGeneral, setLoadingGeneral] = useState(false);


  // AI Features Settings State
  const [textToActionEnabled, setTextToActionEnabled] = useState(false);
  const [loadingTextToAction, setLoadingTextToAction] = useState(false);
  const [savingTextToAction, setSavingTextToAction] = useState(false);

  useEffect(() => {
    if (user?.school) {
      setSchoolName(user.school_name || '');
      if (user.school.settings?.general_settings?.school_type) {
        setSchoolType(user.school.settings.general_settings.school_type);
      }

    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'general' && user?.school?.code) {
      fetchTextToActionStatus();
    }
  }, [activeTab]);

  const fetchTextToActionStatus = async () => {
    if (!user?.school?.code) return;
    setLoadingTextToAction(true);
    try {
      const status = await aiSupportService.getTextToActionStatus(user.school.code);
      setTextToActionEnabled(status.text_to_action_enabled);
    } catch (error) {
      console.error('Failed to fetch text-to-action status:', error);
    } finally {
      setLoadingTextToAction(false);
    }
  };

  const handleToggleTextToAction = async () => {
    if (!user?.school?.code) return;
    setSavingTextToAction(true);
    try {
      const result = await aiSupportService.toggleTextToAction(user.school.code, !textToActionEnabled);
      setTextToActionEnabled(result.text_to_action_enabled);
      showSuccess(result.message);
    } catch (error) {
      console.error('Failed to toggle text-to-action:', error);
      showError('Failed to update AI Data Query setting');
    } finally {
      setSavingTextToAction(false);
    }
  };

  const handleSaveGeneral = async () => {
    setLoadingGeneral(true);
    try {
      await apiService.put('/api/v1/schools/me', {
        name: schoolName,
        settings: {
          general_settings: {
            school_type: schoolType
          }
        }
      });
      showSuccess('General settings saved successfully');
    } catch (error) {
      console.error('Failed to save general settings:', error);
      showError('Failed to save general settings');
    } finally {
      setLoadingGeneral(false);
    }
  };



  const navItems: NavItem[] = [
    {
      id: 'overview',
      name: 'Overview',
      icon: BuildingOfficeIcon,
      description: 'School overview and current term',
      show: true,
    },
    {
      id: 'schools',
      name: 'My Schools',
      icon: BuildingStorefrontIcon,
      description: 'Manage your schools',
      show: user?.role === 'school_owner',
    },
    {
      id: 'academic',
      name: 'Academic',
      icon: AcademicCapIcon,
      description: 'Academic year and term settings',
      show: true,
    },
    {
      id: 'general',
      name: 'General',
      icon: Cog6ToothIcon,
      description: 'General school settings',
      show: true,
    },
  ];

  const visibleNavItems = navItems.filter(item => item.show);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* School Information Card */}
            <Card variant="glass">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  School Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">School Name</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.school_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">School Code</p>
                        <code className="text-base font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                          {user?.school_code || 'N/A'}
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Role</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white capitalize">{user?.role?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Login URL</p>
                        <code className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          /{user?.school_code || 'SCHOOL_CODE'}/login
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">💡 Tip:</span> Share your school code <code className="bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded font-mono text-xs">{user?.school_code || 'SCHOOL_CODE'}</code> with teachers so they can login at <code className="bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded font-mono text-xs">/{user?.school_code || 'SCHOOL_CODE'}/login</code>
                  </p>
                </div>
              </div>
            </Card>

            {/* Current Term Card */}
            <Card variant="glass">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Term
                  </h3>
                  <TermSwitcher compact={true} showLabel={false} />
                </div>
                <CurrentTermIndicator variant="card" />
              </div>
            </Card>

            {/* Quick Actions */}
            <Card variant="glass">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <button
                    onClick={() => window.location.href = `/${user?.school?.code}/terms`}
                    className="flex items-center justify-center px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Manage All Terms
                  </button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'schools':
        return user?.role === 'school_owner' ? <SchoolManagement /> : null;

      case 'academic':
        return (
          <div className="space-y-6">
            {/* Current Academic Session */}
            <Card variant="glass">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Term
                  </h3>
                  <TermSwitcher compact={true} showLabel={false} />
                </div>
                <CurrentTermIndicator variant="card" />
              </div>
            </Card>

            {/* Session Management */}
            <Card variant="glass">
              <div className="p-6">
                <SessionManagement />
              </div>
            </Card>

            {/* Grade Templates */}
            <Card variant="glass">
              <div className="p-6">
                <GradeTemplateManagement />
              </div>
            </Card>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6">
            {/* School Information */}
            <Card variant="glass">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  School Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      School Name
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      School Type
                    </label>
                    <select
                      className="input"
                      value={schoolType}
                      onChange={(e) => setSchoolType(e.target.value)}
                    >
                      <option value="primary">Primary School</option>
                      <option value="secondary">Secondary School</option>
                      <option value="combined">Combined School</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="input"
                    >
                      {CURRENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveGeneral}
                    disabled={loadingGeneral}
                  >
                    {loadingGeneral ? 'Saving...' : 'Save General Settings'}
                  </button>
                </div>
              </div>
            </Card>

            {/* AI Features Section - School Owner Only */}
            {user?.role === 'school_owner' && (
              <Card variant="glass">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white mr-3">
                      <SparklesIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        AI Features
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Beta features powered by AI</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            AI Data Query
                          </h4>
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 rounded-full">
                            Beta
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Allow users to query school data using natural language through the AI assistant.
                          For example: "How many students are in JSS 1?" or "Show me the top performing students".
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          <strong>Note:</strong> Only read-only queries are supported. School owners and teachers can use this feature when enabled.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {loadingTextToAction ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
                        ) : (
                          <button
                            onClick={handleToggleTextToAction}
                            disabled={savingTextToAction}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${textToActionEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                              } ${savingTextToAction ? 'opacity-50 cursor-wait' : ''}`}
                            role="switch"
                            aria-checked={textToActionEnabled}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${textToActionEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {textToActionEnabled && (
                      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          <strong>💡 Tip:</strong> Users can now ask data-related questions in the AI Support chat widget.
                          Try asking "How many students are enrolled?" or "What's the average attendance rate?"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Horizontal Pills */}
      <Card variant="glass" padding="none">
        <div className="p-2">
          <nav className="flex space-x-2 overflow-x-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-white' : ''}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {renderTabContent()}
      </div>

      {/* Modals */}

    </div>
  );
};

export default SchoolSettings;
