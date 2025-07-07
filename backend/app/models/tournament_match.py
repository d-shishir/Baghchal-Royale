import uuid
from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class TournamentMatch(Base):
    __tablename__ = "tournament_matches"

    match_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tournament_id = Column(UUID(as_uuid=True), ForeignKey("tournaments.tournament_id"), nullable=False)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.game_id"), nullable=False)

    tournament = relationship("Tournament", back_populates="matches")
    game = relationship("Game") 