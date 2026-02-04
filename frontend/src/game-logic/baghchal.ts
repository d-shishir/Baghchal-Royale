export type PlayerSide = 'Tiger' | 'Goat';
export type GamePhase = 'placement' | 'movement';
export enum PieceType { EMPTY = 0, TIGER = 1, GOAT = 2 }

export enum GameStatus {
  IN_PROGRESS = "IN_PROGRESS",
  TIGER_WON = "TIGER_WON",
  GOAT_WON = "GOAT_WON",
  DRAW = "DRAW",
}

export interface GameState {
  board: PieceType[][];
  currentPlayer: PlayerSide;
  phase: GamePhase;
  goatsCaptured: number;
  goatsPlaced: number;
  status: GameStatus;
  // The following are for UI state, not pure game logic
  selectedPosition: [number, number] | null;
  // Draw condition tracking
  movesSinceCaptureOrPlacement: number;
  lastMove: { from: Position, to: Position, type: 'move' | 'place' } | null;
}

export type GameMove = {
  type: 'place' | 'move';
  to: [number, number];
  from?: [number, number];
  player_id: string;
  timestamp: string;
};

// Represents a potential move, without session data like player_id or timestamp
export type PotentialMove = { type: 'place'; to: [number, number] } | { type: 'move'; from: [number, number]; to: [number, number] };

// Represents a position on the board [row, col]
export type Position = [number, number];

// Defines the connections between board positions
const connections: { [key: string]: Position[] } = {
    '0,0': [[0,1], [1,0], [1,1]],
    '0,1': [[0,0], [0,2], [1,1]],
    '0,2': [[0,1], [0,3], [1,2], [1,1], [1,3]],
    '0,3': [[0,2], [0,4], [1,3]],
    '0,4': [[0,3], [1,4], [1,3]],

    '1,0': [[0,0], [2,0], [1,1]],
    '1,1': [[1,0], [0,1], [1,2], [2,1], [2,2], [0,0], [0,2], [2,0]],
    '1,2': [[0,2], [1,1], [1,3], [2,2]],
    '1,3': [[0,3], [0,4], [1,2], [1,4], [2,2], [2,3], [2,4]],
    '1,4': [[0,4], [1,3], [2,4]],

    '2,0': [[1,0], [3,0], [2,1], [1,1], [3,1]],
    '2,1': [[2,0], [1,1], [3,1], [2,2]],
    '2,2': [[1,1], [1,2], [1,3], [2,1], [2,3], [3,1], [3,2], [3,3]],
    '2,3': [[2,2], [1,3], [3,3], [2,4]],
    '2,4': [[1,4], [1,3], [2,3], [3,3], [3,4]],

    '3,0': [[2,0], [4,0], [3,1]],
    '3,1': [[3,0], [2,0], [2,1], [3,2], [4,0], [4,2], [2,2], [4,1]],
    '3,2': [[3,1], [2,2], [3,3], [4,2]],
    '3,3': [[3,2], [2,3], [2,4], [3,4], [4,2], [4,3], [4,4], [2,2]],
    '3,4': [[2,4], [3,3], [4,4]],

    '4,0': [[3,0], [4,1], [3,1]],
    '4,1': [[4,0], [4,2], [3,1]],
    '4,2': [[4,1], [3,1], [3,2], [3,3], [4,3]],
    '4,3': [[4,2], [3,3], [4,4]],
    '4,4': [[3,4], [4,3], [3,3]]
};

function getConnections(pos: Position): Position[] {
    return connections[`${pos[0]},${pos[1]}`] || [];
}

/**
 * Checks if a move is valid based on the current game state.
 */
