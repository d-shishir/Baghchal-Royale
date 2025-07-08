import uuid
import enum
from sqlalchemy import Column, ForeignKey, DateTime, func, Enum as SQLAlchemyEnum, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class MoveType(str, enum.Enum):
    PLACE = "place"
    MOVE = "move"
    CAPTURE = "capture"

class Move(Base):
    __tablename__ = "moves"

    move_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.game_id"), nullable=False)
    player_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    move_number = Column(Integer, nullable=False)
    from_row = Column(Integer)
    from_col = Column(Integer)
    to_row = Column(Integer, nullable=False)
    to_col = Column(Integer, nullable=False)
    move_type = Column(SQLAlchemyEnum(MoveType), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=func.now())

    game = relationship("Game", back_populates="moves")
    player = relationship("User") 