import uuid
from sqlalchemy import Column, String, Integer, DateTime, func, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Game(Base):
    __tablename__ = "games"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_1_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Match Supabase schema
    player_2_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Match Supabase schema
    board = Column(Text, nullable=False)  # Match Supabase schema (text, not JSON)
    turn = Column(Integer, default=1, nullable=True)  # Match Supabase schema
    phase = Column(String, default="placement", nullable=True)  # Match Supabase schema
    goats_placed = Column(Integer, default=0, nullable=True)  # Match Supabase schema
    goats_captured = Column(Integer, default=0, nullable=True)  # Match Supabase schema
    status = Column(String, default="active", nullable=True)  # Match Supabase schema
    winner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=func.now(), nullable=True)
    updated_at = Column(DateTime, default=func.now(), nullable=True)
    
    # Update relationships to match new field names
    player1 = relationship("User", foreign_keys=[player_1_id], back_populates="games_as_player1")
    player2 = relationship("User", foreign_keys=[player_2_id], back_populates="games_as_player2")
    moves = relationship("Move", back_populates="game", cascade="all, delete-orphan")

class Move(Base):
    __tablename__ = "moves"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id"), nullable=False)
    player_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    move_number = Column(Integer, nullable=False)
    move_data = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=func.now())

    game = relationship("Game", back_populates="moves")
    player = relationship("User") 