export function isMoveValid(state: GameState, move: PotentialMove | GameMove): boolean {
    const { board, currentPlayer, phase } = state;
    const { type, to } = move;
    const from = (move as any).from;

    if (phase === 'placement') {
        if (currentPlayer === 'Goat') {
            if (type !== 'place') return false;
            const [toRow, toCol] = to;
            return board[toRow][toCol] === PieceType.EMPTY; // Can only place on empty spots
        }
        // If it's the tiger's turn during placement, their moves are validated like in the movement phase.
    }

    // Handles tiger moves during placement AND all moves during movement phase.
    if (type !== 'move' || !from) return false;
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    // General movement rules
    if (board[toRow][toCol] !== PieceType.EMPTY) return false; // Must move to an empty spot
    const piece = board[fromRow][fromCol];
    if ((currentPlayer === 'Tiger' && piece !== PieceType.TIGER) || (currentPlayer === 'Goat' && piece !== PieceType.GOAT)) {
        return false; // Not your piece
    }

    // Loop Prevention: Cannot immediately move back to where you just came from
    if (state.lastMove && state.lastMove.type === 'move' && state.lastMove.to[0] === fromRow && state.lastMove.to[1] === fromCol) {
        if (state.lastMove.from[0] === toRow && state.lastMove.from[1] === toCol) {
            return false;
        }
    }

    // Check for a standard move (to adjacent connected spot)
    const isStandardMove = getConnections(from).some(p => p[0] === toRow && p[1] === toCol);
    if (isStandardMove) {
        return true; // Valid for both tigers and goats
    }
    
    // If it's not a standard move, it could be a tiger capture. Goats cannot capture.
    if (currentPlayer === 'Goat') {
        return false;
    }

    // Check for a valid tiger capture (jump over a goat to a connected, empty spot)
    const [midRow, midCol] = [(fromRow + toRow) / 2, (fromCol + toCol) / 2];
    if (Number.isInteger(midRow) && Number.isInteger(midCol)) {
        const isJumpOverGoat = board[midRow][midCol] === PieceType.GOAT;
        if (isJumpOverGoat) {
            // A capture is valid if the path from->mid->to exists.
            const isPathValid = getConnections(from).some(p => p[0] === midRow && p[1] === midCol) &&
                                getConnections([midRow, midCol]).some(p => p[0] === toRow && p[1] === toCol);
            return isPathValid;
        }
    }

    return false;
}

/**
 * Applies a move to the game state and returns the new state.
 * This function assumes the move is valid.
 */
export function applyMove(state: GameState, move: GameMove): GameState {
    const newState = JSON.parse(JSON.stringify(state)); // Deep copy
    const { board, currentPlayer } = newState;
    const { type, from, to } = move;

    if (type === 'place') {
        board[to[0]][to[1]] = PieceType.GOAT; // Place goat
        newState.goatsPlaced++;
        newState.movesSinceCaptureOrPlacement = 0;
    } else if (type === 'move' && from) {
        const piece = board[from[0]][from[1]];
        board[from[0]][from[1]] = PieceType.EMPTY;
        board[to[0]][to[1]] = piece;

        // isMoveValid has already confirmed this is a valid move.
        // If it was a tiger jump, we just need to remove the goat.
        if (currentPlayer === 'Tiger') {
            const dx = Math.abs(from[0] - to[0]);
            const dy = Math.abs(from[1] - to[1]);
            if (dx > 1 || dy > 1) { // A jump is any move greater than 1 unit away
                const midRow = (from[0] + to[0]) / 2;
                const midCol = (from[1] + to[1]) / 2;
                board[midRow][midCol] = PieceType.EMPTY; // Remove captured goat
                board[midRow][midCol] = PieceType.EMPTY; // Remove captured goat
                newState.goatsCaptured++;
                newState.movesSinceCaptureOrPlacement = 0;
            } else {
                newState.movesSinceCaptureOrPlacement++;
            }
        } else {
             newState.movesSinceCaptureOrPlacement++;
        }
    }

    // Record last move
    if (type === 'move' && from) {
        newState.lastMove = { from, to, type };
    } else {
        newState.lastMove = null; // Reset on placement (or handle differently if needed, but placement doesn't cause loops in this context)
    }

    // Switch player
    newState.currentPlayer = currentPlayer === 'Goat' ? 'Tiger' : 'Goat';

    // Update phase
    if (newState.goatsPlaced >= 20 && newState.phase === 'placement') {
        newState.phase = 'movement';
    }

    // After applying move, check for win condition and update status
    const winCheck = checkWinCondition(newState);
    newState.status = winCheck.status;

    return newState;
}

/**
 * Checks for a win condition.
 */
