import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
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
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  winner,
  onRestart,
  onGoHome,
  showRestart = true, // Default to true for backward compatibility
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
    elevation: 24,
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
    elevation: 6,
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
});

export default GameOverModal; 