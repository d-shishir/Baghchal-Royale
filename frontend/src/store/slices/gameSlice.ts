import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Game } from '../../services/types';
import { GameState } from '../../game-logic/baghchal';
import { api } from '../../services/api';

interface ActiveGameState {
    game: Game;
    history: GameState[]; // Store the sequence of states to allow for undo, etc.
    local: boolean; // Is this a local-only game?
}

interface GameSliceState {
    activeGame: ActiveGameState | null;
}

const initialState: GameSliceState = {
    activeGame: null,
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
    },
    extraReducers: (builder) => {
        // When a user fetches a specific game, set it as the active game
        builder.addMatcher(
            api.endpoints.getGameById.matchFulfilled,
            (state, action: PayloadAction<Game>) => {
                state.activeGame = {
                    game: action.payload,
                    history: [action.payload.game_state], // For now, only the current state from API
                    local: false,
                };
            }
        );
        // Can add matchers for AI games here later if needed
    },
});

export const { startLocalGame, updateLocalGame, clearActiveGame } = gameSlice.actions;

export default gameSlice.reducer; 