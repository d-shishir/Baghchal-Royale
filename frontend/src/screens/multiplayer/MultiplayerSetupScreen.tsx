import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { startLocalGame } from '../../store/slices/gameSlice';
import { initialGameState } from '../../game-logic/initialState';
import { Game, Player, GameStatus } from '../../services/types';
import { useAppTheme } from '../../theme';

const MultiplayerSetupScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  const handlePVPOnDevice = () => {
    const gameId = `local-pvp-${Date.now()}`;
    const player1: Player = { user_id: 'player1', username: 'Player 1 (Tiger)'};
    const player2: Player = { user_id: 'player2', username: 'Player 2 (Goat)'};

    const localGame: Game = {
      game_id: gameId,
      player_tiger_id: 'player1',
      player_goat_id: 'player2',
      player_tiger: player1,
      player_goat: player2,
      status: GameStatus.IN_PROGRESS,
      game_state: initialGameState,
      created_at: new Date().toISOString(),
    };

    dispatch(startLocalGame(localGame));
    navigation.navigate('Game', {
      gameId: gameId,
      gameMode: 'local',
      initialGameState: initialGameState,
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
        <Text style={styles.headerTitle}>Local Multiplayer</Text>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.tigerColor }]}>
            <Ionicons name="people" size={48} color="#FFF" />
          </View>
        </View>
        
        {/* Title and description */}
        <Text style={styles.promptTitle}>Play with a Friend</Text>
        <Text style={styles.promptSubtitle}>
          Share your device and take turns playing as Tigers and Goats
        </Text>

        {/* Player assignments */}
        <View style={styles.playerCards}>
          <View style={styles.playerCard}>
            <View style={[styles.playerIcon, { backgroundColor: theme.colors.tigerColor }]}>
              <Ionicons name="flash" size={24} color="#FFF" />
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerLabel}>Player 1</Text>
              <Text style={styles.playerRole}>Tigers</Text>
            </View>
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.playerCard}>
            <View style={[styles.playerIcon, { backgroundColor: theme.colors.goatColor }]}>
              <Ionicons name="shield" size={24} color="#FFF" />
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerLabel}>Player 2</Text>
              <Text style={styles.playerRole}>Goats</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <View style={styles.instructionRow}>
            <Ionicons name="swap-horizontal" size={20} color={theme.colors.tigerColor} />
            <Text style={styles.instructionText}>Pass the device after each turn</Text>
          </View>
          <View style={styles.instructionRow}>
            <Ionicons name="shield" size={20} color={theme.colors.goatColor} />
            <Text style={styles.instructionText}>Goats move first</Text>
          </View>
        </View>
      </View>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: theme.colors.tigerColor }]} 
          onPress={handlePVPOnDevice}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  promptSubtitle: {
    fontSize: 15,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  playerCards: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  playerCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  playerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  playerInfo: {
    alignItems: 'center',
  },
  playerLabel: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  playerRole: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  vsContainer: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
  },
  instructionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    marginLeft: 12,
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

export default MultiplayerSetupScreen;