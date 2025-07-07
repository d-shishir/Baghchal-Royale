import { GameState, PotentialMove, getAllValidMoves, PlayerSide } from './baghchal';

export enum AIDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM', 
  HARD = 'HARD',
}

export class GuestModeAI {
  private difficulty: AIDifficulty;

  constructor(difficulty: AIDifficulty = AIDifficulty.MEDIUM) {
    this.difficulty = difficulty;
  }

  public setDifficulty(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
  }

  /**
   * Get the best AI move for the current player
   */
  getMove(gameState: GameState): PotentialMove | null {
    const allValidMoves = getAllValidMoves(gameState);
    if (allValidMoves.length === 0) return null;

    if (gameState.currentPlayer === 'Tiger') {
      return this.selectTigerMove(allValidMoves, gameState);
    } else {
      return this.selectGoatMove(allValidMoves, gameState);
    }
  }

  /**
   * Select the best move for Tigers using strategic evaluation
   */
  private selectTigerMove(validMoves: PotentialMove[], gameState: GameState): PotentialMove {
    // 1. Prioritize capture moves
    const captureMoves = validMoves.filter(move => this.isCaptureMove(move, gameState));
    if (captureMoves.length > 0) {
      return this.selectByDifficulty(captureMoves);
    }

    // 2. Evaluate non-capture moves
    const scoredMoves = validMoves.map(move => ({
      move,
      score: this.evaluateTigerMove(move, gameState)
    }));

    // Sort by score
    scoredMoves.sort((a, b) => b.score - a.score);
    
    return this.selectByDifficulty(scoredMoves.map(sm => sm.move));
  }

  /**
   * Select the best move for Goats using defensive strategies
   */
  private selectGoatMove(validMoves: PotentialMove[], gameState: GameState): PotentialMove {
    // 1. Filter out dangerous moves (that would lead to immediate capture)
    const safeMoves = validMoves.filter(move => !this.isMoveDangerous(move, gameState));
    const movesToConsider = safeMoves.length > 0 ? safeMoves : validMoves;

    // 2. Evaluate moves
    const scoredMoves = movesToConsider.map(move => ({
      move,
      score: this.evaluateGoatMove(move, gameState)
    }));

    // Sort by score
    scoredMoves.sort((a, b) => b.score - a.score);
    
    return this.selectByDifficulty(scoredMoves.map(sm => sm.move));
  }

  /**
   * Check if a move is a capture move (for tigers)
   */
  private isCaptureMove(move: PotentialMove, gameState: GameState): boolean {
    if (move.type !== 'move' || !move.from) return false;
    
    const [fromRow, fromCol] = move.from;
    const [toRow, toCol] = move.to;
    
    // Check if it's a jump move (distance > 1)
    const rowDistance = Math.abs(toRow - fromRow);
    const colDistance = Math.abs(toCol - fromCol);
    
    if (rowDistance > 1 || colDistance > 1) {
      // Check if there's a goat in between
      const midRow = (fromRow + toRow) / 2;
      const midCol = (fromCol + toCol) / 2;
      
      if (Number.isInteger(midRow) && Number.isInteger(midCol)) {
        return gameState.board[midRow][midCol] === 2; // Goat
      }
    }
    
    return false;
  }

  /**
   * Check if a move would be dangerous (could lead to capture)
   */
  private isMoveDangerous(move: PotentialMove, gameState: GameState): boolean {
    // Simulate the move
    const newBoard = gameState.board.map((row: number[]) => [...row]);
    const [toRow, toCol] = move.to;
    
    if (move.type === 'place') {
      newBoard[toRow][toCol] = 2; // Place goat
    } else {
      const [fromRow, fromCol] = move.from;
      newBoard[fromRow][fromCol] = 0; // Remove from old position
      newBoard[toRow][toCol] = 2; // Place at new position
    }

    // Check if any tiger can capture this goat
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (newBoard[row][col] === 1) { // Tiger position
          if (this.canTigerCaptureAt([row, col], [toRow, toCol], newBoard)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a tiger can capture a goat at a specific position
   */
  private canTigerCaptureAt(tigerPos: [number, number], goatPos: [number, number], board: number[][]): boolean {
    const [tigerRow, tigerCol] = tigerPos;
    const [goatRow, goatCol] = goatPos;
    
    // Check all directions for potential capture
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dr, dc] of directions) {
      const landingRow = goatRow + dr;
      const landingCol = goatCol + dc;
      
      // Check if tiger can jump to landing position
      if (landingRow >= 0 && landingRow < 5 && landingCol >= 0 && landingCol < 5 &&
          board[landingRow][landingCol] === 0) { // Landing spot is empty
        
        // Check if this forms a valid capture line
        const jumpFromRow = goatRow - dr;
        const jumpFromCol = goatCol - dc;
        
        if (jumpFromRow === tigerRow && jumpFromCol === tigerCol) {
          return true; // Tiger can jump over goat to landing position
        }
      }
    }
    
    return false;
  }

  /**
   * Evaluate tiger move quality
   */
  private evaluateTigerMove(move: PotentialMove, gameState: GameState): number {
    let score = 0;
    const [toRow, toCol] = move.to;
    
    // 1. Center control bonus
    if (toRow === 2 && toCol === 2) {
      score += 50;
    }
    
    // 2. Corner positions bonus
    if ((toRow === 0 || toRow === 4) && (toCol === 0 || toCol === 4)) {
      score += 30;
    }
    
    // 3. Proximity to goats
    let totalGoatDistance = 0;
    let goatCount = 0;
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (gameState.board[row][col] === 2) { // Goat
          const distance = Math.abs(toRow - row) + Math.abs(toCol - col);
          totalGoatDistance += distance;
          goatCount++;
        }
      }
    }
    
