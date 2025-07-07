import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';

import GameBoard from '../../components/game/GameBoard';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { RootState } from '../../store';
import {
  useGetGameByIdQuery,
  useGetMovesQuery,
  useCreateMoveMutation,
  useUpdateGameMutation,
} from '../../services/api';
import * as BaghchalLogic from '../../game-logic/baghchal';
import { GameState, PieceType, PlayerSide } from '../../game-logic/baghchal';
import LoadingScreen from '../../components/LoadingScreen';
import { updateLocalGame } from '../../store/slices/gameSlice';
import { getGuestAIMove, AIDifficulty } from '../../game-logic/guestAI';

type GameScreenRouteProp = RouteProp<MainStackParamList, 'Game'>;

const { width, height } = Dimensions.get('window');

const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute<GameScreenRouteProp>();
  const { gameId, playerSide, aiDifficulty } = route.params;

  const isLocalGame = gameId.startsWith('local');
  const user = useSelector((state: RootState) => state.auth.user);
  
  // For online games
  const { data: onlineGame, isLoading: isLoadingGame, error: gameError } = useGetGameByIdQuery(gameId, { skip: isLocalGame, pollingInterval: 3000 });
  const { data: moves, isLoading: isLoadingMoves } = useGetMovesQuery(gameId, { pollingInterval: 3000 });
  const [createMove] = useCreateMoveMutation();
  
  // For local games
  const activeGame = useSelector((state: RootState) => state.game.activeGame);
  
  const game = isLocalGame ? activeGame?.game : onlineGame;
  const clientGameState = isLocalGame ? activeGame?.game.game_state : onlineGame?.game_state;

  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);

  // AI move logic
  useEffect(() => {
    if (game?.game_type === 'AI' && clientGameState?.currentPlayer !== playerSide) {
      setTimeout(() => {
        if (!clientGameState) return;
        const difficulty = (aiDifficulty as AIDifficulty) || AIDifficulty.MEDIUM;
        const aiMove = getGuestAIMove(clientGameState, difficulty);
        if (aiMove) {
          handleLocalMove(aiMove);
        }
      }, 500); // Small delay for UX
    }
  }, [clientGameState, game?.game_type, playerSide, aiDifficulty]);


  const handleLocalMove = (move: BaghchalLogic.PotentialMove) => {
    if (!clientGameState) return;

    const logicMove: BaghchalLogic.GameMove = {
      ...move,
      player_id: clientGameState.currentPlayer === 'Tiger' ? game?.player1?.id! : game?.player2?.id!,
      timestamp: new Date().toISOString(),
    };
    
    if (BaghchalLogic.isMoveValid(clientGameState, logicMove)) {
      const newState = BaghchalLogic.applyMove(clientGameState, logicMove);
      dispatch(updateLocalGame(newState));
      setSelectedPosition(null);
    }
  };


  const handlePositionPress = async (position: { row: number; col: number }) => {
    if (!game || !user || !clientGameState || clientGameState.status !== 'IN_PROGRESS') return;

    // Check if it's the user's turn
    const isOurTurn = isLocalGame
      ? (game.game_type !== 'AI' || clientGameState.currentPlayer === playerSide)
      : clientGameState.currentPlayer === (user.user_id === game.player1_id ? 'Tiger' : 'Goat');
      
    if (!isOurTurn) return;

    const { row, col } = position;
    
    let potentialMove: BaghchalLogic.PotentialMove | null = null;
    
    if (clientGameState.phase === 'placement') {
        potentialMove = { type: 'place', to: [row, col] };
    } else { // Movement phase
        if (selectedPosition) {
            potentialMove = { type: 'move', from: [selectedPosition.row, selectedPosition.col], to: [row, col] };
        }
    }

    if (potentialMove) {
      if (isLocalGame) {
        handleLocalMove(potentialMove);
      } else {
        await createMove({
            game_id: gameId,
            player_id: user.user_id,
            move_type: potentialMove.type === 'place' ? 'PLACE' : 'MOVE',
            from_row: potentialMove.type === 'move' ? potentialMove.from?.[0] : undefined,
            from_col: potentialMove.type === 'move' ? potentialMove.from?.[1] : undefined,
            to_row: potentialMove.to[0],
            to_col: potentialMove.to[1],
        });
        setSelectedPosition(null);
      }
    } else {
        if (!isLocalGame) {
             const piece = clientGameState.board[row][col];
            const isOurPiece = clientGameState.currentPlayer === (user.user_id === game.player1_id ? 'Tiger' : 'Goat');
            if (isOurPiece) {
                setSelectedPosition({row, col});
            } else {
                setSelectedPosition(null);
            }
        } else {
            setSelectedPosition({row, col});
        }
    }
  };

  const handleQuitGame = () => {
    // For local games, just go back. For online, forfeit.
    if(isLocalGame) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Forfeit Game',
      'Are you sure you want to forfeit? This will result in a loss.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Forfeit', style: 'destructive', onPress: async () => {
            // Forfeit logic for online game would go here
            navigation.goBack();
        }},
      ]
    );
  };
  
  if (isLoadingGame || isLoadingMoves || !clientGameState || !game) return <LoadingScreen />;
  if (gameError) return <View><Text>Error loading game.</Text></View>;
  
  const player1 = game.player1;
  const player2 = game.player2;

  const validMovesForSelection = useMemo(() => {
      if (!selectedPosition || !clientGameState) return [];
      return BaghchalLogic.getMovesForPiece(clientGameState, [selectedPosition.row, selectedPosition.col]);
  }, [selectedPosition, clientGameState])

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      {/* Header: Player Info */}
      <View style={styles.header}>
          {/* Player 1 Info */}
          <View style={[styles.playerInfo, clientGameState.currentPlayer === 'Tiger' && styles.activePlayer]}>
             <Text style={styles.playerName}>{player1?.username} (Tigers)</Text>
          </View>
          {/* Player 2 Info */}
          <View style={[styles.playerInfo, clientGameState.currentPlayer === 'Goat' && styles.activePlayer]}>
              <Text style={styles.playerName}>{player2?.username} (Goats)</Text>
          </View>
      </View>
      
      {/* Game Board */}
      <GameBoard
        board={clientGameState.board}
        onPositionPress={handlePositionPress}
        selectedPosition={selectedPosition}
        validMoves={validMovesForSelection.map(m => ({row: m.to[0], col: m.to[1]}))}
        currentPlayer={clientGameState.currentPlayer}
        phase={clientGameState.phase}
      />
      
      {/* Footer: Game Info & Actions */}
      <View style={styles.footer}>
          <Text style={styles.gameInfoText}>Goats Captured: {clientGameState.goatsCaptured}</Text>
          <Text style={styles.gameInfoText}>Phase: {clientGameState.phase}</Text>
          <Text style={styles.gameInfoText}>Turn: {clientGameState.currentPlayer}</Text>
          <TouchableOpacity style={styles.quitButton} onPress={handleQuitGame}>
              <Ionicons name="exit-outline" size={20} color="#FF5252" />
              <Text style={styles.quitButtonText}>Forfeit Game</Text>
          </TouchableOpacity>
      </View>

      {/* Game Over Modal */}
      {clientGameState.status !== 'IN_PROGRESS' && (
        <Modal transparent={true} visible={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Game Over</Text>
              <Text style={styles.modalText}>
                  {clientGameState.status === 'TIGER_WON' ? 'Tigers win!' : 'Goats win!'}
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={() => navigation.goBack()}>
                <Text style={styles.modalButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
      flex: 0.2,
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      alignItems: 'center'
  },
  footer: {
      flex: 0.2,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10
  },
  playerInfo: {
    padding: 10,
    margin: 10,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 10,
  },
  playerName: {
      color: 'white',
      fontSize: 16
  },
  activePlayer: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowRadius: 10,
    shadowOpacity: 0.8
  },
  gameInfoText: {
      color: 'white',
      fontSize: 16,
      marginBottom: 5
  },
  quitButton: {
      flexDirection: 'row',
      marginTop: 15,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: 'rgba(255, 82, 82, 0.2)',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#FF5252'
  },
  quitButtonText: {
    color: '#FF5252',
    marginLeft: 10,
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2c2c54',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700'
  },
  modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 10,
  },
  modalText: {
      fontSize: 18,
      color: 'white',
      marginBottom: 20,
  },
  modalButton: {
      backgroundColor: '#FFD700',
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 10
  },
  modalButtonText: {
      color: '#1a1a2e',
      fontWeight: 'bold'
  }
});

export default GameScreen; 