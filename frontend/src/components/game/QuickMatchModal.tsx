import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { matchmakingSocket, MatchmakingResponse } from '../../services/websocket';
import { GameScreenNavigationProp } from '../../navigation/MainNavigator';

interface QuickMatchModalProps {
  visible: boolean;
  onClose: () => void;
}

const QuickMatchModal: React.FC<QuickMatchModalProps> = ({ visible, onClose }) => {
  const [status, setStatus] = useState('idle'); // idle, waiting, found
  const token = useSelector((state: RootState) => state.auth.token);
  const navigation = useNavigation<GameScreenNavigationProp>();

  // Use a ref to store the message handler to avoid issues with stale closures in useEffect
  const messageHandlerRef = useRef<((data: MatchmakingResponse) => void) | undefined>(undefined);

  useEffect(() => {
    // Keep the ref updated with the latest handler logic
    messageHandlerRef.current = (data: MatchmakingResponse) => {
      if (data.status === 'match_found' && data.game_id && data.match_id && data.opponent && data.player_side) {
        setStatus('found');
        onClose();
        navigation.navigate('Game', {
          gameId: data.game_id,
          matchId: data.match_id,
          opponentId: data.opponent.id,
          playerSide: data.player_side.toUpperCase() as 'TIGER' | 'GOAT',
          gameMode: 'online',
        });
      } else if (data.status === 'error') {
        console.error('Matchmaking error:', data.message);
        setStatus('idle');
      } else if (data.status === 'searching') {
        setStatus('waiting');
      }
    };
  }, [navigation, onClose]);

  useEffect(() => {
    if (visible && token) {
      // A wrapper function that calls the latest handler from the ref
      const wrappedHandler = (data: MatchmakingResponse) => {
        if (messageHandlerRef.current) {
          messageHandlerRef.current(data);
        }
      };

      matchmakingSocket.connect(token, wrappedHandler);

      // Return a cleanup function that disconnects when the modal is closed
      return () => {
        matchmakingSocket.disconnect();
        setStatus('idle');
      };
    }
  }, [visible, token]);

  const handleCancel = () => {
    matchmakingSocket.disconnect();
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Quick Match</Text>
          
          {status === 'waiting' && (
            <>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.statusText}>Searching for opponent...</Text>
              <Text style={styles.subText}>This shouldn't take long.</Text>
            </>
          )}
          
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
    marginBottom: 24,
  },
  statusText: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 16,
  },
  subText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    marginBottom: 24,
  },
  cancelButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuickMatchModal; 