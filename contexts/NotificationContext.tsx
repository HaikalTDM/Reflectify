import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomToast, { ToastType } from '../components/CustomToast';
import CustomAlert, { AlertButton } from '../components/CustomAlert';
import { useTheme } from './ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

interface NotificationContextType {
  showToast: (options: ToastOptions) => void;
  showAlert: (options: AlertOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isDark } = useTheme();
  const [toast, setToast] = useState<(ToastOptions & { visible: boolean }) | null>(null);
  const [alert, setAlert] = useState<(AlertOptions & { visible: boolean }) | null>(null);

  const showToast = (options: ToastOptions) => {
    setToast({ ...options, visible: true });
  };

  const showAlert = (options: AlertOptions) => {
    setAlert({ ...options, visible: true });
  };

  const hideToast = () => {
    setToast(null);
  };

  const hideAlert = () => {
    setAlert(null);
  };

  return (
    <NotificationContext.Provider value={{ showToast, showAlert }}>
      {children}
      
      {/* Toast */}
      {toast && (
        <CustomToast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={hideToast}
          isDark={isDark}
        />
      )}

      {/* Alert */}
      {alert && (
        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttons={alert.buttons}
          icon={alert.icon}
          iconColor={alert.iconColor}
          onClose={hideAlert}
          isDark={isDark}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

