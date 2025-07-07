import uuid
import enum
from sqlalchemy import Column, ForeignKey, DateTime, func, Enum as SQLAlchemyEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class FeedbackType(str, enum.Enum):
    BUG = "bug"
    SUGGESTION = "suggestion"
    OTHER = "other"

class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SQLAlchemyEnum(FeedbackType), nullable=False)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User") 