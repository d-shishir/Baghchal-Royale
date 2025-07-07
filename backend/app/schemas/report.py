from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from enum import Enum
from .user import User

class ReportStatus(str, Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class ReportCategory(str, Enum):
    CHEATING = "CHEATING"
    HARASSMENT = "HARASSMENT"
    BUG = "BUG"
    OTHER = "OTHER"

class ReportBase(BaseModel):
    reporter_id: uuid.UUID
    reported_user_id: uuid.UUID
    category: ReportCategory
    description: str

class ReportCreate(ReportBase):
    pass

class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    reviewer_notes: Optional[str] = None

class ReportInDBBase(ReportBase):
    report_id: uuid.UUID
    status: ReportStatus
    created_at: datetime
    
    class Config:
        orm_mode = True

class Report(ReportInDBBase):
    reporter: User
    reported_user: User 