import uuid
import enum
from sqlalchemy import Column, ForeignKey, DateTime, func, Enum as SQLAlchemyEnum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class ReportStatus(str, enum.Enum):
    OPEN = "open"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    reported_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.game_id"), nullable=True)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    status = Column(SQLAlchemyEnum(ReportStatus), nullable=False, default=ReportStatus.OPEN)

    reporter = relationship("User", foreign_keys=[reporter_id])
    reported = relationship("User", foreign_keys=[reported_id])
    game = relationship("Game") 