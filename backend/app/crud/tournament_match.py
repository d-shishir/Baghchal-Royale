from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.crud.base import CRUDBase
from app.models.tournament_match import TournamentMatch
from app.schemas.tournament_match import TournamentMatchCreate
import uuid

class CRUDTournamentMatch(CRUDBase[TournamentMatch, TournamentMatchCreate, TournamentMatchCreate]):
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[TournamentMatch]:
        result = await db.execute(
            select(TournamentMatch).filter(TournamentMatch.match_id == id).options(
                selectinload(TournamentMatch.tournament), selectinload(TournamentMatch.game)
            )
        )
        return result.scalars().first()

    async def create_tournament_match(self, db: AsyncSession, *, obj_in: TournamentMatchCreate) -> TournamentMatch:
        db_obj = TournamentMatch(**obj_in.dict())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return await self.get(db, id=db_obj.match_id)

    async def get_matches_by_tournament(
        self, db: AsyncSession, *, tournament_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[TournamentMatch]:
        result = await db.execute(
            select(self.model)
            .where(self.model.tournament_id == tournament_id)
            .options(
                selectinload(TournamentMatch.tournament), selectinload(TournamentMatch.game)
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

tournament_match = CRUDTournamentMatch(TournamentMatch) 