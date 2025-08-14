import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface GoatIconProps {
  size?: number;
  color?: string;
}

const GoatIcon: React.FC<GoatIconProps> = ({ size = 32 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require('../../../assets/goat.jpg')}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 50,
  },
});

export default GoatIcon;
