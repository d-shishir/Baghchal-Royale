from pydantic import BaseModel
import uuid
from datetime import datetime
from .user import User

class TournamentEntryBase(BaseModel):
    tournament_id: uuid.UUID
    user_id: uuid.UUID

class TournamentEntryCreate(TournamentEntryBase):
    pass

class TournamentEntryInDBBase(TournamentEntryBase):
    tournament_entry_id: uuid.UUID
    joined_at: datetime
    
    class Config:
        orm_mode = True

class TournamentEntry(TournamentEntryInDBBase):
    user: User 