export const colors = {
  light: {
    primary: '#C62828',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFCDD2',
    onPrimaryContainer: '#8C1F1F',
    secondary: '#795548',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#EFEBE9',
    onSecondaryContainer: '#3E2723',
    tertiary: '#FF6F00',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFE0B2',
    onTertiaryContainer: '#E65100',
    surface: '#FAFAFA',
    onSurface: '#212121',
    surfaceVariant: '#F5F5F5',
    onSurfaceVariant: '#424242',
    outline: '#757575',
    outlineVariant: '#BDBDBD',
    background: '#FFFFFF',
    onBackground: '#212121',
    card: '#FFFFFF',
    text: '#212121',
    border: '#E0E0E0',
    notification: '#C62828',

    // Game-specific colors & Neons
    tigerColor: '#FF5722',
    tigerGlow: 'rgba(255, 87, 34, 0.4)',
    goatColor: '#8BC34A',
    goatGlow: 'rgba(139, 195, 74, 0.4)',
    
    boardColor: '#8D6E63',
    highlightColor: '#FFC107',
    validMoveColor: 'rgba(76, 175, 80, 0.6)',
    attackColor: '#F44336',

    // UI Accents
    accentGradStart: '#C62828',
    accentGradEnd: '#D32F2F',
    bgGradStart: '#FFFFFF',
    bgGradEnd: '#F5F5F5',

    // Semantic colors
    player1: '#FF5722',
    player2: '#8BC34A',
    validMove: '#4CAF50',
    attack: '#F44336',
    success: '#4CAF50',
    error: '#D32F2F',
  },
  dark: {
    primary: '#FF6F00',
    onPrimary: '#000000',
    primaryContainer: '#C62828', // Darker red for container in dark mode
    onPrimaryContainer: '#FFCDD2',
    secondary: '#A1887F',
    onSecondary: '#000000',
    secondaryContainer: '#5D4037',
    onSecondaryContainer: '#EFEBE9',
    tertiary: '#FFB74D',
    onTertiary: '#000000',
    tertiaryContainer: '#FF8F00',
    onTertiaryContainer: '#FFE0B2',
    surface: '#121212', // Darker surface
    onSurface: '#FFFFFF',
    surfaceVariant: '#1E1E1E', // Slightly lighter
    onSurfaceVariant: '#B0B0B0',
    outline: '#424242',
    outlineVariant: '#333333',
    background: '#050505', // Deep black
    onBackground: '#FFFFFF',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#272727',
    notification: '#FF8F00',
    
    // Game-specific colors & Neons
    tigerColor: '#FF6F00',
    tigerGlow: 'rgba(255, 111, 0, 0.6)',
    goatColor: '#4CAF50',
    goatGlow: 'rgba(76, 175, 80, 0.6)',
    
    boardColor: '#3E2723', // Dark wood
    highlightColor: '#FFD54F',
    validMoveColor: 'rgba(102, 187, 106, 0.8)',
    attackColor: '#F44336',
    
    // UI Accents
    accentGradStart: '#FF6F00',
    accentGradEnd: '#FF8F00',
    bgGradStart: '#1A1A1A',
    bgGradEnd: '#000000',
    
    // Semantic colors
    player1: '#FF6F00', // Tiger
    player2: '#4CAF50', // Goat
    validMove: '#66BB6A',
    attack: '#F44336',
    success: '#4CAF50',
    error: '#F44336',
  },
};

export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
  neon: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10, // Android mostly ignores shadow color, but elevation helps
  })
};

import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const theme = {
  colors: colors.dark, // Default fallback
  fonts: {
    displayLarge: { fontSize: 57, fontWeight: '700' as const, letterSpacing: -0.25 },
    displayMedium: { fontSize: 45, fontWeight: '700' as const, letterSpacing: 0 },
    displaySmall: { fontSize: 36, fontWeight: '700' as const },
    headlineLarge: { fontSize: 32, fontWeight: '700' as const },
    headlineMedium: { fontSize: 28, fontWeight: '700' as const },
    headlineSmall: { fontSize: 24, fontWeight: '700' as const },
    titleLarge: { fontSize: 22, fontWeight: '600' as const },
    titleMedium: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.15 },
    titleSmall: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.1 },
    labelLarge: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.1 },
    labelMedium: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
    labelSmall: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
    bodyLarge: { fontSize: 16, fontWeight: '400' as const, letterSpacing: 0.5 },
    bodyMedium: { fontSize: 14, fontWeight: '400' as const, letterSpacing: 0.25 },
    bodySmall: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.4 },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
  },
  gameBoard: {
    size: 5,
    cellSize: 64, // Slightly larger for better touch targets
    lineWidth: 3,
    pieceSize: 48,
    padding: 24,
  },
  shadows,
};

export type Theme = typeof theme;

export const useAppTheme = () => {
  const isDarkMode = useSelector((state: RootState) => state.ui.darkMode);
  const currentColors = isDarkMode ? colors.dark : colors.light;
  
  return {
    ...theme,
    colors: currentColors,
    isDark: isDarkMode,
  };
};
 