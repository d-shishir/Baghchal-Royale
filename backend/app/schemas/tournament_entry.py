from pydantic import BaseModel
import uuid
from datetime import datetime
from .user import User
from ..models.tournament_entry import TournamentEntryStatus

class TournamentEntryBase(BaseModel):
    tournament_id: uuid.UUID
    user_id: uuid.UUID

class TournamentEntryCreate(TournamentEntryBase):
    pass

class TournamentEntryInDBBase(TournamentEntryBase):
    score: int
    status: TournamentEntryStatus
    
    class Config:
        orm_mode = True

class TournamentEntry(TournamentEntryInDBBase):
    user: User 