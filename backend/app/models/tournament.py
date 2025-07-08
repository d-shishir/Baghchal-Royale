import uuid
import enum
from sqlalchemy import Column, DateTime, func, Enum as SQLAlchemyEnum, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class TournamentType(str, enum.Enum):
    ROUND_ROBIN = "ROUND_ROBIN"
    KNOCKOUT = "KNOCKOUT"

class TournamentStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Tournament(Base):
    __tablename__ = "tournaments"

    tournament_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    max_participants = Column(Integer, nullable=False)
    tournament_type = Column(SQLAlchemyEnum(TournamentType), nullable=False)
    status = Column(SQLAlchemyEnum(TournamentStatus), nullable=False, default=TournamentStatus.PENDING)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

    entries = relationship("TournamentEntry", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship("TournamentMatch", back_populates="tournament", cascade="all, delete-orphan")

    # Add any other necessary columns here

    # Relationships
    # For example, if you have a relationship with teams:
    # teams = relationship("Team", secondary="tournament_teams", back_populates="tournaments")

    # Add any other necessary relationships here 