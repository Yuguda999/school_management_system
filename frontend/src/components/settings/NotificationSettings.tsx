import React, { useState } from 'react';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  SpeakerWaveIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import { useToast } from '../../hooks/useToast';

interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  announcement_notifications: boolean;
  grade_notifications: boolean;
  attendance_notifications: boolean;
  fee_notifications: boolean;
  message_notifications: boolean;
}

const NotificationSettings: React.FC = () => {
  const { showSuccess } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    announcement_notifications: true,
    grade_notifications: true,
    attendance_notifications: true,
    fee_notifications: true,
    message_notifications: true,
  });

  const [loading, setLoading] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call to save preferences would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      console.log('Notification preferences saved:', preferences);
      showSuccess('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const deliveryMethods = [
    {
      key: 'email_notifications' as keyof NotificationPreferences,
      title: 'Email',
      description: 'Receive notifications via email',
      icon: EnvelopeIcon,
      iconBg: 'from-blue-500 to-indigo-600',
    },
    {
      key: 'sms_notifications' as keyof NotificationPreferences,
      title: 'SMS',
      description: 'Receive notifications via text message',
      icon: DevicePhoneMobileIcon,
      iconBg: 'from-green-500 to-emerald-600',
    },
    {
      key: 'push_notifications' as keyof NotificationPreferences,
      title: 'Push',
      description: 'Browser push notifications',
      icon: BellIcon,
      iconBg: 'from-purple-500 to-pink-600',
    },
  ];

  const notificationTypes = [
    {
      key: 'announcement_notifications' as keyof NotificationPreferences,
      title: 'Announcements',
      description: 'School announcements and important notices',
      icon: SpeakerWaveIcon,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      key: 'grade_notifications' as keyof NotificationPreferences,
      title: 'Grades',
      description: 'New grades and academic updates',
      icon: AcademicCapIcon,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      key: 'attendance_notifications' as keyof NotificationPreferences,
      title: 'Attendance',
      description: 'Attendance alerts and reports',
      icon: CalendarDaysIcon,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      key: 'fee_notifications' as keyof NotificationPreferences,
      title: 'Fees',
      description: 'Fee reminders and payment confirmations',
      icon: CurrencyDollarIcon,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      key: 'message_notifications' as keyof NotificationPreferences,
      title: 'Messages',
      description: 'Direct messages from teachers and staff',
      icon: ChatBubbleLeftRightIcon,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

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
      {/* Delivery Methods */}
      <Card variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Delivery Methods
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Choose how you want to receive notifications
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {deliveryMethods.map((method) => {
              const Icon = method.icon;
              const enabled = preferences[method.key];

              return (
                <button
                  key={method.key}
                  onClick={() => handleToggle(method.key)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${enabled
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${method.iconBg} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{method.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{method.description}</p>
                    </div>
                  </div>
                  {enabled && (
                    <div className="absolute top-2 right-2">
                      <CheckCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Notification Types */}
      <Card variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Notification Types
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Choose which types of notifications you want to receive
          </p>

          <div className="space-y-4">
            {notificationTypes.map((type) => {
              const Icon = type.icon;

              return (
                <div
                  key={type.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2.5 rounded-xl ${type.iconBg}`}>
                      <Icon className={`h-5 w-5 ${type.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {type.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={preferences[type.key]}
                    onChange={() => handleToggle(type.key)}
                  />
                </div>
              );
            })}
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
            <BellIcon className="h-4 w-4" />
          )}
          <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
