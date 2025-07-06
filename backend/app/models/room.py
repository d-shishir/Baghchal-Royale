from sqlalchemy import Column, String, Boolean, Enum as SQLAlchemyEnum, ForeignKey, DateTime, Table, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base_class import Base
from app.models.user import User

import enum

class RoomStatus(str, enum.Enum):
    WAITING = "waiting"
    PLAYING = "playing"
    FINISHED = "finished"

class RoomSource(str, enum.Enum):
    PLAYER_CREATED = "player_created"
    QUICK_MATCH = "quick_match"

room_players = Table(
    'room_players', Base.metadata,
    Column('room_id', UUID(as_uuid=True), ForeignKey('rooms.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True)
)

class Room(Base):
    __tablename__ = "rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    status = Column(SQLAlchemyEnum(RoomStatus), default=RoomStatus.WAITING)
    host_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id"), nullable=True)
    is_private = Column(Boolean, default=False)
    room_code = Column(String, unique=True, index=True, nullable=True)
    host_side = Column(String, nullable=True)  # 'tigers' or 'goats'
    source = Column(SQLAlchemyEnum(RoomSource), default=RoomSource.PLAYER_CREATED, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    host = relationship("User", back_populates="hosted_rooms")
    players = relationship("User", secondary=room_players, back_populates="rooms")
    game = relationship("Game", back_populates="room")