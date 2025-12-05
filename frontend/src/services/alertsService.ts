/**
 * Alerts Service for Automated Reporting & Alert Rules (P3.1)
 */

import { apiService as api } from './api';

// ============== Types ==============

export type AlertType = 'attendance' | 'grade' | 'fee' | 'behavior' | 'custom';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertConditionOperator = 'less_than' | 'greater_than' | 'equals' | 'not_equals' | 'less_than_or_equal' | 'greater_than_or_equal';
export type AlertFrequency = 'daily' | 'weekly' | 'monthly' | 'once';

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  is_active: boolean;
  metric: string;
  operator: AlertConditionOperator;
  threshold: number;
  scope_class_id?: string;
  scope_student_id?: string;
  check_frequency: AlertFrequency;
  notify_admin: boolean;
  notify_teacher: boolean;
  notify_parent: boolean;
  email_notification: boolean;
  sms_notification: boolean;
  created_at: string;
}

export interface AlertRuleCreate {
  name: string;
  description?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  metric: string;
  operator: AlertConditionOperator;
  threshold: number;
  scope_class_id?: string;
  scope_student_id?: string;
  check_frequency: AlertFrequency;
  notify_admin?: boolean;
  notify_teacher?: boolean;
  notify_parent?: boolean;
  email_notification?: boolean;
  sms_notification?: boolean;
}

export interface AlertNotification {
  id: string;
  rule_id: string;
  rule_name: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  triggered_value: number;
  threshold_value: number;
  student_id?: string;
  student_name?: string;
  class_id?: string;
  class_name?: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  triggered_at: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  frequency: AlertFrequency;
  recipients: string[];
  filters: Record<string, unknown>;
  last_run_at?: string;
  next_run_at?: string;
  is_active: boolean;
  created_at: string;
}

// ============== API Functions ==============

const alertsService = {
  // Alert Rules CRUD
  listRules: async (schoolCode: string, alertType?: AlertType, isActive?: boolean) => {
    const params: Record<string, string | boolean> = {};
    if (alertType) params.alert_type = alertType;
    if (isActive !== undefined) params.is_active = isActive;
    return await api.get<AlertRule[]>(`/api/v1/school/${schoolCode}/alerts/rules`, { params });
  },

  createRule: async (schoolCode: string, data: AlertRuleCreate) => {
    return await api.post<AlertRule>(`/api/v1/school/${schoolCode}/alerts/rules`, data);
  },

  getRule: async (schoolCode: string, ruleId: string) => {
    return await api.get<AlertRule>(`/api/v1/school/${schoolCode}/alerts/rules/${ruleId}`);
  },

  updateRule: async (schoolCode: string, ruleId: string, data: Partial<AlertRuleCreate>) => {
    return await api.put<AlertRule>(`/api/v1/school/${schoolCode}/alerts/rules/${ruleId}`, data);
  },

  deleteRule: async (schoolCode: string, ruleId: string) => {
    await api.delete(`/api/v1/school/${schoolCode}/alerts/rules/${ruleId}`);
  },

  toggleRule: async (schoolCode: string, ruleId: string, isActive: boolean) => {
    return await api.patch<AlertRule>(`/api/v1/school/${schoolCode}/alerts/rules/${ruleId}/toggle`, { is_active: isActive });
  },

  evaluateRule: async (schoolCode: string, ruleId: string) => {
    return await api.post(`/api/v1/school/${schoolCode}/alerts/rules/${ruleId}/evaluate`);
  },

  // Alert Notifications
  listNotifications: async (schoolCode: string, isAcknowledged?: boolean, isResolved?: boolean, limit?: number) => {
    const params: Record<string, string | number | boolean> = {};
    if (isAcknowledged !== undefined) params.is_acknowledged = isAcknowledged;
    if (isResolved !== undefined) params.is_resolved = isResolved;
    if (limit) params.limit = limit;
    return await api.get<AlertNotification[]>(`/api/v1/school/${schoolCode}/alerts/notifications`, { params });
  },

  acknowledgeNotification: async (schoolCode: string, notificationId: string) => {
    return await api.post<AlertNotification>(`/api/v1/school/${schoolCode}/alerts/notifications/${notificationId}/acknowledge`);
  },

  resolveNotification: async (schoolCode: string, notificationId: string, notes?: string) => {
    return await api.post<AlertNotification>(`/api/v1/school/${schoolCode}/alerts/notifications/${notificationId}/resolve`, { notes });
  },

  // Scheduled Reports
  listScheduledReports: async (schoolCode: string) => {
    return await api.get<ScheduledReport[]>(`/api/v1/school/${schoolCode}/alerts/scheduled-reports`);
  },

  createScheduledReport: async (schoolCode: string, data: Partial<ScheduledReport>) => {
    return await api.post<ScheduledReport>(`/api/v1/school/${schoolCode}/alerts/scheduled-reports`, data);
  },

  deleteScheduledReport: async (schoolCode: string, reportId: string) => {
    await api.delete(`/api/v1/school/${schoolCode}/alerts/scheduled-reports/${reportId}`);
  },
};

export default alertsService;