export function checkWinCondition(state: GameState): { status: GameStatus } {
    // Tiger win condition: 5 goats captured
    if (state.goatsCaptured >= 5) {
        return { status: GameStatus.TIGER_WON };
    }

    // Draw condition: 30 moves without capture or placement
    // Only check this if we are in movement phase (full board movement) or if it applies during placement too (usually applies when board is full or stable)
    // Rule says "after 30 moves with no capture or block (rule-defined) after all goats are placed"
    if (state.phase === 'movement' && state.movesSinceCaptureOrPlacement >= 30) {
        return { status: GameStatus.DRAW };
    }

    // Goat win condition: Tigers are trapped
    const tigers = [];
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.board[r][c] === PieceType.TIGER) {
                tigers.push([r, c]);
            }
        }
    }

    // This check must be independent of whose turn it is.
    // We check if any tiger has any valid move.
    if (state.phase === 'movement' && tigers.length > 0) {
        let canAnyTigerMove = false;
        for (const tigerPos of tigers) {
            const moves = getValidTigerMoves(tigerPos as [number, number], state.board);
            if (moves.length > 0) {
                canAnyTigerMove = true;
                break; // Found a movable tiger, no need to check others
            }
        }

        if (!canAnyTigerMove) {
            return { status: GameStatus.GOAT_WON };
        }
    }

    return { status: GameStatus.IN_PROGRESS };
}

/**
 * Gets all valid moves for a single piece at a given position.
 */
export function getMovesForPiece(state: GameState, pos: Position): PotentialMove[] {
    const { board, currentPlayer } = state;
    const piece = board[pos[0]][pos[1]];

    const pieceBelongsToPlayer = (currentPlayer === 'Tiger' && piece === PieceType.TIGER) || (currentPlayer === 'Goat' && piece === PieceType.GOAT);

    if (!pieceBelongsToPlayer) {
        return []; // Not the current player's piece
    }

    if (currentPlayer === 'Tiger') {
        return getValidTigerMoves(pos, board);
    } else { // Goats
        const moves: PotentialMove[] = [];
        for (const to of getConnections(pos)) {
            if (board[to[0]][to[1]] === PieceType.EMPTY) {
                 moves.push({ type: 'move', from: pos, to });
            }
        }
        return moves;
    }
}

/**
 * Helper to get all valid moves for a single tiger.
 */
function getValidTigerMoves(pos: Position, board: PieceType[][]): PotentialMove[] {
    const moves: PotentialMove[] = [];
    const [r, c] = pos;
    
    // Standard moves
    for (const to of getConnections(pos)) {
        if (board[to[0]][to[1]] === PieceType.EMPTY) {
            moves.push({ type: 'move', from: pos, to });
        }
    }
    
    // Capture moves
    for (const mid of getConnections(pos)) {
        if (board[mid[0]][mid[1]] === PieceType.GOAT) { // Is there a goat to jump?
            const to: Position = [mid[0] + (mid[0] - r), mid[1] + (mid[1] - c)];
            if (to[0] >= 0 && to[0] < 5 && to[1] >= 0 && to[1] < 5) { // Is landing on board?
                if (board[to[0]][to[1]] === PieceType.EMPTY) { // Is landing spot empty?
                    // Is the jump valid? (i.e., is the landing spot connected to the spot being jumped?)
                    if (getConnections(mid).some(p => p[0] === to[0] && p[1] === to[1])) {
                         moves.push({ type: 'move', from: pos, to });
                    }
                }
            }
        }
    }
    return moves;
}

/**
 * Gets all valid moves for the current player (for placement or piece selection).
 */
export function getAllValidMoves(state: GameState): PotentialMove[] {
    const { board, currentPlayer, phase } = state;
    const moves: PotentialMove[] = [];

    if (phase === 'placement') {
        if (currentPlayer === 'Goat') {
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    if (board[r][c] === PieceType.EMPTY) {
                        moves.push({ type: 'place', to: [r,c] });
                    }
                }
            }
            return moves;
        }
        // If tiger's turn during placement, fall through to movement logic
    }

    // Movement logic (for movement phase, and for tigers in placement phase)
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const piece = board[r][c];
            if ((currentPlayer === 'Tiger' && piece === PieceType.TIGER) || (currentPlayer === 'Goat' && piece === PieceType.GOAT)) {
                 if (currentPlayer === 'Tiger') {
                    moves.push(...getValidTigerMoves([r, c], board));
                 } else { // Goats
                    for (const to of getConnections([r,c])) {
                        if (board[to[0]][to[1]] === PieceType.EMPTY) {
                             moves.push({ type: 'move', from: [r, c], to });
                        }
                    }
                 }
            }
        }
    }
    
    return moves;
}

