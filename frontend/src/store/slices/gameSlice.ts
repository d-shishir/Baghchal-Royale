import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PlayerSide = 'Goat' | 'Tiger';
export type GameMode = 'multiplayer' | 'pvai' | 'pvp-local';
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
  matchId: string | null;
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
  winner: PlayerSide | 'draw' | null;
  gameOver: boolean;
  
  // UI state
  selectedPosition: [number, number] | null;
  lastMove: GameMove | null;
  
  // Connection state
  connected: boolean;
  loading: boolean;
  error: string | null;
  
  // History
  moveHistory: GameMove[];
  
  // Available games (lobby)
  availableGames: any[];
  
  // Additional fields
  validMoves: { from: [number, number]; to: [number, number] }[];
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
  matchId: null,
  gameMode: null,
  status: 'waiting',
  
  player1: null,
  player2: null,
  currentPlayer: 'Goat',
  userSide: null,
  
  board: initialBoard,
  phase: 'placement',
  goatsPlaced: 0,
  goatsCaptured: 0,
  
  winner: null,
  gameOver: false,
  
  selectedPosition: null,
  lastMove: null,
  
  connected: false,
  loading: false,
  error: null,
  
  moveHistory: [],
  availableGames: [],
  
  validMoves: [],
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setMultiplayerGame: (state, action: PayloadAction<{ matchId: string, opponentId: string, playerSide: PlayerSide }>) => {
      state.gameMode = 'multiplayer';
      state.matchId = action.payload.matchId;
      state.userSide = action.payload.playerSide;
      // You can set player names etc. here if you fetch them
    },
    startAIGame: (state, action: PayloadAction<{ userSide: PlayerSide }>) => {
      return {
        ...initialState,
        gameMode: 'pvai',
        status: 'active',
        userSide: action.payload.userSide,
        player1: { id: 'user', username: 'You', rating: 1200, side: action.payload.userSide },
        player2: { id: 'ai', username: 'AI', rating: 1200, side: action.payload.userSide === 'Tiger' ? 'Goat' : 'Tiger' },
        currentPlayer: 'Goat',
      };
    },
    // Game session management
    startLocalPVPGame: (state) => {
      return {
        ...initialState,
        gameMode: 'pvp-local',
        status: 'active',
        player1: { id: 'Tiger', username: 'Tigers', rating: 0, side: 'Tiger' },
        player2: { id: 'Goat', username: 'Goats', rating: 0, side: 'Goat' },
        currentPlayer: 'Goat', // Goats always start in placement phase
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
      state.status = action.payload.gameMode === 'multiplayer' ? 'waiting' : 'active';
      
      if (action.payload.userSide === 'Tiger') {
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
      state.gameMode = 'multiplayer';
      state.status = 'active';
      state.player1 = action.payload.player1;
      state.player2 = action.payload.player2;
      state.userSide = action.payload.userSide;
    },
    
    startMultiplayerGame: (state, action: PayloadAction<{
      gameId: string;
      userSide: PlayerSide;
      host: { id: string, username: string, rating: number };
    }>) => {
      const { gameId, userSide, host } = action.payload;
      const opponentSide = userSide === 'Tiger' ? 'Goat' : 'Tiger';

      return {
        ...initialState,
        gameId,
        gameMode: 'multiplayer',
        status: 'active',
        userSide,
        player1: userSide === 'Tiger' ? { id: 'user', username: 'You', rating: 1200, side: 'Tiger' } : { id: host.id, username: host.username, rating: host.rating, side: 'Tiger' },
        player2: userSide === 'Goat' ? { id: 'user', username: 'You', rating: 1200, side: 'Goat' } : { id: host.id, username: host.username, rating: host.rating, side: 'Goat' },
        currentPlayer: 'Goat',
      };
    },
    
    // Board state updates
    updateBoard: (state, action: PayloadAction<{
      board: PieceType[][];
      nextPlayer: PlayerSide;
      phase: GamePhase;
      goatsPlaced: number;
      goatsCaptured: number;
      gameOver: boolean;
      winner: PlayerSide | 'draw' | null;
    }>) => {
      state.board = action.payload.board;
      state.currentPlayer = action.payload.nextPlayer;
      state.phase = action.payload.phase;
      state.goatsPlaced = action.payload.goatsPlaced;
      state.goatsCaptured = action.payload.goatsCaptured;
      state.gameOver = action.payload.gameOver;
      state.winner = action.payload.winner;
    },
    
    // Move handling
    localMove: (state, action: PayloadAction<{
      board: PieceType[][],
      nextPlayer: PlayerSide,
      phase: GamePhase,
      goatsPlaced: number,
      goatsCaptured: number,
      gameOver: boolean,
      winner: PlayerSide | 'draw' | null,
    }>) => {
      state.board = action.payload.board;
      state.currentPlayer = action.payload.nextPlayer;
      state.phase = action.payload.phase;
      state.goatsPlaced = action.payload.goatsPlaced;
      state.goatsCaptured = action.payload.goatsCaptured;
      state.gameOver = action.payload.gameOver;
      state.winner = action.payload.winner;
      state.selectedPosition = null;
    },
    makeMove: (state, action: PayloadAction<GameMove>) => {
      state.moveHistory.push(action.payload);
      state.lastMove = action.payload;
      state.selectedPosition = null;
    },
    
    // UI interactions
    selectPosition: (state, action: PayloadAction<[number, number] | null>) => {
      state.selectedPosition = action.payload;
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
  startAIGame,
  startLocalPVPGame,
  createGameStart,
  createGameSuccess,
  joinGameSuccess,
  startMultiplayerGame,
  updateBoard,
  localMove,
  makeMove,
  selectPosition,
  gameEnded,
  setConnected,
  setAvailableGames,
  resetGame,
  setMultiplayerGame,
  setError,
  clearError,
} = gameSlice.actions;

export default gameSlice.reducer; 