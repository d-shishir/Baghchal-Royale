from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from .user import User
from .game import Game

class TournamentMatchBase(BaseModel):
    tournament_id: uuid.UUID
    game_id: uuid.UUID

class TournamentMatchCreate(TournamentMatchBase):
    pass

class TournamentMatchUpdate(BaseModel):
    game_id: Optional[uuid.UUID] = None

class TournamentMatchInDBBase(TournamentMatchBase):
    match_id: uuid.UUID
    
    class Config:
        orm_mode = True

class TournamentMatch(TournamentMatchInDBBase):
    game: Game 