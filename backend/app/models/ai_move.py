import uuid
import enum
from sqlalchemy import Column, ForeignKey, DateTime, func, Enum as SQLAlchemyEnum, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class AIPlayer(str, enum.Enum):
    USER = "user"
    AI = "ai"

class MoveType(str, enum.Enum):
    PLACE = "place"
    MOVE = "move"
    CAPTURE = "capture"

class AIMove(Base):
    __tablename__ = "ai_moves"

    ai_move_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ai_game_id = Column(UUID(as_uuid=True), ForeignKey("ai_games.ai_game_id"), nullable=False)
    player = Column(SQLAlchemyEnum(AIPlayer), nullable=False)
    move_number = Column(Integer, nullable=False)
    from_pos = Column(String, nullable=False)
    to_pos = Column(String, nullable=False)
    move_type = Column(SQLAlchemyEnum(MoveType), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=func.now())

    ai_game = relationship("AIGame", back_populates="moves") 