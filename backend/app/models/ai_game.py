import uuid
import enum
from sqlalchemy import Column, ForeignKey, DateTime, func, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class AIGameDifficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class AIGameResult(str, enum.Enum):
    WIN = "win"
    LOSS = "loss"
    DRAW = "draw"

class AIGame(Base):
    __tablename__ = "ai_games"

    ai_game_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    difficulty = Column(SQLAlchemyEnum(AIGameDifficulty), nullable=False)
    result = Column(SQLAlchemyEnum(AIGameResult), nullable=True)
    started_at = Column(DateTime, default=func.now())
    ended_at = Column(DateTime, nullable=True)

    user = relationship("User")
    moves = relationship("AIMove", back_populates="ai_game", cascade="all, delete-orphan") 