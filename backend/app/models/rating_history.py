import uuid
from sqlalchemy import Column, ForeignKey, DateTime, func, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class RatingHistory(Base):
    __tablename__ = "ratings_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.game_id"), nullable=False)
    rating_before = Column(Integer, nullable=False)
    rating_after = Column(Integer, nullable=False)
    changed_at = Column(DateTime(timezone=True), nullable=True, default=func.now())

    user = relationship("User")
    game = relationship("Game") 