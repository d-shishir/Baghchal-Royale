from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from .user import User
from enum import Enum

class GameStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"

class GameBase(BaseModel):
    player_goat_id: uuid.UUID
    player_tiger_id: uuid.UUID

class GameCreate(GameBase):
    pass

class GameUpdate(BaseModel):
    status: Optional[GameStatus] = None
    winner_id: Optional[uuid.UUID] = None
    game_duration: Optional[int] = None

class GameInDBBase(GameBase):
    game_id: uuid.UUID
    status: GameStatus
    winner_id: Optional[uuid.UUID] = None
    game_duration: Optional[int] = None
    started_at: datetime
    
    class Config:
        orm_mode = True

class Game(GameInDBBase):
    player_goat: User
    player_tiger: User
    winner: Optional[User] = None