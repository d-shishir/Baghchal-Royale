import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const LoadingScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    return () => rotateAnimation.stop();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.gameBoard}>
          <View style={styles.boardLines}>
            <View style={[styles.line, styles.horizontalLine, { top: '0%' }]} />
            <View style={[styles.line, styles.horizontalLine, { top: '25%' }]} />
            <View style={[styles.line, styles.horizontalLine, { top: '50%' }]} />
            <View style={[styles.line, styles.horizontalLine, { top: '75%' }]} />
            <View style={[styles.line, styles.horizontalLine, { top: '100%' }]} />
            
            <View style={[styles.line, styles.verticalLine, { left: '0%' }]} />
            <View style={[styles.line, styles.verticalLine, { left: '25%' }]} />
            <View style={[styles.line, styles.verticalLine, { left: '50%' }]} />
            <View style={[styles.line, styles.verticalLine, { left: '75%' }]} />
            <View style={[styles.line, styles.verticalLine, { left: '100%' }]} />
          </View>
          
          <View style={[styles.piece, styles.tiger, { top: '0%', left: '0%' }]} />
          <View style={[styles.piece, styles.tiger, { top: '0%', right: '0%' }]} />
          <View style={[styles.piece, styles.tiger, { bottom: '0%', left: '0%' }]} />
          <View style={[styles.piece, styles.tiger, { bottom: '0%', right: '0%' }]} />
          
          <View style={[styles.piece, styles.goat, { top: '25%', left: '50%' }]} />
          <View style={[styles.piece, styles.goat, { top: '50%', left: '25%' }]} />
        </View>
        
        <Text style={styles.title}>बाघचाल Royale</Text>
        <Text style={styles.subtitle}>Tigers and Goats</Text>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.loadingIndicator,
          { transform: [{ rotate: rotation }] },
        ]}
      >
        <View style={styles.spinner} />
      </Animated.View>
      
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  gameBoard: {
    width: 120,
    height: 120,
    marginBottom: 20,
    position: 'relative',
  },
  boardLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    backgroundColor: '#6D4C41',
    position: 'absolute',
  },
  horizontalLine: {
    height: 2,
    width: '100%',
  },
  verticalLine: {
    width: 2,
    height: '100%',
  },
  piece: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    marginTop: -8,
    borderWidth: 2,
    borderColor: '#757575',
  },
  tiger: {
    backgroundColor: '#FF6F00',
  },
  goat: {
    backgroundColor: '#66BB6A',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingIndicator: {
    marginBottom: 20,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FF5252',
    borderTopColor: 'transparent',
  },
  loadingText: {
    fontSize: 16,
    color: '#E0E0E0',
    opacity: 0.7,
  },
});

export default LoadingScreen; 