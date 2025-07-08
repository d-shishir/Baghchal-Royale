import uuid
import enum
from sqlalchemy import Column, ForeignKey, DateTime, func, String, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class ReportStatus(str, enum.Enum):
    OPEN = "OPEN"
    REVIEWED = "REVIEWED"
    DISMISSED = "DISMISSED"

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    reported_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    reason = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    status = Column(SQLAlchemyEnum(ReportStatus), nullable=False, default=ReportStatus.OPEN)

    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reporter_reports")
    reported = relationship("User", foreign_keys=[reported_id], back_populates="reported_reports") 