/**
 * Checks if the current state has occurred 3 times in the history.
 */
export function checkThreefoldRepetition(currentState: GameState, history: GameState[]): boolean {
    if (!history || history.length < 2) return false;

    let repetitions = 0;
    // History includes the current state if we pushed it before calling this, or not. 
    // Usually history is past states. If we are checking if currentState causes a draw, we check against history + currentState.
    // Let's assume history contains *previous* states, and we are checking currentState.
    
    // Helper to serialize relevant state for comparison
    const serializeState = (state: GameState) => {
        return JSON.stringify({
            board: state.board,
            currentPlayer: state.currentPlayer,
            // Phase is implicit from board/counts but good to include
            phase: state.phase, 
            goatsCaptured: state.goatsCaptured,
            goatsPlaced: state.goatsPlaced
        });
    };

    const currentSerialized = serializeState(currentState);

    // Count in history
    for (const state of history) {
        if (serializeState(state) === currentSerialized) {
            repetitions++;
        }
    }

    // Add 1 for the current state itself
    return repetitions >= 3;
}

// ============================================================================
// AI ENHANCEMENTS
// ============================================================================

/**
 * Zobrist hashing for transposition tables
 * Each position on the board has a unique random number for each piece type
 */
let zobristTable: number[][][] = [];
let zobristSideToMove: number = 0;

/**
 * Initialize Zobrist random numbers (call once at startup)
 */
export function initializeZobrist(): void {
    const randomSeed = 12345; // Fixed seed for consistency
    let seed = randomSeed;
    
    // Simple pseudo-random number generator (LCG)
    const random = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed;
    };

    // Initialize table: [row][col][pieceType]
    zobristTable = [];
    for (let r = 0; r < 5; r++) {
        zobristTable[r] = [];
        for (let c = 0; c < 5; c++) {
            zobristTable[r][c] = [
                random(), // EMPTY (not used, but keep consistent indexing)
                random(), // TIGER
                random(), // GOAT
            ];
        }
    }
    zobristSideToMove = random();
}

/**
 * Compute Zobrist hash for a game state
 */
export function getPositionHash(state: GameState): number {
    if (zobristTable.length === 0) {
        initializeZobrist();
    }
    
    let hash = 0;
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const piece = state.board[r][c];
            if (piece !== PieceType.EMPTY) {
                hash ^= zobristTable[r][c][piece];
            }
        }
    }
    
    // Include side to move
    if (state.currentPlayer === 'Tiger') {
        hash ^= zobristSideToMove;
    }
    
    return hash;
}

/**
 * Represents a multi-capture chain for tigers
 */
export interface CaptureChain {
    positions: Position[];      // Path the tiger takes
    capturedGoats: Position[];  // Goats captured along the way
}

/**
 * Generate all possible capture chains starting from a position
 * Uses DFS to find all possible multi-capture sequences
 */
export function generateCaptureChains(
    startPos: Position,
    board: PieceType[][],
    visited: Set<string> = new Set()
): CaptureChain[] {
    const chains: CaptureChain[] = [];
    const [r, c] = startPos;
    
    // Mark current position as visited
    const posKey = `${r},${c}`;
    visited.add(posKey);
    
    // Try all capture moves from current position
    let foundCapture = false;
    for (const mid of getConnections(startPos)) {
        if (board[mid[0]][mid[1]] === PieceType.GOAT) {
            const to: Position = [mid[0] + (mid[0] - r), mid[1] + (mid[1] - c)];
            
            // Check if jump is valid
            if (to[0] >= 0 && to[0] < 5 && to[1] >= 0 && to[1] < 5 &&
                board[to[0]][to[1]] === PieceType.EMPTY &&
                getConnections(mid).some(p => p[0] === to[0] && p[1] === to[1])) {
                
                foundCapture = true;
                
                // Make the capture temporarily
                const originalGoat = board[mid[0]][mid[1]];
                board[mid[0]][mid[1]] = PieceType.EMPTY;
                
                // Recursively find further captures
                const furtherChains = generateCaptureChains(to, board, new Set(visited));
                
                if (furtherChains.length > 0) {
                    // Extend each further chain
                    for (const chain of furtherChains) {
                        chains.push({
                            positions: [startPos, ...chain.positions],
                            capturedGoats: [mid, ...chain.capturedGoats],
                        });
                    }
                } else {
                    // No further captures, this is a terminal chain
                    chains.push({
                        positions: [startPos, to],
                        capturedGoats: [mid],
                    });
                }
                
                // Undo the capture
                board[mid[0]][mid[1]] = originalGoat;
            }
        }
    }
    
    // If no captures found from this position, return empty
    return chains;
}

