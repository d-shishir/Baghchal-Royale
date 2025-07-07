from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.game import Game
from app.schemas.game import GameCreate, GameUpdate
import uuid

class CRUDGame(CRUDBase[Game, GameCreate, GameUpdate]):
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Game]:
        result = await db.execute(select(Game).filter(Game.game_id == id))
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: GameCreate) -> Game:
        db_obj = Game(
            player_goat_id=obj_in.player_goat_id,
            player_tiger_id=obj_in.player_tiger_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_games_by_user(
        self, db: AsyncSession, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Game]:
        result = await db.execute(
            select(self.model)
            .where(
                (self.model.player_goat_id == user_id) | 
                (self.model.player_tiger_id == user_id)
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

game = CRUDGame(Game)