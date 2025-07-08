import { GameState, PotentialMove, getAllValidMoves, PlayerSide, applyMove, PieceType, GameStatus, getMovesForPiece } from './baghchal';

export enum AIDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
}

export class GuestModeAI {
  private difficulty: AIDifficulty;

  constructor(difficulty: AIDifficulty = AIDifficulty.MEDIUM) {
    this.difficulty = difficulty;
  }

  public setDifficulty(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
  }

  getMove(gameState: GameState): PotentialMove | null {
    const allValidMoves = getAllValidMoves(gameState);
    if (allValidMoves.length === 0) return null;
    if (allValidMoves.length === 1) return allValidMoves[0];

    let bestMove: PotentialMove | null = null;
    let bestValue = -Infinity;

    for (const move of allValidMoves) {
      const newState = applyMove(gameState, { ...move, player_id: gameState.currentPlayer, timestamp: '' });
      const moveValue = this.minimax(newState, this.difficulty, false, -Infinity, Infinity);
      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
    }
    return bestMove || allValidMoves[0];
  }

  private minimax(state: GameState, depth: number, isMaximizingPlayer: boolean, alpha: number, beta: number): number {
    if (depth === 0 || state.status !== GameStatus.IN_PROGRESS) {
      return this.evaluateState(state);
    }

    const allValidMoves = getAllValidMoves(state);
    if (allValidMoves.length === 0) {
      return this.evaluateState(state);
    }

    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of allValidMoves) {
        const newState = applyMove(state, { ...move, player_id: state.currentPlayer, timestamp: '' });
        const anEval = this.minimax(newState, depth - 1, false, alpha, beta);
        maxEval = Math.max(maxEval, anEval);
        alpha = Math.max(alpha, anEval);
        if (beta <= alpha) {
          break;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of allValidMoves) {
        const newState = applyMove(state, { ...move, player_id: state.currentPlayer, timestamp: '' });
        const anEval = this.minimax(newState, depth - 1, true, alpha, beta);
        minEval = Math.min(minEval, anEval);
        beta = Math.min(beta, anEval);
        if (beta <= alpha) {
          break;
        }
      }
      return minEval;
    }
  }

  private evaluateState(state: GameState): number {
    let score = 0;
    const isTigerTurn = state.currentPlayer === 'Tiger';
  
    // Win/Loss conditions
    if (state.status === GameStatus.TIGER_WON) return isTigerTurn ? 10000 : -10000;
    if (state.status === GameStatus.GOAT_WON) return isTigerTurn ? -10000 : 10000;

    // Goat capture score
    score += state.goatsCaptured * 100;

    // Tiger mobility score
    let tigerMoves = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (state.board[r][c] === PieceType.TIGER) {
          tigerMoves += getMovesForPiece(state, [r, c]).length;
        }
      }
    }
    score += tigerMoves * 10;

    // Favor tiger for winning
    return isTigerTurn ? score : -score;
  }
}

export function createGuestAI(difficulty: AIDifficulty = AIDifficulty.MEDIUM): GuestModeAI {
  return new GuestModeAI(difficulty);
}

export function getGuestAIMove(gameState: GameState, difficulty: AIDifficulty = AIDifficulty.MEDIUM): PotentialMove | null {
  const ai = new GuestModeAI(difficulty);
  return ai.getMove(gameState);
} 