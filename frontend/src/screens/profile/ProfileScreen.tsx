import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  rating: number;
  games_played: number;
  games_won: number;
  tiger_wins: number;
  goat_wins: number;
  created_at: string;
  bio?: string;
  country?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface GameHistory {
  id: string;
  opponent: string;
  result: 'won' | 'lost' | 'draw';
  duration: string;
  side: 'tigers' | 'goats';
  rating_change: number;
  date: string;
}

interface ProfileScreenProps {
  user: UserProfile | null;
  guestMode: boolean;
  gameHistory: GameHistory[];
  onEditProfile: () => void;
  onLogout: () => void;
  onViewAchievement: (achievement: Achievement) => void;
}

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  guestMode,
  gameHistory,
  onEditProfile,
  onLogout,
  onViewAchievement,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'achievements'>('stats');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Show loading or guest message if no user
  if (!user) {
    return (
      <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.centerContent}>
          <View style={styles.emptyStateIconContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#666" />
          </View>
          <Text style={styles.emptyStateText}>No profile available</Text>
          <Text style={styles.emptyStateSubtext}>Please log in to view your profile</Text>
        </View>
      </LinearGradient>
    );
  }

  const winRate = user.games_played > 0 ? (user.games_won / user.games_played * 100).toFixed(1) : '0';
  const tigerWinRate = user.games_played > 0 ? (user.tiger_wins / user.games_played * 100).toFixed(1) : '0';
  const goatWinRate = user.games_played > 0 ? (user.goat_wins / user.games_played * 100).toFixed(1) : '0';

  // Mock level and experience for now
  const level = Math.floor(user.rating / 100) + 1;
  const experience = user.games_played * 50 + user.games_won * 100;

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
              <Text style={styles.statValue}>{winRate}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient colors={['#333', '#404040']} style={styles.statCardGradient}>
              <Ionicons name="trending-up" size={24} color="#FF6F00" style={styles.statIcon} />
              <Text style={styles.statValue}>{level}</Text>
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
              <Text style={styles.sideWins}>{user.tiger_wins} wins</Text>
              <Text style={styles.sideRate}>{tigerWinRate}% win rate</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.sideCard}>
            <LinearGradient colors={['#66BB6A', '#4CAF50']} style={styles.sideGradient}>
              <View style={styles.sideIconContainer}>
                <Ionicons name="leaf" size={32} color="#FFF" />
              </View>
              <Text style={styles.sideTitle}>Goats</Text>
              <Text style={styles.sideWins}>{user.goat_wins} wins</Text>
              <Text style={styles.sideRate}>{goatWinRate}% win rate</Text>
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
                <Text style={styles.progressLabel}>Level {level}</Text>
              </View>
              <Text style={styles.progressXP}>{experience} XP</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient 
                colors={['#FF6F00', '#FF8F00']}
                style={[
                  styles.progressFill, 
                  { width: `${(experience % 1000) / 10}%` }
                ]} 
              />
            </View>
            <Text style={styles.nextLevelText}>
              {1000 - (experience % 1000)} XP to next level
            </Text>
          </LinearGradient>
        </View>
      </View>

      {guestMode && (
        <View style={styles.guestWarning}>
          <LinearGradient colors={['rgba(255, 152, 0, 0.1)', 'rgba(255, 152, 0, 0.2)']} style={styles.guestWarningGradient}>
            <Ionicons name="warning" size={24} color="#FF9800" />
            <Text style={styles.guestWarningText}>
              Playing in guest mode. Create an account to save your progress!
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Games</Text>
      {gameHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIconContainer}>
            <Ionicons name="game-controller-outline" size={64} color="#666" />
          </View>
          <Text style={styles.emptyStateText}>No games played yet</Text>
          <Text style={styles.emptyStateSubtext}>Start playing to see your game history here</Text>
        </View>
      ) : (
        <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
          {gameHistory.map((game) => (
            <View key={game.id} style={styles.historyCard}>
              <LinearGradient colors={['#333', '#404040']} style={styles.historyCardGradient}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyOpponent}>
                    <Text style={styles.opponentName}>vs {game.opponent}</Text>
                    <Text style={styles.gameDate}>{new Date(game.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={[
                    styles.resultBadge,
                    { backgroundColor: game.result === 'won' ? '#4CAF50' : game.result === 'lost' ? '#F44336' : '#FF9800' }
                  ]}>
                    <Text style={styles.resultText}>{game.result.toUpperCase()}</Text>
                  </View>
                </View>
                
                <View style={styles.historyDetails}>
                  <View style={styles.historyInfo}>
                    <View style={styles.historyItem}>
                      <Ionicons 
                        name={game.side === 'tigers' ? 'flash' : 'leaf'} 
                        size={16} 
                        color={game.side === 'tigers' ? '#FF6F00' : '#66BB6A'} 
                      />
                      <Text style={styles.historyItemText}>
                        Played as {game.side}
                      </Text>
                    </View>
                    
                    <View style={styles.historyItem}>
                      <Ionicons name="time" size={16} color="#999" />
                      <Text style={styles.historyItemText}>
                        {game.duration}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.ratingChange}>
                    <Text style={[
                      styles.ratingChangeText,
                      { color: game.rating_change >= 0 ? '#4CAF50' : '#F44336' }
                    ]}>
                      {game.rating_change >= 0 ? '+' : ''}{game.rating_change}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Mock achievements for now
  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'First Win',
      description: 'Win your first game',
      icon: 'trophy',
      unlocked: user.games_won > 0,
    },
    {
      id: '2',
      name: 'Tiger Master',
      description: 'Win 10 games as Tigers',
      icon: 'flash',
      unlocked: user.tiger_wins >= 10,
      progress: user.tiger_wins,
      maxProgress: 10,
    },
    {
      id: '3',
      name: 'Goat Guardian',
      description: 'Win 10 games as Goats',
      icon: 'leaf',
      unlocked: user.goat_wins >= 10,
      progress: user.goat_wins,
      maxProgress: 10,
    },
    {
      id: '4',
      name: 'Rising Star',
      description: 'Reach rating of 1500',
      icon: 'star',
      unlocked: user.rating >= 1500,
      progress: user.rating,
      maxProgress: 1500,
    },
    {
      id: '5',
      name: 'Veteran Player',
      description: 'Play 50 games',
      icon: 'medal',
      unlocked: user.games_played >= 50,
      progress: user.games_played,
      maxProgress: 50,
    },
  ];

  const renderAchievementsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <ScrollView style={styles.achievementsList} showsVerticalScrollIndicator={false}>
        {achievements.map((achievement) => (
          <TouchableOpacity
            key={achievement.id}
            style={styles.achievementCard}
            onPress={() => onViewAchievement(achievement)}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={achievement.unlocked ? ['#333', '#404040'] : ['#1a1a1a', '#252525']} 
              style={[
                styles.achievementCardGradient,
                { opacity: achievement.unlocked ? 1 : 0.6 }
              ]}
            >
              <View style={[
                styles.achievementIcon,
                { backgroundColor: achievement.unlocked ? '#FF6F00' : '#666' }
              ]}>
                <Ionicons
                  name={achievement.icon as any}
                  size={24}
                  color="#FFF"
                />
              </View>
              
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                
                {achievement.progress !== undefined && achievement.maxProgress && (
                  <View style={styles.achievementProgressContainer}>
                    <View style={styles.progressBarSmall}>
                      <LinearGradient
                        colors={['#FF6F00', '#FF8F00']}
                        style={[
                          styles.progressFillSmall,
                          { width: `${(achievement.progress / achievement.maxProgress) * 100}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {achievement.progress}/{achievement.maxProgress}
                    </Text>
                  </View>
                )}
              </View>
              
              {achievement.unlocked && (
                <View style={styles.achievementCheckmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient colors={['#333', '#404040']} style={styles.headerGradient}>
          <View style={styles.profileInfo}>
            <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.avatar}>
              <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user.username}</Text>
              {guestMode ? (
                <View style={styles.guestBadgeContainer}>
                  <Text style={styles.guestBadge}>Guest Player</Text>
                </View>
              ) : (
                <Text style={styles.email}>{user.email}</Text>
              )}
              <View style={styles.joinedContainer}>
                <Ionicons name="calendar" size={14} color="#999" />
                <Text style={styles.joinedText}>
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
            <LinearGradient colors={['#444', '#555']} style={styles.editButtonGradient}>
              <Ionicons name="settings-outline" size={20} color="#FF6F00" />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons 
            name="analytics" 
            size={20} 
            color={activeTab === 'stats' ? '#FF6F00' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Stats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time" 
            size={20} 
            color={activeTab === 'history' ? '#FF6F00' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Ionicons 
            name="medal" 
            size={20} 
            color={activeTab === 'achievements' ? '#FF6F00' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
            Achievements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'achievements' && renderAchievementsTab()}
      </ScrollView>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutModal(true)}>
        <LinearGradient colors={['rgba(244, 67, 54, 0.1)', 'rgba(244, 67, 54, 0.2)']} style={styles.logoutButtonGradient}>
          <Ionicons name="exit-outline" size={20} color="#F44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#333', '#404040']} style={styles.modalGradient}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="warning" size={32} color="#FF9800" />
              </View>
              <Text style={styles.modalTitle}>Logout</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to logout?
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <LinearGradient colors={['#555', '#666']} style={styles.modalButtonGradient}>
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalButtonConfirm}
                  onPress={() => {
                    setShowLogoutModal(false);
                    onLogout();
                  }}
                >
                  <LinearGradient colors={['#F44336', '#D32F2F']} style={styles.modalButtonGradient}>
                    <Text style={styles.modalButtonConfirmText}>Logout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateIconContainer: {
    backgroundColor: '#333',
    borderRadius: 50,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 0,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerGradient: {
    padding: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 6,
  },
  guestBadgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  guestBadge: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinedText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  editButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  editButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#222',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 6,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FF6F00',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#CCC',
    textAlign: 'center',
  },
  sideStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sideCard: {
    width: (width - 60) / 2,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sideGradient: {
    padding: 16,
    alignItems: 'center',
  },
  sideIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  sideWins: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  sideRate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressCardGradient: {
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
  },
  progressXP: {
    fontSize: 16,
    color: '#FF6F00',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextLevelText: {
    fontSize: 12,
    color: '#CCC',
    textAlign: 'center',
  },
  historyList: {
    maxHeight: 400,
  },
  historyCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  historyCardGradient: {
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyOpponent: {
    flex: 1,
  },
  opponentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  gameDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyItemText: {
    fontSize: 14,
    color: '#CCC',
    marginLeft: 8,
  },
  ratingChange: {
    alignItems: 'flex-end',
  },
  ratingChangeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementsList: {
    maxHeight: 400,
  },
  achievementCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  achievementCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#CCC',
    marginBottom: 8,
  },
  achievementProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarSmall: {
    flex: 1,
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#999',
    minWidth: 40,
  },
  achievementCheckmark: {
    marginLeft: 8,
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
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  logoutText: {
    fontSize: 16,
    color: '#F44336',
    marginLeft: 8,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  modalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonConfirm: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  guestWarning: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  guestWarningGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  guestWarningText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 12,
    flex: 1,
  },
});

export default ProfileScreen; 