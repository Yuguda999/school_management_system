// Utility functions for notifications
// This file provides a centralized way to handle notifications throughout the app

export interface NotificationOptions {
  title?: string;
  duration?: number;
  autoClose?: boolean;
}

// Global notification handler - will be set by the ToastProvider
let globalNotificationHandler: {
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
} | null = null;

export const setGlobalNotificationHandler = (handler: typeof globalNotificationHandler) => {
  globalNotificationHandler = handler;
};

// Drop-in replacement for alert() - shows error toast
export const alertError = (message: string, title: string = 'Error') => {
  if (globalNotificationHandler) {
    globalNotificationHandler.showError(message, title);
  } else {
    // Fallback to browser alert if toast system not available
    alert(`${title}: ${message}`);
  }
};

// Drop-in replacement for success messages
export const alertSuccess = (message: string, title: string = 'Success!') => {
  if (globalNotificationHandler) {
    globalNotificationHandler.showSuccess(message, title);
  } else {
    // Fallback to browser alert if toast system not available
    alert(`${title}: ${message}`);
  }
};

// Drop-in replacement for warning messages
export const alertWarning = (message: string, title: string = 'Warning') => {
  if (globalNotificationHandler) {
    globalNotificationHandler.showWarning(message, title);
  } else {
    // Fallback to browser alert if toast system not available
    alert(`${title}: ${message}`);
  }
};

// Drop-in replacement for info messages
export const alertInfo = (message: string, title: string = 'Info') => {
  if (globalNotificationHandler) {
    globalNotificationHandler.showInfo(message, title);
  } else {
    // Fallback to browser alert if toast system not available
    alert(`${title}: ${message}`);
  }
};

// Generic notification function
export const notify = (
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
  title?: string
) => {
  switch (type) {
    case 'success':
      alertSuccess(message, title);
      break;
    case 'error':
      alertError(message, title);
      break;
    case 'warning':
      alertWarning(message, title);
      break;
    case 'info':
      alertInfo(message, title);
      break;
  }
};

// Confirmation dialog replacement
export const confirmAction = (
  message: string,
  title: string = 'Confirm Action'
): Promise<boolean> => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    resolve(confirmed);
  });
};

export default {
  alertError,
  alertSuccess,
  alertWarning,
  alertInfo,
  notify,
  confirmAction,
};
