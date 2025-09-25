import React, { useState } from 'react';
import {
  CalendarIcon,
  AcademicCapIcon,
  PlusIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { Term } from '../../types';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { useAuth } from '../../contexts/AuthContext';
import TermList from '../terms/TermList';
import TermForm from '../terms/TermForm';
import CurrentTermIndicator from '../terms/CurrentTermIndicator';
import TermSwitcher from '../terms/TermSwitcher';
import SchoolManagement from './SchoolManagement';

type SchoolSettingsTab = 'overview' | 'schools' | 'terms' | 'academic' | 'general';

const SchoolSettings: React.FC = () => {
  const { user } = useAuth();
  const { refresh } = useCurrentTerm();
  const [activeTab, setActiveTab] = useState<SchoolSettingsTab>('overview');
  const [showCreateTermModal, setShowCreateTermModal] = useState(false);
  const [showEditTermModal, setShowEditTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);

  const handleCreateTerm = () => {
    setEditingTerm(null);
    setShowCreateTermModal(true);
  };

  const handleEditTerm = (term: Term) => {
    setEditingTerm(term);
    setShowEditTermModal(true);
  };

  const handleFormSuccess = () => {
    refresh();
  };

  const tabs = [
    {
      id: 'overview' as SchoolSettingsTab,
      name: 'Overview',
      icon: BuildingOfficeIcon,
      description: 'School overview and current term'
    },
    ...(user?.role === 'school_owner' ? [{
      id: 'schools' as SchoolSettingsTab,
      name: 'My Schools',
      icon: BuildingStorefrontIcon,
      description: 'Manage your schools'
    }] : []),
    {
      id: 'terms' as SchoolSettingsTab,
      name: 'Terms',
      icon: CalendarIcon,
      description: 'Manage academic terms'
    },
    {
      id: 'academic' as SchoolSettingsTab,
      name: 'Academic',
      icon: AcademicCapIcon,
      description: 'Academic year and session settings'
    },
    {
      id: 'general' as SchoolSettingsTab,
      name: 'General',
      icon: Cog6ToothIcon,
      description: 'General school settings'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                School Overview
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Term Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Current Term
                    </h4>
                    <TermSwitcher compact={true} showLabel={false} />
                  </div>
                  <CurrentTermIndicator variant="card" />
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Quick Actions
                  </h4>
                  <div className="space-y-3">
                    <button
                      onClick={handleCreateTerm}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create New Term
                    </button>
                    <button
                      onClick={() => setActiveTab('terms')}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Manage All Terms
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* School Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                School Information
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">School Name:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{user?.school_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">School Code:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                      {user?.school_code || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Your Role:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400 capitalize">{user?.role?.replace('_', ' ') || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Login URL:</span>
                    <span className="ml-2 text-blue-600 dark:text-blue-400 font-mono text-xs">
                      /{user?.school_code || 'SCHOOL_CODE'}/login
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 Tip:</strong> Share your school code <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{user?.school_code || 'SCHOOL_CODE'}</code> with teachers so they can login at <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">/{user?.school_code || 'SCHOOL_CODE'}/login</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'schools':
        return user?.role === 'school_owner' ? <SchoolManagement /> : null;

      case 'terms':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Term Management
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create, edit, and manage academic terms for your school
                </p>
              </div>
              <button
                onClick={handleCreateTerm}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Term
              </button>
            </div>

            <CurrentTermIndicator variant="banner" />

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <TermList
                onEdit={handleEditTerm}
                onRefresh={refresh}
              />
            </div>
          </div>
        );

      case 'academic':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Academic Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Configure academic year settings and term preferences
              </p>
            </div>

            {/* Current Academic Session */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Current Academic Session
              </h4>
              <CurrentTermIndicator variant="card" />
            </div>

            {/* Academic Year Configuration */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Academic Year Configuration
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Academic Year Format
                    </label>
                    <select className="input">
                      <option value="yyyy/yyyy">YYYY/YYYY (e.g., 2023/2024)</option>
                      <option value="yyyy-yyyy">YYYY-YYYY (e.g., 2023-2024)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Terms per Year
                    </label>
                    <select className="input">
                      <option value="2">2 Terms (Semester System)</option>
                      <option value="3">3 Terms (Trimester System)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="btn btn-primary">
                    Save Academic Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                General School Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Configure general school preferences and settings
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                School Information
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      School Name
                    </label>
                    <input
                      type="text"
                      className="input"
                      defaultValue={user?.school_name || ''}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      School Type
                    </label>
                    <select className="input">
                      <option value="primary">Primary School</option>
                      <option value="secondary">Secondary School</option>
                      <option value="combined">Combined School</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="btn btn-primary">
                    Save General Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>

      {/* Modals */}
      <TermForm
        isOpen={showCreateTermModal}
        onClose={() => setShowCreateTermModal(false)}
        onSuccess={handleFormSuccess}
        mode="create"
      />

      <TermForm
        isOpen={showEditTermModal}
        onClose={() => setShowEditTermModal(false)}
        onSuccess={handleFormSuccess}
        term={editingTerm}
        mode="edit"
      />
    </div>
  );
};

export default SchoolSettings;
