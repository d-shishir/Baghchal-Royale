import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { useAppTheme } from '../../theme';

interface TigerIconProps {
  size?: number;
  color?: string;
}

const TigerIcon: React.FC<TigerIconProps> = ({ size = 32 }) => {
  const theme = useAppTheme();
  
  const boardTheme = theme.boardTheme;
  const source = boardTheme.pieceStyle === 'image' && 'tigerImage' in boardTheme
    ? boardTheme.tigerImage
    : require('../../../assets/tiger.jpeg');

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
        borderColor: 'rgba(184, 134, 11, 0.6)', // Bronze border
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
        shadowColor: '#FF6F00', // Tiger glow
        shadowOpacity: 0.8,
        shadowRadius: 10,
        ...Platform.select({
          ios: { elevation: 15 },
          android: { elevation: 0, borderWidth: 1, borderColor: '#FF6F00' },
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
        key={theme.boardTheme.id}
        source={source}
        style={[styles.image, { 
          width: size, 
          height: size, 
          borderRadius: size / 2 
        }]}
        resizeMode="cover"
        {...Platform.select({
          android: { fadeDuration: 0 as const },
          default: {},
        })}
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

export default TigerIcon;
