import { GameState, PotentialMove, getAllValidMoves, PlayerSide, applyMove, PieceType, GameStatus, getMovesForPiece } from './baghchal';

export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

// Difficulty configuration
interface DifficultyConfig {
  depth: number;
  randomMoveChance: number;
  useAdvancedEval: boolean;
}

const DIFFICULTY_CONFIGS: Record<AIDifficulty, DifficultyConfig> = {
  [AIDifficulty.EASY]: { depth: 2, randomMoveChance: 0.2, useAdvancedEval: false },
  [AIDifficulty.MEDIUM]: { depth: 3, randomMoveChance: 0, useAdvancedEval: true },
  [AIDifficulty.HARD]: { depth: 4, randomMoveChance: 0, useAdvancedEval: true },
};

// Position weights for strategic importance
const POSITION_WEIGHTS: number[][] = [
  [3, 2, 3, 2, 3],
  [2, 4, 2, 4, 2],
  [3, 2, 5, 2, 3],
  [2, 4, 2, 4, 2],
  [3, 2, 3, 2, 3],
];

export class GuestModeAI {
  private difficulty: AIDifficulty;
  private aiSide: PlayerSide;

  constructor(difficulty: AIDifficulty = AIDifficulty.MEDIUM, aiSide: PlayerSide = 'Tiger') {
    this.difficulty = difficulty;
    this.aiSide = aiSide;
  }

  public setDifficulty(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
  }

  public setAISide(side: PlayerSide) {
    this.aiSide = side;
  }

  getMove(gameState: GameState): PotentialMove | null {
    const allValidMoves = getAllValidMoves(gameState) || [];
    if (allValidMoves.length === 0) return null;
    if (allValidMoves.length === 1) return allValidMoves[0];

    const config = DIFFICULTY_CONFIGS[this.difficulty];

    // Random move based on difficulty
    if (config.randomMoveChance > 0 && Math.random() < config.randomMoveChance) {
      const randomIndex = Math.floor(Math.random() * allValidMoves.length);
      return allValidMoves[randomIndex];
    }

    // Find best move using minimax
    let bestMove: PotentialMove | null = null;
    let bestValue = -Infinity;

    for (const move of allValidMoves) {
      const newState = applyMove(gameState, { ...move, player_id: gameState.currentPlayer, timestamp: '' });
      const moveValue = this.minimax(newState, config.depth - 1, false, -Infinity, Infinity);
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

    const allValidMoves = getAllValidMoves(state) || [];
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
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    
    // Check terminal states first
    if (state.status === GameStatus.TIGER_WON) {
      return this.aiSide === 'Tiger' ? 100000 : -100000;
    }
    if (state.status === GameStatus.GOAT_WON) {
      return this.aiSide === 'Goat' ? 100000 : -100000;
    }

    // Calculate features
    const features = this.calculateFeatures(state);
    
    let score: number;
    if (this.aiSide === 'Tiger') {
      score = this.evaluateForTiger(features, config.useAdvancedEval);
    } else {
      score = this.evaluateForGoat(features, config.useAdvancedEval);
    }

    return score;
  }

  private calculateFeatures(state: GameState): GameFeatures {
    const { board } = state;
    const tigers: [number, number][] = [];
    const goats: [number, number][] = [];
    
    // Find all pieces
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (board[r][c] === PieceType.TIGER) {
          tigers.push([r, c]);
        } else if (board[r][c] === PieceType.GOAT) {
          goats.push([r, c]);
        }
      }
    }

    // Calculate tiger mobility and trap status
    let totalTigerMobility = 0;
    let trappedTigers = 0;
    let nearlyTrappedTigers = 0;
    let captureThreats = 0;

    for (const tigerPos of tigers) {
      const tigerState: GameState = { ...state, currentPlayer: 'Tiger' };
      const moves = getMovesForPiece(tigerState, tigerPos) || [];
      const moveCount = moves.length;
      totalTigerMobility += moveCount;
      
      if (moveCount === 0) {
        trappedTigers++;
      } else if (moveCount === 1) {
        nearlyTrappedTigers++;
      }

      // Count capture opportunities (moves that would be jumps)
      for (const move of moves) {
        if (move.type === 'move') {
          const dx = Math.abs(move.from[0] - move.to[0]);
          const dy = Math.abs(move.from[1] - move.to[1]);
          if (dx > 1 || dy > 1) {
            captureThreats++;
          }
        }
      }
    }

