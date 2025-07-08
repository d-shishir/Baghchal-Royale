from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.crud.base import CRUDBase
from app.models.game import Game
from app.schemas.game import GameCreate, GameUpdate
import uuid

class CRUDGame(CRUDBase[Game, GameCreate, GameUpdate]):
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Game]:
        result = await db.execute(
            select(Game).filter(Game.game_id == id).options(
                selectinload(Game.player_goat), selectinload(Game.player_tiger)
            )
        )
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: GameCreate) -> Game:
        db_obj = Game(
            player_goat_id=obj_in.player_goat_id,
            player_tiger_id=obj_in.player_tiger_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return await self.get(db, id=db_obj.game_id)

    async def get_games_by_user(
        self, db: AsyncSession, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Game]:
        result = await db.execute(
            select(self.model)
            .where(
                (self.model.player_goat_id == user_id) | 
                (self.model.player_tiger_id == user_id)
            )
            .options(
                selectinload(Game.player_goat), selectinload(Game.player_tiger)
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def update(
        self, db: AsyncSession, *, db_obj: Game, obj_in: GameUpdate
    ) -> Game:
        update_data = obj_in.dict(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return await self.get(db, id=db_obj.game_id)

game = CRUDGame(Game)