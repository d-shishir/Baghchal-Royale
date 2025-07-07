from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.rating_history import RatingHistory
from app.schemas.rating_history import RatingHistoryCreate

class CRUDRatingHistory(CRUDBase[RatingHistory, RatingHistoryCreate, RatingHistoryCreate]):
    async def create_rating_history(self, db: AsyncSession, *, obj_in: RatingHistoryCreate) -> RatingHistory:
        db_obj = RatingHistory(**obj_in.dict())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_rating_history_by_user(
        self, db: AsyncSession, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[RatingHistory]:
        result = await db.execute(
            select(self.model)
            .where(self.model.user_id == user_id)
            .order_by(self.model.changed_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

rating_history = CRUDRatingHistory(RatingHistory) 