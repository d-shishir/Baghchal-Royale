from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
import json

from app import crud, models, schemas
from app.api import deps
from app.core.baghchal_env import BaghchalEnv, Player
from app.core.enhanced_ai import get_enhanced_ai_move
from app.core.game_utils import reconstruct_game_state
from pydantic import BaseModel

router = APIRouter()

# In-memory game sessions (for active games)
active_games: Dict[str, BaghchalEnv] = {}
# Stores AI player info for PvAI games
ai_game_info: Dict[str, Dict[str, str]] = {}


class MoveRequest(BaseModel):
    action_type: str
    row: Optional[int] = None
    col: Optional[int] = None
    from_row: Optional[int] = None
    from_col: Optional[int] = None
    to_row: Optional[int] = None
    to_col: Optional[int] = None

class CreateGameRequest(BaseModel):
    mode: str = "pvai"
    side: Optional[str] = "goats"
    difficulty: Optional[str] = "medium"


def execute_ai_move_if_needed(game_id: str, db: Session) -> Optional[Dict[str, Any]]:
    """
    If it's the AI's turn in a PvAI game, this function gets the AI's move,
    executes it in the game environment, updates the database, and returns the result.
    """
    if game_id not in ai_game_info or game_id not in active_games:
        return None

    game_env = active_games[game_id]
    state = game_env.get_state()

    if state['game_over']:
        return None

    info = ai_game_info[game_id]
    current_player_name = state['current_player'].name.lower() + 's'

    if current_player_name != info['ai_side']:
        return None

    ai_player = Player.TIGER if info['ai_side'] == 'tigers' else Player.GOAT
    
    action = get_enhanced_ai_move(ai_player, game_env, state)

    if not action:
        print(f"❌ AI could not select an action for {current_player_name}")
        return None

    print(f"🤖 AI ({current_player_name}) executing: {action}")
    new_state, _, _, _ = game_env.step(action)
    
    _update_game_state_in_db(db, game_id, new_state)

    return {
        "ai_move_executed": True,
        "action": action,
        "game_state": _format_state_for_response(new_state)
    }

def _update_game_state_in_db(db: Session, game_id: str, state: Dict):
    """Helper to persist the game state to the database."""
    game = crud.game.get_sync(db=db, id=uuid.UUID(game_id))
    if game:
        board_state = _format_state_for_response(state)
        game.board = json.dumps(board_state)
        game.phase = state['phase'].name.lower()
        game.goats_placed = state['goats_placed']
        game.goats_captured = state['goats_captured']
        if state['game_over']:
            game.status = "finished"
            winner = state.get('winner')
            if winner:
                info = ai_game_info.get(game_id, {})
                player_side = info.get('player_side')
                if (winner == Player.TIGER and player_side == 'tigers') or \
                   (winner == Player.GOAT and player_side == 'goats'):
                    game.winner_id = game.player_1_id
        db.commit()
        db.refresh(game)


@router.post("/create", response_model=Dict[str, Any])
def create_game(
    *,
    db: Session = Depends(deps.get_db_sync),
    game_request: CreateGameRequest,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
) -> Any:
    """
    Create a new game.
    """
    game_env = BaghchalEnv()
    game_id = str(uuid.uuid4())
    active_games[game_id] = game_env
    
    player_side = game_request.side
    ai_side = 'tigers' if player_side == 'goats' else 'goats'
    
    if game_request.mode == 'pvai':
        ai_game_info[game_id] = {
            'ai_side': ai_side,
            'player_side': player_side,
            'difficulty': game_request.difficulty
        }

    # Create game in DB
    game = crud.game.create_with_owner(db=db, obj_in=schemas.GameCreate(
        id=game_id,
        status="active",
        mode=game_request.mode,
        player_1_id=current_user.id
    ), owner_id=current_user.id)
    
    initial_state = _format_state_for_response(game_env.get_state())
    
    # Check if AI needs to make the first move
    ai_response = execute_ai_move_if_needed(game_id, db)
    if ai_response:
        initial_state = ai_response["game_state"]

    return {
        "game_id": game_id,
        "message": "Game created successfully",
        "game_state": initial_state
    }


