from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from .user import User

class FeedbackBase(BaseModel):
    user_id: uuid.UUID
    subject: str
    message: str
    type: str
    
class FeedbackCreate(FeedbackBase):
    pass

class FeedbackInDBBase(FeedbackBase):
    feedback_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class Feedback(FeedbackInDBBase):
    user: User 