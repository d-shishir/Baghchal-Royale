import uuid
from sqlalchemy import Column, ForeignKey, DateTime, func, PrimaryKeyConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Friendship(Base):
    __tablename__ = "friendships"

    user_id_1 = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), primary_key=True)
    user_id_2 = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), primary_key=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    user1 = relationship("User", foreign_keys=[user_id_1])
    user2 = relationship("User", foreign_keys=[user_id_2])

    __table_args__ = (
        CheckConstraint("user_id_1 != user_id_2"),
    ) 