from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime
from app.schemas.user import User

# Shared properties
class GameBase(BaseModel):
    game_mode: str = "pvai"  # "pvp" or "pvai"
    player1_side: str = "goats"  # "tigers" or "goats"

# Properties to receive on game creation
class GameCreate(GameBase):
    pass

# Properties to receive on game update
class GameUpdate(BaseModel):
    game_mode: Optional[str] = None
    player1_side: Optional[str] = None
    status: Optional[str] = None
    board_state: Optional[Dict[str, Any]] = None
    current_player: Optional[str] = None
    game_phase: Optional[str] = None
    goats_placed: Optional[int] = None
    goats_captured: Optional[int] = None
    winner_id: Optional[uuid.UUID] = None

class GameInDBBase(GameBase):
    id: uuid.UUID
    player1_id: uuid.UUID
    player2_id: Optional[uuid.UUID] = None
    status: str = "active"  # "pending", "active", "finished", "aborted"
    board_state: Dict[str, Any]
    current_player: str
    game_phase: str
    goats_placed: int = 0
    goats_captured: int = 0
    winner_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Additional properties to return via API
class Game(GameInDBBase):
    player1: Optional[User] = None
    player2: Optional[User] = None

# Game state response for API
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

# Move-related schemas
class MoveCreate(BaseModel):
    action_type: str  # "place" or "move"
    row: Optional[int] = None
    col: Optional[int] = None
    from_row: Optional[int] = None
    from_col: Optional[int] = None
    to_row: Optional[int] = None
    to_col: Optional[int] = None

class Move(BaseModel):
    id: uuid.UUID
    game_id: uuid.UUID
    player_id: uuid.UUID
    move_number: int
    move_data: Dict[str, Any]
    created_at: datetime

    class Config:
        orm_mode = True

# Game creation request
class CreateGameRequest(BaseModel):
    mode: str = "pvai"  # "pvp" or "pvai"
    side: str = "goats"  # "tigers" or "goats"
    difficulty: str = "medium"  # "easy", "medium", "hard"

# Game list response
class GameListResponse(BaseModel):
    games: List[Game]
    total: int
    page: int
    per_page: int

# Game statistics
class GameStats(BaseModel):
    total_games: int
    games_won: int
    tiger_games: int
    tiger_wins: int
    goat_games: int
    goat_wins: int
    win_rate: float 