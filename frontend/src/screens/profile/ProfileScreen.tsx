import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
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
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="person-circle-outline" size={80} color="#666" />
          <Text style={styles.emptyStateText}>No profile available</Text>
          <Text style={styles.emptyStateSubtext}>Please log in to view your profile</Text>
        </View>
      </View>
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
            <Text style={styles.statValue}>{user.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.games_played}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>
      </View>

      {/* Side Preferences */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Side Performance</Text>
        
        <View style={styles.sideStats}>
          <View style={styles.sideCard}>
            <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.sideGradient}>
              <Ionicons name="flash" size={32} color="#FFF" />
              <Text style={styles.sideTitle}>Tigers</Text>
              <Text style={styles.sideWins}>{user.tiger_wins} wins</Text>
              <Text style={styles.sideRate}>{tigerWinRate}% win rate</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.sideCard}>
            <LinearGradient colors={['#66BB6A', '#4CAF50']} style={styles.sideGradient}>
              <Ionicons name="leaf" size={32} color="#FFF" />
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
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Level {level}</Text>
            <Text style={styles.progressXP}>{experience} XP</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(experience % 1000) / 10}%` }
              ]} 
            />
          </View>
          <Text style={styles.nextLevelText}>
            {1000 - (experience % 1000)} XP to next level
          </Text>
        </View>
      </View>

      {guestMode && (
        <View style={styles.guestWarning}>
          <Ionicons name="warning" size={24} color="#FF9800" />
          <Text style={styles.guestWarningText}>
            Playing in guest mode. Create an account to save your progress!
          </Text>
        </View>
      )}
    </View>
  );

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Games</Text>
      {gameHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="game-controller-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No games played yet</Text>
          <Text style={styles.emptyStateSubtext}>Start playing to see your game history here</Text>
        </View>
      ) : (
        <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
          {gameHistory.map((game) => (
            <View key={game.id} style={styles.historyCard}>
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
  ];

  const renderAchievementsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <ScrollView style={styles.achievementsList} showsVerticalScrollIndicator={false}>
        {achievements.map((achievement) => (
          <TouchableOpacity
            key={achievement.id}
            style={[
              styles.achievementCard,
              { opacity: achievement.unlocked ? 1 : 0.6 }
            ]}
            onPress={() => onViewAchievement(achievement)}
          >
            <View style={styles.achievementIcon}>
              <Ionicons
                name={achievement.icon as any}
                size={32}
                color={achievement.unlocked ? '#FFD700' : '#666'}
              />
            </View>
            
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
              
              {achievement.progress !== undefined && achievement.maxProgress && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarSmall}>
                    <View
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
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{user.username}</Text>
            {guestMode ? (
              <Text style={styles.guestBadge}>Guest Player</Text>
            ) : (
              <Text style={styles.email}>{user.email}</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
          <Ionicons name="settings-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Stats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
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
        <Ionicons name="exit-outline" size={20} color="#FFF" />
        <Text style={styles.logoutText}>Logout</Text>
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
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
              >
                <Text style={styles.modalButtonConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF5252',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
  },
  guestBadge: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
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
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF5252',
    marginBottom: 4,
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
    width: (width - 60) / 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sideGradient: {
    padding: 16,
    alignItems: 'center',
  },
  sideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
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
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  progressXP: {
    fontSize: 16,
    color: '#FF5252',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF5252',
    borderRadius: 4,
  },
  nextLevelText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  historyList: {
    maxHeight: 400,
  },
  historyCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
    color: '#999',
    marginLeft: 8,
  },
  ratingChange: {
    alignItems: 'flex-end',
  },
  ratingChangeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  achievementsList: {
    maxHeight: 400,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  achievementIcon: {
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#999',
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBarSmall: {
    height: '100%',
    backgroundColor: '#FF5252',
    borderRadius: 4,
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: '#FF5252',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 10,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF5252',
    marginLeft: 8,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#333',
    marginRight: 8,
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FF5252',
    marginLeft: 8,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  guestWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
  },
  guestWarningText: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: 8,
  },
});

export default ProfileScreen; 