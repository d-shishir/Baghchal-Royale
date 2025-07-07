import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { useGetTournamentsQuery } from '../../services/api';
import { Tournament } from '../../services/types';
import { theme } from '../../theme';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { RootState } from '../../store';

type TournamentsNavProp = StackNavigationProp<MainStackParamList, 'MainTabs'>;

const TournamentsScreen = () => {
  const navigation = useNavigation<TournamentsNavProp>();
  const { data: tournaments, isLoading, isFetching, error, refetch } = useGetTournamentsQuery();
  const { user } = useSelector((state: RootState) => state.auth);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCreateTournament = () => {
    // Navigate to a creation screen, for now an alert
    alert("Admins can create tournaments here.");
  };

  const renderTournament = ({ item }: { item: Tournament }) => (
    <TouchableOpacity onPress={() => navigation.navigate('TournamentDetails', { tournamentId: item.tournament_id })}>
      <LinearGradient
        colors={['#2a2a2a', '#1e1e1e']}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={[styles.statusBadge, {backgroundColor: item.status === 'IN_PROGRESS' ? theme.colors.success : theme.colors.primary}]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="people-outline" size={16} color="#999" />
            <Text style={styles.footerText}>{item.max_participants} players</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={16} color="#999" />
            <Text style={styles.footerText}>{new Date(item.start_date).toLocaleDateString()}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator style={styles.centered} size="large" color={theme.colors.primary} />;
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load tournaments.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <FlatList
        data={tournaments || []}
        renderItem={renderTournament}
        keyExtractor={(item) => item.tournament_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No tournaments found.</Text>
          </View>
        }
      />
    );
  };

  return (
    <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tournaments</Text>
      </View>
      {renderContent()}
      {user?.role === 'ADMIN' && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateTournament}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default TournamentsScreen; 