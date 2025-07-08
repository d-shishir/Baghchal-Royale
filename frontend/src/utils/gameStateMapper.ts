import { Game as ServerGame } from '../services/types';
import { GameState } from '../game-logic/baghchal';

export const mapServerGameToBaghchalState = (serverGame: ServerGame): GameState => {
  // The server's Game object already contains the game_state in the format the client expects.
  // We can just return it directly.
  return serverGame.game_state;
}; 