/**
 * Get all valid tiger moves including multi-capture chains
 * Returns both simple moves and complete capture sequences
 */
export function getAllTigerMoves(pos: Position, board: PieceType[][]): PotentialMove[] {
    const moves: PotentialMove[] = [];
    
    // Standard moves (non-capture)
    for (const to of getConnections(pos)) {
        if (board[to[0]][to[1]] === PieceType.EMPTY) {
            moves.push({ type: 'move', from: pos, to });
        }
    }
    
    // Capture moves (including chains)
    const chains = generateCaptureChains(pos, board);
    for (const chain of chains) {
        // Return the final position in the chain
        const finalPos = chain.positions[chain.positions.length - 1];
        moves.push({ type: 'move', from: pos, to: finalPos });
    }
    
    return moves;
}

/**
 * Check if a move is a capture move
 */
export function isCaptureMove(from: Position, to: Position, board: PieceType[][]): boolean {
    const dx = Math.abs(from[0] - to[0]);
    const dy = Math.abs(from[1] - to[1]);
    // A capture is any move > 1 unit away OR if there's a goat in between
    if (dx > 1 || dy > 1) {
        return true;
    }
    return false;
}

/**
 * Count the number of valid moves for all tigers
 */
export function countTigerMobility(state: GameState): number {
    let count = 0;
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.board[r][c] === PieceType.TIGER) {
                count += getAllTigerMoves([r, c], state.board).length;
            }
        }
    }
    return count;
}

/**
 * Count the number of valid moves for all goats
 */
export function countGoatMobility(state: GameState): number {
    let count = 0;
    
    // During placement phase, mobility is number of empty squares
    if (state.phase === 'placement' && state.goatsPlaced < 20) {
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                if (state.board[r][c] === PieceType.EMPTY) {
                    count++;
                }
            }
        }
        return count;
    }
    
    // During movement phase, count actual moves
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.board[r][c] === PieceType.GOAT) {
                for (const neighbor of getConnections([r, c])) {
                    if (state.board[neighbor[0]][neighbor[1]] === PieceType.EMPTY) {
                        count++;
                    }
                }
            }
        }
    }
    return count;
}

/**
 * For each tiger, count how many empty neighbors it has
 * Returns an array of counts (one per tiger)
 */
export function getEmptyNeighborsAroundTigers(state: GameState): number[] {
    const counts: number[] = [];
    
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.board[r][c] === PieceType.TIGER) {
                let emptyCount = 0;
                for (const neighbor of getConnections([r, c])) {
                    if (state.board[neighbor[0]][neighbor[1]] === PieceType.EMPTY) {
                        emptyCount++;
                    }
                }
                counts.push(emptyCount);
            }
        }
    }
    
    return counts;
}

/**
 * Count how many goats are in immediate danger of being captured
 */
export function countVulnerableGoats(state: GameState): number {
    let vulnerable = 0;
    
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.board[r][c] === PieceType.TIGER) {
                // Check each direction for a jump opportunity
                for (const mid of getConnections([r, c])) {
                    if (state.board[mid[0]][mid[1]] === PieceType.GOAT) {
                        const to: Position = [mid[0] + (mid[0] - r), mid[1] + (mid[1] - c)];
                        if (to[0] >= 0 && to[0] < 5 && to[1] >= 0 && to[1] < 5 &&
                            state.board[to[0]][to[1]] === PieceType.EMPTY &&
                            getConnections(mid).some(p => p[0] === to[0] && p[1] === to[1])) {
                            vulnerable++;
                        }
                    }
                }
            }
        }
    }
    
    return vulnerable;
}

