from pydantic import BaseModel
import uuid
from datetime import datetime

class RatingHistoryBase(BaseModel):
    user_id: uuid.UUID
    game_id: uuid.UUID
    old_rating: int
    new_rating: int

class RatingHistoryCreate(RatingHistoryBase):
    pass

class RatingHistoryInDBBase(RatingHistoryBase):
    rating_history_id: uuid.UUID
    changed_at: datetime
    
    class Config:
        orm_mode = True

class RatingHistory(RatingHistoryInDBBase):
    pass 