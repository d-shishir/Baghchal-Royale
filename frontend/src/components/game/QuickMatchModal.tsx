import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface QuickMatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSide: (side: 'tigers' | 'goats') => void;
  isLoading: boolean;
}

const QuickMatchModal: React.FC<QuickMatchModalProps> = ({
  visible,
  onClose,
  onSelectSide,
  isLoading,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Choose Your Side</Text>
          <Text style={styles.modalSubtitle}>
            You'll be matched with an opponent who chose the opposite side.
          </Text>

          <View style={styles.optionsContainer}>
            {/* Tiger Option */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => onSelectSide('tigers')}
              disabled={isLoading}
            >
              <LinearGradient colors={['#FF8F00', '#FF6F00']} style={styles.gradient}>
                <Ionicons name="flash" size={48} color="#FFF" />
                <Text style={styles.optionTitle}>Tigers</Text>
                <Text style={styles.optionDescription}>Play offensively</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Goat Option */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => onSelectSide('goats')}
              disabled={isLoading}
            >
              <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.gradient}>
                <Ionicons name="shield" size={48} color="#FFF" />
                <Text style={styles.optionTitle}>Goats</Text>
                <Text style={styles.optionDescription}>Play defensively</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Finding match...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  optionButton: {
    width: '45%',
    borderRadius: 16,
    elevation: 4,
  },
  gradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  optionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  loadingContainer: {
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFF',
    fontStyle: 'italic',
  },
});

export default QuickMatchModal; 