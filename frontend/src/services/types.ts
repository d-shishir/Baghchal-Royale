// Types for offline Baghchal game
import { GameState, PotentialMove } from "../game-logic/baghchal";

export type { GameState, PotentialMove };

// Game Status enum for compatibility
export enum BackendGameStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
  TIGER_WON = "TIGER_WON",
  GOAT_WON = "GOAT_WON",
  DRAW = "DRAW",
}

// Alias for compatibility
export { BackendGameStatus as GameStatus };

// Player - for game contexts
export interface Player {
    user_id: string;
    username: string;
}

// Game - local game structure
export interface Game {
    game_id: string;
    player_goat_id: string;
    player_tiger_id: string;
    status: BackendGameStatus;
    created_at: string;
    ended_at?: string;
    player_goat?: Player;
    player_tiger?: Player;
    winner_id?: string | null;
    game_state: GameState;
}

// Move types (for potential future use)
export interface MoveCreate {
    game_id: string;
    move_number: number;
    player_id: string;
    move_type: string;
    from_row?: number;
    from_col?: number;
    to_row: number;
    to_col: number;
}