import uuid
import enum
from sqlalchemy import (
    Column,
    ForeignKey,
    DateTime,
    func,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class FriendshipStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"

class Friendship(Base):
    __tablename__ = "friendships"

    friendship_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id_1 = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    user_id_2 = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    status = Column(
        SQLAlchemyEnum(FriendshipStatus),
        nullable=False,
        default=FriendshipStatus.PENDING,
    )
    created_at = Column(DateTime(timezone=True), default=func.now())

    user1 = relationship(
        "User", foreign_keys=[user_id_1], back_populates="sent_friend_requests"
    )
    user2 = relationship(
        "User", foreign_keys=[user_id_2], back_populates="received_friend_requests"
    ) 