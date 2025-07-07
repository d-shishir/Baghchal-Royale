import uuid
import enum
from sqlalchemy import Column, ForeignKey, Enum as SQLAlchemyEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class TournamentEntryStatus(str, enum.Enum):
    ACTIVE = "active"
    ELIMINATED = "eliminated"
    WINNER = "winner"

class TournamentEntry(Base):
    __tablename__ = "tournament_entries"

    tournament_id = Column(UUID(as_uuid=True), ForeignKey("tournaments.tournament_id"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), primary_key=True)
    score = Column(Integer, nullable=True)
    status = Column(SQLAlchemyEnum(TournamentEntryStatus), nullable=False, default=TournamentEntryStatus.ACTIVE)

    tournament = relationship("Tournament", back_populates="entries")
    user = relationship("User") 