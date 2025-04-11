import { useState, useCallback } from 'react';
import { SnackbarState } from '../types';

export const useNotification = () => {
  const [notification, setNotification] = useState<SnackbarState>({
    open: false,
    message: '',
  });

  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({
      open: true,
      message,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      open: false,
    }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
};