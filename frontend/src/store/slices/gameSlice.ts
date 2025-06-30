import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PlayerSide = 'tigers' | 'goats';
export type GameMode = 'pvp' | 'pvai' | 'pvp-local';
export type GameStatus = 'waiting' | 'active' | 'completed' | 'cancelled';
export type GamePhase = 'placement' | 'movement';
export type PieceType = 0 | 1 | 2; // 0 = empty, 1 = tiger, 2 = goat

export interface GamePlayer {
  id: string;
  username: string;
  rating: number;
  side: PlayerSide;
}

export interface GameMove {
  type: 'place' | 'move';
  from?: [number, number];
  to: [number, number];
  captured?: [number, number];
  player_id: string;
  timestamp: string;
}

export interface GameState {
  // Current game session
  gameId: string | null;
  gameMode: GameMode | null;
  status: GameStatus;
  
  // Players
  player1: GamePlayer | null;
  player2: GamePlayer | null;
  currentPlayer: PlayerSide;
  userSide: PlayerSide | null;
  
  // Board state
  board: PieceType[][];
  phase: GamePhase;
  goatsPlaced: number;
  goatsCaptured: number;
  
  // Game result
  winner: PlayerSide | null;
  gameOver: boolean;
  
  // UI state
  selectedPosition: [number, number] | null;
  validMoves: [number, number][];
  lastMove: GameMove | null;
  
  // Connection state
  connected: boolean;
  loading: boolean;
  error: string | null;
  
  // History
  moveHistory: GameMove[];
  
  // Available games (lobby)
  availableGames: any[];
}

const initialBoard: PieceType[][] = [
  [1, 0, 0, 0, 1],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [1, 0, 0, 0, 1],
];

const initialState: GameState = {
  gameId: null,
  gameMode: null,
  status: 'waiting',
  
  player1: null,
  player2: null,
  currentPlayer: 'goats',
  userSide: null,
  
  board: initialBoard,
  phase: 'placement',
  goatsPlaced: 0,
  goatsCaptured: 0,
  
  winner: null,
  gameOver: false,
  
  selectedPosition: null,
  validMoves: [],
  lastMove: null,
  
  connected: false,
  loading: false,
  error: null,
  
  moveHistory: [],
  availableGames: [],
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Game session management
    startLocalPVPGame: (state) => {
      return {
        ...initialState,
        gameMode: 'pvp-local',
        status: 'active',
        player1: { id: 'tigers', username: 'Tigers', rating: 0, side: 'tigers' },
        player2: { id: 'goats', username: 'Goats', rating: 0, side: 'goats' },
        currentPlayer: 'goats', // Goats always start in placement phase
        userSide: null, // Not relevant for local pvp
      };
    },
    createGameStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    createGameSuccess: (state, action: PayloadAction<{
      gameId: string;
      gameMode: GameMode;
      userSide: PlayerSide;
      player: GamePlayer;
    }>) => {
      state.loading = false;
      state.gameId = action.payload.gameId;
      state.gameMode = action.payload.gameMode;
      state.userSide = action.payload.userSide;
      state.status = action.payload.gameMode === 'pvp' ? 'waiting' : 'active';
      
      if (action.payload.userSide === 'tigers') {
        state.player1 = action.payload.player;
      } else {
        state.player2 = action.payload.player;
      }
    },
    joinGameSuccess: (state, action: PayloadAction<{
      gameId: string;
      player1: GamePlayer;
      player2: GamePlayer;
      userSide: PlayerSide;
    }>) => {
      state.gameId = action.payload.gameId;
      state.gameMode = 'pvp';
      state.status = 'active';
      state.player1 = action.payload.player1;
      state.player2 = action.payload.player2;
      state.userSide = action.payload.userSide;
    },
    
    // Board state updates
    updateBoard: (state, action: PayloadAction<{
      board: PieceType[][];
      currentPlayer: PlayerSide;
      phase: GamePhase;
      goatsPlaced: number;
      goatsCaptured: number;
    }>) => {
      state.board = action.payload.board;
      state.currentPlayer = action.payload.currentPlayer;
      state.phase = action.payload.phase;
      state.goatsPlaced = action.payload.goatsPlaced;
      state.goatsCaptured = action.payload.goatsCaptured;
    },
    
    // Move handling
    localMove: (state, action: PayloadAction<{ board: PieceType[][]; nextPlayer: PlayerSide; phase: GamePhase; goatsPlaced: number; goatsCaptured: number; gameOver: boolean; winner: PlayerSide | null }>) => {
      state.board = action.payload.board;
      state.currentPlayer = action.payload.nextPlayer;
      state.phase = action.payload.phase;
      state.goatsPlaced = action.payload.goatsPlaced;
      state.goatsCaptured = action.payload.goatsCaptured;
      state.gameOver = action.payload.gameOver;
      state.winner = action.payload.winner;
      state.selectedPosition = null;
      state.validMoves = [];
    },
    makeMove: (state, action: PayloadAction<GameMove>) => {
      state.moveHistory.push(action.payload);
      state.lastMove = action.payload;
      state.selectedPosition = null;
      state.validMoves = [];
    },
    
    // UI interactions
    selectPosition: (state, action: PayloadAction<[number, number] | null>) => {
      state.selectedPosition = action.payload;
      if (action.payload === null) {
        state.validMoves = [];
      }
    },
    setValidMoves: (state, action: PayloadAction<[number, number][]>) => {
      state.validMoves = action.payload;
    },
    
    // Game end
    gameEnded: (state, action: PayloadAction<{
      winner: PlayerSide;
      reason?: string;
    }>) => {
      state.gameOver = true;
      state.winner = action.payload.winner;
      state.status = 'completed';
    },
    
    // Connection management
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    
    // Available games (lobby)
    setAvailableGames: (state, action: PayloadAction<any[]>) => {
      state.availableGames = action.payload;
    },
    
    // Reset game state
    resetGame: () => initialState,
    
    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  startLocalPVPGame,
  createGameStart,
  createGameSuccess,
  joinGameSuccess,
  updateBoard,
  localMove,
  makeMove,
  selectPosition,
  setValidMoves,
  gameEnded,
  setConnected,
  setAvailableGames,
  resetGame,
  setError,
  clearError,
} = gameSlice.actions;

export default gameSlice.reducer; 