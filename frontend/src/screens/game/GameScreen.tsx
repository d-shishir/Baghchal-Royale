import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';

import GameBoard from '../../components/game/GameBoard';
import { GameState, PieceType, PlayerSide, GamePhase, isMoveValid, applyMove, getMovesForPiece, PotentialMove, GameStatus as GameStatusEnum } from '../../game-logic/baghchal';
import { getGuestAIMove } from '../../game-logic/guestAI';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Game, Player, MoveCreate } from '../../services/types';
import { useCreateMoveMutation, useGetGameByIdQuery, useGetAIMoveMutation } from '../../services/api';
import { gameSocket, GameMoveData } from '../../services/websocket';
import { initialGameState } from '../../game-logic/initialState';
import { mapServerGameToBaghchalState } from '../../utils/gameStateMapper';
import GameOverModal from '../../components/game/GameOverModal';

const mapBaghchalStateToAIInput = (state: GameState): any => {
  const board = state.board.map(row => 
    row.map(cell => {
      if (cell === PieceType.TIGER) return 'T';
      if (cell === PieceType.GOAT) return 'G';
      return 'EMPTY';
    })
  );

  return {
    ...state,
    board,
  };
};

type GameScreenRouteProp = RouteProp<{
  Game: {
    gameId: string;
    gameMode?: 'local' | 'ai' | 'online';
    playerSide: PlayerSide;
    initialGameState?: GameState; // For local games
    aiDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  };
}, 'Game'>;

