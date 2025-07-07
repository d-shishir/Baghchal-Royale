from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

class AIMoveBase(BaseModel):
    ai_game_id: uuid.UUID
    move_number: int
    player_type: str
    move_type: str
    from_row: Optional[int] = None
    from_col: Optional[int] = None
    to_row: int
    to_col: int

class AIMoveCreate(AIMoveBase):
    pass

class AIMoveInDBBase(AIMoveBase):
    ai_move_id: uuid.UUID
    created_at: datetime
    
    class Config:
        orm_mode = True

class AIMove(AIMoveInDBBase):
    pass 