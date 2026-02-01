import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Game } from '../../services/types';
import { GameState } from '../../game-logic/baghchal';

interface ActiveGameState {
    game: Game;
    history: GameState[]; // Store the sequence of states to allow for undo, etc.
    local: boolean; // Is this a local-only game?
}

interface GameSliceState {
    activeGame: ActiveGameState | null;
    // Local game history for offline tracking
    localGameHistory: {
        gameId: string;
        result: 'win' | 'loss' | 'draw';
        mode: 'ai' | 'local';
        playerSide?: 'TIGER' | 'GOAT';
        aiDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
        date: string;
    }[];
}

const initialState: GameSliceState = {
    activeGame: null,
    localGameHistory: [],
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        // Reducer to start a local game (PVP or vs AI)
        startLocalGame: (state, action: PayloadAction<Game>) => {
            state.activeGame = {
                game: action.payload,
                history: [action.payload.game_state],
                local: true,
            };
        },
        // Reducer to update a local game's state
        updateLocalGame: (state, action: PayloadAction<GameState>) => {
            if (state.activeGame && state.activeGame.local) {
                state.activeGame.game.game_state = action.payload;
                state.activeGame.game.status = action.payload.status;
                state.activeGame.history.push(action.payload);
            }
        },
        // Clear the active game when it's over or the user navigates away
        clearActiveGame: (state) => {
            state.activeGame = null;
        },
        // Record completed game for local history
        recordGameResult: (state, action: PayloadAction<{
            gameId: string;
            result: 'win' | 'loss' | 'draw';
            mode: 'ai' | 'local';
            playerSide?: 'TIGER' | 'GOAT';
            aiDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
        }>) => {
            state.localGameHistory.unshift({
                ...action.payload,
                date: new Date().toISOString(),
            });
            // Keep only last 50 games
            if (state.localGameHistory.length > 50) {
                state.localGameHistory = state.localGameHistory.slice(0, 50);
            }
        },
        // Clear game history
        clearGameHistory: (state) => {
            state.localGameHistory = [];
        },
    },
    // No extraReducers - removed all API dependencies
});

export const { startLocalGame, updateLocalGame, clearActiveGame, recordGameResult, clearGameHistory } = gameSlice.actions;

export default gameSlice.reducer; 