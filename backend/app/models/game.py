import uuid
import enum
from sqlalchemy import Column, ForeignKey, DateTime, func, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class GameResult(str, enum.Enum):
    GOAT_WIN = "goat_win"
    TIGER_WIN = "tiger_win"
    DRAW = "draw"
    ABORTED = "aborted"

class Game(Base):
    __tablename__ = "games"

    game_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_goat_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    player_tiger_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    winner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    result = Column(SQLAlchemyEnum(GameResult), nullable=True)
    
    started_at = Column(DateTime, default=func.now())
    ended_at = Column(DateTime, nullable=True)

    player_goat = relationship("User", back_populates="games_as_goat", foreign_keys=[player_goat_id])
    player_tiger = relationship("User", back_populates="games_as_tiger", foreign_keys=[player_tiger_id])
    winner = relationship("User", foreign_keys=[winner_id])
    moves = relationship("Move", back_populates="game", cascade="all, delete-orphan")