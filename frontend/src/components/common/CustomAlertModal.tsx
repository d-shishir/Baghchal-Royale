import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
  onClose: () => void;
}

const getIconForType = (type: AlertType): { name: keyof typeof Ionicons.glyphMap; color: string } => {
  switch (type) {
    case 'success':
      return { name: 'checkmark-circle', color: '#4CAF50' };
    case 'warning':
      return { name: 'warning', color: '#FF9800' };
    case 'error':
      return { name: 'close-circle', color: '#F44336' };
    case 'confirm':
      return { name: 'help-circle', color: '#2196F3' };
    case 'info':
    default:
      return { name: 'information-circle', color: '#2196F3' };
  }
};

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
}) => {
  const theme = useAppTheme();
  const { name: iconName, color: iconColor } = getIconForType(type);

  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    onClose();
  };

  const getButtonStyle = (button: AlertButton): ViewStyle => {
    if (button.style === 'destructive') {
      return { backgroundColor: theme.colors.error };
    }
    if (button.style === 'cancel') {
      return { backgroundColor: theme.colors.surfaceVariant };
    }
    return { backgroundColor: theme.colors.primary };
  };

  const getButtonTextColor = (button: AlertButton): string => {
    if (button.style === 'cancel') {
      return theme.colors.text;
    }
    return '#FFF';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={iconName} size={40} color={iconColor} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>

          {/* Message */}
          {message && (
            <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
              {message}
            </Text>
          )}

          {/* Buttons */}
          <View style={[styles.buttonContainer, buttons.length > 2 && styles.buttonContainerColumn]}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  buttons.length <= 2 && styles.buttonFlex,
                  getButtonStyle(button),
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: getButtonTextColor(button) }]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  buttonContainerColumn: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFlex: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlertModal;
