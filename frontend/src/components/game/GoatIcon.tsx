import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface GoatIconProps {
  size?: number;
  color?: string;
}

const GoatIcon: React.FC<GoatIconProps> = ({ size = 32 }) => {
  return (
    <View style={[styles.container, { 
      width: size, 
      height: size,
      borderRadius: size / 2,
    }]}>
      <Image
        source={require('../../../assets/goat.jpg')}
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

export default GoatIcon;
