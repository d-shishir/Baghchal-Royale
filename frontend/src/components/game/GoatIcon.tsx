import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { useAppTheme } from '../../theme';

interface GoatIconProps {
  size?: number;
  color?: string;
}

const GoatIcon: React.FC<GoatIconProps> = ({ size = 32 }) => {
  const theme = useAppTheme();
  
  const boardTheme = theme.boardTheme;
  const source = boardTheme.pieceStyle === 'image' && 'goatImage' in boardTheme
    ? boardTheme.goatImage
    : require('../../../assets/goat.jpg');

  return (
    <View style={[
      styles.container, 
      { 
        width: size, 
        height: size,
        borderRadius: size / 2,
      },
      theme.boardTheme.id === 'stone' && {
        borderWidth: 2,
        borderColor: 'rgba(50, 50, 50, 0.4)', // Subtle dark border for marble definition
        shadowOpacity: 0.6,
        shadowRadius: 6,
        ...Platform.select({
          ios: { elevation: 10 },
          android: { elevation: 0 },
        }),
      },
      theme.boardTheme.id === 'neon' && {
        borderWidth: 0,
        borderColor: 'transparent',
        shadowColor: '#00FFFF', // Goat glow
        shadowOpacity: 0.8,
        shadowRadius: 10,
        ...Platform.select({
          ios: { elevation: 15 },
          android: { elevation: 0, borderWidth: 1, borderColor: '#00FFFF' },
        }),
      },
      theme.boardTheme.id === 'newyear' && {
        borderWidth: 2,
        borderColor: '#FFD700', // Gold border for celebration
        shadowColor: '#FFD700',
        shadowOpacity: 0.6,
        shadowRadius: 8,
        ...Platform.select({
          ios: { elevation: 12 },
          android: { elevation: 0 },
        }),
      }
    ]}>
      <Image
        source={source}
        style={[styles.image, { 
          width: size, 
          height: size, 
          borderRadius: size / 2 
        }]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    ...Platform.select({
      ios: { elevation: 5 },
      android: { elevation: 0, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    }),
  },
  image: {
    backgroundColor: '#2A2A2A',
  },
});

export default GoatIcon;