const GameScreen: React.FC = () => {
  const route = useRoute<GameScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { gameId, gameMode, playerSide, initialGameState: localInitialState, aiDifficulty } = route.params;

  const authUser = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const [createMove, { isLoading: isMoveLoading, error: moveError }] = useCreateMoveMutation();
  const [getAIMove, { isLoading: isAIMoveLoading }] = useGetAIMoveMutation();

  const { data: game, error: gameError, isLoading: isGameLoading } = useGetGameByIdQuery(gameId, {
    skip: !gameId || gameId.startsWith('local-'),
  });

  const [currentGameState, setCurrentGameState] = useState<GameState>(localInitialState || initialGameState);
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isGameOverModalVisible, setGameOverModalVisible] = useState(false);
  const [aiGameId, setAiGameId] = useState<string | null>(null);
  
  useEffect(() => {
    if (gameMode === 'online' && gameId && token && !gameSocket.isConnected()) {
      gameSocket.connect(gameId, token, (data: GameMoveData) => {
        if (data.game_state) {
          setCurrentGameState(data.game_state as GameState);
        } else if (data.status === 'error' && data.message) {
          Alert.alert('Error', data.message);
        }
      });

      return () => {
        gameSocket.disconnect();
      };
    }
  }, [gameId, token, gameMode]);

  useEffect(() => {
    const isAiTurn =
      !!aiDifficulty &&
      currentGameState.currentPlayer.toLowerCase() !== playerSide.toLowerCase() &&
      currentGameState.status === GameStatusEnum.IN_PROGRESS;

    if (isAiTurn) {
      setIsAiThinking(true);
      
      const handleAIMove = async () => {
        let aiPotentialMove: PotentialMove | null = null;
        try {
            if (authUser && !authUser.user_id.startsWith('guest-')) {
                // Logged in user, use backend AI
                const aiGameState = mapBaghchalStateToAIInput(currentGameState);
                const response = await getAIMove({
                    difficulty: aiDifficulty,
                    game_state: aiGameState,
                    user_id: authUser.user_id,
                    ai_game_id: aiGameId || undefined,
                    player_side: playerSide,
                }).unwrap();
                aiPotentialMove = response.move;
                if (response.ai_game_id) {
                    setAiGameId(response.ai_game_id);
                }
            } else {
                // Guest user, use local AI
                aiPotentialMove = getGuestAIMove(currentGameState);
            }
    
            if (aiPotentialMove) {
              const aiMove = { ...aiPotentialMove, player_id: currentGameState.currentPlayer, timestamp: new Date().toISOString() };
              const newState = applyMove(currentGameState, aiMove);
              setCurrentGameState(newState);
            }
        } catch (err) {
            console.error('Failed to get AI move:', err);
            Alert.alert('Error', 'Could not get AI move. Playing a random move.');
            // Fallback to local AI on error
            aiPotentialMove = getGuestAIMove(currentGameState);
            if (aiPotentialMove) {
                const aiMove = { ...aiPotentialMove, player_id: currentGameState.currentPlayer, timestamp: new Date().toISOString() };
                const newState = applyMove(currentGameState, aiMove);
                setCurrentGameState(newState);
            }
        } finally {
            setIsAiThinking(false);
        }
      };

      // Add a small delay to make the AI's move feel more natural
      const timer = setTimeout(handleAIMove, 500);
      return () => clearTimeout(timer);
    }
  }, [currentGameState, aiDifficulty, playerSide, authUser, getAIMove, aiGameId]);

  useEffect(() => {
    if (game) {
      setCurrentGameState(mapServerGameToBaghchalState(game));
    }
  }, [game]);

  useEffect(() => {
    const status = currentGameState.status;
    if (status === GameStatusEnum.TIGER_WON || status === GameStatusEnum.GOAT_WON) {
      const timer = setTimeout(() => {
        setGameOverModalVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentGameState.status]);

  const player1 = useMemo(() => (gameMode === 'local' ? { username: 'Player 1' } : (playerSide === 'Tiger' ? authUser : game?.player_tiger)), [game, playerSide, authUser, gameMode]);
  const player2 = useMemo(() => (gameMode === 'local' ? { username: 'Player 2' } : (playerSide === 'Goat' ? authUser : game?.player_goat)), [game, playerSide, authUser, gameMode]);

  const ourSide = gameMode === 'local' ? currentGameState.currentPlayer : playerSide;

  const handlePress = useCallback(async (position: { row: number, col: number }) => {
    if (!currentGameState || isMoveLoading || isAiThinking || !ourSide || currentGameState.currentPlayer.toLowerCase() !== ourSide.toLowerCase()) {
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
        if (gameMode === 'online' && gameId) {
            gameSocket.makeMove(aMove);
        } else {
            const gameMove = { ...aMove, player_id: ourSide, timestamp: new Date().toISOString() };
            const newState = applyMove(currentGameState, gameMove);
            setCurrentGameState(newState);
        }
      }
      setSelectedPosition(null);
      return;
    }

    if (ourSide.toLowerCase() === 'goat') {
      if (currentGameState.phase === 'placement') {
        if (piece === PieceType.EMPTY) {
          const aMove: PotentialMove = { to: [position.row, position.col], type: 'place' };
          if (isMoveValid(currentGameState, aMove)) {
            if (gameMode === 'online' && gameId) {
                gameSocket.makeMove(aMove);
            } else {
                const gameMove = { ...aMove, player_id: ourSide, timestamp: new Date().toISOString() };
                const newState = applyMove(currentGameState, gameMove);
                setCurrentGameState(newState);
            }
          }
        }
      } else {
        if (piece === PieceType.GOAT) {
          setSelectedPosition(position);
        }
      }
    } else if (ourSide.toLowerCase() === 'tiger') {
      if (piece === PieceType.TIGER) {
        setSelectedPosition(position);
      }
    }
  }, [currentGameState, selectedPosition, gameMode, gameId, isMoveLoading, isAiThinking, ourSide]);

  const handleGoHome = () => {
    setGameOverModalVisible(false);
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const handleRestart = () => {
    setGameOverModalVisible(false);
    setTimeout(() => {
      setCurrentGameState(initialGameState);
    }, 200);
  };

  const handleQuitGame = () => {
    Alert.alert(
      "Forfeit Game",
      "Are you sure you want to forfeit?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Forfeit", onPress: () => {
          gameSocket.forfeit();
          navigation.goBack();
        }, style: 'destructive' }
      ]
    );
  };

  const winnerText = useMemo(() => {
    const status = currentGameState.status;
    const winner = status === GameStatusEnum.TIGER_WON ? 'Tiger' : 'Goat';

    if (!!aiDifficulty) {
      if (winner.toLowerCase() === playerSide.toLowerCase()) {
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

  if (isGameLoading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  if (gameError || !currentGameState) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <Text style={styles.errorText}>Error loading game.</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#1a1a2e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <PlayerInfo
            player={gameMode === 'local' ? { username: 'Tiger' } : (ourSide === 'Tiger' ? player1 : player2) || null}
            side="Tiger"
            isActive={currentGameState.currentPlayer === 'Tiger'}
            goatsCaptured={currentGameState.goatsCaptured}
            goatsToPlace={0}
            phase={currentGameState.phase}
          />
        </View>

        <View style={styles.boardContainer}>
          <GameBoard
            board={currentGameState.board}
            selectedPosition={selectedPosition}
            validMoves={validMovesForSelection}
            onPositionPress={handlePress}
            isMoveLoading={isMoveLoading || isAiThinking}
            currentPlayer={currentGameState.currentPlayer}
            phase={currentGameState.phase}
          />
        </View>

        <View style={styles.footer}>
          <PlayerInfo
            player={gameMode === 'local' ? { username: 'Goat' } : (ourSide === 'Goat' ? player1 : player2) || null}
            side="Goat"
            isActive={currentGameState.currentPlayer === 'Goat'}
            goatsToPlace={20 - currentGameState.goatsPlaced}
            phase={currentGameState.phase}
            goatsCaptured={0}
          />
          <GameStatus winner={currentGameState.status !== GameStatusEnum.IN_PROGRESS ? currentGameState.status : null} turn={currentGameState.currentPlayer} />
        </View>
      </SafeAreaView>
      <GameOverModal
        visible={isGameOverModalVisible}
        winner={winnerText}
        onRestart={handleRestart}
        onGoHome={handleGoHome}
      />
    </LinearGradient>
  );
};

const PlayerInfo: React.FC<{
  player: Player | { username: string } | null;
  side: PlayerSide;
  isActive: boolean;
  goatsCaptured: number;
  goatsToPlace: number;
  phase: GamePhase;
}> = ({ player, side, isActive, goatsCaptured, goatsToPlace, phase }) => {
  const isTiger = side === 'Tiger';
  return (
    <View style={[styles.playerInfo, isActive && styles.activePlayer]}>
      <FontAwesome5 name={isTiger ? "cat" : "dot-circle"} size={24} color={isTiger ? '#FFC107' : '#FFF'} />
      <Text style={styles.playerName}>{player?.username || 'Player'}</Text>
      {isTiger ? (
        <Text style={styles.playerDetails}>Captured: {goatsCaptured}</Text>
      ) : (
        <Text style={styles.playerDetails}>
          {phase === 'placement' ? `To Place: ${goatsToPlace}` : ''}
        </Text>
      )}
    </View>
  );
};

const GameStatus: React.FC<{
  winner: GameStatusEnum | null;
  turn: PlayerSide;
}> = ({ winner, turn }) => {
  if (winner) {
    return (
      <View style={styles.gameStatus}>
        <Text style={styles.statusText}>{winner.replace('_', ' ')}!</Text>
      </View>
    );
  }
  return (
    <View style={styles.gameStatus}>
      <Text style={styles.statusText}>{turn}'s Turn</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  header: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  boardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '90%',
    marginVertical: 5,
  },
  activePlayer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
    borderWidth: 1,
  },
  playerName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  playerDetails: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 'auto',
  },
  gameStatus: {
    marginTop: 15,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  statusText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 18,
  },
  forfeitButton: {
    marginTop: 20,
    backgroundColor: '#C62828',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  forfeitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GameScreen;