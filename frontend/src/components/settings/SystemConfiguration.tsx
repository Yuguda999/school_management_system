import React, { useState } from 'react';
import { 
  Cog6ToothIcon, 
  ClockIcon, 
  CalendarDaysIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

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
}

const SystemConfiguration: React.FC = () => {
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
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Academic Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AcademicCapIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Academic Settings
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

      {/* School Timing */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ClockIcon className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            School Timing
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Attendance Grace Period (minutes)
            </label>
            <input
              type="number"
              value={config.attendance_grace_period}
              onChange={(e) => handleInputChange('attendance_grace_period', parseInt(e.target.value))}
              className="input"
              min="0"
              max="60"
            />
          </div>
        </div>
      </div>

      {/* Financial Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Financial Settings
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Online Payments
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Allow parents to pay fees online
              </p>
            </div>
            <button
              onClick={() => handleToggle('enable_online_payments')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                config.enable_online_payments ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enable_online_payments ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Portal Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Portal & Access Settings
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Parent Portal
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Allow parents to access the system
              </p>
            </div>
            <button
              onClick={() => handleToggle('enable_parent_portal')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                config.enable_parent_portal ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enable_parent_portal ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Student Portal
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Allow students to access the system
              </p>
            </div>
            <button
              onClick={() => handleToggle('enable_student_portal')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                config.enable_student_portal ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enable_student_portal ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Require Parent Approval
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Require parent approval for student actions
              </p>
            </div>
            <button
              onClick={() => handleToggle('require_parent_approval')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                config.require_parent_approval ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.require_parent_approval ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-generate Student IDs
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically generate unique student IDs
              </p>
            </div>
            <button
              onClick={() => handleToggle('auto_generate_student_ids')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                config.auto_generate_student_ids ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.auto_generate_student_ids ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            System Settings
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={config.session_timeout}
              onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value))}
              className="input"
              min="5"
              max="480"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Cog6ToothIcon className="h-4 w-4" />
          )}
          <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>
    </div>
  );
};

export default SystemConfiguration;
