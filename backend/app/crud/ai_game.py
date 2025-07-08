from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.crud.base import CRUDBase
from app.models.ai_game import AIGame
from app.schemas.ai_game import AIGameCreate

class CRUDAIGame(CRUDBase[AIGame, AIGameCreate, AIGameCreate]):
    async def get(self, db: AsyncSession, id: UUID) -> Optional[AIGame]:
        result = await db.execute(
            select(AIGame).filter(AIGame.ai_game_id == id).options(
                selectinload(AIGame.user), selectinload(AIGame.moves)
            )
        )
        return result.scalars().first()

    async def create_ai_game(self, db: AsyncSession, *, obj_in: AIGameCreate) -> AIGame:
        db_obj = AIGame(**obj_in.dict())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return await self.get(db, id=db_obj.ai_game_id)

    async def get_ai_games_by_user(
        self, db: AsyncSession, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AIGame]:
        result = await db.execute(
            select(self.model)
            .where(self.model.user_id == user_id)
            .options(
                selectinload(AIGame.user), selectinload(AIGame.moves)
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

ai_game = CRUDAIGame(AIGame) 