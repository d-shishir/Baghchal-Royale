import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import GameScreen from '../screens/game/GameScreen';
import { GameMove, localMove } from '../store/slices/gameSlice';
import { PieceType, PlayerSide } from '../store/slices/gameSlice';

const GameContainer = () => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);

  const handleMove = (move: GameMove) => {
    if (gameState.gameMode === 'pvp-local') {
      // Implement local move logic here
      // This is a simplified example. A real implementation would need
      // the full Baghchal game rules.
      const { board, currentPlayer, goatsPlaced, goatsCaptured, phase } = gameState;
      
      // *** This is where the full game logic would go. ***
      // For now, let's assume a function `applyMove` exists.
      // const newState = applyMove(gameState, move);
      
      // Dummy logic for now:
      const nextPlayer = currentPlayer === 'goats' ? 'tigers' : 'goats';
      const newBoard = board.map(row => [...row]);
      if (move.type === 'place') {
          newBoard[move.to[0]][move.to[1]] = 2; // Place a goat
      } else if (move.from) {
          const piece = newBoard[move.from[0]][move.from[1]];
          newBoard[move.from[0]][move.from[1]] = 0;
          newBoard[move.to[0]][move.to[1]] = piece;
      }

      dispatch(localMove({
        board: newBoard as PieceType[][],
        nextPlayer: nextPlayer,
        phase: phase, // Keep phase for simplicity; this should be updated
        goatsPlaced: goatsPlaced + (move.type === 'place' ? 1 : 0),
        goatsCaptured: goatsCaptured, // Capture logic needed
        gameOver: false, // Win condition logic needed
        winner: null,
      }));
    } else {
      // Handle online/AI moves
      console.log('Online move:', move);
    }
  };

  const handleQuit = () => {
    // Handle quitting the game
    console.log('Quit game');
  };

  if (!gameState.gameMode) {
    return null; // Or a loading/error screen
  }

  return (
    <GameScreen
      gameMode={gameState.gameMode}
      board={gameState.board}
      currentPlayer={gameState.currentPlayer}
      player1={gameState.player1}
      player2={gameState.player2}
      userSide={gameState.userSide}
      selectedPosition={gameState.selectedPosition ? [gameState.selectedPosition[0], gameState.selectedPosition[1]] : null}
      validMoves={gameState.validMoves.map(m => ({row: m[0], col: m[1]}))}
      onMove={handleMove}
      onQuitGame={handleQuit}
      winner={gameState.winner}
      gameOver={gameState.gameOver}
      goatsCaptured={gameState.goatsCaptured}
      phase={gameState.phase}
    />
  );
};

export default GameContainer; 