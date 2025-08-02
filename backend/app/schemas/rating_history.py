from pydantic import BaseModel
import uuid
from datetime import datetime

class RatingHistoryBase(BaseModel):
    user_id: uuid.UUID
    game_id: uuid.UUID
    rating_before: int
    rating_after: int

class RatingHistoryCreate(RatingHistoryBase):
    pass

class RatingHistoryInDBBase(RatingHistoryBase):
    id: uuid.UUID
    changed_at: datetime
    
    class Config:
        from_attributes = True

class RatingHistory(RatingHistoryInDBBase):
    pass 