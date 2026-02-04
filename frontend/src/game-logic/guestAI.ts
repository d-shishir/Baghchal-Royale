import {
    GameState,
    PotentialMove,
    Position,
    PlayerSide,
    PieceType,
    getAllValidMoves,
    getPositionHash,
    initializeZobrist,
    makeMove,
    undoMove,
    UndoInfo,
    countTigerMobility,
    countGoatMobility,
    getEmptyNeighborsAroundTigers,
    countVulnerableGoats,
    countTrappedTigers,
    getTigerCentralization,
    isCaptureMove,
    cloneGameState,
} from './baghchal';
import {
    AIDifficulty,
    AIConfig,
    TranspositionEntry,
    SearchResult,
    getDefaultConfig,
} from './aiTypes';

/**
 * Competitive AI for Baghchal (Tigers & Goats)
 * Implements minimax with alpha-beta pruning, iterative deepening,
 * transposition tables, and difficulty levels
 */
export class GuestModeAI {
    private config: AIConfig;
    private aiSide: PlayerSide = 'Goat';
    private transpositionTable: Map<number, TranspositionEntry>;
    private killerMoves: PotentialMove[][];
    private historyTable: Map<string, number>;
    private nodesSearched: number = 0;
    private searchStartTime: number = 0;

    constructor(difficulty: AIDifficulty = AIDifficulty.MEDIUM) {
        this.config = getDefaultConfig(difficulty);
        this.transpositionTable = new Map();
        this.killerMoves = [];
        this.historyTable = new Map();
        initializeZobrist();
    }

    /**
     * Set the AI's difficulty level
     */
    public setDifficulty(difficulty: AIDifficulty): void {
        this.config = getDefaultConfig(difficulty);
        this.clearCache();
    }

    /**
     * Set which side the AI is playing
     */
    public setAISide(side: PlayerSide): void {
        this.aiSide = side;
    }

    /**
     * Get the best move for the current position
     */
    public getMove(state: GameState): PotentialMove | null {
        // Ensure it's AI's turn (case-insensitive comparison)
        const currentPlayerNormalized = state.currentPlayer.toUpperCase();
        const aiSideNormalized = this.aiSide.toUpperCase();
        
        if (currentPlayerNormalized !== aiSideNormalized) {
            console.warn(`AI called on non-AI turn: current=${state.currentPlayer}, aiSide=${this.aiSide}`);
            return null;
        }

        this.nodesSearched = 0;
        this.searchStartTime = Date.now();

        let validMoves = getAllValidMoves(state);
        if (validMoves.length === 0) {
            return null;
        }

        // IMPLEMENTATION of Opening Book Strategy for Goat
        // User Request: First move must be Center (2,2) or Edge Midpoints (0,2, 2,0, 4,2, 2,4)
        if (
            this.aiSide === 'Goat' &&
            state.phase === 'placement' &&
            state.goatsPlaced === 0
        ) {
            const preferredOpenings = ['2,2', '0,2', '2,0', '4,2', '2,4'];
            const openingMoves = validMoves.filter(m => {
                const key = `${m.to[0]},${m.to[1]}`;
                return m.type === 'place' && preferredOpenings.includes(key);
            });
            
            if (openingMoves.length > 0) {
                // Determine best opening via search among these filtered moves ONLY
                // Store all results to pick from top range
                const results: { move: PotentialMove, score: number }[] = [];
                let bestOpScore = -Infinity;

                const opDepth = Math.min(this.config.maxDepth, 6);

                for (const move of openingMoves) {
                    const undoInfo = makeMove(state, move);
                    const score = -this.alphaBeta(state, opDepth - 1, -Infinity, Infinity, false);
                    undoMove(state, move, undoInfo);
                    
                    if (score > bestOpScore) {
                        bestOpScore = score;
                    }
                    results.push({ move, score });
                }
                
                // Fuzzy selection: Pick any move within 7000 points of best score
                // This allows 'Standard' openings even if AI sees deep tactical risks (like Center)
                const tolerance = 7000;
                const bestOpMoves = results
                    .filter(r => r.score >= bestOpScore - tolerance)
                    .map(r => r.move);
                
                const selectedMove = bestOpMoves[Math.floor(Math.random() * bestOpMoves.length)];
                
                console.log(`AI (Opening): Picked ${JSON.stringify(selectedMove)} from ${bestOpMoves.length} options (BestScore: ${bestOpScore})`);
                return selectedMove || results[0].move;
            }
        }

        // Easy difficulty: pick randomly from top moves with shallow search
        if (this.config.difficulty === AIDifficulty.EASY) {
            return this.getEasyMove(state, validMoves);
        }

        // Medium/Hard: use full search
        const result = this.config.maxDepth > 8
            ? this.iterativeDeepening(state)
            : this.searchBestMove(state, this.config.maxDepth);

        console.log(`AI (${this.config.difficulty}): Searched ${this.nodesSearched} nodes in ${Date.now() - this.searchStartTime}ms, depth ${result.depth}, score ${result.score}`);

        return result.move;
    }

