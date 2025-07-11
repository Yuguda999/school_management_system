import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Toast, { ToastType } from '../components/ui/Toast';
import { setGlobalNotificationHandler } from '../utils/notifications';

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (type: ToastType, title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setIsVisible(true);
  };

  const hideToast = () => {
    setIsVisible(false);
  };

  // Helper functions for different toast types
  const showSuccess = (message: string, title: string = 'Success!') => {
    showToast('success', title, message);
  };

  const showError = (message: string, title: string = 'Error') => {
    showToast('error', title, message);
  };

  const showWarning = (message: string, title: string = 'Warning') => {
    showToast('warning', title, message);
  };

  const showInfo = (message: string, title: string = 'Info') => {
    showToast('info', title, message);
  };

  // Register global notification handler
  useEffect(() => {
    setGlobalNotificationHandler({
      showSuccess,
      showError,
      showWarning,
      showInfo,
    });

    // Cleanup on unmount
    return () => {
      setGlobalNotificationHandler(null);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        type={toastType}
        title={toastTitle}
        message={toastMessage}
        isVisible={isVisible}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};

export default ToastContext;
