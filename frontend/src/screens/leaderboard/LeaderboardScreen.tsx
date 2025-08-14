import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useGetLeaderboardQuery } from '../../services/api';
import { RootState } from '../../store';
import { User } from '../../services/types';
import { theme } from '../../theme';
import { logout } from '../../store/slices/authSlice';

const LeaderboardScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { isGuest, user: currentUser } = useSelector((state: RootState) => state.auth);
  
  const {
    data: leaderboardData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetLeaderboardQuery(undefined, {
    skip: isGuest,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isGuest) {
    return (
      <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
        <View style={styles.guestContainer}>
          <Ionicons name="trophy-outline" size={64} color="#666" />
          <Text style={styles.guestTitle}>View the Leaderboard</Text>
          <Text style={styles.guestMessage}>
            Create an account to see your rank and compete with other players.
          </Text>
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => dispatch(logout())}
          >
            <Text style={styles.createAccountText}>Register or Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const renderPlayer = ({ item, index }: { item: User; index: number }) => {
    const isCurrentUser = currentUser?.user_id === item.user_id;
    const rank = index + 1;
    
    let rankIcon = <Text style={styles.rankText}>#{rank}</Text>;
    if (rank === 1) {
      rankIcon = <Ionicons name="trophy" size={24} color="#FFD700" />;
    } else if (rank === 2) {
      rankIcon = <Ionicons name="trophy" size={24} color="#C0C0C0" />;
    } else if (rank === 3) {
      rankIcon = <Ionicons name="trophy" size={24} color="#CD7F32" />;
    }

    return (
      <View
        style={[
          styles.playerCard,
          isCurrentUser && styles.currentUserCard,
        ]}
      >
        <View style={styles.rankContainer}>
          {rankIcon}
        </View>

        <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{item.username}</Text>
            <Text style={styles.playerCountry}>Lvl {item.level} • {item.country || 'Unknown'}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
            <Text style={styles.playerRating}>{item.rating}</Text>
            <Ionicons name="star" size={16} color={theme.colors.primary} />
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
  
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Failed to load leaderboard</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
  
    const list = leaderboardData?.leaderboard || [];
    return (
      <>
        {leaderboardData?.my_rank ? (
          <View style={styles.myRankContainer}>
            <Text style={styles.myRankText}>Your Rank: #{leaderboardData.my_rank}</Text>
          </View>
        ) : null}
        <FlatList
        data={list}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessage}>The leaderboard is empty!</Text>
          </View>
        }
      />
      </>
    );
  };


  return (
    <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
      </View>
      
      {renderContent()}
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
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  guestMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  createAccountButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  createAccountText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  emptyMessage: {
      fontSize: 16,
      color: '#999'
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  currentUserCard: {
    backgroundColor: '#3c3c3c',
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowRadius: 5,
    shadowOpacity: 0.5,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  playerCountry: {
      fontSize: 14,
      color: '#999',
      marginTop: 4,
  },
  ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center'
  },
  playerRating: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 8,
  },
});

export default LeaderboardScreen; 