import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';

interface GameOverModalProps {
  visible: boolean;
  winner: string;
  onRestart: () => void;
  onGoHome: () => void;
  showRestart?: boolean; // Optional prop to control restart button visibility
  /** Optional CTA to play a rewarded ad in exchange for an in-app reward. */
  onWatchAd?: () => void;
  /** Whether the ad CTA should be visible (e.g. when a rewarded ad is loaded). */
  showAdButton?: boolean;
  /** Label displayed on the ad CTA button. */
  adButtonLabel?: string;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  winner,
  onRestart,
  onGoHome,
  showRestart = true, // Default to true for backward compatibility
  onWatchAd,
  showAdButton = false,
  adButtonLabel = 'Watch Ad for +25 XP',
}) => {
  const { colors, isDark } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.5);
    }
  }, [visible, scaleAnim, opacityAnim]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.modalContent,
            { 
              opacity: opacityAnim, 
              transform: [{ scale: scaleAnim }],
              backgroundColor: colors.surface 
            },
          ]}
        >
          <LinearGradient
            colors={[colors.surface, colors.surfaceVariant]}
            style={styles.gradient}
          >
            <Ionicons name="trophy" size={80} color={colors.highlightColor} />
            <Text style={[styles.winnerText, { color: colors.text }]}>{winner}</Text>
            {showAdButton && onWatchAd && (
              <TouchableOpacity
                style={[styles.adButton, { backgroundColor: colors.highlightColor }]}
                onPress={onWatchAd}
                accessibilityRole="button"
                accessibilityLabel={adButtonLabel}
              >
                <Ionicons name="play-circle" size={22} color="#000" />
                <Text style={[styles.adButtonText, { color: '#000' }]}>{adButtonLabel}</Text>
              </TouchableOpacity>
            )}
            <View style={[styles.buttonContainer, !showRestart && styles.singleButtonContainer]}>
              {showRestart && (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={onRestart}
                >
                  <Ionicons name="refresh" size={24} color={colors.onPrimary} />
                  <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Restart</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, !showRestart && styles.singleButton, { backgroundColor: colors.secondary }]}
                onPress={onGoHome}
              >
                <Ionicons name="home" size={24} color={colors.onSecondary} />
                <Text style={[styles.buttonText, { color: colors.onSecondary }]}>Home</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    ...Platform.select({
      ios: { elevation: 24 },
      android: { elevation: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    }),
  },
  gradient: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 36,
    fontWeight: '800',
    marginVertical: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
    width: '100%',
    gap: 16, // Adds space between buttons
  },
  singleButtonContainer: {
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    ...Platform.select({
      ios: { elevation: 6 },
      android: { elevation: 0, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    }),
  },
  singleButton: {
    minWidth: 160,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  adButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  adButtonText: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});

export default GameOverModal; 