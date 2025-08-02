import { Game as ServerGame } from '../services/types';
import { GameState, PlayerSide, GamePhase } from '../game-logic/baghchal';

// Normalize server game state to frontend format
export const normalizeGameState = (serverState: any): GameState => {
  // Normalize the currentPlayer field from server format (GOAT/TIGER) to frontend format (Goat/Tiger)
  const normalizePlayer = (player: string): PlayerSide => {
    return player.toLowerCase() === 'goat' ? 'Goat' : 'Tiger';
  };
  
  // Normalize the phase field from server format (PLACEMENT/MOVEMENT) to frontend format (placement/movement)
  const normalizePhase = (phase: string): GamePhase => {
    return phase.toLowerCase() as GamePhase;
  };
  
  return {
    ...serverState,
    currentPlayer: normalizePlayer(serverState.current_player || serverState.currentPlayer),
    phase: normalizePhase(serverState.phase),
  };
};

export const mapServerGameToBaghchalState = (serverGame: ServerGame): GameState => {
  return normalizeGameState(serverGame.game_state);
}; 