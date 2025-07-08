import uuid
import enum
from sqlalchemy import Column, ForeignKey, DateTime, func, Enum as SQLAlchemyEnum, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class GameStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"

class Game(Base):
    __tablename__ = "games"

    game_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_goat_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    player_tiger_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    winner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    status = Column(SQLAlchemyEnum(GameStatus), nullable=False, default=GameStatus.IN_PROGRESS)
    game_duration = Column(Integer, nullable=True)
    game_state = Column(JSON, nullable=False, default=lambda: {})
    
    created_at = Column(DateTime(timezone=True), default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    player_goat = relationship("User", back_populates="games_as_goat", foreign_keys=[player_goat_id])
    player_tiger = relationship("User", back_populates="games_as_tiger", foreign_keys=[player_tiger_id])
    winner = relationship("User", foreign_keys=[winner_id])
    moves = relationship("Move", back_populates="game", cascade="all, delete-orphan")