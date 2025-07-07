from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from .user import User
from enum import Enum

class AIGameStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class AIGameDifficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class AIGameBase(BaseModel):
    user_id: uuid.UUID
    difficulty: AIGameDifficulty
    user_side: str

class AIGameCreate(AIGameBase):
    pass

class AIGameUpdate(BaseModel):
    status: Optional[AIGameStatus] = None
    winner: Optional[str] = None
    game_duration: Optional[int] = None

class AIGameInDBBase(AIGameBase):
    ai_game_id: uuid.UUID
    status: AIGameStatus
    winner: Optional[str] = None
    game_duration: Optional[int] = None
    started_at: datetime
    
    class Config:
        orm_mode = True

class AIGame(AIGameInDBBase):
    user: User 