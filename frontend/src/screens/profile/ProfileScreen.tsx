import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState } from '../../store';
import { updateLocalUser } from '../../store/slices/authSlice';
import { MainStackParamList } from '../../navigation/MainNavigator';
import GameButton from '../../components/game/GameButton';
import { useAppTheme } from '../../theme';
import { User } from '../../store/slices/authSlice';
import { useAlert } from '../../contexts/AlertContext';

const { width } = Dimensions.get('window');

type ProfileNavProp = StackNavigationProp<MainStackParamList>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  
  const user = useSelector((state: RootState) => state.auth.user) as User;
  const localGameHistory = useSelector((state: RootState) => state.game.localGameHistory);
  
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.username || '');

  React.useEffect(() => {
    if (user?.username) {
      setEditName(user.username);
    }
  }, [user]);

  const stats = useMemo(() => {
    const history = localGameHistory || [];
    const aiGames = history.filter(g => g.mode === 'ai');
    const localGames = history.filter(g => g.mode === 'local');
    
    const aiWins = aiGames.filter(g => g.result === 'win').length;
    
    return {
      totalGames: history.length,
      aiGames: aiGames.length,
      aiWins,
      aiWinRate: aiGames.length > 0 ? Math.round((aiWins / aiGames.length) * 100) : 0,
      localGames: localGames.length,
    };
  }, [localGameHistory]);

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      showAlert({
        title: 'Error',
        message: 'Username cannot be empty',
        type: 'error',
      });
      return;
    }
    
    dispatch(updateLocalUser({ username: editName.trim() }));
    setIsEditing(false);
    showAlert({
      title: 'Success',
      message: 'Profile updated!',
      type: 'success',
    });
  };

  const handlePlayGame = () => {
    navigation.navigate('SinglePlayerSetup');
  };

  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.statIconBox, { backgroundColor: theme.colors.tigerColor + '20' }]}>
            <Ionicons name="game-controller" size={20} color={theme.colors.tigerColor} />
          </View>
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.totalGames}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Total Games</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.statIconBox, { backgroundColor: theme.colors.success + '20' }]}>
            <Ionicons name="trophy" size={20} color={theme.colors.success} />
          </View>
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.aiWins}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>AI Wins</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.statIconBox, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="stats-chart" size={20} color={theme.colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.aiWinRate}%</Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Win Rate</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.statIconBox, { backgroundColor: theme.colors.goatColor + '20' }]}>
            <Ionicons name="people" size={20} color={theme.colors.goatColor} />
          </View>
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.localGames}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Local Games</Text>
        </View>
      </View>

      {/* Level Progress */}
      <View style={[styles.levelCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.levelHeader}>
          <View style={styles.levelInfo}>
            <View style={[styles.levelIconBox, { backgroundColor: theme.colors.tigerColor + '20' }]}>
              <Ionicons name="star" size={20} color={theme.colors.tigerColor} />
            </View>
            <View>
              <Text style={[styles.levelTitle, { color: theme.colors.text }]}>Level {user?.level || 1}</Text>
              <Text style={[styles.levelSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {100 - ((user?.xp || 0) % 100)} XP to next level
              </Text>
            </View>
          </View>
          <Text style={[styles.xpBadge, { color: theme.colors.tigerColor }]}>{user?.xp || 0} XP</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${((user?.xp || 0) % 100)}%`,
                backgroundColor: theme.colors.tigerColor 
              }
            ]} 
          />
        </View>
      </View>

      {stats.totalGames === 0 && (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="game-controller-outline" size={32} color={theme.colors.onSurfaceVariant} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No games yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Play your first game to start tracking stats!
          </Text>
          <GameButton 
            title="Play Now" 
            onPress={handlePlayGame}
            style={styles.playButton}
          />
        </View>
      )}
    </View>
  );

  const renderHistoryTab = () => {
    const history = localGameHistory || [];
    return (
    <View style={styles.tabContent}>
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="time-outline" size={32} color={theme.colors.onSurfaceVariant} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No game history</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Your completed games will appear here
          </Text>
        </View>
      ) : (
        history.slice(0, 10).map((game, index) => (
          <View 
            key={game.gameId + index} 
            style={[styles.historyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <View style={[styles.historyIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Ionicons 
                name={game.mode === 'ai' ? 'hardware-chip-outline' : 'people-outline'} 
                size={20} 
                color={theme.colors.primary} 
              />
            </View>
            <View style={styles.historyInfo}>
              <Text style={[styles.historyMode, { color: theme.colors.text }]}>
                {game.mode === 'ai' ? `vs AI (${game.aiDifficulty})` : 'Local PVP'}
              </Text>
              <Text style={[styles.historyDate, { color: theme.colors.onSurfaceVariant }]}>
                {new Date(game.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={[
              styles.resultBadge,
              game.result === 'win' 
                ? { backgroundColor: theme.colors.success + '20' } 
                : game.result === 'loss' 
                  ? { backgroundColor: theme.colors.error + '20' } 
                  : { backgroundColor: theme.colors.surfaceVariant }
            ]}>
              <Text style={[
                styles.resultText,
                game.result === 'win' 
                  ? { color: theme.colors.success } 
                  : game.result === 'loss' 
                    ? { color: theme.colors.error } 
                    : { color: theme.colors.onSurfaceVariant }
              ]}>
                {game.result.toUpperCase()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }]}>
            <Ionicons name="person" size={40} color={theme.colors.onSurfaceVariant} />
          </View>
          
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter username"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                autoFocus
              />
              <View style={styles.editActions}>
                <GameButton 
                  title="Save" 
                  size="small" 
                  variant="success"
                  onPress={handleSaveProfile} 
                  style={styles.actionBtn}
                />
                <GameButton 
                  title="Cancel" 
                  size="small" 
                  variant="secondary"
                  onPress={() => {
                    setEditName(user?.username || '');
                    setIsEditing(false);
                  }} 
                  style={styles.actionBtn}
                />
              </View>
            </View>
          ) : (
            <View style={styles.usernameRow}>
              <Text style={[styles.username, { color: theme.colors.text }]}>{user?.username || 'Player'}</Text>
              <TouchableOpacity 
                onPress={() => setIsEditing(true)} 
                style={[styles.editButton, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Ionicons name="pencil" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          <Text style={[styles.userSubtitle, { color: theme.colors.onSurfaceVariant }]}>Offline Player</Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab, 
              activeTab === 'stats' && { backgroundColor: theme.colors.primary + '15' }
            ]}
            onPress={() => setActiveTab('stats')}
          >
            <Ionicons 
              name="stats-chart" 
              size={18} 
              color={activeTab === 'stats' ? theme.colors.primary : theme.colors.onSurfaceVariant} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'stats' ? theme.colors.primary : theme.colors.onSurfaceVariant }
            ]}>
              Stats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab, 
              activeTab === 'history' && { backgroundColor: theme.colors.primary + '15' }
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Ionicons 
              name="time" 
              size={18} 
              color={activeTab === 'history' ? theme.colors.primary : theme.colors.onSurfaceVariant} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'history' ? theme.colors.primary : theme.colors.onSurfaceVariant }
            ]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'stats' ? renderStatsTab() : renderHistoryTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  editContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    minWidth: 90,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  levelCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  xpBadge: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  playButton: {
    marginTop: 20,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyMode: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;