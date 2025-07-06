import { GameState, GameMove } from '../store/slices/gameSlice';

export type PlayerSide = 'tigers' | 'goats';
export type GamePhase = 'placement' | 'movement';
export type PieceType = 0 | 1 | 2; // 0 = empty, 1 = tiger, 2 = goat

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
        if (currentPlayer === 'goats') {
            if (type !== 'place') return false;
            const [toRow, toCol] = to;
            return board[toRow][toCol] === 0; // Can only place on empty spots
        }
        // If it's the tiger's turn during placement, their moves are validated like in the movement phase.
    }

    // Handles tiger moves during placement AND all moves during movement phase.
    if (type !== 'move' || !from) return false;
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    // General movement rules
    if (board[toRow][toCol] !== 0) return false; // Must move to an empty spot
    const piece = board[fromRow][fromCol];
    if ((currentPlayer === 'tigers' && piece !== 1) || (currentPlayer === 'goats' && piece !== 2)) {
        return false; // Not your piece
    }

    // Check for a standard move (to adjacent connected spot)
    const isStandardMove = getConnections(from).some(p => p[0] === toRow && p[1] === toCol);
    if (isStandardMove) {
        return true; // Valid for both tigers and goats
    }
    
    // If it's not a standard move, it could be a tiger capture. Goats cannot capture.
    if (currentPlayer === 'goats') {
        return false;
    }

    // Check for a valid tiger capture (jump over a goat to a connected, empty spot)
    const [midRow, midCol] = [(fromRow + toRow) / 2, (fromCol + toCol) / 2];
    if (Number.isInteger(midRow) && Number.isInteger(midCol)) {
        const isJumpOverGoat = board[midRow][midCol] === 2;
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
        board[to[0]][to[1]] = 2; // Place goat
        newState.goatsPlaced++;
    } else if (type === 'move' && from) {
        const piece = board[from[0]][from[1]];
        board[from[0]][from[1]] = 0;
        board[to[0]][to[1]] = piece;

        // isMoveValid has already confirmed this is a valid move.
        // If it was a tiger jump, we just need to remove the goat.
        if (currentPlayer === 'tigers') {
            const dx = Math.abs(from[0] - to[0]);
            const dy = Math.abs(from[1] - to[1]);
            if (dx > 1 || dy > 1) { // A jump is any move greater than 1 unit away
                const midRow = (from[0] + to[0]) / 2;
                const midCol = (from[1] + to[1]) / 2;
                board[midRow][midCol] = 0; // Remove captured goat
                newState.goatsCaptured++;
            }
        }
    }

    // Switch player
    newState.currentPlayer = currentPlayer === 'goats' ? 'tigers' : 'goats';

    // Update phase
    if (newState.goatsPlaced >= 20 && newState.phase === 'placement') {
        newState.phase = 'movement';
    }

    return newState;
}

/**
 * Checks for a win condition.
 */
export function checkWinCondition(state: GameState): { winner: 'tigers' | 'goats' | 'draw' | null, gameOver: boolean } {
    // Tiger win condition: 5 goats captured
    if (state.goatsCaptured >= 5) {
        return { winner: 'tigers', gameOver: true };
    }

    // Goat win condition: Tigers are trapped
    const tigers = [];
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.board[r][c] === 1) {
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
            return { winner: 'goats', gameOver: true };
        }
    }

    return { winner: null, gameOver: false };
}

/**
 * Gets all valid moves for a single piece at a given position.
 */
export function getMovesForPiece(state: GameState, pos: Position): PotentialMove[] {
    const { board, currentPlayer } = state;
    const piece = board[pos[0]][pos[1]];

    const pieceBelongsToPlayer = (currentPlayer === 'tigers' && piece === 1) || (currentPlayer === 'goats' && piece === 2);

    if (!pieceBelongsToPlayer) {
        return []; // Not the current player's piece
    }

    if (currentPlayer === 'tigers') {
        return getValidTigerMoves(pos, board);
    } else { // Goats
        const moves: PotentialMove[] = [];
        for (const to of getConnections(pos)) {
            if (board[to[0]][to[1]] === 0) {
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
        if (board[to[0]][to[1]] === 0) {
            moves.push({ type: 'move', from: pos, to });
        }
    }
    
    // Capture moves
    for (const mid of getConnections(pos)) {
        if (board[mid[0]][mid[1]] === 2) { // Is there a goat to jump?
            const to: Position = [mid[0] + (mid[0] - r), mid[1] + (mid[1] - c)];
            if (to[0] >= 0 && to[0] < 5 && to[1] >= 0 && to[1] < 5) { // Is landing on board?
                if (board[to[0]][to[1]] === 0) { // Is landing spot empty?
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
        if (currentPlayer === 'goats') {
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    if (board[r][c] === 0) {
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
            if ((currentPlayer === 'tigers' && piece === 1) || (currentPlayer === 'goats' && piece === 2)) {
                 if (currentPlayer === 'tigers') {
                    moves.push(...getValidTigerMoves([r, c], board));
                 } else { // Goats
                    for (const to of getConnections([r,c])) {
                        if (board[to[0]][to[1]] === 0) {
                             moves.push({ type: 'move', from: [r, c], to });
                        }
                    }
                 }
            }
        }
    }
    
    return moves;
} 