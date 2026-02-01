import React from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import { theme as staticTheme, useAppTheme } from '../../theme';

interface GameCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined' | 'glass';
  title?: string;
  icon?: React.ReactNode;
}

const GameCard: React.FC<GameCardProps> = ({
  children,
  style,
  variant = 'default',
  title,
  icon,
}) => {
  const theme = useAppTheme();

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'glass':
        return theme.isDark ? 'rgba(30,30,30,0.9)' : 'rgba(60,60,60,0.9)';
      case 'outlined':
        return 'transparent';
      default:
        return theme.colors.surface;
    }
  };

  const getCardStyle = () => {
    const baseStyle: ViewStyle = {
      backgroundColor: getBackgroundColor(),
    };

    if (variant === 'outlined') {
      baseStyle.borderWidth = 2;
      baseStyle.borderColor = theme.colors.outline;
    }

    return baseStyle;
  };

  return (
    <View style={[styles.container, variant === 'glass' && styles.glassEffect, style]}>
      <View style={[styles.content, getCardStyle()]}>
        {(title || icon) && (
          <View style={styles.header}>
            {icon && <View style={styles.icon}>{icon}</View>}
            {title && <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>}
          </View>
        )}
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: staticTheme.borderRadius.xl,
    overflow: 'hidden',
    ...staticTheme.shadows.medium,
    marginBottom: staticTheme.spacing.md,
  },
  glassEffect: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    padding: staticTheme.spacing.lg,
    borderRadius: staticTheme.borderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: staticTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: staticTheme.spacing.sm,
  },
  icon: {
    marginRight: staticTheme.spacing.sm,
  },
  title: {
    fontSize: staticTheme.fonts.titleLarge.fontSize,
    fontWeight: staticTheme.fonts.titleLarge.fontWeight,
    letterSpacing: 0.5,
  },
});

export default GameCard;
