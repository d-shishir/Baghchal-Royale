import uuid
from sqlalchemy import Column, String, Integer, DateTime, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    
    # User stats
    rating = Column(Integer, default=1000, nullable=False)
    games_played = Column(Integer, default=0, nullable=False)
    games_won = Column(Integer, default=0, nullable=False)
    tiger_wins = Column(Integer, default=0, nullable=False)
    goat_wins = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Update relationships to match new field names
    games_as_player1 = relationship("Game", foreign_keys="[Game.player_1_id]", back_populates="player1")
    games_as_player2 = relationship("Game", foreign_keys="[Game.player_2_id]", back_populates="player2") 