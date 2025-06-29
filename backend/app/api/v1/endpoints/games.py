from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
import json

from app import crud, models, schemas
from app.api import deps
from app.core.baghchal_env import BaghchalEnv, Player, GamePhase
from app.core.enhanced_ai import AIPlayer, AIGameManager
from app.core.game_utils import reconstruct_game_state, validate_game_state
from pydantic import BaseModel

router = APIRouter()

# In-memory game sessions (for active games)
active_games: Dict[str, BaghchalEnv] = {}
ai_agents: Dict[str, Dict[str, Any]] = {}

# Initialize AI manager
try:
    ai_manager = AIGameManager()
    tiger_ai = ai_manager.create_ai_player(Player.TIGER, "enhanced")
    goat_ai = ai_manager.create_ai_player(Player.GOAT, "enhanced")
    AI_AVAILABLE = True
    print("✅ AI system initialized successfully")
except Exception as e:
    print(f"Warning: AI initialization failed: {e}")
    ai_manager = None
    tiger_ai = None
    goat_ai = None
    AI_AVAILABLE = False

# Pydantic models for game operations
class GameStateResponse(BaseModel):
    game_id: str
    board: List[List[int]]
    phase: str
    current_player: str
    goats_placed: int
    goats_captured: int
    game_over: bool
    winner: Optional[str]
    valid_actions: List[Dict[str, Any]]

class MoveRequest(BaseModel):
    action_type: str  # "place" or "move"
    row: Optional[int] = None
    col: Optional[int] = None
    from_row: Optional[int] = None
    from_col: Optional[int] = None
    to_row: Optional[int] = None
    to_col: Optional[int] = None

class CreateGameRequest(BaseModel):
    mode: str = "pvai"  # "pvp" or "pvai"
    side: Optional[str] = "goats"  # "tigers" or "goats"
    difficulty: Optional[str] = "medium"  # "easy", "medium", "hard"


