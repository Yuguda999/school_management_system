import React, { useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-800 dark:text-green-200',
          message: 'text-green-700 dark:text-green-300',
          closeButton: 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200',
        };
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-800 dark:text-red-200',
          message: 'text-red-700 dark:text-red-300',
          closeButton: 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-800 dark:text-yellow-200',
          message: 'text-yellow-700 dark:text-yellow-300',
          closeButton: 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200',
        };
      case 'info':
        return {
          container: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800',
          icon: 'text-primary-600 dark:text-primary-400',
          title: 'text-primary-800 dark:text-primary-200',
          message: 'text-primary-700 dark:text-primary-300',
          closeButton: 'text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200',
        };
      default:
        return {
          container: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
          icon: 'text-gray-600 dark:text-gray-400',
          title: 'text-gray-800 dark:text-gray-200',
          message: 'text-gray-700 dark:text-gray-300',
          closeButton: 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return CheckCircleIcon;
      case 'error':
        return ExclamationTriangleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'info':
        return InformationCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const styles = getToastStyles();
  const IconComponent = getIcon();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right duration-300">
      <div className={`border rounded-lg p-4 shadow-lg ${styles.container}`}>
        <div className="flex items-start">
          <IconComponent className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${styles.icon}`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${styles.title}`}>
              {title}
            </p>
            <p className={`text-sm mt-1 ${styles.message}`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`ml-3 ${styles.closeButton} transition-colors duration-200`}
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
