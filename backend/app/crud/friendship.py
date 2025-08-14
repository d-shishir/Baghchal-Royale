from typing import List, Optional, Union, Dict, Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import joinedload, noload
from app.crud.base import CRUDBase
from app.models.friendship import Friendship
from app.models.user import User
from app.schemas.friendship import FriendshipCreate

class CRUDFriendship(CRUDBase[Friendship, FriendshipCreate, FriendshipCreate]):
    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: Friendship,
        obj_in: Union[Dict[str, Any], "FriendshipCreate"]
    ) -> Friendship:
        """Override base update to avoid jsonable_encoder recursion on SQLAlchemy models.

        Only apply direct attribute updates for provided fields.
        """
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.dict(exclude_unset=True)
        for field_name, field_value in update_data.items():
            setattr(db_obj, field_name, field_value)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Friendship]:
        result = await db.execute(
            select(Friendship).filter(Friendship.friendship_id == id)
            .options(
                joinedload(self.model.user1).options(
                    noload(User.sent_friend_requests), noload(User.received_friend_requests)
                ),
                joinedload(self.model.user2).options(
                    noload(User.sent_friend_requests), noload(User.received_friend_requests)
                )
            )
        )
        return result.scalars().first()

    async def get_friendship_by_users(
        self, db: AsyncSession, *, user1_id: uuid.UUID, user2_id: uuid.UUID
    ) -> Optional[Friendship]:
        result = await db.execute(
            select(self.model).where(
                or_(
                    (self.model.user_id_1 == user1_id) & (self.model.user_id_2 == user2_id),
                    (self.model.user_id_1 == user2_id) & (self.model.user_id_2 == user1_id)
                )
            ).options(
                joinedload(self.model.user1).options(
                    noload(User.sent_friend_requests), noload(User.received_friend_requests)
                ),
                joinedload(self.model.user2).options(
                    noload(User.sent_friend_requests), noload(User.received_friend_requests)
                )
            )
        )
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: FriendshipCreate) -> Friendship:
        db_obj = Friendship(
            user_id_1=obj_in.user_id_1,
            user_id_2=obj_in.user_id_2
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: uuid.UUID) -> Friendship:
        result = await db.execute(select(self.model).filter(self.model.friendship_id == id))
        obj = result.scalars().first()
        await db.delete(obj)
        await db.commit()
        return obj

    async def get_friends(self, db: AsyncSession, *, user_id: uuid.UUID) -> List[Friendship]:
        result = await db.execute(
            select(self.model)
            .where((self.model.user_id_1 == user_id) | (self.model.user_id_2 == user_id))
            .options(
                joinedload(self.model.user1).options(
                    noload(User.sent_friend_requests), noload(User.received_friend_requests)
                ),
                joinedload(self.model.user2).options(
                    noload(User.sent_friend_requests), noload(User.received_friend_requests)
                )
            )
        )
        return result.scalars().all()

friendship = CRUDFriendship(Friendship) 