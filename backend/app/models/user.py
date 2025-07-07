import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, func, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base
from sqlalchemy.orm import relationship

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(SQLAlchemyEnum(UserRole), nullable=False, default=UserRole.USER)
    rating = Column(Integer, default=1200, nullable=False)
    created_at = Column(DateTime, default=func.now())

    games_as_goat = relationship("Game", foreign_keys="[Game.player_goat_id]", back_populates="player_goat")
    games_as_tiger = relationship("Game", foreign_keys="[Game.player_tiger_id]", back_populates="player_tiger")