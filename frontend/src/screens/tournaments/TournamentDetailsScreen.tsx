import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import {
  useGetTournamentByIdQuery,
  useGetTournamentEntriesQuery,
  useGetTournamentMatchesQuery,
  useCreateTournamentEntryMutation,
} from '../../services/api';
import { theme } from '../../theme';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { RootState } from '../../store';
import { TournamentEntry, TournamentMatch } from '../../services/types';

type DetailsRouteProp = RouteProp<MainStackParamList, 'TournamentDetails'>;

const TournamentDetailsScreen = () => {
  const route = useRoute<DetailsRouteProp>();
  const { tournamentId } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: tournament, isLoading: isLoadingTournament, refetch: refetchTournament } = useGetTournamentByIdQuery(tournamentId);
  const { data: entries, isLoading: isLoadingEntries, refetch: refetchEntries } = useGetTournamentEntriesQuery(tournamentId);
  const { data: matches, isLoading: isLoadingMatches, refetch: refetchMatches } = useGetTournamentMatchesQuery(tournamentId);
  const [createEntry, { isLoading: isJoining }] = useCreateTournamentEntryMutation();

  const isUserEntered = useMemo(() => {
    return entries?.some((entry: TournamentEntry) => entry.user_id === user?.user_id);
  }, [entries, user]);

  const onRefresh = useCallback(() => {
    refetchTournament();
    refetchEntries();
    refetchMatches();
  }, [refetchTournament, refetchEntries, refetchMatches]);

  const handleJoinTournament = async () => {
    if (!user) {
      Alert.alert("Authentication Error", "You must be logged in to join.");
      return;
    }
    if (isUserEntered) {
      Alert.alert("Already Joined", "You are already part of this tournament.");
      return;
    }
    try {
      await createEntry({ tournId: tournamentId, data: { tournament_id: tournamentId, user_id: user.user_id } }).unwrap();
      Alert.alert("Success", "You have joined the tournament!");
    } catch (error) {
      Alert.alert("Error", "Could not join the tournament.");
    }
  };
  
  const renderSection = (title: string, children: React.ReactNode) => (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </View>
  );
  
  const renderParticipant = ({item}: {item: TournamentEntry}) => (
      <View style={styles.participantCard}>
        <Text style={styles.participantName}>{item.user.username}</Text>
        <Text style={styles.participantRating}>{item.user.rating} Rating</Text>
      </View>
  );

  const renderMatch = ({item}: {item: TournamentMatch}) => (
    <View style={styles.matchCard}>
        <Text style={styles.roundTitle}>Round {item.round_number}</Text>
        <View style={styles.matchup}>
            <Text style={styles.matchPlayer}>{item.player_1.username || 'TBD'}</Text>
            <Text style={styles.vsText}>vs</Text>
            <Text style={styles.matchPlayer}>{item.player_2.username || 'TBD'}</Text>
        </View>
        <Text style={styles.matchStatus}>
            {item.game ? `Status: ${item.game.status}`: 'Not Started'}
        </Text>
    </View>
  );

  if (isLoadingTournament || isLoadingEntries || isLoadingMatches) {
    return <ActivityIndicator style={styles.centered} size="large" color={theme.colors.primary} />;
  }

  if (!tournament) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Tournament not found.</Text>
      </View>
    );
  }

  const canJoin = tournament.status === 'PENDING' && !isUserEntered;

  return (
    <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
            <Text style={styles.title}>{tournament.name}</Text>
            <Text style={styles.description}>{tournament.description}</Text>
            <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color="#999"/>
                <Text style={styles.detailText}>
                    {new Date(tournament.start_date).toDateString()} - {new Date(tournament.end_date).toDateString()}
                </Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="trophy-outline" size={16} color="#999"/>
                <Text style={styles.detailText}>
                    {entries?.length || 0} / {tournament.max_participants} Participants
                </Text>
            </View>
        </View>
        
        {canJoin && (
            <TouchableOpacity 
                style={[styles.joinButton, isJoining && {opacity: 0.6}]}
                onPress={handleJoinTournament}
                disabled={isJoining}
            >
                {isJoining 
                    ? <ActivityIndicator color="white" /> 
                    : <Text style={styles.joinButtonText}>Join Tournament</Text>}
            </TouchableOpacity>
        )}

        {renderSection('Participants', entries && entries.length > 0 ? (
            entries.map(p => renderParticipant({item: p}))
        ) : <Text style={styles.emptySectionText}>No one has joined yet.</Text>)}

        {renderSection('Matches', matches && matches.length > 0 ? (
            matches.map(m => renderMatch({item: m}))
        ): <Text style={styles.emptySectionText}>Matches have not been generated.</Text>)}

      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16,
    borderRadius: 12
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  description: {
      fontSize: 16,
      color: '#b0b0b0',
      marginBottom: 16
  },
  detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
  },
  detailText: {
      color: '#999',
      marginLeft: 8,
  },
  joinButton: {
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 24,
  },
  joinButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold'
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  participantCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#2C2C2C',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
  },
  participantName: {
      color: 'white',
      fontSize: 16
  },
  participantRating: {
      color: '#999',
      fontSize: 14
  },
  matchCard: {
      backgroundColor: '#2C2C2C',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
  },
  roundTitle: {
      color: theme.colors.primary,
      fontWeight: 'bold',
      marginBottom: 8,
  },
  matchup: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
  },
  matchPlayer: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center'
  },
  vsText: {
      color: '#999',
      marginHorizontal: 10
  },
  matchStatus: {
      color: '#999',
      textAlign: 'center',
      fontSize: 12
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
  },
  emptySectionText: {
      color: '#999',
      textAlign: 'center',
      paddingVertical: 20
  }
});

export default TournamentDetailsScreen; 