    // Calculate goat formations and positioning
    let goatFormationScore = 0;
    let goatPositionScore = 0;
    
    for (const goatPos of goats) {
      // Position value
      goatPositionScore += POSITION_WEIGHTS[goatPos[0]][goatPos[1]];
      
      // Formation - count adjacent goats
      for (const otherGoat of goats) {
        if (goatPos !== otherGoat) {
          const dist = Math.abs(goatPos[0] - otherGoat[0]) + Math.abs(goatPos[1] - otherGoat[1]);
          if (dist === 1) {
            goatFormationScore += 1;
          }
        }
      }
    }
    goatFormationScore = goatFormationScore / 2; // Each pair counted twice

    // Calculate tiger position score
    let tigerPositionScore = 0;
    for (const tigerPos of tigers) {
      tigerPositionScore += POSITION_WEIGHTS[tigerPos[0]][tigerPos[1]];
    }

    return {
      goatsCaptured: state.goatsCaptured,
      goatsPlaced: state.goatsPlaced,
      goatsRemaining: 20 - state.goatsCaptured,
      totalTigerMobility,
      trappedTigers,
      nearlyTrappedTigers,
      captureThreats,
      goatFormationScore,
      goatPositionScore,
      tigerPositionScore,
      phase: state.phase,
    };
  }

  private evaluateForTiger(features: GameFeatures, advanced: boolean): number {
    let score = 0;

    // Primary: Captures are the main goal
    score += features.goatsCaptured * 2000;

    // Mobility is crucial - trapped tiger = bad
    score += features.totalTigerMobility * 30;
    score -= features.trappedTigers * 200;
    score -= features.nearlyTrappedTigers * 50;

    // Capture threats are valuable opportunities
    score += features.captureThreats * 150;

    if (advanced) {
      // Central control for tigers
      score += features.tigerPositionScore * 10;
      
      // Punish goat formations that block movement
      score -= features.goatFormationScore * 15;
      
      // In movement phase, prioritize aggressive positioning
      if (features.phase === 'movement') {
        score += features.captureThreats * 40; // Extra bonus for threats
      }
    }

    return score;
  }

  private evaluateForGoat(features: GameFeatures, advanced: boolean): number {
    let score = 0;

    // Primary: Trapping tigers is the goal
    score += features.trappedTigers * 1000;
    score += features.nearlyTrappedTigers * 200;

    // Avoid losing goats
    score -= features.goatsCaptured * 1000;

    // Limit tiger mobility
    score -= features.totalTigerMobility * 20;

    // Block capture opportunities
    score -= features.captureThreats * 500;

    if (advanced) {
      // Good formations help trap tigers
      score += features.goatFormationScore * 40;
      
      // Strategic positioning
      score += features.goatPositionScore * 10;
      
      // During placement, prioritize getting goats on the board strategically
      if (features.phase === 'placement') {
        score += features.goatsPlaced * 15;
        // Bonus for blocking central positions
        score += features.goatPositionScore * 5;
      }
    }

    return score;
  }
}

interface GameFeatures {
  goatsCaptured: number;
  goatsPlaced: number;
  goatsRemaining: number;
  totalTigerMobility: number;
  trappedTigers: number;
  nearlyTrappedTigers: number;
  captureThreats: number;
  goatFormationScore: number;
  goatPositionScore: number;
  tigerPositionScore: number;
  phase: 'placement' | 'movement';
}

export function createGuestAI(difficulty: AIDifficulty = AIDifficulty.MEDIUM, aiSide: PlayerSide = 'Tiger'): GuestModeAI {
  return new GuestModeAI(difficulty, aiSide);
}

export function getGuestAIMove(gameState: GameState, difficulty: AIDifficulty = AIDifficulty.MEDIUM, aiSide: PlayerSide = 'Tiger'): PotentialMove | null {
  const ai = new GuestModeAI(difficulty, aiSide);
  return ai.getMove(gameState);
}