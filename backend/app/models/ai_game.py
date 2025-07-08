import uuid
import enum
from sqlalchemy import Column, ForeignKey, DateTime, func, Enum as SQLAlchemyEnum, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class AIGameDifficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class AIGameStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class AIGame(Base):
    __tablename__ = "ai_games"

    ai_game_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    difficulty = Column(SQLAlchemyEnum(AIGameDifficulty), nullable=False)
    user_side = Column(String, nullable=False)
    status = Column(SQLAlchemyEnum(AIGameStatus), nullable=False, default=AIGameStatus.IN_PROGRESS)
    winner = Column(String, nullable=True)
    game_duration = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), default=func.now())

    user = relationship("User")
    moves = relationship("AIMove", back_populates="ai_game", cascade="all, delete-orphan") 