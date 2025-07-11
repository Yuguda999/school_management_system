import React, { useState } from 'react';
import { 
  BellIcon, 
  EnvelopeIcon, 
  DevicePhoneMobileIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

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
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    {
      key: 'announcement_notifications' as keyof NotificationPreferences,
      title: 'Announcements',
      description: 'School announcements and important notices',
      icon: SpeakerWaveIcon,
    },
    {
      key: 'grade_notifications' as keyof NotificationPreferences,
      title: 'Grades',
      description: 'New grades and academic updates',
      icon: BellIcon,
    },
    {
      key: 'attendance_notifications' as keyof NotificationPreferences,
      title: 'Attendance',
      description: 'Attendance alerts and reports',
      icon: BellIcon,
    },
    {
      key: 'fee_notifications' as keyof NotificationPreferences,
      title: 'Fees',
      description: 'Fee reminders and payment confirmations',
      icon: BellIcon,
    },
    {
      key: 'message_notifications' as keyof NotificationPreferences,
      title: 'Messages',
      description: 'Direct messages from teachers and staff',
      icon: EnvelopeIcon,
    },
  ];

  return (
    <div className="card p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Notification Settings
      </h3>
      
      {/* Delivery Methods */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Delivery Methods
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Email Notifications
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('email_notifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                preferences.email_notifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.email_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  SMS Notifications
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive notifications via SMS
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('sms_notifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                preferences.sms_notifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.sms_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BellIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Push Notifications
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive browser push notifications
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('push_notifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                preferences.push_notifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.push_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Notification Types
        </h4>
        <div className="space-y-3">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <type.icon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {type.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {type.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(type.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  preferences[type.key] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary w-full flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <BellIcon className="h-4 w-4" />
          )}
          <span>{loading ? 'Saving...' : 'Save Notification Settings'}</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
