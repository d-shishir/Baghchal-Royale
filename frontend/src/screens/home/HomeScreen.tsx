import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState } from '../../store';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { startLocalGame } from '../../store/slices/gameSlice';
import { Game, Player, BackendGameStatus } from '../../services/types';
import { initialGameState } from '../../game-logic/initialState';
import { useGetGamesQuery } from '../../services/api';

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
    const player1: Player = { user_id: 'player1', username: 'Player 1 (Tiger)'};
    const player2: Player = { user_id: 'player2', username: 'Player 2 (Goat)'};

    const localGame: Game = {
        game_id: gameId,
        player_tiger_id: 'player1',
        player_goat_id: 'player2',
        player_tiger: player1,
        player_goat: player2,
        status: BackendGameStatus.IN_PROGRESS,
        game_state: initialGameState,
        created_at: new Date().toISOString(),
    };
    dispatch(startLocalGame(localGame));
    navigation.navigate('Game', { gameId, gameMode: 'local' });
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
  
  const { data: games = [], isLoading: isLoadingGames } = useGetGamesQuery(undefined, {
    skip: !isAuthenticated || isGuest,
    pollingInterval: 30000, // Poll for new games every 30 seconds
  });

  const ongoingGames = games.filter(g => g.status === BackendGameStatus.IN_PROGRESS);
  const finishedGames = games.filter(g => g.status === BackendGameStatus.COMPLETED);

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

      {/* Recent Games */}
      {isAuthenticated && !isGuest && (
        <View style={styles.recentGamesSection}>
          <Text style={styles.sectionTitle}>Recent Games</Text>
          {isLoadingGames && <ActivityIndicator color="#FFF" />}
          {ongoingGames.length > 0 && (
            <View>
              <Text style={styles.subSectionTitle}>Ongoing</Text>
              {ongoingGames.map(game => (
                <TouchableOpacity key={game.game_id} style={styles.gameCard} onPress={() => navigation.navigate('Game', { gameId: game.game_id, gameMode: 'online' })}>
                  <Text style={styles.gameText}>vs {game.player_tiger?.username === user?.username ? game.player_goat?.username : game.player_tiger?.username}</Text>
                  <Text style={styles.gameStatus}>In Progress</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {finishedGames.length > 0 && (
            <View>
              <Text style={styles.subSectionTitle}>Finished</Text>
              {finishedGames.map(game => {
                  const isWin = game.winner_id === user?.user_id;
                  const isDraw = !game.winner_id;
                  const result = isWin ? 'Won' : isDraw ? 'Draw' : 'Lost';
                  
                  return (
                    <View key={game.game_id} style={styles.gameCard}>
                      <Text style={styles.gameText}>vs {game.player_tiger?.username === user?.username ? game.player_goat?.username : game.player_tiger?.username}</Text>
                      <Text style={[
                        styles.gameStatus, 
                        isWin ? styles.gameResultWin : isDraw ? styles.gameResultDraw : styles.gameResultLoss
                      ]}>
                        {result}
                      </Text>
                    </View>
                  );
              })}
            </View>
          )}
          {games.length === 0 && !isLoadingGames && <Text style={styles.noGamesText}>No recent games found.</Text>}
        </View>
      )}

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
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 10,
    marginTop: 10,
  },
  gameModeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
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
  },
  modeDescription: {
    fontSize: 13,
    color: '#E0E0E0',
    marginTop: 4,
  },
  modeBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
  },
  actionText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: 8,
  },
  recentGamesSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  gameCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameText: {
    color: '#FFF',
    fontSize: 16,
  },
  gameStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameResultWin: {
    color: '#4CAF50',
  },
  gameResultLoss: {
    color: '#F44336',
  },
  gameResultDraw: {
    color: '#9E9E9E',
  },
  noGamesText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  gameInfoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
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