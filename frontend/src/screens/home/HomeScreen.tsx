import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState } from '../../store';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { startLocalGame } from '../../store/slices/gameSlice';
import { Game, GamePlayer } from '../../services/types';
import { GameStatus } from '../../game-logic/baghchal';
import { initialGameState } from '../../game-logic/initialState';

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MainTabs'>;

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const isGuest = useSelector((state: RootState) => state.auth.isGuest);

  const handlePlaySinglePlayer = () => {
    navigation.navigate('SinglePlayerSetup');
  };

  const handlePlayLocalPVP = () => {
    const gameId = `local-pvp-${Date.now()}`;
    const player1: GamePlayer = { id: 'player1', username: 'Player 1 (Tiger)'};
    const player2: GamePlayer = { id: 'player2', username: 'Player 2 (Goat)'};

    const localGame: Game = {
        game_id: gameId,
        player1_id: 'player1',
        player2_id: 'player2',
        player1,
        player2,
        status: GameStatus.IN_PROGRESS,
        game_state: initialGameState,
        game_type: 'PVP_LOCAL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    dispatch(startLocalGame(localGame));
    navigation.navigate('Game', { gameId });
  };

  const handlePlayMultiplayer = () => {
    if (!isAuthenticated || isGuest) {
      Alert.alert(
        'Account Required',
        'Please log in or create an account to play online multiplayer games.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('MultiplayerSetup');
  };

  const handleViewProfile = () => {
    navigation.navigate('MainTabs', { screen: 'Profile' });
  };

  const handleViewLeaderboard = () => {
    navigation.navigate('MainTabs', { screen: 'Leaderboard' });
  };

  const handleShowGameRules = () => {
     Alert.alert(
      'Baghchal Rules',
      '🐯 4 Tigers vs 🐐 20 Goats\n\n• Tigers move first\n• Tigers win by capturing 5 goats\n• Goats win by blocking all tiger movements\n• Game has 2 phases: placement and movement'
    );
  };
  
  // TODO: calculate winrate from user's game history
  const winRate = 'N/A';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <LinearGradient colors={['#2d2d2d', '#1a1a1a']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{user?.username || 'Guest'}</Text>
          </View>
          <TouchableOpacity onPress={handleViewProfile} style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Game Mode Selection */}
      <View style={styles.gameModesSection}>
        <Text style={styles.sectionTitle}>Choose Game Mode</Text>
        
        {/* Single Player Mode */}
        <TouchableOpacity style={styles.gameModeCard} onPress={handlePlaySinglePlayer}>
          <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.modeGradient}>
            <View style={styles.modeContent}>
              <View style={styles.modeIcon}>
                <Ionicons name="person-outline" size={32} color="#FFF" />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Single Player</Text>
                <Text style={styles.modeDescription}>Play against AI opponent</Text>
                <View style={styles.modeBadge}>
                  <Text style={styles.badgeText}>Practice Mode</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* On-Device PVP Mode */}
        <TouchableOpacity style={styles.gameModeCard} onPress={handlePlayLocalPVP}>
          <LinearGradient colors={['#42A5F5', '#1976D2']} style={styles.modeGradient}>
            <View style={styles.modeContent}>
              <View style={styles.modeIcon}>
                <Ionicons name="phone-portrait-outline" size={32} color="#FFF" />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>PVP (On Device)</Text>
                <Text style={styles.modeDescription}>Two players on the same device</Text>
                <View style={styles.modeBadge}>
                  <Text style={styles.badgeText}>Local Match</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Multiplayer Mode */}
        <TouchableOpacity style={styles.gameModeCard} onPress={handlePlayMultiplayer}>
          <LinearGradient colors={['#66BB6A', '#4CAF50']} style={styles.modeGradient}>
            <View style={styles.modeContent}>
              <View style={styles.modeIcon}>
                <Ionicons name="people-outline" size={32} color="#FFF" />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Multiplayer</Text>
                <Text style={styles.modeDescription}>Play with friends online</Text>
                <View style={styles.modeBadge}>
                  <Text style={styles.badgeText}>Ranked Games</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleViewLeaderboard}>
            <LinearGradient colors={['#FFB74D', '#FFA726']} style={styles.actionGradient}>
              <Ionicons name="trophy-outline" size={28} color="#FFF" />
              <Text style={styles.actionText}>Leaderboard</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleShowGameRules}>
            <LinearGradient colors={['#81C784', '#66BB6A']} style={styles.actionGradient}>
              <Ionicons name="book-outline" size={28} color="#FFF" />
              <Text style={styles.actionText}>Game Rules</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleViewProfile}>
            <LinearGradient colors={['#F48FB1', '#E91E63']} style={styles.actionGradient}>
              <Ionicons name="stats-chart-outline" size={28} color="#FFF" />
              <Text style={styles.actionText}>My Stats</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient colors={['#90CAF9', '#42A5F5']} style={styles.actionGradient}>
              <Ionicons name="settings-outline" size={28} color="#FFF" />
              <Text style={styles.actionText}>Settings</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Info */}
      <View style={styles.gameInfoSection}>
        <Text style={styles.sectionTitle}>About Baghchal</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🐅 Traditional Nepali Strategy Game</Text>
          <Text style={styles.infoDescription}>
            Baghchal (Tigers and Goats) is a traditional board game from Nepal. 
            Four tigers hunt twenty goats while the goats try to block the tigers' movement.
          </Text>
          <View style={styles.rulesPreview}>
            <Text style={styles.ruleItem}>• 4 Tigers vs 20 Goats</Text>
            <Text style={styles.ruleItem}>• Tigers move first</Text>
            <Text style={styles.ruleItem}>• Tigers win by capturing 5 goats</Text>
            <Text style={styles.ruleItem}>• Goats win by blocking all tigers</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#999',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5252',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
  },
  gameModesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  gameModeCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modeGradient: {
    borderRadius: 16,
    padding: 20,
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  modeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  actionGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  gameInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
    marginBottom: 16,
  },
  rulesPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  ruleItem: {
    fontSize: 14,
    color: '#999',
    marginBottom: 6,
  },
});

export default HomeScreen; 