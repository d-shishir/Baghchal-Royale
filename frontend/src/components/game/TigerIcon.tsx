import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useAppTheme } from '../../theme';

interface TigerIconProps {
  size?: number;
  color?: string;
}

const TigerIcon: React.FC<TigerIconProps> = ({ size = 32 }) => {
  const theme = useAppTheme();
  
  const source = theme.boardTheme.pieceStyle === 'image' && 'tigerImage' in theme.boardTheme
    ? theme.boardTheme.tigerImage
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
        elevation: 10,
      },
      theme.boardTheme.id === 'neon' && {
        shadowColor: '#FF6F00', // Tiger glow
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 15,
      },
      theme.boardTheme.id === 'newyear' && {
        borderWidth: 2,
        borderColor: '#FFD700', // Gold border for celebration
        shadowColor: '#FFD700',
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 12,
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
    elevation: 5,
  },
  image: {
    backgroundColor: '#2A2A2A',
  },
});

export default TigerIcon;
