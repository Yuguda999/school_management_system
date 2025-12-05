/**
 * Alerts Management Panel Component (P3.1)
 * Displays alert rules and notifications for admins
 */

import React, { useEffect, useState } from 'react';
import {
  BellAlertIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import alertsService, { AlertRule, AlertNotification, AlertSeverity } from '../../services/alertsService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const AlertsManagementPanel: React.FC = () => {
  const schoolCode = useSchoolCode();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notifications' | 'rules'>('notifications');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = async () => {
    if (!schoolCode) return;
    try {
      setLoading(true);
      const [rulesData, notificationsData] = await Promise.all([
        alertsService.listRules(schoolCode),
        alertsService.listNotifications(schoolCode, false, false, 20)
      ]);
      setRules(rulesData);
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [schoolCode]);

  const handleAcknowledge = async (notificationId: string) => {
    if (!schoolCode) return;
    try {
      await alertsService.acknowledgeNotification(schoolCode, notificationId);
      fetchData();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  const handleResolve = async (notificationId: string) => {
    if (!schoolCode) return;
    try {
      await alertsService.resolveNotification(schoolCode, notificationId);
      fetchData();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    if (!schoolCode) return;
    try {
      await alertsService.toggleRule(schoolCode, ruleId, isActive);
      fetchData();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const severityColors: Record<AlertSeverity, string> = {
    low: 'bg-blue-100 text-blue-700 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200'
  };

  const severityIcons: Record<AlertSeverity, React.ReactNode> = {
    low: <BellAlertIcon className="h-5 w-5 text-blue-500" />,
    medium: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />,
    high: <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />,
    critical: <XCircleIcon className="h-5 w-5 text-red-500" />
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <BellAlertIcon className="h-6 w-6 mr-2 text-primary-500" />
          Alerts & Rules
        </h2>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <PlusIcon className="h-4 w-4 mr-1" />
          Create Rule
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'rules'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Rules ({rules.length})
        </button>
      </div>

      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircleIcon className="h-12 w-12 mx-auto text-green-400 mb-4" />
              <p className="text-gray-500">No active alerts. Everything looks good!</p>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card key={notification.id} className={`p-4 border-l-4 ${severityColors[notification.severity]}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {severityIcons[notification.severity]}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{notification.rule_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                      {notification.student_name && (
                        <p className="text-xs text-gray-500 mt-1">Student: {notification.student_name}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.triggered_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.is_acknowledged && (
                      <Button size="sm" variant="outline" onClick={() => handleAcknowledge(notification.id)}>
                        Acknowledge
                      </Button>
                    )}
                    {!notification.is_resolved && (
                      <Button size="sm" onClick={() => handleResolve(notification.id)}>
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                  <p className="text-sm text-gray-500">
                    {rule.metric} {rule.operator.replace(/_/g, ' ')} {rule.threshold}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${severityColors[rule.severity]}`}>
                      {rule.severity}
                    </span>
                    <span className="text-xs text-gray-400">{rule.check_frequency}</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.is_active}
                    onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Rule Modal - Placeholder */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Alert Rule">
        <p className="text-gray-500">Alert rule creation form coming soon...</p>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AlertsManagementPanel;