    /**
     * Easy AI: shallow search + randomness
     */
    private getEasyMove(state: GameState, validMoves: PotentialMove[]): PotentialMove {
        const scoredMoves = validMoves.map(move => ({
            move,
            score: this.quickEval(state, move),
        }));

        // Sort by score
        scoredMoves.sort((a, b) => b.score - a.score);

        // Pick randomly from top 3 (or fewer if not enough moves)
        const topN = Math.min(3, scoredMoves.length);
        const randomIndex = Math.floor(Math.random() * topN);
        return scoredMoves[randomIndex].move;
    }

    /**
     * Quick evaluation for easy mode (just one ply lookahead)
     */
    private quickEval(state: GameState, move: PotentialMove): number {
        const clonedState = cloneGameState(state);
        makeMove(clonedState, move);
        // Negamax: we want to maximize our score, which is -opponentScore
        return -this.evaluate(clonedState);
    }

    /**
     * Iterative deepening for hard mode
     */
    private iterativeDeepening(state: GameState): SearchResult {
        let bestResult: SearchResult = {
            move: null,
            score: -Infinity,
            depth: 0,
            nodesSearched: 0,
            timeElapsed: 0,
        };

        // Start from depth 1 and go up
        for (let depth = 1; depth <= this.config.maxDepth; depth++) {
            const timeElapsed = Date.now() - this.searchStartTime;
            
            // Stop if we're out of time
            if (timeElapsed >= this.config.timeLimit * 0.8) {
                break;
            }

            const result = this.searchBestMove(state, depth);
            
            // Update best result
            if (result.move) {
                bestResult = result;
            }

            // Stop if we found a winning move
            if (this.aiSide === 'Tiger' && result.score >= 9000) {
                break;
            }
            if (this.aiSide === 'Goat' && result.score <= -9000) {
                break;
            }
        }

        return bestResult;
    }

    /**
     * Main search function
     */
    private searchBestMove(state: GameState, maxDepth: number): SearchResult {
        const validMoves = getAllValidMoves(state);
        
        if (validMoves.length === 0) {
            return {
                move: null,
                score: this.evaluate(state),
                depth: 0,
                nodesSearched: this.nodesSearched,
                timeElapsed: Date.now() - this.searchStartTime,
            };
        }

        // Order moves for better alpha-beta pruning
        const orderedMoves = this.config.useMoveOrdering
            ? this.orderMoves(state, validMoves, 0)
            : validMoves;

        let bestMove: PotentialMove = orderedMoves[0];
        let bestScore = -Infinity;
        const alpha = -Infinity;
        const beta = Infinity;

        let bestMoves: PotentialMove[] = [];
        const isRoot = maxDepth === this.config.maxDepth;
        const useRandomness = isRoot && this.config.difficulty === AIDifficulty.MEDIUM;
        const randomnessTolerance = 200; // Small tolerance for variety

        for (const move of orderedMoves) {
            const undoInfo = makeMove(state, move);
            const score = -this.alphaBeta(state, maxDepth - 1, -beta, -alpha, false);
            undoMove(state, move, undoInfo);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
                if (useRandomness) bestMoves = [move];
            } else if (useRandomness && score >= bestScore - randomnessTolerance) {
                bestMoves.push(move);
            }
        }
        
