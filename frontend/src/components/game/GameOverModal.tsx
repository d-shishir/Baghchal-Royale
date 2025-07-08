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

interface GameOverModalProps {
  visible: boolean;
  winner: string;
  onRestart: () => void;
  onGoHome: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  winner,
  onRestart,
  onGoHome,
}) => {
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
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#2a2a2e', '#16213e']}
            style={styles.gradient}
          >
            <Ionicons name="trophy" size={80} color="#FFD700" />
            <Text style={styles.winnerText}>{winner}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.restartButton]}
                onPress={onRestart}
              >
                <Ionicons name="refresh" size={24} color="#FFF" />
                <Text style={styles.buttonText}>Restart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.homeButton]}
                onPress={onGoHome}
              >
                <Ionicons name="home" size={24} color="#FFF" />
                <Text style={styles.buttonText}>Home</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  gradient: {
    padding: 30,
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginVertical: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartButton: {
    backgroundColor: '#4CAF50',
  },
  homeButton: {
    backgroundColor: '#1E88E5',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default GameOverModal; 