from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from .user import User

class MoveBase(BaseModel):
    game_id: uuid.UUID
    move_number: int
    player_id: uuid.UUID
    move_type: str
    from_row: Optional[int] = None
    from_col: Optional[int] = None
    to_row: int
    to_col: int

class MoveCreate(MoveBase):
    pass

class MoveInDBBase(MoveBase):
    move_id: uuid.UUID
    created_at: datetime
    
    class Config:
        orm_mode = True

class Move(MoveInDBBase):
    player: User 