import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Room {
  id: string;
  name: string;
  host: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'full';
  isPrivate: boolean;
  created_at: string;
}

interface MultiplayerSetupScreenProps {
  onCreateRoom: (roomName: string, isPrivate: boolean) => void;
  onJoinRoom: (roomId: string) => void;
  onJoinPrivateRoom: (roomCode: string) => void;
  onQuickMatch: () => void;
  onBack: () => void;
  availableRooms: Room[];
  isLoading: boolean;
}

const { width } = Dimensions.get('window');

const MultiplayerSetupScreen: React.FC<MultiplayerSetupScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  onJoinPrivateRoom,
  onQuickMatch,
  onBack,
  availableRooms,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }
    
    onCreateRoom(roomName.trim(), isPrivate);
    setShowCreateModal(false);
    setRoomName('');
    setIsPrivate(false);
  };

  const handleJoinPrivateRoom = () => {
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }
    
    onJoinPrivateRoom(roomCode.trim().toUpperCase());
    setShowJoinModal(false);
    setRoomCode('');
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const renderJoinTab = () => (
    <View style={styles.tabContent}>
      {/* Quick Match */}
      <TouchableOpacity style={styles.quickMatchCard} onPress={onQuickMatch}>
        <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.quickMatchGradient}>
          <View style={styles.quickMatchContent}>
            <View style={styles.quickMatchIcon}>
              <Ionicons name="flash" size={32} color="#FFF" />
            </View>
            <View style={styles.quickMatchInfo}>
              <Text style={styles.quickMatchTitle}>Quick Match</Text>
              <Text style={styles.quickMatchSubtitle}>Find a game instantly</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Join Private Room */}
      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={() => setShowJoinModal(true)}
      >
        <Ionicons name="key" size={20} color="#FFF" />
        <Text style={styles.actionButtonText}>Join Private Room</Text>
      </TouchableOpacity>

      {/* Available Rooms */}
      <View style={styles.roomsSection}>
        <Text style={styles.sectionTitle}>Available Rooms</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading rooms...</Text>
          </View>
        ) : availableRooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>No rooms available</Text>
            <Text style={styles.emptyStateSubtext}>Create a room or try quick match</Text>
          </View>
        ) : (
          <ScrollView style={styles.roomsList} showsVerticalScrollIndicator={false}>
            {availableRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomCard,
                  room.status === 'full' && styles.roomCardDisabled
                ]}
                onPress={() => room.status !== 'full' && onJoinRoom(room.id)}
                disabled={room.status === 'full'}
              >
                <View style={styles.roomHeader}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: 
                      room.status === 'waiting' ? '#4CAF50' : 
                      room.status === 'playing' ? '#FF9800' : '#F44336'
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {room.status === 'waiting' ? 'WAITING' : 
                       room.status === 'playing' ? 'PLAYING' : 'FULL'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.roomDetails}>
                  <View style={styles.roomInfo}>
                    <Ionicons name="person" size={16} color="#999" />
                    <Text style={styles.roomInfoText}>Host: {room.host}</Text>
                  </View>
                  
                  <View style={styles.roomInfo}>
                    <Ionicons name="people" size={16} color="#999" />
                    <Text style={styles.roomInfoText}>
                      {room.players}/{room.maxPlayers} players
                    </Text>
                  </View>
                  
                  <View style={styles.roomInfo}>
                    <Ionicons name="time" size={16} color="#999" />
                    <Text style={styles.roomInfoText}>
                      {formatTimeAgo(room.created_at)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );

  const renderCreateTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Create New Room</Text>
      
      <View style={styles.createForm}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Room Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter room name"
            placeholderTextColor="#666"
            value={roomName}
            onChangeText={setRoomName}
            maxLength={30}
          />
        </View>

        <View style={styles.optionGroup}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <View style={styles.optionLeft}>
              <Ionicons 
                name={isPrivate ? "lock-closed" : "lock-open"} 
                size={20} 
                color={isPrivate ? "#FF6F00" : "#666"} 
              />
              <Text style={styles.optionText}>Private Room</Text>
            </View>
            <View style={[
              styles.checkbox,
              isPrivate && styles.checkboxChecked
            ]}>
              {isPrivate && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
          </TouchableOpacity>
          
          <Text style={styles.optionDescription}>
            {isPrivate 
              ? "Only players with the room code can join"
              : "Anyone can see and join your room"
            }
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, !roomName.trim() && styles.createButtonDisabled]}
          onPress={handleCreateRoom}
          disabled={!roomName.trim()}
        >
          <LinearGradient
            colors={roomName.trim() ? ['#66BB6A', '#4CAF50'] : ['#333', '#333']}
            style={styles.createButtonGradient}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.createButtonText}>Create Room</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Room Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Room Features</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="chatbubble" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Real-time chat</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="refresh" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Rematch option</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="trophy" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Ranked matches</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="time" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Move timer</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Multiplayer</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'join' && styles.activeTab]}
          onPress={() => setActiveTab('join')}
        >
          <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>
            Join Game
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            Create Room
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'join' && renderJoinTab()}
        {activeTab === 'create' && renderCreateTab()}
      </ScrollView>

      {/* Join Private Room Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showJoinModal}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Private Room</Text>
            
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Room Code</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#666"
                value={roomCode}
                onChangeText={(text) => setRoomCode(text.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleJoinPrivateRoom}
              >
                <Text style={styles.confirmButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF5252',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  quickMatchCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  quickMatchGradient: {
    borderRadius: 16,
    padding: 20,
  },
  quickMatchContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickMatchIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickMatchInfo: {
    flex: 1,
  },
  quickMatchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  quickMatchSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  roomsSection: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  roomsList: {
    maxHeight: 400,
  },
  roomCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  roomCardDisabled: {
    opacity: 0.5,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  roomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roomInfoText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  createForm: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFF',
  },
  optionGroup: {
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6F00',
    borderColor: '#FF6F00',
  },
  optionDescription: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    marginLeft: 32,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  featuresSection: {
    marginTop: 20,
  },
  featuresList: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#CCC',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    width: width * 0.8,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalInputLabel: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 8,
  },
  modalTextInput: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#FF5252',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default MultiplayerSetupScreen; 