from pydantic import BaseModel
import uuid
from datetime import datetime
from .user import UserFriendInfo
import enum

class FriendshipStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"

class FriendshipBase(BaseModel):
    user_id_1: uuid.UUID
    user_id_2: uuid.UUID

class FriendshipCreate(BaseModel):
    user_id_1: uuid.UUID
    user_id_2: uuid.UUID

class FriendshipUpdate(BaseModel):
    status: FriendshipStatus

class FriendshipInDBBase(FriendshipBase):
    friendship_id: uuid.UUID
    created_at: datetime
    status: FriendshipStatus
    
    class Config:
        from_attributes = True

class Friendship(FriendshipInDBBase):
    user1: UserFriendInfo
    user2: UserFriendInfo 