@router.get("/{game_id}/state", response_model=Dict[str, Any])
def get_game_state(
    *,
    db: Session = Depends(deps.get_db_sync),
    game_id: str,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
) -> Any:
    """
    Get current game state.
    """
    # Check if game exists in database
    game = crud.game.get_sync(db=db, id=uuid.UUID(game_id))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check permissions
    if not (current_user.is_superuser or str(game.player_1_id) == str(current_user.id) or (game.player_2_id and str(game.player_2_id) == str(current_user.id))):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get game from active games or reconstruct
    if game_id not in active_games:
        # Reconstruct game state from database
        game_env = BaghchalEnv()
        if game.board and validate_game_state(json.loads(game.board)):
            game_env = reconstruct_game_state(game_env, json.loads(game.board))
            # Note: AI agent info is not stored in database, so PvAI games
            # that are reconstructed will not have AI functionality unless
            # explicitly re-created through the frontend
        active_games[game_id] = game_env
    
    game_env = active_games[game_id]
    state = game_env.get_state()
    
    # Get valid actions for current player
    valid_actions = []
    if not state['game_over']:
        actions = game_env.get_valid_actions(state['current_player'])
        for action in actions:
            if action[0] == 'place':
                valid_actions.append({
                    "type": "place",
                    "row": action[1],
                    "col": action[2]
                })
            elif action[0] == 'move':
                valid_actions.append({
                    "type": "move",
                    "from_row": action[1],
                    "from_col": action[2],
                    "to_row": action[3],
                    "to_col": action[4]
                })
    
    # Map enum names to frontend expected format
    current_player_name = state['current_player'].name.lower()
    if current_player_name == 'goat':
        current_player_name = 'goats'
    elif current_player_name == 'tiger':
        current_player_name = 'tigers'
    
    winner_name = None
    if state['winner']:
        winner_name = state['winner'].name.lower()
        if winner_name == 'goat':
            winner_name = 'goats'
        elif winner_name == 'tiger':
            winner_name = 'tigers'

    return {
        "success": True,
        "data": {
            "game_id": game_id,
            "board": state['board'].tolist(),
            "phase": state['phase'].name.lower(),
            "current_player": current_player_name,
            "goats_placed": state['goats_placed'],
            "goats_captured": state['goats_captured'],
            "game_over": state['game_over'],
            "winner": winner_name,
            "valid_actions": valid_actions,
            "ai_info": ai_game_info.get(game_id, {})
        }
    }


