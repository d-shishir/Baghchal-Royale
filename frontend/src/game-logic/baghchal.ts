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
                newState.goatsCaptured++;
            }
        }
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