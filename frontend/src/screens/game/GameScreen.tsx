import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';

import GameBoard from '../../components/game/GameBoard';
import TigerIcon from '../../components/game/TigerIcon';
import GoatIcon from '../../components/game/GoatIcon';
import AnimatedPiece from '../../components/game/AnimatedPiece';
import { GameState, PieceType, PlayerSide, GamePhase, isMoveValid, applyMove, getMovesForPiece, PotentialMove, GameStatus as GameStatusEnum } from '../../game-logic/baghchal';
import { getGuestAIMove, AIDifficulty } from '../../game-logic/guestAI';
import { RootState } from '../../store';
import { Player } from '../../services/types';
import { initialGameState } from '../../game-logic/initialState';
import GameOverModal from '../../components/game/GameOverModal';
import { recordGameResult } from '../../store/slices/gameSlice';
import { incrementWins, incrementLosses } from '../../store/slices/authSlice';
import { useAppTheme } from '../../theme';
import { useAlert } from '../../contexts/AlertContext';
import { setBoardTheme } from '../../store/slices/uiSlice';

const { width } = Dimensions.get('window');

type GameScreenRouteProp = RouteProp<{
  Game: {
    gameId: string;
    gameMode?: 'local' | 'ai';
    playerSide?: PlayerSide;
    initialGameState?: GameState;
    aiDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  };
}, 'Game'>;

/** Shape for a pending (mid-animation) AI move */
interface PendingAiMove {
  from: [number, number];
  to: [number, number];
  pieceType: PieceType.TIGER | PieceType.GOAT;
  nextState: GameState;
  isCapture: boolean;
}

