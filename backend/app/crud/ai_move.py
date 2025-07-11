from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy import func
from app.crud.base import CRUDBase
from app.models.ai_move import AIMove
from app.schemas.ai_move import AIMoveCreate, AIMoveUpdate

class CRUDAIMove(CRUDBase[AIMove, AIMoveCreate, AIMoveUpdate]):
    async def create_ai_move(self, db: AsyncSession, *, obj_in: AIMoveCreate) -> AIMove:
        db_obj = AIMove(**obj_in.dict())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_ai_moves_by_game(
        self, db: AsyncSession, *, ai_game_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AIMove]:
        result = await db.execute(
            select(self.model)
            .where(self.model.ai_game_id == ai_game_id)
            .order_by(self.model.move_number)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_moves_count_by_game(self, db: AsyncSession, *, ai_game_id: UUID) -> int:
        result = await db.execute(
            select(func.count(self.model.ai_move_id))
            .filter(self.model.ai_game_id == ai_game_id)
        )
        return result.scalar_one()

ai_move = CRUDAIMove(AIMove) 