import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  ClockIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ServerIcon,
  CloudArrowUpIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { usePermissions } from '../../hooks/usePermissions';
import UserManagement from './UserManagement';
import Card from '../ui/Card';
import { useToast } from '../../hooks/useToast';

interface SystemConfig {
  academic_year_start: string;
  academic_year_end: string;
  school_start_time: string;
  school_end_time: string;
  attendance_grace_period: number;
  late_fee_percentage: number;
  max_students_per_class: number;
  enable_parent_portal: boolean;
  enable_student_portal: boolean;
  enable_online_payments: boolean;
  require_parent_approval: boolean;
  auto_generate_student_ids: boolean;
  backup_frequency: string;
  session_timeout: number;
  // Promotion settings
  promotion_mode: 'automatic' | 'performance_based' | 'manual';
  min_promotion_score: number;
}

const SystemConfiguration: React.FC = () => {
  const { canManagePlatform } = usePermissions();
  const { showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<'config' | 'users'>('config');
  const [config, setConfig] = useState<SystemConfig>({
    academic_year_start: '2024-04-01',
    academic_year_end: '2025-03-31',
    school_start_time: '08:00',
    school_end_time: '15:30',
    attendance_grace_period: 15,
    late_fee_percentage: 5,
    max_students_per_class: 40,
    enable_parent_portal: true,
    enable_student_portal: true,
    enable_online_payments: true,
    require_parent_approval: false,
    auto_generate_student_ids: true,
    backup_frequency: 'daily',
    session_timeout: 30,
    // Promotion settings
    promotion_mode: 'automatic',
    min_promotion_score: 40,
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleToggle = (key: keyof SystemConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call to save configuration would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      console.log('System configuration saved:', config);
      showSuccess('System configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation for Platform Admin */}
      {canManagePlatform() && (
        <Card variant="glass" padding="none">
          <div className="p-2">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'config'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                System Configuration
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'users'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                <UserGroupIcon className="h-4 w-4 mr-2" />
                User Management
              </button>
            </nav>
          </div>
        </Card>
      )}

      {/* Tab Content */}
      {activeTab === 'users' && canManagePlatform() ? (
        <UserManagement />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Academic Settings */}
          <Card variant="glass">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <AcademicCapIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Academic Settings
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure academic year and class settings
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Academic Year Start
                  </label>
                  <input
                    type="date"
                    value={config.academic_year_start}
                    onChange={(e) => handleInputChange('academic_year_start', e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Academic Year End
                  </label>
                  <input
                    type="date"
                    value={config.academic_year_end}
                    onChange={(e) => handleInputChange('academic_year_end', e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Students per Class
                  </label>
                  <input
                    type="number"
                    value={config.max_students_per_class}
                    onChange={(e) => handleInputChange('max_students_per_class', parseInt(e.target.value))}
                    className="input"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Promotion Settings */}
          <Card variant="glass">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <UserGroupIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Promotion Settings
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure how students are promoted to the next class
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Promotion Mode
                  </label>
                  <select
                    value={config.promotion_mode}
                    onChange={(e) => handleInputChange('promotion_mode', e.target.value)}
                    className="input"
                  >
                    <option value="automatic">Automatic (Promote All)</option>
                    <option value="performance_based">Performance Based (Score Threshold)</option>
                    <option value="manual">Manual (Require Individual Decisions)</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {config.promotion_mode === 'automatic' && 'All students will be automatically promoted to the next class.'}
                    {config.promotion_mode === 'performance_based' && 'Students meeting the minimum score will be promoted; others repeat.'}
                    {config.promotion_mode === 'manual' && 'Each student requires a manual promotion decision.'}
                  </p>
                </div>

                {config.promotion_mode === 'performance_based' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Promotion Score
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={config.min_promotion_score}
                        onChange={(e) => handleInputChange('min_promotion_score', parseInt(e.target.value))}
                        className="input pr-8"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Students with session average below this score will repeat the class.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* School Timing */}
          <Card variant="glass">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <ClockIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    School Timing
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Set school hours and attendance policies
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    School Start Time
                  </label>
                  <input
                    type="time"
                    value={config.school_start_time}
                    onChange={(e) => handleInputChange('school_start_time', e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    School End Time
                  </label>
                  <input
                    type="time"
                    value={config.school_end_time}
                    onChange={(e) => handleInputChange('school_end_time', e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attendance Grace Period
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={config.attendance_grace_period}
                      onChange={(e) => handleInputChange('attendance_grace_period', parseInt(e.target.value))}
                      className="input pr-16"
                      min="0"
                      max="60"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">min</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Financial Settings */}
          <Card variant="glass">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
                  <CurrencyDollarIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Financial Settings
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure fee policies and payment options
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Late Fee Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={config.late_fee_percentage}
                      onChange={(e) => handleInputChange('late_fee_percentage', parseFloat(e.target.value))}
                      className="input pr-8"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Enable Online Payments
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow parents to pay fees online
                    </p>
                  </div>
                  <Toggle
                    enabled={config.enable_online_payments}
                    onChange={() => handleToggle('enable_online_payments')}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Portal Settings */}
          <Card variant="glass">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                  <ShieldCheckIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Portal & Access Settings
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure user access and permissions
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'enable_parent_portal' as keyof SystemConfig,
                    title: 'Enable Parent Portal',
                    description: 'Allow parents to access the system',
                  },
                  {
                    key: 'enable_student_portal' as keyof SystemConfig,
                    title: 'Enable Student Portal',
                    description: 'Allow students to access the system',
                  },
                  {
                    key: 'require_parent_approval' as keyof SystemConfig,
                    title: 'Require Parent Approval',
                    description: 'Require parent approval for student actions',
                  },
                  {
                    key: 'auto_generate_student_ids' as keyof SystemConfig,
                    title: 'Auto-generate Student IDs',
                    description: 'Automatically generate unique student IDs',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                    <Toggle
                      enabled={config[item.key] as boolean}
                      onChange={() => handleToggle(item.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* System Settings */}
          <Card variant="glass">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 text-white">
                  <ServerIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    System Settings
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Backup and security configuration
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CloudArrowUpIcon className="h-4 w-4 inline mr-1" />
                    Backup Frequency
                  </label>
                  <select
                    value={config.backup_frequency}
                    onChange={(e) => handleInputChange('backup_frequency', e.target.value)}
                    className="input"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <KeyIcon className="h-4 w-4 inline mr-1" />
                    Session Timeout
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={config.session_timeout}
                      onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value))}
                      className="input pr-16"
                      min="5"
                      max="480"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">min</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary px-6 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Cog6ToothIcon className="h-4 w-4" />
              )}
              <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfiguration;