    if (goatCount > 0) {
      const avgDistance = totalGoatDistance / goatCount;
      score += Math.max(0, 20 - avgDistance * 2); // Closer to goats is better
    }
    
    // 4. Edge positions (less valuable)
    if (toRow === 0 || toRow === 4 || toCol === 0 || toCol === 4) {
      score += 10;
    }
    
    return score;
  }

  /**
   * Evaluate goat move quality
   */
  private evaluateGoatMove(move: PotentialMove, gameState: GameState): number {
    let score = 0;
    const [toRow, toCol] = move.to;
    
    // 1. Distance from tigers (safety)
    let minTigerDistance = Infinity;
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (gameState.board[row][col] === 1) { // Tiger
          const distance = Math.abs(toRow - row) + Math.abs(toCol - col);
          minTigerDistance = Math.min(minTigerDistance, distance);
        }
      }
    }
    
    if (minTigerDistance !== Infinity) {
      score += minTigerDistance * 15; // Farther from tigers is better
    }
    
    // 2. Central area control (but not the exact center - tigers want that)
    if (toRow >= 1 && toRow <= 3 && toCol >= 1 && toCol <= 3 && !(toRow === 2 && toCol === 2)) {
      score += 25;
    }
    
    // 3. Blocking tiger movement paths
    score += this.calculateBlockingValue([toRow, toCol], gameState);
    
    // 4. Formation building (adjacent to other goats)
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (gameState.board[row][col] === 2) { // Other goat
          const distance = Math.abs(toRow - row) + Math.abs(toCol - col);
          if (distance === 1) {
            score += 10; // Adjacent to another goat
          }
        }
      }
    }
    
    return score;
  }

  /**
   * Calculate how much a position blocks tiger movement
   */
  private calculateBlockingValue(pos: [number, number], gameState: GameState): number {
    let blockingValue = 0;
    const [row, col] = pos;
    
    // Count tiger movements this position would block
    for (let tigerRow = 0; tigerRow < 5; tigerRow++) {
      for (let tigerCol = 0; tigerCol < 5; tigerCol++) {
        if (gameState.board[tigerRow][tigerCol] === 1) { // Tiger
          // Check if placing goat at pos would block tiger moves
          const adjacentPositions = this.getAdjacentPositions([tigerRow, tigerCol]);
          
          for (const adjPos of adjacentPositions) {
            const [adjRow, adjCol] = adjPos;
            if (adjRow === row && adjCol === col) {
              blockingValue += 8; // This position is adjacent to a tiger
            }
          }
        }
      }
    }
    
    return blockingValue;
  }

  /**
   * Get adjacent positions to a given position
   */
  private getAdjacentPositions(pos: [number, number]): [number, number][] {
    const [row, col] = pos;
    const adjacent: [number, number][] = [];
    
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5) {
        adjacent.push([newRow, newCol]);
      }
    }
    
    return adjacent;
  }

  /**
   * Select move based on difficulty level
   */
  private selectByDifficulty(moves: PotentialMove[]): PotentialMove {
    if (moves.length === 0) throw new Error('No moves available');
    
    if (this.difficulty === AIDifficulty.EASY) {
      // 30% chance to pick the best move, 70% chance for a random move
      if (Math.random() < 0.3) {
        return moves[0];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    } else if (this.difficulty === AIDifficulty.MEDIUM) {
      // 70% chance for best move, 30% for random
      if (Math.random() < 0.7) {
        return moves[0];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    } else { // Hard
      // 95% chance for best move
      if (Math.random() < 0.95) {
        return moves[0];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    }
  }
}

// Factory function to create AI instance
export function createGuestAI(difficulty: AIDifficulty = AIDifficulty.MEDIUM): GuestModeAI {
  return new GuestModeAI(difficulty);
}

// Helper function to get AI move
export function getGuestAIMove(gameState: GameState, difficulty: AIDifficulty = AIDifficulty.MEDIUM): PotentialMove | null {
  const ai = createGuestAI(difficulty);
  return ai.getMove(gameState);
} 