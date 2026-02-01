import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { theme as staticTheme, useAppTheme } from '../../theme';

interface GameButtonProps {
  onPress: () => void;
  title?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  circular?: boolean;
}

const GameButton: React.FC<GameButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  icon,
  style,
  textStyle,
  disabled = false,
  circular = false,
}) => {
  const scale = useSharedValue(1);
  const theme = useAppTheme();

  const getBackgroundColor = (): string => {
    if (disabled) return theme.colors.surfaceVariant;
    
    switch (variant) {
      case 'primary':
        return theme.colors.tigerColor; // Orange
      case 'secondary':
        return theme.colors.surfaceVariant; // Grey
      case 'success':
        return theme.colors.goatColor; // Green
      case 'danger':
        return theme.colors.error; // Red
      default:
        return theme.colors.primary;
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.container, style, circular && styles.containerCircular, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={disabled}
        style={[
          styles.button,
          { backgroundColor: getBackgroundColor() },
          size === 'small' && styles.small,
          size === 'large' && styles.large,
          disabled && styles.disabled,
          circular && styles.buttonCircular,
        ]}
      >
        {icon && <View style={[styles.iconContainer, (!title || circular) && { marginRight: 0 }]}>{icon}</View>}
        {title && !circular ? (
          <Text
            style={[
              styles.text,
              size === 'small' && styles.textSmall,
              size === 'large' && styles.textLarge,
              variant === 'secondary' && { color: theme.colors.text },
              disabled && { color: theme.colors.onSurfaceVariant },
              textStyle,
            ]} 
          >
            {title}
          </Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: staticTheme.borderRadius.lg,
    ...staticTheme.shadows.medium,
  },
  containerCircular: {
    borderRadius: 100,
    width: 48,
    height: 48,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: staticTheme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCircular: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  disabled: {
    opacity: 0.6,
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textSmall: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 20,
  },
});

export default GameButton;