@router.post("/{game_id}/move", response_model=Dict[str, Any])
def make_move(
    *,
    db: Session = Depends(deps.get_db_sync),
    game_id: str,
    move: MoveRequest,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
) -> Any:
    """
    Make a move in the game.
    """
    # Check if game exists
    game = crud.game.get_sync(db=db, id=uuid.UUID(game_id))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check permissions
    if not (current_user.is_superuser or str(game.player_1_id) == str(current_user.id) or (game.player_2_id and str(game.player_2_id) == str(current_user.id))):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get game environment
    if game_id not in active_games:
        raise HTTPException(status_code=400, detail="Game session not active")
    
    game_env = active_games[game_id]
    current_state = game_env.get_state()
    
    # For PvAI games, check if it's the human player's turn
    if game_id in ai_game_info:
        ai_info = ai_game_info[game_id]
        current_player_name = current_state['current_player'].name.lower()
        # Map singular to plural for comparison
        if current_player_name == 'goat':
            current_player_name = 'goats'
        elif current_player_name == 'tiger':
            current_player_name = 'tigers'
        
        if current_player_name == ai_info['ai_side']:
            raise HTTPException(status_code=400, detail="It's AI's turn, not player's turn")
    
    # Build action tuple based on move type
    if move.action_type == "place":
        if move.row is None or move.col is None:
            raise HTTPException(status_code=400, detail="Row and col required for place action")
        action = ('place', move.row, move.col)
    elif move.action_type == "move":
        if any(x is None for x in [move.from_row, move.from_col, move.to_row, move.to_col]):
            raise HTTPException(status_code=400, detail="from_row, from_col, to_row, to_col required for move action")
        action = ('move', move.from_row, move.from_col, move.to_row, move.to_col)
    else:
        raise HTTPException(status_code=400, detail="Invalid action type")
    
    # Execute player move
    try:
        print(f"Player executing: {action}")
        state, reward, done, info = game_env.step(action)
        
        # Update database
        board_state = {
            "board": state['board'].tolist(),
            "phase": state['phase'].name,
            "current_player": state['current_player'].name,
            "goats_placed": state['goats_placed'],
            "goats_captured": state['goats_captured'],
            "game_over": state['game_over'],
            "winner": state['winner'].name if state['winner'] else None
        }
        
        # Fix field mapping - use correct model fields
        game.board = json.dumps(board_state)  # Store as JSON text
        game.phase = state['phase'].name.lower()
        game.goats_placed = state['goats_placed']
        game.goats_captured = state['goats_captured']
        
        if state['game_over']:
            game.status = "finished"
            # Set winner correctly - need to get player side from ai_game_info
            if game_id in ai_game_info:
                ai_info = ai_game_info[game_id]
                if state['winner'] == Player.TIGER:
                    if ai_info['player_side'] == "tigers":
                        game.winner_id = game.player_1_id
                elif state['winner'] == Player.GOAT:
                    if ai_info['player_side'] == "goats":
                        game.winner_id = game.player_1_id
        
        db.commit()
        db.refresh(game)
        
        # Map enum names to frontend expected format for move response
        current_player_name = state['current_player'].name.lower()
        if current_player_name == 'goat':
            current_player_name = 'goats'
        elif current_player_name == 'tiger':
            current_player_name = 'tigers'
        
        winner_name = None
        if state['winner']:
            winner_name = state['winner'].name.lower()
            if winner_name == 'goat':
                winner_name = 'goats'
            elif winner_name == 'tiger':
                winner_name = 'tigers'

        response_data = {
            "game_id": game_id,
            "board": state['board'].tolist(),
            "phase": state['phase'].name.lower(),
            "current_player": current_player_name,
            "goats_placed": state['goats_placed'],
            "goats_captured": state['goats_captured'],
            "game_over": state['game_over'],
            "winner": winner_name
        }
        
        # Execute AI move if game is not over and it's a PvAI game
        if not state['game_over'] and game_id in ai_game_info:
            ai_result = execute_ai_move_if_needed(game_id, db)
            if ai_result:
                response_data["ai_move"] = ai_result
        
        return {
            "success": True,
            "message": "Move executed successfully",
            "data": response_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid move: {str(e)}")


@router.post("/{game_id}/ai-move", response_model=Dict[str, Any])
def make_ai_move(
    *,
    db: Session = Depends(deps.get_db_sync),
    game_id: str,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
) -> Any:
    """
    Make an AI move in the game (manual trigger).
    """
    if not AI_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI system not available")
    
    # Check if game exists
    game = crud.game.get_sync(db=db, id=uuid.UUID(game_id))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check permissions
    if not (current_user.is_superuser or str(game.player_1_id) == str(current_user.id)):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if this is a PvAI game
    if game_id not in ai_game_info:
        raise HTTPException(status_code=400, detail="This is not a PvAI game")
    
    # Check if game is still active
    if game_id not in active_games:
        raise HTTPException(status_code=400, detail="Game session not active")
    
    # Execute AI move
    ai_result = execute_ai_move_if_needed(game_id, db)
    
    if not ai_result:
        error_msg = ai_result.get("error", "Could not execute AI move")
        print(f"❌ AI move failed for game {game_id}: {error_msg}")
        raise HTTPException(status_code=400, detail=f"AI move failed: {error_msg}")
    
    return {
        "success": True,
        "message": "AI move executed successfully",
        "data": ai_result["game_state"]
    }


@router.get("/", response_model=List[schemas.Game])
def read_games(
    db: Session = Depends(deps.get_db_sync),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
) -> Any:
    """
    Retrieve user's games.
    """
    if crud.user.is_superuser(current_user):
        games = crud.game.get_multi_sync(db, skip=skip, limit=limit)
    else:
        games = crud.game.get_multi_by_owner(
            db=db, owner_id=current_user.id, skip=skip, limit=limit
        )
    return games


@router.get("/{game_id}", response_model=schemas.Game)
def read_game(
    *,
    db: Session = Depends(deps.get_db_sync),
    game_id: str,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
) -> Any:
    """
    Get game by ID.
    """
    game = crud.game.get_sync(db=db, id=uuid.UUID(game_id))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if not (current_user.is_superuser or str(game.player_1_id) == str(current_user.id) or (game.player_2_id and str(game.player_2_id) == str(current_user.id))):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return game


@router.get("/{game_id}/reset")
def reset_game(
    *,
    db: Session = Depends(deps.get_db_sync),
    game_id: str,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
) -> Any:
    """
    Reset game to initial state.
    """
    # Check if game exists
    game = crud.game.get_sync(db=db, id=uuid.UUID(game_id))
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check permissions
    if not (current_user.is_superuser or str(game.player_1_id) == str(current_user.id)):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Reset game environment
    if game_id in active_games:
        game_env = active_games[game_id]
        state = game_env.reset()
        
        # Update database
        board_state = {
            "board": state['board'].tolist(),
            "phase": state['phase'].name,
            "current_player": state['current_player'].name,
            "goats_placed": state['goats_placed'],
            "goats_captured": state['goats_captured'],
            "game_over": state['game_over'],
            "winner": state['winner'].name if state['winner'] else None
        }
        
        # Fix field mapping - use correct model fields
        game.board = json.dumps(board_state)  # Store as JSON text
        game.phase = state['phase'].name.lower()
        game.goats_placed = state['goats_placed']
        game.goats_captured = state['goats_captured']
        game.status = "active"
        game.winner_id = None
        
        db.commit()
        db.refresh(game)
        
        # Execute AI move if AI goes first
        if game_id in ai_game_info:
            ai_info = ai_game_info[game_id]
            if state['current_player'].name.lower() == ai_info['ai_side']:
                execute_ai_move_if_needed(game_id, db)
    
    return {"success": True, "message": "Game reset successfully"}


@router.get("/ai/status")
def get_ai_status() -> Any:
    """
    Get AI system status and information.
    """
    if not AI_AVAILABLE:
        return {
            "ai_available": False,
            "message": "AI system not available"
        }
    
    system_info = ai_manager.get_system_info()
    
    return {
        "ai_available": True,
        "system_info": system_info,
        "active_games": len(active_games),
        "ai_games": len(ai_game_info),
        "difficulties": ["easy", "medium", "hard"]
    }


def _format_state_for_response(state: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to format the game state dictionary for API responses."""
    winner = state.get('winner')
    return {
        "board": state['board'].tolist(),
        "phase": state['phase'].name.lower(),
        "current_player": state['current_player'].name.lower() + 's',
        "goats_placed": state['goats_placed'],
        "goats_captured": state['goats_captured'],
        "game_over": state['game_over'],
        "winner": winner.name.lower() + 's' if winner else None
    }


 