import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useGetLeaderboardQuery } from '../../services/api';
import { RootState } from '../../store';

interface LeaderboardPlayer {
  username: string;
  rating: number;
  games_played: number;
  games_won: number;
  tiger_wins: number;
  goat_wins: number;
  win_rate: number;
}

interface LeaderboardScreenProps {
  showGuestMessage?: boolean;
  leaderboardData?: LeaderboardPlayer[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  showGuestMessage = false,
  leaderboardData = [],
  loading = false,
  error = null,
  onRefresh,
}) => {
  const [sortBy, setSortBy] = useState<'rating' | 'games_won' | 'games_played'>('rating');
  const [refreshing, setRefreshing] = useState(false);
  
  const guestMode = useSelector((state: RootState) => state.auth.guestMode);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Use API hook for authenticated users
  const {
    data: apiData,
    isLoading: apiLoading,
    error: apiError,
    refetch,
  } = useGetLeaderboardQuery(
    { limit: 50, offset: 0, sort_by: sortBy },
    { skip: guestMode || showGuestMessage }
  );

  const handleRefresh = async () => {
    if (guestMode || showGuestMessage) {
      onRefresh?.();
      return;
    }
    
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSortChange = (newSort: 'rating' | 'games_won' | 'games_played') => {
    setSortBy(newSort);
  };

  // Determine data source and loading state
  const isLoadingData = showGuestMessage ? loading : apiLoading;
  const errorMessage = showGuestMessage ? error : (apiError as any)?.message;
  const players = showGuestMessage ? leaderboardData : (apiData?.data || []);

  if (guestMode || showGuestMessage) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Leaderboard</Text>
        </View>
        
        <View style={styles.guestContainer}>
          <Ionicons name="lock-closed" size={64} color="#666" />
          <Text style={styles.guestTitle}>Account Required</Text>
          <Text style={styles.guestMessage}>
            Create an account to view the leaderboard and compete with other players!
          </Text>
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => Alert.alert('Create Account', 'Please logout and create a new account to access all features.')}
          >
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Top players competing in Baghchal</Text>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'rating' && styles.activeSortButton]}
            onPress={() => handleSortChange('rating')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.activeSortButtonText]}>
              Rating
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'games_won' && styles.activeSortButton]}
            onPress={() => handleSortChange('games_won')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'games_won' && styles.activeSortButtonText]}>
              Wins
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'games_played' && styles.activeSortButton]}
            onPress={() => handleSortChange('games_played')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'games_played' && styles.activeSortButtonText]}>
              Games
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Leaderboard Content */}
      {isLoadingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Failed to load leaderboard</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : players.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>No players yet</Text>
          <Text style={styles.emptyMessage}>Be the first to join the leaderboard!</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.leaderboardList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#e74c3c']}
              tintColor="#e74c3c"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {players.map((player, index) => {
            const isCurrentUser = currentUser?.username === player.username;
            const rank = index + 1;
            
            return (
              <View
                key={`${player.username}-${index}`}
                style={[
                  styles.playerCard,
                  isCurrentUser && styles.currentUserCard,
                  rank <= 3 && styles.topThreeCard,
                ]}
              >
                {/* Rank */}
                <View style={styles.rankContainer}>
                  {rank <= 3 ? (
                    <View style={[
                      styles.medalContainer,
                      rank === 1 && styles.goldMedal,
                      rank === 2 && styles.silverMedal,
                      rank === 3 && styles.bronzeMedal,
                    ]}>
                      <Ionicons
                        name="trophy"
                        size={24}
                        color={rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32'}
                      />
                    </View>
                  ) : (
                    <Text style={styles.rankText}>#{rank}</Text>
                  )}
                </View>

                {/* Player Info */}
                <View style={styles.playerInfo}>
                  <View style={styles.playerHeader}>
                    <Text style={[styles.playerName, isCurrentUser && styles.currentUserName]}>
                      {player.username}
                      {isCurrentUser && ' (You)'}
                    </Text>
                    <Text style={styles.playerRating}>{player.rating}</Text>
                  </View>
                  
                  <View style={styles.playerStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{player.games_played}</Text>
                      <Text style={styles.statLabel}>Games</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{player.games_won}</Text>
                      <Text style={styles.statLabel}>Wins</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{player.win_rate.toFixed(1)}%</Text>
                      <Text style={styles.statLabel}>Win Rate</Text>
                    </View>
                  </View>
                  
                  <View style={styles.sideStats}>
                    <View style={styles.sideStatItem}>
                      <Ionicons name="flash" size={12} color="#FF6F00" />
                      <Text style={styles.sideStatText}>{player.tiger_wins} tiger wins</Text>
                    </View>
                    
                    <View style={styles.sideStatItem}>
                      <Ionicons name="leaf" size={12} color="#66BB6A" />
                      <Text style={styles.sideStatText}>{player.goat_wins} goat wins</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCC',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 16,
  },
  guestMessage: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createAccountButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  createAccountText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sortLabel: {
    fontSize: 16,
    color: '#CCC',
    marginRight: 15,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#333',
    marginRight: 10,
  },
  activeSortButton: {
    backgroundColor: '#e74c3c',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#CCC',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#CCC',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
  },
  leaderboardList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  currentUserCard: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  topThreeCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    marginRight: 16,
  },
  medalContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldMedal: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  silverMedal: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
  },
  bronzeMedal: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCC',
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  currentUserName: {
    color: '#e74c3c',
  },
  playerRating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  playerStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statItem: {
    marginRight: 20,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  sideStats: {
    flexDirection: 'row',
  },
  sideStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  sideStatText: {
    fontSize: 12,
    color: '#CCC',
    marginLeft: 4,
  },
});

export default LeaderboardScreen; 