import { useToast as useToastContext } from '../contexts/ToastContext';

export const useToast = () => {
  const { showToast, hideToast } = useToastContext();

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

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };
};

export default useToast;
