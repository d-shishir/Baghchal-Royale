import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Image, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { colors } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedSplashProps {
  onAnimationComplete: () => void;
}

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onAnimationComplete }) => {
  // Theme
  const isDarkMode = useSelector((state: RootState) => state.ui.darkMode);
  const themeColors = isDarkMode ? colors.dark : colors.light;

  // Animation values
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const runAnimation = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Ignore if splash screen is already hidden
      }

      // Phase 1: Logo entrance animation (scale up + fade in)
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Phase 2: Text fade in after logo
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Phase 3: Hold for a moment, then fade out everything
          setTimeout(() => {
            Animated.timing(containerOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              onAnimationComplete();
            });
          }, 800);
        });
      });
    };

    // Small delay to let the native splash screen transition smoothly
    const timer = setTimeout(runAnimation, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.background,
          opacity: containerOpacity,
        },
      ]}
    >
      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../assets/br.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App Name */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text style={[styles.appName, { color: themeColors.primary }]}>
          BAGHCHAL
        </Text>
        <Text style={[styles.appSubtitle, { color: themeColors.onSurfaceVariant }]}>
          ROYALE
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 6,
  },
  appSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 12,
    marginTop: 4,
  },
});

export default AnimatedSplash;
