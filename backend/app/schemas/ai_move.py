from pydantic import BaseModel, ConfigDict
import uuid
from typing import Optional

class AIMoveBase(BaseModel):
    ai_game_id: uuid.UUID
    move_number: int
    player: str # Should be 'user' or 'ai'
    move_type: str
    from_pos: str
    to_pos: str

class AIMoveCreate(AIMoveBase):
    pass

class AIMoveUpdate(BaseModel):
    pass

class AIMove(AIMoveBase):
    ai_move_id: uuid.UUID
    timestamp: str

    model_config = ConfigDict(from_attributes=True) 