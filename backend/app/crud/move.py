from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.crud.base import CRUDBase
from app.models.move import Move
from app.schemas.move import MoveCreate
import uuid

class CRUDMove(CRUDBase[Move, MoveCreate, MoveCreate]):
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Move]:
        result = await db.execute(
            select(Move).filter(Move.move_id == id).options(
                selectinload(Move.game), selectinload(Move.player)
            )
        )
        return result.scalars().first()

    async def create_move(self, db: AsyncSession, *, obj_in: MoveCreate) -> Move:
        db_obj = Move(**obj_in.dict())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return await self.get(db, id=db_obj.move_id)

    async def get_moves_by_game(
        self, db: AsyncSession, *, game_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Move]:
        result = await db.execute(
            select(self.model)
            .where(self.model.game_id == game_id)
            .order_by(self.model.move_number)
            .options(
                selectinload(Move.game), selectinload(Move.player)
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

move = CRUDMove(Move) 