import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainStackParamList } from '../../navigation/MainNavigator';
import { RootState } from '../../store';
import { startLocalGame } from '../../store/slices/gameSlice';
import { Game, Player } from '../../services/types';
import { GameStatus } from '../../game-logic/baghchal';
import { initialGameState } from '../../game-logic/initialState';
import { useAppTheme } from '../../theme';

type NavProps = StackNavigationProp<MainStackParamList, 'SinglePlayerSetup'>;

const { width } = Dimensions.get('window');

const SinglePlayerSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavProps>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [selectedSide, setSelectedSide] = useState<'TIGER' | 'GOAT'>('GOAT');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');

  const handleStartGame = () => {
    const gameId = `local-ai-${Date.now()}`;
    const userPlayer: Player = { 
      user_id: user?.user_id || 'guest-player', 
      username: user?.username || 'Guest' 
    };
    const aiPlayer: Player = { user_id: 'ai-player', username: `AI (${selectedDifficulty})` };

    const tigerPlayer = selectedSide === 'TIGER' ? userPlayer : aiPlayer;
    const goatPlayer = selectedSide === 'GOAT' ? userPlayer : aiPlayer;

    const localGame: Game = {
      game_id: gameId,
      player_tiger_id: tigerPlayer.user_id,
      player_goat_id: goatPlayer.user_id,
      player_tiger: tigerPlayer,
      player_goat: goatPlayer,
      status: GameStatus.IN_PROGRESS,
      game_state: initialGameState,
      created_at: new Date().toISOString(),
    };

    dispatch(startLocalGame(localGame));
    navigation.navigate('Game', {
      gameId: gameId,
      playerSide: selectedSide,
      aiDifficulty: selectedDifficulty,
      initialGameState: localGame.game_state,
      gameMode: 'ai',
    });
  };

  const styles = createStyles(theme, insets);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Game</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Choose Your Side */}
        <Text style={styles.sectionTitle}>Choose Your Side</Text>
        
        <View style={styles.sideContainer}>
          {/* Tiger Option */}
          <TouchableOpacity
            style={[
              styles.sideCard,
              selectedSide === 'TIGER' && styles.sideCardSelected,
              selectedSide === 'TIGER' && { borderColor: theme.colors.tigerColor }
            ]}
            onPress={() => setSelectedSide('TIGER')}
            activeOpacity={0.7}
          >
            <View style={[styles.sideIcon, { backgroundColor: theme.colors.tigerColor }]}>
              <Ionicons name="flash" size={28} color="#FFF" />
            </View>
            <Text style={styles.sideTitle}>Tigers</Text>
            <Text style={styles.sideHint}>Capture 5 goats</Text>
            {selectedSide === 'TIGER' && (
              <View style={[styles.checkBadge, { backgroundColor: theme.colors.tigerColor }]}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Goat Option */}
          <TouchableOpacity
            style={[
              styles.sideCard,
              selectedSide === 'GOAT' && styles.sideCardSelected,
              selectedSide === 'GOAT' && { borderColor: theme.colors.goatColor }
            ]}
            onPress={() => setSelectedSide('GOAT')}
            activeOpacity={0.7}
          >
            <View style={[styles.sideIcon, { backgroundColor: theme.colors.goatColor }]}>
              <Ionicons name="shield" size={28} color="#FFF" />
            </View>
            <Text style={styles.sideTitle}>Goats</Text>
            <Text style={styles.sideHint}>Block all tigers</Text>
            {selectedSide === 'GOAT' && (
              <View style={[styles.checkBadge, { backgroundColor: theme.colors.goatColor }]}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Difficulty */}
        <Text style={styles.sectionTitle}>Difficulty</Text>
        
        <View style={styles.difficultyContainer}>
          {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => {
            const isSelected = selectedDifficulty === level;
            const color = level === 'EASY' ? '#4CAF50' : level === 'MEDIUM' ? '#FF9800' : '#F44336';
            const label = level === 'EASY' ? 'Easy' : level === 'MEDIUM' ? 'Medium' : 'Hard';
            
            return (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyOption,
                  isSelected && styles.difficultySelected,
                  isSelected && { borderColor: color, backgroundColor: `${color}15` }
                ]}
                onPress={() => setSelectedDifficulty(level)}
                activeOpacity={0.7}
              >
                <View style={[styles.difficultyDot, { backgroundColor: color }]} />
                <Text style={[styles.difficultyText, isSelected && { color }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Game Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Game Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>You play as:</Text>
            <Text style={[styles.summaryValue, { color: selectedSide === 'TIGER' ? theme.colors.tigerColor : theme.colors.goatColor }]}>
              {selectedSide === 'TIGER' ? 'Tigers' : 'Goats'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>AI difficulty:</Text>
            <Text style={styles.summaryValue}>{selectedDifficulty.charAt(0) + selectedDifficulty.slice(1).toLowerCase()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>First move:</Text>
            <Text style={styles.summaryValue}>{selectedSide === 'GOAT' ? 'You' : 'AI'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: theme.colors.tigerColor }]} 
          onPress={handleStartGame}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={24} color="#FFF" style={styles.startIcon} />
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>, insets: { top: number; bottom: number }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: insets.top + 12,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  sideContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  sideCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  sideCardSelected: {
    borderWidth: 2,
  },
  sideIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sideHint: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  difficultyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: 8,
  },
  difficultySelected: {
    borderWidth: 2,
  },
  difficultyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  difficultyText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryLabel: {
    fontSize: 15,
    color: theme.colors.onSurfaceVariant,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  footer: {
    padding: 20,
    paddingBottom: insets.bottom + 20,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  startIcon: {
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default SinglePlayerSetupScreen;