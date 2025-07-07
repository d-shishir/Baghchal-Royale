from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from .user import User
from .game import Game

class TournamentMatchBase(BaseModel):
    tournament_id: uuid.UUID
    round_number: int
    player_1_id: uuid.UUID
    player_2_id: uuid.UUID

class TournamentMatchCreate(TournamentMatchBase):
    pass

class TournamentMatchUpdate(BaseModel):
    game_id: Optional[uuid.UUID] = None

class TournamentMatchInDBBase(TournamentMatchBase):
    tournament_match_id: uuid.UUID
    game_id: Optional[uuid.UUID] = None
    
    class Config:
        orm_mode = True

class TournamentMatch(TournamentMatchInDBBase):
    player_1: User
    player_2: User
    game: Optional[Game] = None 