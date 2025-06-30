import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import GameScreen from '../screens/game/GameScreen';
import {
  localMove,
  selectPosition,
  resetGame,
  startLocalPVPGame,
  GameState,
  GameMove,
} from '../store/slices/gameSlice';
import { isMoveValid, applyMove, checkWinCondition, getAllValidMoves, getMovesForPiece, PotentialMove } from '../game-logic/baghchal';
import { useNavigation } from '@react-navigation/native';

const GameContainer = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const gameState = useSelector((state: RootState) => state.game);
  const { gameMode, selectedPosition, board, currentPlayer, phase, winner, gameOver } = gameState;

  const validMoves = useMemo(() => {
    return selectedPosition
      ? getMovesForPiece(gameState, selectedPosition)
      : getAllValidMoves(gameState);
  }, [selectedPosition, board, currentPlayer, phase]);
  
  const validMovePositions = useMemo(() => {
    if (selectedPosition) {
      // If a piece is selected, highlight the destination squares.
      return validMoves.map(move => ({ row: (move as any).to[0], col: (move as any).to[1] }));
    } else {
      // If no piece is selected, highlight the pieces that can be moved OR the spots for placement.
      const positionsToHighlight = validMoves.map(m => m.type === 'place' ? m.to : (m as any).from).filter(p => p);
      const uniquePositions = Array.from(new Set(positionsToHighlight.map(p => `${p[0]},${p[1]}`))).map(s => s.split(',').map(Number));
      return uniquePositions.map(pos => ({ row: pos[0], col: pos[1] }));
    }
  }, [validMoves, selectedPosition]);

  const handleSelectPosition = (pos: { row: number, col: number } | null) => {
    dispatch(selectPosition(pos ? [pos.row, pos.col] : null));
  };
  
  const handleMove = (move: PotentialMove) => {
    if (gameMode !== 'pvp-local') {
        console.log('Online move:', move);
        return;
    }

    const fullMove: GameMove = {
      ...move,
      player_id: gameState.currentPlayer,
      timestamp: new Date().toISOString()
    };

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
  };

  const handleQuitGame = () => {
    dispatch(resetGame());
    navigation.goBack();
  };

  const handleNewGame = () => {
    dispatch(startLocalPVPGame());
  };

  // Create player objects for local PVP
  const player1 = { id: 'tigers', username: 'Tigers', rating: 0, side: 'tigers' as const };
  const player2 = { id: 'goats', username: 'Goats', rating: 0, side: 'goats' as const };

  if (!gameMode) {
    return null;
  }

  return (
    <GameScreen
      gameMode={gameMode}
      board={gameState.board}
      currentPlayer={gameState.currentPlayer}
      player1={player1}
      player2={player2}
      userSide={null} // Not applicable in local PVP
      selectedPosition={selectedPosition ? { row: selectedPosition[0], col: selectedPosition[1] } : null}
      validMoves={validMoves}
      onMove={handleMove}
      onSelectPosition={handleSelectPosition}
      onQuitGame={handleQuitGame}
      onNewGame={handleNewGame}
      winner={gameState.winner}
      gameOver={gameState.gameOver}
      goatsCaptured={gameState.goatsCaptured}
      phase={gameState.phase}
      isAIThinking={false} // No AI in this mode
    />
  );
};

export default GameContainer; 