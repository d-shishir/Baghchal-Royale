import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import CustomAlertModal, { AlertType, AlertButton } from '../components/common/CustomAlertModal';

interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
    buttons: [{ text: 'OK' }],
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions({
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      buttons: options.buttons || [{ text: 'OK' }],
    });
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Convenience functions for common alert types
export const useAlertHelpers = () => {
  const { showAlert } = useAlert();

  const showSuccess = useCallback((title: string, message?: string, onOk?: () => void) => {
    showAlert({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  }, [showAlert]);

  const showError = useCallback((title: string, message?: string, onOk?: () => void) => {
    showAlert({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message?: string, onOk?: () => void) => {
    showAlert({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string, 
    message: string | undefined, 
    onConfirm: () => void, 
    onCancel?: () => void
  ) => {
    showAlert({
      title,
      message,
      type: 'confirm',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Confirm', style: 'default', onPress: onConfirm },
      ],
    });
  }, [showAlert]);

  return { showSuccess, showError, showWarning, showConfirm, showAlert };
};
