import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../store';
import { setShowGameRules, setShowSettings } from '../../store/slices/uiSlice';
import { MainStackParamList, MainTabParamList } from '../../navigation/MainNavigator';
import { theme as staticTheme, useAppTheme } from '../../theme';
import GameButton from '../../components/game/GameButton';
import GameCard from '../../components/game/GameCard';
import RulesModal from '../../components/game/RulesModal';

const { width } = Dimensions.get('window');

// Define navigation prop type
type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<MainStackParamList>
>;

// Define static theme for styles usage
const theme = staticTheme;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector((state: RootState) => state.auth.user);
  const localGameHistory = useSelector((state: RootState) => state.game.localGameHistory);
  
  const currentTheme = useAppTheme(); // Dynamic theme (renamed to avoid conflict with static theme)

  // Calculate stats
  const { totalGames, wins, winRate } = useMemo(() => {
    const games = localGameHistory || [];
    const total = games.length;
    const won = games.filter(g => g.result === 'win').length;
    const rate = total > 0 ? Math.round((won / total) * 100) : 0;
    
    return {
      totalGames: total,
      wins: won,
      winRate: rate
    };
  }, [localGameHistory]);

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const handlePlaySinglePlayer = () => {
    navigation.navigate('SinglePlayerSetup');
  };

  const handlePlayLocalPVP = () => {
    navigation.navigate('MultiplayerSetup');
  };

  const handleShowGameRules = () => {
    dispatch(setShowGameRules(true));
  };

  const handleViewSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar barStyle={currentTheme.isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={[currentTheme.colors.bgGradStart, currentTheme.colors.bgGradEnd]}
        style={styles.background}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: currentTheme.colors.onSurfaceVariant }]}>WELCOME BACK</Text>
            <Text style={[styles.username, { color: currentTheme.colors.text }]}>{user?.username || 'Hunter'}</Text>
          </View>
          <GameButton 
            onPress={handleViewProfile}
            title=""
            icon={<Ionicons name="person" size={24} color={currentTheme.colors.onPrimary} />}
            circular
          />
        </View>

        {/* Stats Section */}
        <View style={[styles.statsContainer, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }]}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: currentTheme.colors.tigerColor + '20' }]}>
              <Ionicons name="game-controller" size={20} color={currentTheme.colors.tigerColor} />
            </View>
            <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{totalGames}</Text>
            <Text style={[styles.statLabel, { color: currentTheme.colors.onSurfaceVariant }]}>Games</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: currentTheme.colors.border }]} />
          
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: currentTheme.colors.success + '20' }]}>
              <Ionicons name="trophy" size={20} color={currentTheme.colors.success} />
            </View>
            <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{wins}</Text>
            <Text style={[styles.statLabel, { color: currentTheme.colors.onSurfaceVariant }]}>Wins</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: currentTheme.colors.border }]} />
          
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: currentTheme.colors.primary + '20' }]}>
              <Ionicons name="stats-chart" size={20} color={currentTheme.colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>{winRate}%</Text>
            <Text style={[styles.statLabel, { color: currentTheme.colors.onSurfaceVariant }]}>Win Rate</Text>
          </View>
        </View>


        {/* Main Actions */}
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.onSurfaceVariant }]}>PLAY NOW</Text>
        
        <GameButton
          title="Single Player"
          variant="primary"
          size="large"
          onPress={handlePlaySinglePlayer}
          icon={<Ionicons name="game-controller" size={28} color="#FFF" />}
          style={styles.mainButton}
        />
        
        <GameButton
          title="Local Multiplayer"
          variant="success"
          size="large"
          onPress={handlePlayLocalPVP}
          icon={<Ionicons name="people" size={28} color="#FFF" />}
          style={styles.mainButton}
        />

        {/* Quick Actions Grid */}
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.onSurfaceVariant }]}>ACTIONS</Text>
        <View style={styles.actionGrid}>
          <GameButton
            title="Rules"
            variant="secondary"
            size="medium"
            onPress={handleShowGameRules}
            style={styles.gridButton}
            icon={<Ionicons name="book" size={20} color={currentTheme.colors.text} />}
          />
           <GameButton
            title="Settings"
            variant="secondary"
            size="medium"
            onPress={handleViewSettings}
            style={styles.gridButton}
            icon={<Ionicons name="settings" size={20} color={currentTheme.colors.text} />}
          />
        </View>

        {/* Tip Section */}
        <View style={[styles.tipCard, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }]}>
          <View style={[styles.tipIconBox, { backgroundColor: currentTheme.colors.primary + '15' }]}>
            <Ionicons name="bulb" size={24} color={currentTheme.colors.primary} />
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: currentTheme.colors.text }]}>Pro Tip</Text>
            <Text style={[styles.tipText, { color: currentTheme.colors.onSurfaceVariant }]}>
              With perfect play, Goats can always win! Focus on blocking tiger movements.
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Rules Modal */}
      <RulesModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.fonts.labelSmall.fontSize,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  username: {
    color: theme.colors.text,
    fontSize: theme.fonts.headlineMedium.fontSize,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: theme.spacing.xl,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 50,
    marginHorizontal: 8,
  },
  sectionTitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.fonts.labelMedium.fontSize,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  mainButton: {
    marginBottom: theme.spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  gridButton: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
  },
  // Tip Card
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  tipIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default HomeScreen;