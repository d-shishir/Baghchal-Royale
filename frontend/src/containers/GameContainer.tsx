import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import GameScreen from '../screens/game/GameScreen';
import {
  localMove,
  selectPosition,
  resetGame,
  startLocalPVPGame,
  GameState,
  GameMove,
  setMultiplayerGame,
  updateBoard,
} from '../store/slices/gameSlice';
import { matchmakingSocket } from '../services/api';
import { isMoveValid, applyMove, checkWinCondition, PotentialMove, PieceType, getAllValidMoves, getMovesForPiece } from '../game-logic/baghchal';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../navigation/MainNavigator';

const GameContainer = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainStackParamList, 'Game'>>();
  const gameState = useSelector((state: RootState) => state.game);
  const token = useSelector((state: RootState) => state.auth.token);
  
  const params = route.params;

  useEffect(() => {
    if ('gameMode' in params && params.gameMode === 'multiplayer') {
      dispatch(setMultiplayerGame({
        matchId: params.matchId,
        opponentId: params.opponentId,
        playerSide: params.playerSide,
      }));

      const handleWsMessage = (data: any) => {
        if (data.status === 'move') {
          // Opponent made a move
          const stateAfterMove = applyMove(gameState, data.move);
          const gameResult = checkWinCondition(stateAfterMove);
          dispatch(updateBoard({
            board: stateAfterMove.board,
            nextPlayer: stateAfterMove.currentPlayer,
            phase: stateAfterMove.phase,
            goatsPlaced: stateAfterMove.goatsPlaced,
            goatsCaptured: stateAfterMove.goatsCaptured,
            gameOver: gameResult.gameOver,
            winner: gameResult.winner,
          }));
        } else if (data.status === 'opponent_disconnected') {
          // Handle opponent disconnection
          console.log('Opponent disconnected');
          // Optionally, show a message and end the game
        }
      };

      if (token) {
        matchmakingSocket.connect(token, handleWsMessage);
      }
    }
  }, [dispatch, params, token, gameState]);

  const {
    board,
    currentPlayer,
    phase,
    goatsCaptured,
    selectedPosition,
    gameOver,
    winner,
    userSide,
    player1,
    player2,
    matchId,
    gameMode
  } = gameState;

  const validMoves = useMemo(() => {
    return selectedPosition
      ? getMovesForPiece(gameState, selectedPosition)
      : getAllValidMoves(gameState);
  }, [selectedPosition, board, currentPlayer, phase]);

  const handleMove = async (move: PotentialMove) => {
    if (gameMode === 'pvp-local') {
      const fullMove: GameMove = { ...move, player_id: currentPlayer, timestamp: new Date().toISOString() };
      if (isMoveValid(gameState, fullMove)) {
        const stateAfterMove = applyMove(gameState, fullMove);
        const gameResult = checkWinCondition(stateAfterMove);
        dispatch(localMove({
          board: stateAfterMove.board,
          nextPlayer: stateAfterMove.currentPlayer,
          phase: stateAfterMove.phase,
          goatsPlaced: stateAfterMove.goatsPlaced,
          goatsCaptured: stateAfterMove.goatsCaptured,
          gameOver: gameResult.gameOver,
          winner: gameResult.winner,
        }));
      } else {
        console.warn("Invalid move attempted:", move);
      }
    } else if (gameMode === 'multiplayer' && matchId) {
      const fullMove: GameMove = { ...move, player_id: currentPlayer, timestamp: new Date().toISOString() };
      if (isMoveValid(gameState, fullMove)) {
        const stateAfterMove = applyMove(gameState, fullMove);
        const gameResult = checkWinCondition(stateAfterMove);
        dispatch(localMove({
          board: stateAfterMove.board,
          nextPlayer: stateAfterMove.currentPlayer,
          phase: stateAfterMove.phase,
          goatsPlaced: stateAfterMove.goatsPlaced,
          goatsCaptured: stateAfterMove.goatsCaptured,
          gameOver: gameResult.gameOver,
          winner: gameResult.winner,
        }));
        // Send move to opponent
        matchmakingSocket.sendMessage({
          match_id: matchId,
          move: fullMove,
        });
      } else {
        console.warn("Invalid move attempted:", move);
      }
    }
  };

  const handleSelectPosition = (pos: { row: number, col: number } | null) => {
    dispatch(selectPosition(pos ? [pos.row, pos.col] : null));
  };

  const handleQuitGame = () => {
    if (gameMode === 'multiplayer') {
      matchmakingSocket.disconnect();
    }
    dispatch(resetGame());
    navigation.goBack();
  };

  const handleNewGame = () => {
    if (gameMode === 'pvp-local') {
      dispatch(startLocalPVPGame());
    } else {
      navigation.goBack();
    }
  };
  
  const formattedValidMoves = validMoves.map(move => {
    if (move.type === 'place') {
      return { row: move.to[0], col: move.to[1] };
    }
    return { row: move.to[0], col: move.to[1] };
  });

  const effectiveGameMode = 'gameMode' in params ? params.gameMode : params.mode;

  if (!effectiveGameMode) {
    return null; // Or a loading screen
  }

  return (
    <GameScreen
      gameMode={effectiveGameMode}
      board={board as PieceType[][]}
      currentPlayer={currentPlayer}
      phase={phase}
      goatsCaptured={goatsCaptured}
      onMove={handleMove}
      onSelectPosition={handleSelectPosition}
      selectedPosition={selectedPosition ? { row: selectedPosition[0], col: selectedPosition[1] } : null}
      gameOver={gameOver}
      winner={winner}
      onQuitGame={handleQuitGame}
      onNewGame={handleNewGame}
      userSide={userSide}
      player1={player1}
      player2={player2}
      validMoves={formattedValidMoves}
    />
  );
};

export default GameContainer; 