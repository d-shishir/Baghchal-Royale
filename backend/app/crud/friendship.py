from typing import List, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.crud.base import CRUDBase
from app.models.friendship import Friendship
from app.schemas.friendship import FriendshipCreate

class CRUDFriendship(CRUDBase[Friendship, FriendshipCreate, FriendshipCreate]):
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Friendship]:
        result = await db.execute(select(Friendship).filter(Friendship.friendship_id == id))
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
            )
        )
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: FriendshipCreate) -> Friendship:
        # Ensure user_id_1 < user_id_2 to maintain uniqueness
        user_ids = sorted([str(obj_in.user_id_1), str(obj_in.user_id_2)])
        
        db_obj = Friendship(
            user_id_1=uuid.UUID(user_ids[0]),
            user_id_2=uuid.UUID(user_ids[1])
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
            .options(selectinload(self.model.user1), selectinload(self.model.user2))
        )
        return result.scalars().all()

friendship = CRUDFriendship(Friendship) 