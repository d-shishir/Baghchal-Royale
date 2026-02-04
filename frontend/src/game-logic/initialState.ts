import { GameState, GameStatus, PieceType } from "./baghchal";

export const initialGameState: GameState = {
    board: [
      [1, 0, 0, 0, 1],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1],
    ],
    currentPlayer: 'Goat',
    phase: 'placement',
    goatsCaptured: 0,
    goatsPlaced: 0,
    status: GameStatus.IN_PROGRESS,
    selectedPosition: null,
    movesSinceCaptureOrPlacement: 0,
    lastMove: null,
};
