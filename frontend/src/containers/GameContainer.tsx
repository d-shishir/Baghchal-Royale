import React, { useMemo } from 'react';
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
} from '../store/slices/gameSlice';
import { useGetGameStateQuery, useMakeMoveMutation } from '../services/api';
import { isMoveValid, applyMove, checkWinCondition, PotentialMove, PieceType, getAllValidMoves, getMovesForPiece } from '../game-logic/baghchal';
import { useNavigation, useRoute } from '@react-navigation/native';

const GameContainer = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const gameState = useSelector((state: RootState) => state.game);
  
  const [makeMove] = useMakeMoveMutation();
  const { gameId, gameMode } = gameState;
  
  const { data: onlineGameState } = useGetGameStateQuery(gameId, {
    skip: !gameId || gameMode !== 'pvp',
    pollingInterval: 3000,
  });
  
  const finalGameState: GameState = useMemo(() => {
    if (gameMode === 'pvp' && onlineGameState) {
        return {
            ...gameState,
            board: onlineGameState.board,
            currentPlayer: onlineGameState.current_player,
            phase: onlineGameState.phase,
            goatsPlaced: onlineGameState.goats_placed,
            goatsCaptured: onlineGameState.goats_captured,
            gameOver: onlineGameState.game_over,
            winner: onlineGameState.winner,
        };
    }
    return gameState;
  }, [gameMode, onlineGameState, gameState]);

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
    player2
  } = finalGameState;

  const validMoves = useMemo(() => {
    return selectedPosition
      ? getMovesForPiece(finalGameState, selectedPosition)
      : getAllValidMoves(finalGameState);
  }, [selectedPosition, board, currentPlayer, phase]);

  const handleMove = async (move: PotentialMove) => {
    if (gameMode === 'pvp-local') {
      const fullMove: GameMove = { ...move, player_id: currentPlayer, timestamp: new Date().toISOString() };
      if (isMoveValid(finalGameState, fullMove)) {
        const stateAfterMove = applyMove(finalGameState, fullMove);
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
    } else if (gameMode === 'pvp' && gameId) {
      try {
        let movePayload;
        if (move.type === 'place') {
            movePayload = { game_id: gameId, action_type: 'place' as const, row: move.to[0], col: move.to[1] };
        } else {
            movePayload = { game_id: gameId, action_type: 'move' as const, from_row: move.from[0], from_col: move.from[1], to_row: move.to[0], to_col: move.to[1] };
        }
        await makeMove(movePayload).unwrap();
      } catch (error) {
        console.error('Failed to make move:', error);
      }
    }
  };

  const handleSelectPosition = (pos: { row: number, col: number } | null) => {
    dispatch(selectPosition(pos ? [pos.row, pos.col] : null));
  };

  const handleQuitGame = () => {
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

  if (!gameMode) {
    return null; // Or a loading screen
  }

  return (
    <GameScreen
      gameMode={gameMode}
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