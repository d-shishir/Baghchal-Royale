from typing import List, Optional, Union
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.friendship import Friendship, FriendshipStatus
from app.models.user import User
from app.schemas import FriendshipCreate, FriendshipUpdate

class CRUDFriendship(CRUDBase[Friendship, FriendshipCreate, FriendshipUpdate]):
    async def get_friendship_by_users(
        self, db: AsyncSession, *, user1_id: uuid.UUID, user2_id: uuid.UUID
    ) -> Optional[Friendship]:
        result = await db.execute(
            select(self.model).where(
                ((self.model.requester_id == user1_id) & (self.model.addressee_id == user2_id)) |
                ((self.model.requester_id == user2_id) & (self.model.addressee_id == user1_id))
            )
        )
        return result.scalars().first()

    async def create_request(
        self, db: AsyncSession, *, requester_id: uuid.UUID, addressee_id: uuid.UUID
    ) -> Friendship:
        db_obj = Friendship(
            requester_id=requester_id,
            addressee_id=addressee_id,
            status=FriendshipStatus.PENDING
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_friends(self, db: AsyncSession, *, user_id: uuid.UUID) -> List[Friendship]:
        result = await db.execute(
            select(self.model)
            .where(
                ((self.model.requester_id == user_id) | (self.model.addressee_id == user_id)) &
                (self.model.status == FriendshipStatus.ACCEPTED)
            )
            .options(selectinload(self.model.requester), selectinload(self.model.addressee))
        )
        return result.scalars().all()

    async def get_pending_requests(self, db: AsyncSession, *, user_id: uuid.UUID) -> List[Friendship]:
        result = await db.execute(
            select(self.model)
            .where(
                (self.model.addressee_id == user_id) & (self.model.status == FriendshipStatus.PENDING)
            )
            .options(selectinload(self.model.requester))
        )
        return result.scalars().all()


friendship = CRUDFriendship(Friendship) 