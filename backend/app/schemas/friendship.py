from pydantic import BaseModel
import uuid
from .user import User
from ..models.friendship import FriendshipStatus

class FriendshipBase(BaseModel):
    addressee_id: uuid.UUID

class FriendshipCreate(FriendshipBase):
    pass

class FriendshipUpdate(BaseModel):
    status: FriendshipStatus

class FriendshipInDBBase(BaseModel):
    id: uuid.UUID
    requester_id: uuid.UUID
    addressee_id: uuid.UUID
    status: FriendshipStatus

    class Config:
        orm_mode = True

class Friendship(FriendshipInDBBase):
    requester: User
    addressee: User

class FriendshipInfo(BaseModel):
    id: uuid.UUID
    status: FriendshipStatus
    friend: User
    
    class Config:
        from_attributes = True 