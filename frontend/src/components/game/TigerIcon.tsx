import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface TigerIconProps {
  size?: number;
  color?: string;
}

const TigerIcon: React.FC<TigerIconProps> = ({ size = 32 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require('../../../assets/tiger.jpeg')}
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

export default TigerIcon;
