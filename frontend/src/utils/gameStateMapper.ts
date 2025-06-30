import { PlayerSide, PieceType, GamePhase } from '../store/slices/gameSlice';

/**
 * Backend game state from API
 */
export interface BackendGameState {
  game_id: string;
  board: number[][];
  current_player: 'tigers' | 'goats';
  phase: 'placement' | 'movement';
  goats_placed: number;
  goats_captured: number;
  game_over: boolean;
  winner: 'tigers' | 'goats' | null;
  valid_actions: Array<{
    type: string;
    row?: number;
    col?: number;
    from_row?: number;
    from_col?: number;
    to_row?: number;
    to_col?: number;
  }>;
}

/**
 * Convert backend game state to normalized format for GameScreen
 */
export function mapBackendStateToGameScreen(backendState: BackendGameState, selectedPosition: [number, number] | null = null) {
  // Convert board format
  const board: PieceType[][] = backendState.board.map(row => row.map(cell => cell as PieceType));
  
  // Convert player names
  const currentPlayer: PlayerSide = backendState.current_player;
  
  // Convert phase
  const phase: GamePhase = backendState.phase;
  
  // Convert winner
  const winner: PlayerSide | null = backendState.winner;
  
  // Convert valid_actions to validMoves format for UI highlighting
  let validMoves: { row: number, col: number }[] = [];
  
  if (selectedPosition) {
    // If a piece is selected, show only destination moves for that piece
    validMoves = backendState.valid_actions
      .filter(action => {
        if (action.type === 'move' && action.from_row === selectedPosition[0] && action.from_col === selectedPosition[1]) {
          return true;
        }
        return false;
      })
      .map(action => ({ row: action.to_row!, col: action.to_col! }));
  } else {
    // No piece selected - show all valid positions for current player
    if (phase === 'placement' && currentPlayer === 'goats') {
      // During placement, show empty spots where goats can be placed
      validMoves = backendState.valid_actions
        .filter(action => action.type === 'place')
        .map(action => ({ row: action.row!, col: action.col! }));
    } else {
      // During movement phase (or tiger moves during placement), show pieces that can be moved
      const piecePositions = new Set<string>();
      
      backendState.valid_actions.forEach(action => {
        if (action.type === 'move' && action.from_row !== undefined && action.from_col !== undefined) {
          piecePositions.add(`${action.from_row},${action.from_col}`);
        }
      });
      
      validMoves = Array.from(piecePositions).map(pos => {
        const [row, col] = pos.split(',').map(Number);
        return { row, col };
      });
    }
  }
  
  return {
    board,
    currentPlayer,
    phase,
    goatsPlaced: backendState.goats_placed,
    goatsCaptured: backendState.goats_captured,
    gameOver: backendState.game_over,
    winner,
    validMoves,
  };
} 