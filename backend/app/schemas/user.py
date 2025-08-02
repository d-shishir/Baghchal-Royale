from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"

class UserStatus(str, Enum):
    OFFLINE = "OFFLINE"
    ONLINE = "ONLINE"
    INGAME = "INGAME"

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    username: str
    country: Optional[str] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    is_superuser: bool = False

# Properties to receive via API on update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    country: Optional[str] = None
    password: Optional[str] = None
    level: Optional[int] = None
    xp: Optional[int] = None
    achievements: Optional[List[str]] = None

# Properties for admin to update user status
class UserStatusUpdate(BaseModel):
    status: Optional[UserStatus] = None
    role: Optional[UserRole] = None

class UserInDBBase(UserBase):
    user_id: uuid.UUID
    role: UserRole
    status: UserStatus
    rating: int
    level: int = 1
    xp: int = 0
    achievements: List[str] = Field(default_factory=list)
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Additional properties to return via API
class User(UserInDBBase):
    pass

class UserFriendInfo(BaseModel):
    user_id: uuid.UUID
    username: str
    status: UserStatus
    rating: int
    level: int

    class Config:
        from_attributes = True

class UserWithStats(User):
    games_played: int = 0
    wins: int = 0
    losses: int = 0
    win_rate: float = 0.0

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str 