        if (useRandomness && bestMoves.length > 0) {
             bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)] || bestMove;
             // Update bestMove but keeping bestScore accurate for alpha/beta propagation isn't needed at root final return
        }

        return {
            move: bestMove,
            score: bestScore,
            depth: maxDepth,
            nodesSearched: this.nodesSearched,
            timeElapsed: Date.now() - this.searchStartTime,
        };
    }

    /**
     * Alpha-beta pruning search
     */
    private alphaBeta(
        state: GameState,
        depth: number,
        alpha: number,
        beta: number,
        isMaximizing: boolean
    ): number {
        this.nodesSearched++;

        // Check time limit
        if (Date.now() - this.searchStartTime >= this.config.timeLimit) {
            return this.evaluate(state);
        }

        // Check transposition table
        if (this.config.useTranspositionTable) {
            const hash = getPositionHash(state);
            const ttEntry = this.transpositionTable.get(hash);
            if (ttEntry && ttEntry.depth >= depth) {
                if (ttEntry.flag === 'exact') {
                    return ttEntry.score;
                } else if (ttEntry.flag === 'lowerbound') {
                    alpha = Math.max(alpha, ttEntry.score);
                } else if (ttEntry.flag === 'upperbound') {
                    beta = Math.min(beta, ttEntry.score);
                }
                if (alpha >= beta) {
                    return ttEntry.score;
                }
            }
        }

        // Terminal node or depth limit
        if (depth === 0) {
            // Quiescence search for hard mode
            if (this.config.useQuiescence && this.aiSide === 'Tiger' && state.currentPlayer === 'Tiger') {
                return this.quiescence(state, alpha, beta, 3);
            }
            return this.evaluate(state);
        }

        // Check for terminal state
        if (state.goatsCaptured >= 5) {
            return this.evaluate(state);
        }

        const validMoves = getAllValidMoves(state);
        if (validMoves.length === 0) {
            // No moves = immobilized
            // If it's Tiger turn and no moves, Goats win. evaluated in evaluate()
            return this.evaluate(state);
        }

        // Order moves
        const orderedMoves = this.config.useMoveOrdering
            ? this.orderMoves(state, validMoves, depth)
            : validMoves;

        let bestScore = -Infinity;
        let bestMove: PotentialMove | undefined;
        let hashFlag: 'exact' | 'lowerbound' | 'upperbound' = 'upperbound';

        for (const move of orderedMoves) {
            const undoInfo = makeMove(state, move);
            const score = -this.alphaBeta(state, depth - 1, -beta, -alpha, !isMaximizing);
            undoMove(state, move, undoInfo);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }

            alpha = Math.max(alpha, score);
            if (alpha >= beta) {
                // Beta cutoff
                if (this.config.useMoveOrdering) {
                    this.updateKillerMoves(move, depth);
                }
                hashFlag = 'lowerbound';
                break;
            }
        }

        if (bestScore > alpha) {
            hashFlag = 'exact';
        }

        // Store in transposition table
        if (this.config.useTranspositionTable && bestMove) {
            const hash = getPositionHash(state);
            this.transpositionTable.set(hash, {
                hash: hash.toString(),
                depth,
                score: bestScore,
                flag: hashFlag,
                bestMove,
            });

            // Limit TT size (mobile friendly)
            if (this.transpositionTable.size > 10000) {
                // Clear oldest entries (simple implementation)
                const keysToDelete = Array.from(this.transpositionTable.keys()).slice(0, 2000);
                keysToDelete.forEach(key => this.transpositionTable.delete(key));
            }
        }

        return bestScore;
    }

    /**
     * Quiescence search to avoid horizon effect
     * Only search captures for tigers
     */
    private quiescence(state: GameState, alpha: number, beta: number, depth: number): number {
        this.nodesSearched++;

        const standPat = this.evaluate(state);

        if (depth === 0) {
            return standPat;
        }

        if (standPat >= beta) {
            return beta;
        }

        if (alpha < standPat) {
            alpha = standPat;
        }

        // Get only capture moves for tigers
        const validMoves = getAllValidMoves(state);
        const captureMoves = validMoves.filter(move => {
            if (move.type === 'move' && move.from) {
                return isCaptureMove(move.from, move.to, state.board);
            }
            return false;
        });

        for (const move of captureMoves) {
            const undoInfo = makeMove(state, move);
            const score = -this.quiescence(state, -beta, -alpha, depth - 1);
            undoMove(state, move, undoInfo);

            if (score >= beta) {
                return beta;
            }
            if (score > alpha) {
                alpha = score;
            }
        }

        return alpha;
    }

    /**
     * Move ordering for better alpha-beta pruning
     */
    private orderMoves(state: GameState, moves: PotentialMove[], depth: number): PotentialMove[] {
        const scored = moves.map(move => {
            let score = 0;

            // Captures first (very high priority for tigers)
            if (move.type === 'move' && move.from && isCaptureMove(move.from, move.to, state.board)) {
                score += 10000;
            }

            // Killer move heuristic
            if (depth < this.killerMoves.length) {
                const killers = this.killerMoves[depth] || [];
                if (killers.some(k => this.movesEqual(k, move))) {
                    score += 5000;
                }
            }

            // History heuristic
            const moveKey = this.getMoveKey(move);
            score += this.historyTable.get(moveKey) || 0;

            // Check TT for best move
            if (this.config.useTranspositionTable) {
                const hash = getPositionHash(state);
                const ttEntry = this.transpositionTable.get(hash);
                if (ttEntry?.bestMove && this.movesEqual(ttEntry.bestMove, move)) {
                    score += 20000;
                }
            }

            return { move, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.map(s => s.move);
    }

    /**
     * Evaluation function - Returns TIGER ADVANTAGE
     * Positive score = Good for Tiger
     * Negative score = Good for Goat
     */
    private evaluate(state: GameState): number {
        // Terminal states check first
        if (state.goatsCaptured >= 5) {
             const score = 100000;
             return state.currentPlayer === 'Tiger' ? score : -score;
        }
        
        const tigerMobility = countTigerMobility(state);
        // If movement phase and tigers can't move, Goats win
        if (tigerMobility === 0 && state.phase === 'movement') {
             const score = -100000;
             return state.currentPlayer === 'Tiger' ? score : -score;
        }

        let score = 0;

        // --- TIGER FACTORS (Positive) ---

        // 1. Captures are the ultimate goal
        score += state.goatsCaptured * 5000;

        // 2. Vulnerable Goats (Immediate capture opportunities)
        // This is extremely good for Tigers, extremely bad for Goats.
        const vulnerableGoats = countVulnerableGoats(state);
        score += vulnerableGoats * 3000;

        // 3. Tiger Mobility
        // More moves is generally better
        score += tigerMobility * 20;

        // 4. Tiger Centralization (Early game)
        // Tigers control the board better from the center
        if (state.phase === 'placement' || state.goatsPlaced < 15) {
             const centralization = getTigerCentralization(state);
             score += centralization * 15;
        }

        // --- GOAT FACTORS (Negative) ---

        // 1. Trapped Tigers (Very bad for Tiger)
        const trappedTigers = countTrappedTigers(state);
        score -= trappedTigers * 500;

        // 2. Goat Mobility
        // Goats need to be able to move to maintain nets
        if (state.phase === 'movement') {
            const goatMobility = countGoatMobility(state);
            score -= goatMobility * 10;
        }

        // 3. Network Tightness (Reducing Tiger Options)
        // We evaluate how much "breathing room" tigers have.
        // Less empty neighbors = Tighter net = Better for Goat (Lower Score)
        const emptyAroundTigers = getEmptyNeighborsAroundTigers(state);
        for (const count of emptyAroundTigers) {
            // Each empty spot adds to Tiger's advantage
            // But we penalize lack of empty spots non-linearly?
            score += count * 40; 
        }

        // 4. Placement Strategy
        if (state.phase === 'placement') {
            // Incentivize placing all goats (don't stall)
            // But more importantly, place them safely!
            // Safe placement is handled by Minimax avoiding 'vulnerableGoats' states
            // We just add a small factor to encourage completion
            score -= (20 - state.goatsPlaced) * 10;
        }

        // --- RETURN ---
        // For Negamax, we must return the score from the perspective of state.currentPlayer.
        // If current player is Tiger, return Tiger Advantage (score).
        // If current player is Goat, return Goat Advantage (-score).
        
        return state.currentPlayer === 'Tiger' ? score : -score;
    }

    /**
     * Update killer moves table
     */
    private updateKillerMoves(move: PotentialMove, depth: number): void {
        if (!this.killerMoves[depth]) {
            this.killerMoves[depth] = [];
        }
        
        // Keep only 2 killer moves per depth
        this.killerMoves[depth] = [move, ...this.killerMoves[depth].slice(0, 1)];
    }

    /**
     * Helper to compare moves
     */
    private movesEqual(m1: PotentialMove, m2: PotentialMove): boolean {
        if (m1.type !== m2.type) return false;
        if (m1.to[0] !== m2.to[0] || m1.to[1] !== m2.to[1]) return false;
        if (m1.type === 'move' && m2.type === 'move') {
            return m1.from[0] === m2.from[0] && m1.from[1] === m2.from[1];
        }
        return true;
    }

    /**
     * Get a string key for a move (for history/killer tables)
     */
    private getMoveKey(move: PotentialMove): string {
        if (move.type === 'place') {
            return `place_${move.to[0]}_${move.to[1]}`;
        }
        return `move_${move.from[0]}_${move.from[1]}_${move.to[0]}_${move.to[1]}`;
    }

    /**
     * Clear cached data (useful when changing difficulty)
     */
    private clearCache(): void {
        this.transpositionTable.clear();
        this.killerMoves = [];
        this.historyTable.clear();
    }
}

// Export a singleton instance for convenience
export const defaultAI = new GuestModeAI();

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

// Re-export AIDifficulty for convenience (it's in aiTypes.ts but old code imports from here)
export { AIDifficulty } from './aiTypes';

/**
 * Backward compatibility function for existing code
 * @param state Current game state
 * @param difficulty AI difficulty level
 * @param aiSide Which side the AI is playing
 * @returns Best move for the AI
 */
export function getGuestAIMove(
    state: GameState,
    difficulty: AIDifficulty,
    aiSide: PlayerSide
): PotentialMove | null {
    const ai = new GuestModeAI(difficulty);
    ai.setAISide(aiSide);
    return ai.getMove(state);
}
