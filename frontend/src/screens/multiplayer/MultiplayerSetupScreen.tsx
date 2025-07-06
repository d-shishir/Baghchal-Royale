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
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useQuickMatchMutation, useGetRoomsQuery, useGetFriendsRoomsQuery, useCreateRoomMutation, useGetProfileQuery } from '../../services/api';
import { startMultiplayerGame } from '../../store/slices/gameSlice';
import QuickMatchModal from '../../components/game/QuickMatchModal';

interface Room {
  id: string;
  name: string;
  host: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  isPrivate: boolean;
  created_at: string;
  game_id?: string;
  host_side?: string;
}

const { width } = Dimensions.get('window');

const MultiplayerSetupScreen = () => {
  const [activeTab, setActiveTab] = useState<'public' | 'friends'>('public');
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isQuickMatchModalVisible, setQuickMatchModalVisible] = useState(false);
  
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const { data: publicRooms, isLoading: isLoadingPublic, refetch: refetchPublic } = useGetRoomsQuery(undefined, {
    pollingInterval: 5000,
    skip: activeTab !== 'public',
  });
  const { data: friendsRooms, isLoading: isLoadingFriends, refetch: refetchFriends } = useGetFriendsRoomsQuery(undefined, {
    pollingInterval: 5000,
    skip: activeTab !== 'friends',
  });
  
  const [createRoom, { isLoading: isCreatingRoom }] = useCreateRoomMutation();
  const [quickMatch, { data: quickMatchResult, isLoading: isQuickMatching, isSuccess: quickMatchSuccess, error: quickMatchError }] = useQuickMatchMutation();
  const { data: user } = useGetProfileQuery(null);

  useEffect(() => {
    if (quickMatchSuccess && quickMatchResult) {
      const room = quickMatchResult;
      if (room.status === 'playing' && room.game_id) {
        const userIsHost = room.host.id === user?.id;
        const userSide = userIsHost ? room.host_side : (room.host_side === 'tigers' ? 'goats' : 'tigers');
        
        setQuickMatchModalVisible(false);
        Alert.alert('Match Found!', `You are playing as ${userSide}. The game will now begin.`);
        dispatch(startMultiplayerGame({ gameId: room.game_id, userSide: userSide, host: room.host }));
        navigation.navigate('Game');
      } else if (room.status === 'waiting') {
        Alert.alert('Waiting for Opponent', 'A new room has been created. We will notify you when a match is found.');
        refetchPublic(); 
      }
    }
    if (quickMatchError) Alert.alert('Quick Match Error', 'Could not find or create a match. Please try again.');
  }, [quickMatchSuccess, quickMatchResult, quickMatchError, dispatch, navigation, user, refetchPublic]);

  useEffect(() => {
    const allRooms = [...(publicRooms || []), ...(friendsRooms || [])];
    if (!user || allRooms.length === 0) return;

    const myStartedRoom = allRooms.find(
      (room) => room.host.id === user.id && room.status === 'playing' && room.game_id
    );

    if (myStartedRoom && myStartedRoom.game_id && myStartedRoom.host_side) {
      Alert.alert('Opponent Found!', `Your opponent has joined. You are playing as ${myStartedRoom.host_side}.`);
      
      dispatch(startMultiplayerGame({
        gameId: myStartedRoom.game_id,
        userSide: myStartedRoom.host_side,
        host: myStartedRoom.host
      }));
      navigation.navigate('Game');
    }
  }, [publicRooms, friendsRooms, user, dispatch, navigation]);

  const handleCreateRoom = async () => {
    if (newRoomName.trim() === '') return;
    try {
      await createRoom({ name: newRoomName, is_private: isPrivate }).unwrap();
      setCreateModalVisible(false);
      setNewRoomName('');
      refetchPublic();
    } catch (err) {
      Alert.alert('Error', 'Failed to create room.');
    }
  };

  const handleQuickMatch = (side: 'tigers' | 'goats') => {
    quickMatch({ side });
  };
  
  const renderRoomList = (rooms: any[], isLoading: boolean) => {
    if (isLoading) return <ActivityIndicator size="large" color="#FFF" />;
    if (!rooms || rooms.length === 0) return <Text style={styles.emptyText}>No available rooms.</Text>;
    
    return rooms.map((room) => (
      <TouchableOpacity key={room.id} style={styles.roomItem} onPress={() => Alert.alert('Join Room', `This feature is coming soon!`)}>
        <View style={styles.roomDetails}>
            <View style={[styles.statusIndicator, { backgroundColor: room.status === 'waiting' ? '#16c79a' : '#e94560' }]} />
            <View>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.roomHost}>Host: {room.host.username}</Text>
            </View>
        </View>
        <Text style={styles.roomPlayers}>{room.players_count}/{room.max_players}</Text>
      </TouchableOpacity>
    ));
  };
  
  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <QuickMatchModal visible={isQuickMatchModalVisible} onClose={() => setQuickMatchModalVisible(false)} onSelectSide={handleQuickMatch} isLoading={isQuickMatching} />
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={isCreateModalVisible}
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Create a New Room</Text>
                  <TextInput
                      style={styles.input}
                      placeholder="Enter Room Name"
                      placeholderTextColor="#888"
                      value={newRoomName}
                      onChangeText={setNewRoomName}
                  />
                  <TouchableOpacity style={styles.privateSwitch} onPress={() => setIsPrivate(!isPrivate)}>
                      <Text style={styles.privateText}>Private Room</Text>
                      <Ionicons name={isPrivate ? "checkbox" : "square-outline"} size={24} color="#16c79a" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalCreateButton} onPress={handleCreateRoom} disabled={isCreatingRoom}>
                      <Text style={styles.createButtonText}>
                          {isCreatingRoom ? "Creating..." : "Create Room"}
                      </Text>
                  </TouchableOpacity>
                   <TouchableOpacity style={styles.modalCancelButton} onPress={() => setCreateModalVisible(false)}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
              </View>
          </View>
        </Modal>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
          <Text style={styles.title}>Multiplayer</Text>
          <TouchableOpacity onPress={() => activeTab === 'public' ? refetchPublic() : refetchFriends()}><Ionicons name="refresh" size={24} color="white" /></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.megaButton} onPress={() => setQuickMatchModalVisible(true)}>
          <Ionicons name="flash" size={24} color="#FFF" />
          <Text style={styles.megaButtonText}>Quick Match</Text>
        </TouchableOpacity>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'public' && styles.activeTab]} onPress={() => setActiveTab('public')}>
            <Text style={styles.tabText}>Public Rooms</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'friends' && styles.activeTab]} onPress={() => setActiveTab('friends')}>
            <Text style={styles.tabText}>Friends' Rooms</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.roomListContainer}>
          {activeTab === 'public' ? renderRoomList(publicRooms || [], isLoadingPublic) : renderRoomList(friendsRooms || [], isLoadingFriends)}
        </ScrollView>
        <TouchableOpacity style={styles.createButton} onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createButtonText}>Create New Room</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    megaButton: { flexDirection: 'row', backgroundColor: 'rgba(233, 69, 96, 0.8)', padding: 20, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
    megaButtonText: { color: 'white', marginLeft: 10, fontWeight: 'bold', fontSize: 18 },
    tabContainer: { flexDirection: 'row', marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.2)' },
    activeTab: { borderBottomColor: '#16c79a' },
    tabText: { color: 'white', fontWeight: 'bold' },
    roomListContainer: { flex: 1 },
    emptyText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
    roomItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    roomDetails: { flexDirection: 'row', alignItems: 'center' },
    statusIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 15 },
    roomName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    roomHost: { color: 'gray' },
    roomPlayers: { color: 'white', fontWeight: 'bold' },
    createButton: { flexDirection: 'row', backgroundColor: 'rgba(22, 199, 154, 0.8)', padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    createButtonText: { color: 'white', marginLeft: 10, fontWeight: 'bold' },
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#1a1a2e', padding: 20, borderRadius: 15, width: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
    privateSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    privateText: { color: 'white', fontSize: 16 },
    modalCreateButton: { backgroundColor: '#16c79a', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    modalCancelButton: { backgroundColor: '#e94560', padding: 15, borderRadius: 10, alignItems: 'center' },
    cancelButtonText: { color: 'white', fontWeight: 'bold' }
});

export default MultiplayerSetupScreen; 