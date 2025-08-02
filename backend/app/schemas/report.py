from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from enum import Enum
from .user import User

class ReportStatus(str, Enum):
    OPEN = "OPEN"
    REVIEWED = "REVIEWED"
    DISMISSED = "DISMISSED"

class ReportBase(BaseModel):
    reporter_id: uuid.UUID
    reported_id: uuid.UUID
    reason: str

class ReportCreate(ReportBase):
    pass

class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None

class ReportInDBBase(ReportBase):
    report_id: uuid.UUID
    status: ReportStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class Report(ReportInDBBase):
    reporter: User
    reported: User 