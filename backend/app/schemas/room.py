from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import List, Optional

from .user import User
from app.models.room import RoomStatus

# Shared properties
class RoomBase(BaseModel):
    name: str
    is_private: bool = False

# Properties to receive on room creation
class RoomCreate(RoomBase):
    pass

# Properties to receive on room update
class RoomUpdate(RoomBase):
    name: Optional[str] = None
    is_private: Optional[bool] = None
    status: Optional[RoomStatus] = None

# Properties shared by models stored in DB
class RoomInDBBase(RoomBase):
    id: uuid.UUID
    host_id: uuid.UUID
    game_id: Optional[uuid.UUID] = None
    created_at: datetime
    status: RoomStatus
    host_side: Optional[str] = None
    
    class Config:
        from_attributes = True

# Properties to return to client
class Room(RoomInDBBase):
    host: User
    players_count: int
    max_players: int = 2

# Properties stored in DB
class RoomInDB(RoomInDBBase):
    pass

class QuickMatchRequest(BaseModel):
    side: str 