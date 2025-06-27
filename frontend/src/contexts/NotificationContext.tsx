import React, { createContext, useContext, useRef } from 'react';

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const notifications = useRef<any[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Simple alert for now - can be enhanced with custom toast component
    console.log(`${type.toUpperCase()}: ${message}`);
    // In a real app, you'd add to a notification queue and display toast
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}; 