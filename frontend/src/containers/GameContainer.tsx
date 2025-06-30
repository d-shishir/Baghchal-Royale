import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import GameScreen from '../screens/game/GameScreen';
import { localMove, selectPosition, setValidMoves, GameMove } from '../store/slices/gameSlice';
import { isMoveValid, applyMove, checkWinCondition, getAllValidMoves, getMovesForPiece, PotentialMove } from '../game-logic/baghchal';

const GameContainer = () => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const { gameMode, selectedPosition, board, currentPlayer, phase, goatsPlaced } = gameState;

  // Recalculate valid moves for UI highlighting whenever the state changes
  useEffect(() => {
    if (gameMode !== 'pvp-local') return;

    let movesToShow: PotentialMove[] = [];
    if (selectedPosition) {
        // If a piece is selected, show only where THAT piece can move
        movesToShow = getMovesForPiece(gameState, selectedPosition);
        // Debug log for valid moves of the selected piece
        console.log('🐅 Valid moves for selected piece:', selectedPosition, movesToShow);
    } else {
        // If no piece is selected, get all possible moves for highlighting selectable pieces
        movesToShow = getAllValidMoves(gameState);
    }
    
    // Extract the destination or piece positions for highlighting
    const positionsToHighlight = movesToShow.map(m => {
        if (m.type === 'place') {
            return m.to; // For placement, highlight the empty spot
        }
        // If a piece is selected, highlight its destination.
        // If no piece is selected, highlight the piece that can be moved.
        return selectedPosition ? m.to : m.from;
    });

    const uniquePositions = Array.from(new Set(positionsToHighlight.map(p => `${p[0]},${p[1]}`))).map(s => s.split(',').map(Number));

    // Only dispatch if the highlights have actually changed
    if (JSON.stringify(gameState.validMoves) !== JSON.stringify(uniquePositions)) {
      dispatch(setValidMoves(uniquePositions as [number, number][]));
    }
    // Dependency array is now more specific to prevent infinite loops.
  }, [selectedPosition, board, currentPlayer, phase, gameMode, dispatch, gameState.validMoves]);

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

  const handleQuit = () => {
    // Handle quitting the game
    console.log('Quit game');
  };

  if (!gameMode) {
    return null; // Or a loading/error screen
  }

  return (
    <GameScreen
      gameMode={gameMode}
      board={board}
      currentPlayer={currentPlayer}
      player1={gameState.player1}
      player2={gameState.player2}
      userSide={gameState.userSide}
      selectedPosition={selectedPosition ? { row: selectedPosition[0], col: selectedPosition[1] } : null}
      validMoves={gameState.validMoves.map(m => ({row: m[0], col: m[1]}))}
      onSelectPosition={handleSelectPosition}
      onMove={handleMove}
      onQuitGame={handleQuit}
      winner={gameState.winner}
      gameOver={gameState.gameOver}
      goatsCaptured={gameState.goatsCaptured}
      phase={phase}
    />
  );
};

export default GameContainer; 