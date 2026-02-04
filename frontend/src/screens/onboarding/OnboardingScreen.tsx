
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Animated,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { setHasSeenOnboarding } from '../../store/slices/uiSlice';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Welcome to Baghchal Royale',
    description: 'Experience the traditional game of Tigers and Goats with a modern Royale twist.',
    icon: 'game-controller',
  },
  {
    id: '2',
    title: 'The Rules',
    description: 'Tigers must capture 5 goats to win. Goats must surround tigers so they cannot move.',
    icon: 'book',
  },
  {
    id: '3',
    title: 'Play Your Way',
    description: 'Challenge the AI in single player mode or play with friends locally.',
    icon: 'people',
  },
];

const OnboardingScreen = () => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    dispatch(setHasSeenOnboarding(true));
  };

  const handleSkip = () => {
    handleFinish();
  };

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <View style={[styles.slide, { backgroundColor: theme.colors.background }]}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={item.icon}
            size={100}
            color={theme.colors.primary}
          />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {item.description}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
         {currentIndex < slides.length - 1 && (
            <Text style={[styles.skipText, { color: theme.colors.primary }]}>Skip</Text>
         )}
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(index);
        }}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    currentIndex === index
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                  width: currentIndex === index ? 20 : 10,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleNext}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'flex-end',
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 50,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
