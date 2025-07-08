import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, func, Enum as SQLAlchemyEnum, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base
from sqlalchemy.orm import relationship

class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"

class UserStatus(str, enum.Enum):
    OFFLINE = "OFFLINE"
    ONLINE = "ONLINE"
    INGAME = "INGAME"

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(SQLAlchemyEnum(UserRole), nullable=False, default=UserRole.USER)
    status = Column(SQLAlchemyEnum(UserStatus), nullable=False, default=UserStatus.OFFLINE)
    country = Column(String, nullable=True)
    rating = Column(Integer, default=1200, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    xp = Column(Integer, default=0, nullable=False)
    achievements = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    games_as_goat = relationship("Game", foreign_keys="[Game.player_goat_id]", back_populates="player_goat")
    games_as_tiger = relationship("Game", foreign_keys="[Game.player_tiger_id]", back_populates="player_tiger")
    
    reporter_reports = relationship("Report", foreign_keys="[Report.reporter_id]", back_populates="reporter")
    reported_reports = relationship("Report", foreign_keys="[Report.reported_id]", back_populates="reported")
    
    feedbacks = relationship("Feedback", back_populates="user")
    
    tournament_entries = relationship("TournamentEntry", back_populates="user")
    
    sent_friend_requests = relationship(
        "Friendship",
        foreign_keys="[Friendship.user_id_1]",
        back_populates="user1",
        cascade="all, delete-orphan",
    )
    received_friend_requests = relationship(
        "Friendship",
        foreign_keys="[Friendship.user_id_2]",
        back_populates="user2",
        cascade="all, delete-orphan",
    )