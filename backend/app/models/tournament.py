import uuid
import enum
from sqlalchemy import Column, DateTime, func, Enum as SQLAlchemyEnum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class TournamentType(str, enum.Enum):
    KNOCKOUT = "knockout"
    ROUND_ROBIN = "round_robin"

class TournamentStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"

class Tournament(Base):
    __tablename__ = "tournaments"

    tournament_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(SQLAlchemyEnum(TournamentType), nullable=False)
    status = Column(SQLAlchemyEnum(TournamentStatus), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)

    entries = relationship("TournamentEntry", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship("TournamentMatch", back_populates="tournament", cascade="all, delete-orphan") 