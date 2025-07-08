import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { useGetGamesQuery, useGetMeQuery } from '../../services/api';
import { MainStackParamList } from '../../navigation/MainNavigator';
import LoadingScreen from '../../components/LoadingScreen';
import EditProfileModal from '../../components/EditProfileModal';
import { Game } from '../../services/types';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'achievements'>('stats');
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  
  const { data: user, isLoading: isUserLoading } = useGetMeQuery();
  const isGuest = useSelector((state: RootState) => state.auth.isGuest);
  const { data: gameHistory, isLoading: isLoadingGames } = useGetGamesQuery(undefined, {
      skip: isGuest, // Don't fetch for guests
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => dispatch(logout()) },
      ],
      { cancelable: false }
    );
  };
  
  const handleEditProfile = () => {
      setEditModalVisible(true);
  };

  const handleFeedback = () => {
      navigation.navigate('Feedback');
  }
  
  const handleViewAchievement = (achievement: any) => {
      Alert.alert('Achievement', achievement.name);
  };

  if (isGuest) {
      return (
        <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
            <View style={styles.centerContent}>
                <Text style={styles.emptyStateText}>Create an account to view your profile and track your stats!</Text>
                <TouchableOpacity style={styles.registerButton} onPress={() => dispatch(logout())}>
                    <Text style={styles.registerButtonText}>Register or Login</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
      )
  }
  
  if (isUserLoading || isLoadingGames || !user) {
      return <LoadingScreen />;
  }
  
  const totalXpForLevel = (level: number) => {
    if (level <= 1) return 0;
    return Math.floor(100 * Math.pow(level - 1, 1.5));
  }

  const xpForCurrentLevel = totalXpForLevel(user.level);
  const xpForNextLevel = totalXpForLevel(user.level + 1);
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const xpProgressInCurrentLevel = user.xp - xpForCurrentLevel;
  const xpProgress = xpNeededForNextLevel > 0 ? (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100 : 0;

  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      {/* Overall Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Overall Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient colors={['#333', '#404040']} style={styles.statCardGradient}>
              <Ionicons name="star" size={24} color="#FF6F00" style={styles.statIcon} />
              <Text style={styles.statValue}>{user.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient colors={['#333', '#404040']} style={styles.statCardGradient}>
              <Ionicons name="game-controller" size={24} color="#FF6F00" style={styles.statIcon} />
              <Text style={styles.statValue}>{user.games_played}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient colors={['#333', '#404040']} style={styles.statCardGradient}>
              <Ionicons name="trophy" size={24} color="#FF6F00" style={styles.statIcon} />
              <Text style={styles.statValue}>{user.win_rate}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient colors={['#333', '#404040']} style={styles.statCardGradient}>
              <Ionicons name="trending-up" size={24} color="#FF6F00" style={styles.statIcon} />
              <Text style={styles.statValue}>{user.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Side Preferences */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Side Performance</Text>
        
        <View style={styles.sideStats}>
          <View style={styles.sideCard}>
            <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.sideGradient}>
              <View style={styles.sideIconContainer}>
                <Ionicons name="flash" size={32} color="#FFF" />
              </View>
              <Text style={styles.sideTitle}>Tigers</Text>
              <Text style={styles.sideWins}>{user.wins} wins</Text>
              <Text style={styles.sideRate}>{user.win_rate}% win rate</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.sideCard}>
            <LinearGradient colors={['#66BB6A', '#4CAF50']} style={styles.sideGradient}>
              <View style={styles.sideIconContainer}>
                <Ionicons name="leaf" size={32} color="#FFF" />
              </View>
              <Text style={styles.sideTitle}>Goats</Text>
              <Text style={styles.sideWins}>{user.wins} wins</Text>
              <Text style={styles.sideRate}>{user.win_rate}% win rate</Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Experience Progress */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.progressCard}>
          <LinearGradient colors={['#333', '#404040']} style={styles.progressCardGradient}>
            <View style={styles.progressHeader}>
              <View style={styles.levelContainer}>
                <Ionicons name="cellular" size={20} color="#FF6F00" />
                <Text style={styles.progressLabel}>Level {user.level}</Text>
              </View>
              <Text style={styles.progressXP}>{user.xp} XP</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient 
                colors={['#FF6F00', '#FF8F00']}
                style={[
                  styles.progressFill, 
                  { width: `${xpProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.nextLevelText}>
              {xpForNextLevel - user.xp} XP to next level
            </Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Games</Text>
      {!gameHistory || gameHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIconContainer}>
            <Ionicons name="game-controller-outline" size={64} color="#666" />
          </View>
          <Text style={styles.emptyStateText}>No games played yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
          {gameHistory.map((game: Game) => {
              const isWin = game.winner_id === user.user_id;
              const isTiger = game.player1_id === user.user_id;
              const opponent = isTiger ? game.player2 : game.player1;

              return (
                <View key={game.game_id} style={styles.historyCard}>
                  <LinearGradient colors={['#333', '#404040']} style={styles.historyCardGradient}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyOpponent}>
                        <Text style={styles.opponentName}>vs {opponent?.username || 'Unknown'}</Text>
                        <Text style={styles.gameDate}>{new Date(game.created_at).toLocaleDateString()}</Text>
                      </View>
                      <View style={[
                        styles.resultBadge,
                        { backgroundColor: isWin ? '#4CAF50' : '#F44336' }
                      ]}>
                        <Text style={styles.resultText}>{isWin ? 'WON' : 'LOST'}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.historyDetails}>
                      <View style={styles.historyInfo}>
                        <View style={styles.historyItem}>
                          <Ionicons 
                            name={isTiger ? 'flash' : 'leaf'} 
                            size={16} 
                            color={isTiger ? '#FF6F00' : '#66BB6A'} 
                          />
                          <Text style={styles.historyItemText}>
                            Played as {isTiger ? 'Tigers' : 'Goats'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderAchievementsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      {user.achievements.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIconContainer}>
            <Ionicons name="trophy-outline" size={64} color="#666" />
          </View>
          <Text style={styles.emptyStateText}>No achievements unlocked yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.achievementList} showsVerticalScrollIndicator={false}>
          {user.achievements.map((achievement, index) => (
            <TouchableOpacity key={index} onPress={() => handleViewAchievement({ name: achievement })}>
              <LinearGradient colors={['#333', '#404040']} style={styles.achievementCard}>
                <Ionicons name="trophy" size={24} color="#FFD700" style={styles.achievementIcon} />
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{achievement}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#FF6F00" />
          </View>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userJoined}>Joined: {new Date(user.created_at).toLocaleDateString()}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
                <Ionicons name="create-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleFeedback}>
                <Ionicons name="help-buoy-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FF6F00" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tab Navigator */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Ionicons name="stats-chart" size={20} color={activeTab === 'stats' ? '#FF6F00' : '#999'} />
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Ionicons name="time" size={20} color={activeTab === 'history' ? '#FF6F00' : '#999'} />
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Ionicons name="trophy" size={20} color={activeTab === 'achievements' ? '#FF6F00' : '#999'} />
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>Achievements</Text>
          </TouchableOpacity>
        </View>
        
        {/* Render active tab content */}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'achievements' && renderAchievementsTab()}
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={() => setEditModalVisible(false)}
        user={user}
      />
    </LinearGradient>
  );
};

// Add StyleSheet, it's large and I'll keep it similar to the original for now
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
    },
    avatarContainer: {
        marginBottom: 10,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    userEmail: {
        fontSize: 16,
        color: '#999',
        marginBottom: 10,
    },
    userJoined: {
        fontSize: 14,
        color: '#777',
    },
    headerActions: {
        flexDirection: 'row',
        marginTop: 20,
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: '#333',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginHorizontal: 10,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFF',
        marginLeft: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#1f1f1f',
        paddingVertical: 10,
    },
    tab: {
        alignItems: 'center',
        padding: 10,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#FF6F00',
    },
    tabText: {
        color: '#999',
        marginTop: 5,
    },
    activeTabText: {
        color: '#FF6F00',
    },
    tabContent: {
        padding: 20,
    },
    statsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 15,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        marginBottom: 15,
        borderRadius: 16
    },
    statCardGradient: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    statIcon: {
        marginBottom: 10,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    statLabel: {
        fontSize: 14,
        color: '#999',
    },
    sideStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sideCard: {
        width: '48%',
        borderRadius: 16,
    },
    sideGradient: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    sideIconContainer: {
        marginBottom: 10,
    },
    sideTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    sideWins: {
        fontSize: 16,
        color: '#FFF',
        marginVertical: 5,
    },
    sideRate: {
        fontSize: 14,
        color: '#DDD',
    },
    progressCard: {
        borderRadius: 16,
    },
    progressCardGradient: {
        padding: 20,
        borderRadius: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    levelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginLeft: 10,
    },
    progressXP: {
        fontSize: 16,
        color: '#999',
    },
    progressBar: {
        height: 10,
        backgroundColor: '#555',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 5,
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    nextLevelText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'right',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyStateIconContainer: {
        backgroundColor: '#2a2a2a',
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 10,
        textAlign: 'center'
    },
    historyList: {
        // styles for the list container if needed
    },
    historyCard: {
        borderRadius: 16,
        marginBottom: 15,
    },
    historyCardGradient: {
        padding: 20,
        borderRadius: 16,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    historyOpponent: {
        // styles
    },
    opponentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    gameDate: {
        fontSize: 12,
        color: '#888',
    },
    resultBadge: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    resultText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    historyDetails: {
        // styles
    },
    historyInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyItemText: {
        color: '#DDD',
        marginLeft: 8,
    },
    registerButton: {
        marginTop: 20,
        backgroundColor: '#FF6F00',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25
    },
    registerButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileActions: {
        flexDirection: 'row',
    },
    xpContainer: {
        marginTop: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    xpText: {
        color: '#FF6F00',
        fontWeight: 'bold',
    },
    achievementList: {
        // styles for the list container if needed
    },
    achievementCard: {
        borderRadius: 16,
        marginBottom: 15,
    },
    achievementIcon: {
        marginBottom: 10,
    },
    achievementInfo: {
        // styles
    },
    achievementName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
});

export default ProfileScreen; 