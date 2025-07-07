from pydantic import BaseModel, EmailStr
from typing import Optional
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

class UserInDBBase(UserBase):
    user_id: uuid.UUID
    role: UserRole
    status: UserStatus
    rating: int
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Additional properties to return via API
class User(UserInDBBase):
    pass

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str 