const GameScreen: React.FC = () => {
  const route = useRoute<GameScreenRouteProp>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { gameId, gameMode = 'local', playerSide = 'Tiger', initialGameState: localInitialState, aiDifficulty } = route.params;

  const enableSoundEffects = useSelector((state: RootState) => state.ui.enableSoundEffects);
  const enableAnimations   = useSelector((state: RootState) => state.ui.enableAnimations);
  const currentBoardTheme  = useSelector((state: RootState) => state.ui.boardTheme);

  // Audio players
  // Audio players - Paths are 3 levels up from src/screens/game/ to root assets/
  const moveSoundPlayer    = useAudioPlayer(require('../../../assets/audio/move_sound.mp3'));
  const captureSoundPlayer = useAudioPlayer(require('../../../assets/audio/capture_sound.mp3'));

  const [currentGameState, setCurrentGameState] = useState<GameState>(localInitialState || initialGameState);
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [pendingAiMove, setPendingAiMove] = useState<PendingAiMove | null>(null);
  // Mirror pendingAiMove into a ref so the animation callback is never stale
  const pendingAiMoveRef = useRef<PendingAiMove | null>(null);
  const [isGameOverModalVisible, setGameOverModalVisible] = useState(false);
  const [isExitModalVisible, setExitModalVisible] = useState(false);
  const [isThemeModalVisible, setThemeModalVisible] = useState(false);
  const gameOverModalShownRef = useRef(false);
  const resultRecordedRef = useRef(false);

  /** Play a sound only if the setting is on */
  const playSound = useCallback((isCapture: boolean) => {
    console.log(`playSound called: isCapture=${isCapture}, enabled=${enableSoundEffects}`);
    if (!enableSoundEffects) return;
    if (isCapture) {
      console.log('Playing capture sound...');
      captureSoundPlayer.seekTo(0);
      captureSoundPlayer.play();
    } else {
      console.log('Playing move sound...');
      moveSoundPlayer.seekTo(0);
      moveSoundPlayer.play();
    }
  }, [enableSoundEffects, moveSoundPlayer, captureSoundPlayer]);

  /** Called by AnimatedPiece when the slide finishes — commit board state.
   *  Reads from ref to avoid stale closure issues with runOnJS. */
  const handleAiAnimationComplete = useCallback(() => {
    const move = pendingAiMoveRef.current;
    if (move) {
      console.log(`AI Animation Complete: isCapture=${move.isCapture}`);
      // Play capture sound at the END of animation — sounds like the piece lands/crunch
      if (move.isCapture) {
        playSound(true);
      }
      setCurrentGameState(move.nextState);
      setPendingAiMove(null);
      pendingAiMoveRef.current = null;
      isAiThinkingRef.current = false;
      setIsAiThinking(false);
    }
  }, [playSound]);  // Use latest playSound to avoid stale audio player refs
  const isAiThinkingRef = useRef(false);
  // Capture enableAnimations in a ref to avoid adding it as an effect dependency
  const enableAnimationsRef = useRef(enableAnimations);
  useEffect(() => { enableAnimationsRef.current = enableAnimations; }, [enableAnimations]);

  // AI Move Effect — only re-runs when the board state or game config changes
  useEffect(() => {
    // Guard: bail immediately if already processing an AI move
    if (isAiThinkingRef.current) return;

    const isAiTurn =
      !!aiDifficulty &&
      currentGameState.currentPlayer.toUpperCase() !== playerSide?.toUpperCase() &&
      currentGameState.status === GameStatusEnum.IN_PROGRESS;

    if (isAiTurn) {
      isAiThinkingRef.current = true;
      setIsAiThinking(true);
      
      const handleAIMove = async () => {
        try {
          const normalizedPlayerSide = playerSide?.charAt(0).toUpperCase() + playerSide?.slice(1).toLowerCase();
          const aiSide = normalizedPlayerSide === 'Tiger' ? 'Goat' : 'Tiger';
          
          console.log(`AI Move: playerSide=${playerSide}, aiSide=${aiSide}, currentPlayer=${currentGameState.currentPlayer}`);
          
          let difficultyEnum = AIDifficulty.MEDIUM;
          if (aiDifficulty === 'EASY') difficultyEnum = AIDifficulty.EASY;
          else if (aiDifficulty === 'HARD') difficultyEnum = AIDifficulty.HARD;

          const clonedState = {
            ...currentGameState,
            board: currentGameState.board.map(row => [...row]),
          };

          const aiPotentialMove = getGuestAIMove(clonedState, difficultyEnum, aiSide);
          
          if (aiPotentialMove) {
            const aiMove = { ...aiPotentialMove, player_id: currentGameState.currentPlayer, timestamp: new Date().toISOString() };
            const nextState = applyMove(currentGameState, aiMove);

            if (aiPotentialMove.type === 'move' && enableAnimationsRef.current) {
              // Detect capture: tiger jumps 2 cells
              const isCapture =
                Math.abs(aiPotentialMove.from[0] - aiPotentialMove.to[0]) > 1 ||
                Math.abs(aiPotentialMove.from[1] - aiPotentialMove.to[1]) > 1;

              const movingPiece = currentGameState.board[aiPotentialMove.from[0]][aiPotentialMove.from[1]] as PieceType.TIGER | PieceType.GOAT;

              // Play MOVE sound at the START of animation (slide begins)
              // Capture sound plays later in handleAiAnimationComplete when piece lands
              playSound(false);

              // Store the pending move — AnimatedPiece will handle committing it
              const movePayload: PendingAiMove = {
                from: [aiPotentialMove.from[0], aiPotentialMove.from[1]],
                to:   [aiPotentialMove.to[0],   aiPotentialMove.to[1]],
                pieceType: movingPiece,
                nextState,
                isCapture,
              };
              pendingAiMoveRef.current = movePayload;
              setPendingAiMove(movePayload);
              // isAiThinkingRef stays true — handleAiAnimationComplete clears it
            } else {
              // Placements or animations-off: update immediately
              playSound(false);
              setCurrentGameState(nextState);
              isAiThinkingRef.current = false;
              setIsAiThinking(false);
            }
          } else {
            isAiThinkingRef.current = false;
            setIsAiThinking(false);
          }
        } catch (err) {
          console.error('Failed to get AI move:', err);
          showAlert({
            title: 'Error',
            message: 'Could not get AI move.',
            type: 'error',
          });
          isAiThinkingRef.current = false;
          setIsAiThinking(false);
        }
      };

      const timer = setTimeout(handleAIMove, 800);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGameState, aiDifficulty, playerSide]);

  // Game Over Effect
  useEffect(() => {
    const status = currentGameState.status;
    if ((status === GameStatusEnum.TIGER_WON || status === GameStatusEnum.GOAT_WON) &&
        !gameOverModalShownRef.current &&
        pendingAiMoveRef.current === null) {
      const timer = setTimeout(() => {
        gameOverModalShownRef.current = true;
        setGameOverModalVisible(true);
        
        if (!resultRecordedRef.current) {
          resultRecordedRef.current = true;
          
          if (gameMode === 'ai' && playerSide) {
            const winner = status === GameStatusEnum.TIGER_WON ? 'TIGER' : 'GOAT';
            const playerWon = winner === playerSide.toUpperCase();
            
            dispatch(recordGameResult({
              gameId,
              result: playerWon ? 'win' : 'loss',
              mode: 'ai',
              playerSide: playerSide.toUpperCase() as 'TIGER' | 'GOAT',
              aiDifficulty,
            }));
            
            if (playerWon) {
              dispatch(incrementWins());
            } else {
              dispatch(incrementLosses());
            }
          } else if (gameMode === 'local') {
            dispatch(recordGameResult({
              gameId,
              result: 'draw',
              mode: 'local',
            }));
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentGameState.status, gameId, gameMode, playerSide, aiDifficulty, dispatch]);

  const tigerPlayer = useMemo(() => (
    gameMode === 'local' 
      ? { username: 'Player 1', isYou: false } 
      : (playerSide?.toUpperCase() === 'TIGER' ? { username: 'You', isYou: true } : { username: 'AI', isYou: false })
  ), [playerSide, gameMode]);
  
  const goatPlayer = useMemo(() => (
    gameMode === 'local' 
      ? { username: 'Player 2', isYou: false } 
      : (playerSide?.toUpperCase() === 'GOAT' ? { username: 'You', isYou: true } : { username: 'AI', isYou: false })
  ), [playerSide, gameMode]);

  const ourSide = gameMode === 'local' ? currentGameState.currentPlayer : playerSide;

  const handlePress = useCallback(async (position: { row: number, col: number }) => {
    if (!currentGameState || isAiThinking || !ourSide) {
      return;
    }

    const isMyTurn = gameMode === 'local' || 
      currentGameState.currentPlayer.toUpperCase() === ourSide.toUpperCase();
    
    if (!isMyTurn) {
      return;
    }

    const piece = currentGameState.board[position.row][position.col];
    
    if (selectedPosition) {
      const aMove: PotentialMove = {
        from: [selectedPosition.row, selectedPosition.col],
        to: [position.row, position.col],
        type: 'move',
      };
      if (isMoveValid(currentGameState, aMove)) {
        const isCapture =
          Math.abs(selectedPosition.row - position.row) > 1 ||
          Math.abs(selectedPosition.col - position.col) > 1;
        playSound(isCapture);
        const gameMove = { ...aMove, player_id: ourSide, timestamp: new Date().toISOString() };
        const newState = applyMove(currentGameState, gameMove);
        setCurrentGameState(newState);
      }
      setSelectedPosition(null);
      return;
    }

    if (ourSide.toUpperCase() === 'GOAT') {
      if (currentGameState.phase === 'placement') {
        if (piece === PieceType.EMPTY) {
          const aMove: PotentialMove = { to: [position.row, position.col], type: 'place' };
          const isValid = isMoveValid(currentGameState, aMove);
          
          if (isValid) {
            playSound(false); // placement = move sound
            const gameMove = { ...aMove, player_id: ourSide, timestamp: new Date().toISOString() };
            const newState = applyMove(currentGameState, gameMove);
            setCurrentGameState(newState);
          }
        }
      } else {
        if (piece === PieceType.GOAT) {
          setSelectedPosition(position);
        }
      }
    } else if (ourSide.toUpperCase() === 'TIGER') {
      if (piece === PieceType.TIGER) {
        setSelectedPosition(position);
      }
    }
  }, [currentGameState, selectedPosition, gameMode, isAiThinking, ourSide, playSound]);

  const handleOpenThemeModal = () => {
    setThemeModalVisible(true);
  };

  const handleSelectTheme = (themeId: 'classic' | 'stone' | 'neon' | 'newyear') => {
    dispatch(setBoardTheme(themeId));
    setThemeModalVisible(false);
  };

  const handleGoHome = () => {
    setGameOverModalVisible(false);
    gameOverModalShownRef.current = false;
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const handleRestart = () => {
    setGameOverModalVisible(false);
    gameOverModalShownRef.current = false;
    resultRecordedRef.current = false;
    setTimeout(() => {
      setCurrentGameState(localInitialState || initialGameState);
    }, 200);
  };

  const handleQuitGame = () => {
    setExitModalVisible(true);
  };

  const confirmExit = () => {
    setExitModalVisible(false);
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const winnerText = useMemo(() => {
    const status = currentGameState.status;
    const winner = status === GameStatusEnum.TIGER_WON ? 'Tiger' : 'Goat';

    if (!!aiDifficulty && playerSide) {
      if (winner.toUpperCase() === playerSide.toUpperCase()) {
        return 'You Win!';
      } else {
        return 'You Lose!';
      }
    }

    return `${winner} Wins!`;
  }, [currentGameState.status, aiDifficulty, playerSide]);

  const validMovesForSelection = useMemo(() => {
    if (!currentGameState) return [];

    if (currentGameState.phase === 'placement' && currentGameState.currentPlayer.toUpperCase() === 'GOAT') {
      const placements: { row: number, col: number }[] = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (currentGameState.board[r][c] === PieceType.EMPTY) {
            placements.push({ row: r, col: c });
          }
        }
      }
      return placements;
    }

    if (selectedPosition) {
      return getMovesForPiece(currentGameState, [selectedPosition.row, selectedPosition.col]).map(m => ({ row: m.to[0], col: m.to[1] }));
    }

    return [];
  }, [currentGameState, selectedPosition]);

  const isTigerTurn = currentGameState.currentPlayer === 'Tiger';
  const isGoatTurn = currentGameState.currentPlayer === 'Goat';
  const goatsToPlace = 20 - (currentGameState.goatsPlaced || 0);

  if (!currentGameState) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Section - Tiger Info */}
      <View style={[styles.topSection, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.playerCard, { backgroundColor: theme.colors.surface, borderColor: isTigerTurn ? theme.colors.tigerColor : 'transparent' }]}>
          <View style={[styles.playerIconBg, { backgroundColor: theme.colors.tigerColor + '20' }]}>
            <TigerIcon key={currentBoardTheme} size={28} color={theme.colors.tigerColor} />
          </View>
          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, { color: tigerPlayer.isYou ? theme.colors.goatColor : theme.colors.text }]}>
              {tigerPlayer.username}
            </Text>
            <Text style={[styles.playerSide, { color: theme.colors.onSurfaceVariant }]}>Tigers</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{currentGameState.goatsCaptured}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Captured</Text>
          </View>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.boardWrapper}>
        <View style={styles.boardContainer}>
          <GameBoard
            board={currentGameState.board}
            selectedPosition={selectedPosition}
            validMoves={validMovesForSelection}
            onPositionPress={handlePress}
            isMoveLoading={isAiThinking || pendingAiMove !== null}
            currentPlayer={currentGameState.currentPlayer}
            phase={currentGameState.phase}
            animatingFrom={pendingAiMove ? pendingAiMove.from : null}
            animatingCapture={
              pendingAiMove?.isCapture
                ? [
                    Math.round((pendingAiMove.from[0] + pendingAiMove.to[0]) / 2),
                    Math.round((pendingAiMove.from[1] + pendingAiMove.to[1]) / 2),
                  ]
                : null
            }
            animatedPieceNode={
              pendingAiMove ? (
                <AnimatedPiece
                  from={pendingAiMove.from}
                  to={pendingAiMove.to}
                  pieceType={pendingAiMove.pieceType}
                  onAnimationComplete={handleAiAnimationComplete}
                />
              ) : null
            }
          />
        </View>
      </View>

      {/* Bottom Section - Goat Info & Status */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
        {/* Turn Indicator */}
        <View style={[styles.turnIndicator, { backgroundColor: isTigerTurn ? theme.colors.tigerColor + '20' : theme.colors.goatColor + '20' }]}>
          <View style={[styles.turnDot, { backgroundColor: isTigerTurn ? theme.colors.tigerColor : theme.colors.goatColor }]} />
          <Text style={[styles.turnText, { color: isTigerTurn ? theme.colors.tigerColor : theme.colors.goatColor }]}>
            {gameMode === 'ai' 
              ? (currentGameState.currentPlayer.toUpperCase() === playerSide?.toUpperCase() ? 'Your Turn' : "AI's Turn")
              : `${isTigerTurn ? 'Tiger' : 'Goat'}'s Turn`
            }
          </Text>
          {currentGameState.phase === 'placement' && isGoatTurn && (
            <Text style={[styles.phaseHint, { color: theme.colors.onSurfaceVariant }]}>Tap to place a goat</Text>
          )}
        </View>

        <View style={[styles.playerCard, { backgroundColor: theme.colors.surface, borderColor: isGoatTurn ? theme.colors.goatColor : 'transparent' }]}>
          <View style={[styles.playerIconBg, { backgroundColor: theme.colors.goatColor + '20' }]}>
            <GoatIcon key={currentBoardTheme} size={28} color={theme.colors.goatColor} />
          </View>
          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, { color: goatPlayer.isYou ? theme.colors.goatColor : theme.colors.text }]}>
              {goatPlayer.username}
            </Text>
            <Text style={[styles.playerSide, { color: theme.colors.onSurfaceVariant }]}>Goats</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {currentGameState.phase === 'placement' ? goatsToPlace : '✓'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              {currentGameState.phase === 'placement' ? 'To Place' : 'All Placed'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]} onPress={handleRestart}>
            <Ionicons name="refresh" size={20} color={theme.colors.text} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]} onPress={handleOpenThemeModal}>
            <Ionicons name="color-palette" size={20} color={theme.colors.text} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Theme</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]} onPress={handleQuitGame}>
            <Ionicons name="home" size={20} color={theme.colors.text} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <GameOverModal
        visible={isGameOverModalVisible}
        winner={winnerText}
        onRestart={handleRestart}
        onGoHome={handleGoHome}
        showRestart={true}
      />

      {/* Exit Confirmation Modal */}
      <Modal
        visible={isExitModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExitModalVisible(false)}
      >
        <View style={styles.exitModalOverlay}>
          <View style={[styles.exitModalContainer, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="exit-outline" size={48} color={theme.colors.error} style={styles.exitModalIcon} />
            <Text style={[styles.exitModalTitle, { color: theme.colors.text }]}>Exit Game?</Text>
            <Text style={[styles.exitModalMessage, { color: theme.colors.onSurfaceVariant }]}>
              Your current progress will be lost.
            </Text>
            <View style={styles.exitModalButtons}>
              <TouchableOpacity 
                style={[styles.exitModalButton, styles.exitModalCancelButton, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() => setExitModalVisible(false)}
              >
                <Text style={[styles.exitModalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exitModalButton, styles.exitModalExitButton, { backgroundColor: theme.colors.error }]}
                onPress={confirmExit}
              >
                <Text style={[styles.exitModalButtonText, { color: '#FFF' }]}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        visible={isThemeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.themeModalOverlay}>
          <View style={[styles.themeModalContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.themeModalHeader}>
              <Text style={[styles.themeModalTitle, { color: theme.colors.text }]}>Select Board Theme</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.themeOptionList}>
              {(['classic', 'stone', 'neon', 'newyear'] as const).map((id) => {
                const isSelected = currentBoardTheme === id;
                const themeNames = {
                  classic: 'Classic Wood',
                  stone: 'Ancient Stone',
                  neon: 'Cyber Neon',
                  newyear: 'Nepali New Year'
                };
                
                return (
                  <TouchableOpacity 
                    key={id}
                    style={[
                      styles.themeOption, 
                      { backgroundColor: theme.colors.surfaceVariant },
                      isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
                    ]}
                    onPress={() => handleSelectTheme(id)}
                  >
                    <View style={styles.themeOptionInfo}>
                      <Text style={[styles.themeOptionName, { color: theme.colors.text }]}>{themeNames[id]}</Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 8,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
  },
  playerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  playerSide: {
    fontSize: 13,
    marginTop: 2,
  },
  statBadge: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingOverlay: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
  },
  thinkingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  thinkingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 16,
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  turnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  turnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  phaseHint: {
    fontSize: 12,
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    minWidth: 90,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  exitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitModalContainer: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  exitModalIcon: {
    marginBottom: 16,
  },
  exitModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  exitModalMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  exitModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  exitModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  exitModalCancelButton: {},
  exitModalExitButton: {},
  exitModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  themeModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  themeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  themeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeOptionList: {
    gap: 12,
  },
  themeOption: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeOptionName: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default GameScreen;