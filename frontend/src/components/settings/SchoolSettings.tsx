import React, { useState } from 'react';
import {
  CalendarIcon,
  AcademicCapIcon,
  PlusIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Term } from '../../types';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { useAuth } from '../../contexts/AuthContext';
import TermList from '../terms/TermList';
import TermForm from '../terms/TermForm';
import CurrentTermIndicator from '../terms/CurrentTermIndicator';
import TermSwitcher from '../terms/TermSwitcher';
import SchoolManagement from './SchoolManagement';
import { useCurrency } from '../../contexts/CurrencyContext';
import { CURRENCY_OPTIONS } from '../../utils/currency';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useEffect } from 'react';
import { TemplateService, ReportCardTemplate } from '../../services/templateService';
import GradeTemplateManagement from './GradeTemplateManagement';

type SchoolSettingsTab = 'overview' | 'schools' | 'academic' | 'general' | 'report_cards';

const SchoolSettings: React.FC = () => {
  const { user } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { refresh } = useCurrentTerm();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<SchoolSettingsTab>('overview');
  const [showCreateTermModal, setShowCreateTermModal] = useState(false);
  const [showEditTermModal, setShowEditTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);

  // General Settings State
  const [schoolName, setSchoolName] = useState('');
  const [schoolType, setSchoolType] = useState('primary');
  const [loadingGeneral, setLoadingGeneral] = useState(false);

  // Academic Settings State
  const [academicYearFormat, setAcademicYearFormat] = useState('yyyy/yyyy');
  const [termsPerYear, setTermsPerYear] = useState('3');
  const [loadingAcademic, setLoadingAcademic] = useState(false);

  // Report Card Settings State
  const [templates, setTemplates] = useState<ReportCardTemplate[]>([]);
  const [defaultTemplateId, setDefaultTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    if (user?.school) {
      setSchoolName(user.school_name || '');
      // Initialize other settings if available in user.school.settings
      if (user.school.settings?.general_settings?.school_type) {
        setSchoolType(user.school.settings.general_settings.school_type);
      }
      if (user.school.settings?.academic_calendar?.format) {
        setAcademicYearFormat(user.school.settings.academic_calendar.format);
      }
      if (user.school.settings?.academic_calendar?.terms_per_year) {
        setTermsPerYear(String(user.school.settings.academic_calendar.terms_per_year));
      }
      if (user.school.default_template_id) {
        setDefaultTemplateId(user.school.default_template_id);
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'report_cards') {
      fetchTemplates();
    }
  }, [activeTab]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await TemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      showError('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveReportCardTemplate = async (templateId: string) => {
    setSavingTemplate(true);
    try {
      await apiService.put('/api/v1/schools/me', {
        default_template_id: templateId
      });
      setDefaultTemplateId(templateId);
      showSuccess('Default report card template updated');
      // Update user context if possible, or trigger a reload/refetch
      // For now, local state update is enough for UI feedback
    } catch (error) {
      console.error('Failed to save default template:', error);
      showError('Failed to update default template');
    } finally {
      setSavingTemplate(false);
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

  const handleSaveAcademic = async () => {
    setLoadingAcademic(true);
    try {
      await apiService.put('/api/v1/schools/me', {
        settings: {
          academic_calendar: {
            format: academicYearFormat,
            terms_per_year: parseInt(termsPerYear)
          }
        }
      });
      showSuccess('Academic settings saved successfully');
    } catch (error) {
      console.error('Failed to save academic settings:', error);
      showError('Failed to save academic settings');
    } finally {
      setLoadingAcademic(false);
    }
  };

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
      id: 'academic' as SchoolSettingsTab,
      name: 'Academic',
      icon: AcademicCapIcon,
      description: 'Academic year and term settings'
    },
    {
      id: 'report_cards' as SchoolSettingsTab,
      name: 'Report Cards',
      icon: DocumentTextIcon,
      description: 'Manage report card templates'
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
                      onClick={() => window.location.href = `/${user?.school?.code}/terms`}
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
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Current Academic Session
                </h4>
                <button
                  onClick={() => window.location.href = `/${user?.school?.code}/terms`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Manage Terms →
                </button>
              </div>
              <CurrentTermIndicator variant="card" />
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> For comprehensive term management including creating, editing, and archiving terms,
                  please use the dedicated <a href={`/${user?.school?.code}/terms`} className="underline font-medium">Term Management</a> page.
                </p>
              </div>
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
                    <select
                      className="input"
                      value={academicYearFormat}
                      onChange={(e) => setAcademicYearFormat(e.target.value)}
                    >
                      <option value="yyyy/yyyy">YYYY/YYYY (e.g., 2023/2024)</option>
                      <option value="yyyy-yyyy">YYYY-YYYY (e.g., 2023-2024)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Terms per Year
                    </label>
                    <select
                      className="input"
                      value={termsPerYear}
                      onChange={(e) => setTermsPerYear(e.target.value)}
                    >
                      <option value="2">2 Terms (Semester System)</option>
                      <option value="3">3 Terms (Trimester System)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveAcademic}
                    disabled={loadingAcademic}
                  >
                    {loadingAcademic ? 'Saving...' : 'Save Academic Settings'}
                  </button>
                </div>
              </div>
            </div>

            {/* Grade Templates Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <GradeTemplateManagement />
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
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <div className="flex justify-end">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveGeneral}
                    disabled={loadingGeneral}
                  >
                    {loadingGeneral ? 'Saving...' : 'Save General Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'report_cards':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Report Card Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Select the default report card template for your school. This template will be used for all classes unless overridden in class settings.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Available Templates
              </h4>

              {loadingTemplates ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${defaultTemplateId === template.id
                        ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      onClick={() => handleSaveReportCardTemplate(template.id)}
                    >
                      <div className="aspect-[210/297] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded mb-3 overflow-hidden relative group">
                        {/* Placeholder for template preview */}
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800">
                          <DocumentTextIcon className="h-12 w-12 opacity-20" />
                        </div>
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                      </div>

                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white text-sm">{template.name}</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{template.description}</p>
                        </div>
                        {defaultTemplateId === template.id && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
