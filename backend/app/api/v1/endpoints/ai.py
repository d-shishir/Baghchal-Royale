from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps
from app.schemas.ai import AIInput
from app.core.enhanced_ai import get_enhanced_ai_move, get_ai_status, reload_models
from app.core.baghchal_env import BaghchalEnv, Player, GamePhase, PieceType
from app.models.ai_game import AIGameDifficulty
import numpy as np
from typing import Any, Optional, Tuple
import uuid
import asyncio

router = APIRouter()

def convert_board_to_numpy(board: list[list[str]]) -> np.ndarray:
    mapping = {
        'T': PieceType.TIGER.value, 
        'G': PieceType.GOAT.value, 
        'EMPTY': PieceType.EMPTY.value
    }
    
    new_board = np.zeros((5,5), dtype=int)
    for r in range(5):
        for c in range(5):
            # The frontend board might be using 'T', 'G', or 'EMPTY'
            # The piece type enum values are 1 for Tiger, 2 for Goat, 0 for Empty
            key = board[r][c]
            if key not in mapping:
                # Handle cases where the frontend might send different values, if necessary
                # For now, we assume it's one of the three.
                pass
            new_board[r, c] = mapping[key]

    return new_board

def convert_player_to_enum(player: str) -> Player:
    if player.lower() == 'tiger':
        return Player.TIGER
    return Player.GOAT

@router.post("/move", response_model=dict)
async def get_ai_move(
    *,
    db: AsyncSession = Depends(deps.get_db),
    ai_input: AIInput,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get AI move and record it.
    """
    if current_user.user_id != ai_input.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    game_state = ai_input.game_state
    difficulty = ai_input.difficulty

    try:
        # Get or create AI Game
        if ai_input.ai_game_id:
            ai_game = await crud.ai_game.get(db, id=ai_input.ai_game_id)
            if not ai_game:
                raise HTTPException(status_code=404, detail="AIGame not found")
        else:
            ai_game_in = schemas.AIGameCreate(
                user_id=ai_input.user_id,
                difficulty=AIGameDifficulty(ai_input.difficulty.upper()),
                user_side=ai_input.player_side.upper(),
            )
            ai_game = await crud.ai_game.create(db, obj_in=ai_game_in)

        # Create a clean, non-database-linked environment for the synchronous AI function
        env = BaghchalEnv()
        
        board_np = convert_board_to_numpy(game_state.board)
        current_player_enum = convert_player_to_enum(game_state.currentPlayer)

        # Manually set the state of the new environment
        env.board = board_np
        env.current_player = current_player_enum
        env.goats_captured = game_state.goatsCaptured
        env.goats_placed = game_state.goatsPlaced
        env.phase = GamePhase.PLACEMENT if game_state.phase == 'placement' else GamePhase.MOVEMENT

        state_dict = env.get_state()
        
        # Run the synchronous, CPU-bound AI function in a separate thread
        # Use enhanced AI with Q-learning support and difficulty-based randomness
        move = await asyncio.to_thread(get_enhanced_ai_move, current_player_enum, env, state_dict, difficulty)

        if move is None:
             raise HTTPException(status_code=400, detail="AI could not find a valid move.")

        move_number = (await crud.ai_move.get_moves_count_by_game(db, ai_game_id=ai_game.ai_game_id)) + 1

        is_user_move = ai_input.player_side.upper() == game_state.currentPlayer.upper()
        player_str = "user" if is_user_move else "ai"

        move_to_log = {
            "ai_game_id": ai_game.ai_game_id,
            "move_number": move_number,
            "player": player_str,
            "from_pos": "",
            "to_pos": "",
        }

        if move[0] == 'place':
            move_to_log.update({
                "move_type": "place",
                "from_pos": "0,0", # Placeholder
                "to_pos": f"{move[1]},{move[2]}",
            })
            response_move = {"type": "place", "to": [move[1], move[2]]}
        elif move[0] == 'move':
            move_to_log.update({
                "move_type": "move",
                "from_pos": f"{move[1]},{move[2]}",
                "to_pos": f"{move[3]},{move[4]}",
            })
            response_move = {"type": "move", "from": [move[1], move[2]], "to": [move[3], move[4]]}
        else:
            raise HTTPException(status_code=400, detail="Invalid move type from AI")
        
        ai_move_in = schemas.AIMoveCreate(**move_to_log)
        await crud.ai_move.create(db, obj_in=ai_move_in)

        return {"move": response_move, "ai_game_id": ai_game.ai_game_id}

    except Exception as e:
        # Log the exception for debugging
        print(f"Error in get_ai_move: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while processing the AI move.") 