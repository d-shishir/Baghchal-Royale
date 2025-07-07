from pydantic import BaseModel
import uuid
from datetime import datetime
from .user import User

class FriendshipBase(BaseModel):
    user_id_1: uuid.UUID
    user_id_2: uuid.UUID

class FriendshipCreate(BaseModel):
    user_id_1: uuid.UUID
    user_id_2: uuid.UUID

class FriendshipInDBBase(FriendshipBase):
    friendship_id: uuid.UUID
    created_at: datetime
    
    class Config:
        orm_mode = True

class Friendship(FriendshipInDBBase):
    user1: User
    user2: User 