def get_ai_player_for_difficulty(player_type: Player, difficulty: str) -> Optional[AIPlayer]:
    """Get AI player based on difficulty level."""
    if not AI_AVAILABLE or not ai_manager:
        print(f"❌ AI not available: AI_AVAILABLE={AI_AVAILABLE}, ai_manager={ai_manager}")
        return None
    
    try:
        print(f"🤖 Creating AI player: type={player_type}, difficulty={difficulty}")
        
        if difficulty == "easy":
            # Create new advanced AI for easy (could use different strategy)
            ai_player = ai_manager.create_ai_player(player_type, "advanced")
        elif difficulty == "medium":
            # Use global enhanced AI instances or create new ones
            ai_player = tiger_ai if player_type == Player.TIGER else goat_ai
            if not ai_player:
                print(f"⚠️ Global AI instance not available, creating new one")
                ai_player = ai_manager.create_ai_player(player_type, "advanced")
        else:  # hard
            # Use global enhanced AI instances or create new ones
            ai_player = tiger_ai if player_type == Player.TIGER else goat_ai
            if not ai_player:
                print(f"⚠️ Global AI instance not available, creating new one")
                ai_player = ai_manager.create_ai_player(player_type, "advanced")
        
        print(f"✅ AI player created: {type(ai_player)} for {player_type} at {difficulty} difficulty")
        return ai_player
        
    except Exception as e:
        print(f"❌ Error creating AI player: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return None


def execute_ai_move_if_needed(game_id: str, db: Session) -> Dict[str, Any]:
    """Execute AI move if it's AI's turn in a PvAI game."""
    if game_id not in ai_agents or game_id not in active_games:
        return {}
    
    game_env = active_games[game_id]
    state = game_env.get_state()
    
    if state['game_over']:
        return {}
    
    ai_info = ai_agents[game_id]
    current_player_name = state['current_player'].name.lower()
    # Map singular to plural for comparison
    if current_player_name == 'goat':
        current_player_name = 'goats'
    elif current_player_name == 'tiger':
        current_player_name = 'tigers'
    
    print(f"🤖 AI Check: current_player='{current_player_name}', ai_side='{ai_info['ai_side']}', match={current_player_name == ai_info['ai_side']}")
    
    # Check if it's AI's turn
    if current_player_name != ai_info['ai_side']:
        return {}
    
    # Get AI player based on difficulty
    ai_side_enum = Player.TIGER if current_player_name == "tigers" else Player.GOAT
    ai_player = get_ai_player_for_difficulty(ai_side_enum, ai_info['difficulty'])
    
    if not ai_player:
        print(f"❌ AI player not available for {current_player_name}")
        return {}
    
    try:
        # Use direct advanced AI system that we know works
        from app.core.advanced_baghchal_ai import AdvancedTigerAI, AdvancedGoatAI, TigerStrategy, GoatStrategy
        
        # Create fresh AI instance directly (bypassing the complex initialization)
        if ai_side_enum == Player.TIGER:
            direct_ai = AdvancedTigerAI(TigerStrategy.AGGRESSIVE_HUNT, "expert")
        else:
            direct_ai = AdvancedGoatAI(GoatStrategy.DEFENSIVE_BLOCK, "expert")
        
        print(f"🤖 Using direct AI: {type(direct_ai).__name__}")
        action = direct_ai.select_action(game_env, state)
        
        if not action:
            print(f"❌ Direct AI also failed, trying AI player...")
            # Fallback to original method
            action = ai_player.select_action(game_env, state)
        
        if not action:
            print(f"❌ AI could not select action for {current_player_name}")
            return {"error": "AI could not select action", "ai_move_executed": False}
        
        print(f"🤖 AI ({current_player_name}) executing: {action}")
        
        # Execute AI move
        try:
            new_state, reward, done, info = game_env.step(action)
            print(f"✅ Move executed successfully: {action}")
        except Exception as step_error:
            print(f"❌ Error executing move {action}: {step_error}")
            import traceback
            print(f"❌ Step error traceback: {traceback.format_exc()}")
            return {"error": f"Could not execute AI move: {step_error}", "ai_move_executed": False}
        
        # Update database
        game = crud.game.get_sync(db=db, id=uuid.UUID(game_id))
        if game:
            board_state = {
                "board": new_state['board'].tolist(),
                "phase": new_state['phase'].name,
                "current_player": new_state['current_player'].name,
                "goats_placed": new_state['goats_placed'],
                "goats_captured": new_state['goats_captured'],
                "game_over": new_state['game_over'],
                "winner": new_state['winner'].name if new_state['winner'] else None
            }
            
            # Fix field mapping - use correct model fields
            game.board = json.dumps(board_state)  # Store as JSON text
            game.phase = new_state['phase'].name.lower()
            game.goats_placed = new_state['goats_placed']
            game.goats_captured = new_state['goats_captured']
            
            if new_state['game_over']:
                game.status = "finished"
                # Set winner correctly - need to get player side from ai_agents
                if game_id in ai_agents:
                    ai_info = ai_agents[game_id]
                    if new_state['winner'] == Player.TIGER:
                        if ai_info['player_side'] == "tigers":
                            game.winner_id = game.player_1_id
                    elif new_state['winner'] == Player.GOAT:
                        if ai_info['player_side'] == "goats":
                            game.winner_id = game.player_1_id
            
            db.commit()
            db.refresh(game)
        
        # Map enum names to frontend expected format for AI response
        result_current_player = new_state['current_player'].name.lower()
        if result_current_player == 'goat':
            result_current_player = 'goats'
        elif result_current_player == 'tiger':
            result_current_player = 'tigers'
        
        winner_name = None
        if new_state['winner']:
            winner_name = new_state['winner'].name.lower()
            if winner_name == 'goat':
                winner_name = 'goats'
            elif winner_name == 'tiger':
                winner_name = 'tigers'

        print(f"✅ AI move executed successfully. New state: {result_current_player}'s turn")

        return {
            "ai_move_executed": True,
            "action": action,
            "game_state": {
                "board": new_state['board'].tolist(),
                "phase": new_state['phase'].name.lower(),
                "current_player": result_current_player,
                "goats_placed": new_state['goats_placed'],
                "goats_captured": new_state['goats_captured'],
                "game_over": new_state['game_over'],
                "winner": winner_name
            }
        }
        
    except Exception as e:
        print(f"❌ Error executing AI move: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return {"error": str(e), "ai_move_executed": False}


@router.post("/create", response_model=Dict[str, Any])
def create_game(
    *,
    db: Session = Depends(deps.get_db_sync),
    game_request: CreateGameRequest,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
) -> Any:
    """
    Create new game with enhanced Baghchal logic.
    """
    # Create game environment
    game_env = BaghchalEnv()
    game_id = str(uuid.uuid4())
    
    # Store in active games
    active_games[game_id] = game_env
    
    # Initialize board state for database
    state = game_env.get_state()
    board_state = {
        "board": state['board'].tolist(),
        "phase": state['phase'].name,
        "current_player": state['current_player'].name,
        "goats_placed": state['goats_placed'],
        "goats_captured": state['goats_captured'],
        "game_over": state['game_over'],
        "winner": state['winner'].name if state['winner'] else None
    }
    
    # Set up AI if needed
    if game_request.mode == "pvai":
        ai_agents[game_id] = {
            "player_side": game_request.side,
            "ai_side": "tigers" if game_request.side == "goats" else "goats",
            "difficulty": game_request.difficulty
        }
    
    # Create game record using CRUD
    game_create = schemas.GameCreate(
        game_mode=game_request.mode,
        player1_side=game_request.side
    )
    
    # Create the game object manually for now
    db_game = models.Game(
        id=uuid.UUID(game_id),
        player_1_id=current_user.id,
        board=json.dumps(board_state),  # Store as JSON text
        phase=state['phase'].name.lower(),
        goats_placed=state['goats_placed'],
        goats_captured=state['goats_captured'],
        status="active"
    )
    
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    
    response_data = {
        "game_id": game_id,
        "mode": game_request.mode,
        "player_side": game_request.side,
        "ai_side": ai_agents.get(game_id, {}).get("ai_side"),
        "difficulty": game_request.difficulty,
        "status": "active"
    }
    
    # Execute AI move if AI goes first (tigers start)
    if game_request.mode == "pvai" and game_request.side == "goats":
        ai_result = execute_ai_move_if_needed(game_id, db)
        if ai_result.get("ai_move_executed"):
            response_data["ai_move"] = ai_result
    
    return {
        "success": True,
        "message": "Game created successfully",
        "data": response_data
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
            "ai_info": ai_agents.get(game_id, {})
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
    if game_id in ai_agents:
        ai_info = ai_agents[game_id]
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
            # Set winner correctly - need to get player side from ai_agents
            if game_id in ai_agents:
                ai_info = ai_agents[game_id]
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
        if not state['game_over'] and game_id in ai_agents:
            ai_result = execute_ai_move_if_needed(game_id, db)
            if ai_result.get("ai_move_executed"):
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
    if game_id not in ai_agents:
        raise HTTPException(status_code=400, detail="This is not a PvAI game")
    
    # Check if game is still active
    if game_id not in active_games:
        raise HTTPException(status_code=400, detail="Game session not active")
    
    # Execute AI move
    ai_result = execute_ai_move_if_needed(game_id, db)
    
    if not ai_result.get("ai_move_executed"):
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
        if game_id in ai_agents:
            ai_info = ai_agents[game_id]
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
        "ai_games": len(ai_agents),
        "difficulties": ["easy", "medium", "hard"]
    }


 