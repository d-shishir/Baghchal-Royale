from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from enum import Enum
from .user import User
from .tournament_entry import TournamentEntry

class TournamentType(str, Enum):
    ROUND_ROBIN = "ROUND_ROBIN"
    KNOCKOUT = "KNOCKOUT"

class TournamentStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class TournamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    max_participants: int
    tournament_type: TournamentType
    start_date: datetime
    end_date: Optional[datetime] = None

class TournamentCreate(TournamentBase):
    pass

class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    max_participants: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[TournamentStatus] = None

class TournamentInDBBase(TournamentBase):
    tournament_id: uuid.UUID
    status: TournamentStatus
    created_at: datetime
    entries: List[TournamentEntry] = []
    
    class Config:
        from_attributes = True

class Tournament(TournamentInDBBase):
    pass 