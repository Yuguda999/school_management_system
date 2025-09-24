import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  KeyIcon,
  ServerIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../hooks/useToast';

interface PlatformSettings {
  general: {
    platform_name: string;
    support_email: string;
    maintenance_mode: boolean;
    registration_enabled: boolean;
    max_schools_per_owner: number;
  };
  security: {
    password_min_length: number;
    session_timeout: number;
    two_factor_required: boolean;
    ip_whitelist_enabled: boolean;
    failed_login_attempts: number;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    system_alerts: boolean;
    marketing_emails: boolean;
  };
  billing: {
    currency: string;
    tax_rate: number;
    trial_period_days: number;
    payment_methods: string[];
  };
}

const PlatformSettingsPage: React.FC = () => {
  const { canManagePlatform } = usePermissions();
  const { showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<PlatformSettings>({
    general: {
      platform_name: 'School Management System',
      support_email: 'support@schoolms.com',
      maintenance_mode: false,
      registration_enabled: true,
      max_schools_per_owner: 5
    },
    security: {
      password_min_length: 8,
      session_timeout: 30,
      two_factor_required: false,
      ip_whitelist_enabled: false,
      failed_login_attempts: 5
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      system_alerts: true,
      marketing_emails: false
    },
    billing: {
      currency: 'USD',
      tax_rate: 10,
      trial_period_days: 30,
      payment_methods: ['credit_card', 'bank_transfer']
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the API
      // const data = await platformAdminService.getPlatformSettings();
      // setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      showError('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // In a real app, this would save to the API
      // await platformAdminService.updatePlatformSettings(settings);
      showToast('Platform settings updated successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save platform settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof PlatformSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  if (!canManagePlatform()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'billing', name: 'Billing', icon: CurrencyDollarIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Settings
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Configure global platform settings and preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              General Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.general.platform_name}
                  onChange={(e) => updateSetting('general', 'platform_name', e.target.value)}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.general.support_email}
                  onChange={(e) => updateSetting('general', 'support_email', e.target.value)}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Schools per Owner
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.general.max_schools_per_owner}
                  onChange={(e) => updateSetting('general', 'max_schools_per_owner', parseInt(e.target.value))}
                  className="input"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenance_mode"
                    checked={settings.general.maintenance_mode}
                    onChange={(e) => updateSetting('general', 'maintenance_mode', e.target.checked)}
                    className="checkbox"
                  />
                  <label htmlFor="maintenance_mode" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Maintenance Mode
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="registration_enabled"
                    checked={settings.general.registration_enabled}
                    onChange={(e) => updateSetting('general', 'registration_enabled', e.target.checked)}
                    className="checkbox"
                  />
                  <label htmlFor="registration_enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Enable New Registrations
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Security Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={settings.security.password_min_length}
                  onChange={(e) => updateSetting('security', 'password_min_length', parseInt(e.target.value))}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={settings.security.session_timeout}
                  onChange={(e) => updateSetting('security', 'session_timeout', parseInt(e.target.value))}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Failed Login Attempts Limit
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.security.failed_login_attempts}
                  onChange={(e) => updateSetting('security', 'failed_login_attempts', parseInt(e.target.value))}
                  className="input"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="two_factor_required"
                    checked={settings.security.two_factor_required}
                    onChange={(e) => updateSetting('security', 'two_factor_required', e.target.checked)}
                    className="checkbox"
                  />
                  <label htmlFor="two_factor_required" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Require Two-Factor Authentication
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ip_whitelist_enabled"
                    checked={settings.security.ip_whitelist_enabled}
                    onChange={(e) => updateSetting('security', 'ip_whitelist_enabled', e.target.checked)}
                    className="checkbox"
                  />
                  <label htmlFor="ip_whitelist_enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Enable IP Whitelist
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Notification Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Notifications
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Send system notifications via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.email_notifications}
                  onChange={(e) => updateSetting('notifications', 'email_notifications', e.target.checked)}
                  className="checkbox"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    SMS Notifications
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Send critical alerts via SMS
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.sms_notifications}
                  onChange={(e) => updateSetting('notifications', 'sms_notifications', e.target.checked)}
                  className="checkbox"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    System Alerts
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive alerts about system issues
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.system_alerts}
                  onChange={(e) => updateSetting('notifications', 'system_alerts', e.target.checked)}
                  className="checkbox"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Marketing Emails
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Send promotional and marketing content
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.marketing_emails}
                  onChange={(e) => updateSetting('notifications', 'marketing_emails', e.target.checked)}
                  className="checkbox"
                />
              </div>
            </div>
          </div>
        )}

        {/* Billing Settings */}
        {activeTab === 'billing' && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Billing Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Currency
                </label>
                <select
                  value={settings.billing.currency}
                  onChange={(e) => updateSetting('billing', 'currency', e.target.value)}
                  className="input"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={settings.billing.tax_rate}
                  onChange={(e) => updateSetting('billing', 'tax_rate', parseFloat(e.target.value))}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trial Period (days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={settings.billing.trial_period_days}
                  onChange={(e) => updateSetting('billing', 'trial_period_days', parseInt(e.target.value))}
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="card p-6 border-red-200 dark:border-red-800">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
              Danger Zone
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                  Reset Platform Settings
                </h4>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Reset all platform settings to default values
                </p>
              </div>
              <button className="btn btn-danger">
                Reset Settings
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                  Clear All Data
                </h4>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Permanently delete all platform data (irreversible)
                </p>
              </div>
              <button className="btn btn-danger">
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformSettingsPage;