/**
 * Count tigers that are "trapped" (have very limited mobility)
 */
export function countTrappedTigers(state: GameState): number {
    let trapped = 0;
    
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.board[r][c] === PieceType.TIGER) {
                const moves = getAllTigerMoves([r, c], state.board);
                if (moves.length <= 1) {
                    trapped++;
                }
            }
        }
    }
    
    return trapped;
}

/**
 * Calculate a centralization score for tigers
 * Center positions are more valuable in early/mid game
 */
export function getTigerCentralization(state: GameState): number {
    let score = 0;
    const center = [2, 2];
    
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.board[r][c] === PieceType.TIGER) {
                const distance = Math.abs(r - center[0]) + Math.abs(c - center[1]);
                score += (4 - distance); // Closer to center = higher score
            }
        }
    }
    
    return score;
}

/**
 * Efficient move application for AI search (mutates state)
 * Returns information needed for undo
 */
export interface UndoInfo {
    capturedGoat?: Position;
    previousPlayer: PlayerSide;
}

export function makeMove(state: GameState, move: PotentialMove): UndoInfo {
    const undoInfo: UndoInfo = {
        previousPlayer: state.currentPlayer,
    };
    
    if (move.type === 'place') {
        state.board[move.to[0]][move.to[1]] = PieceType.GOAT;
        state.goatsPlaced++;
    } else {
        const piece = state.board[move.from[0]][move.from[1]];
        state.board[move.from[0]][move.from[1]] = PieceType.EMPTY;
        state.board[move.to[0]][move.to[1]] = piece;
        
        // Check for capture
        if (state.currentPlayer === 'Tiger') {
            const dx = Math.abs(move.from[0] - move.to[0]);
            const dy = Math.abs(move.from[1] - move.to[1]);
            if (dx > 1 || dy > 1) {
                const midRow = Math.floor((move.from[0] + move.to[0]) / 2);
                const midCol = Math.floor((move.from[1] + move.to[1]) / 2);
                undoInfo.capturedGoat = [midRow, midCol];
                state.board[midRow][midCol] = PieceType.EMPTY;
                state.goatsCaptured++;
            }
        }
    }
    
    // Switch player
    state.currentPlayer = state.currentPlayer === 'Goat' ? 'Tiger' : 'Goat';
    
    // Update phase if needed
    if (state.goatsPlaced >= 20 && state.phase === 'placement') {
        state.phase = 'movement';
    }
    
    return undoInfo;
}

/**
 * Undo a move (for AI search)
 */
export function undoMove(state: GameState, move: PotentialMove, undoInfo: UndoInfo): void {
    // Restore player
    state.currentPlayer = undoInfo.previousPlayer;
    
    if (move.type === 'place') {
        state.board[move.to[0]][move.to[1]] = PieceType.EMPTY;
        state.goatsPlaced--;
    } else {
        const piece = state.board[move.to[0]][move.to[1]];
        state.board[move.to[0]][move.to[1]] = PieceType.EMPTY;
        state.board[move.from[0]][move.from[1]] = piece;
        
        // Restore captured goat if any
        if (undoInfo.capturedGoat) {
            state.board[undoInfo.capturedGoat[0]][undoInfo.capturedGoat[1]] = PieceType.GOAT;
            state.goatsCaptured--;
        }
    }
    
    // Restore phase if needed
    if (state.goatsPlaced < 20) {
        state.phase = 'placement';
    }
}

/**
 * Create a lightweight copy of game state for AI search
 */
export function cloneGameState(state: GameState): GameState {
    return {
        board: state.board.map(row => [...row]),
        currentPlayer: state.currentPlayer,
        phase: state.phase,
        goatsCaptured: state.goatsCaptured,
        goatsPlaced: state.goatsPlaced,
        status: state.status,
        selectedPosition: state.selectedPosition,
        movesSinceCaptureOrPlacement: state.movesSinceCaptureOrPlacement,
        lastMove: state.lastMove,
    };
}