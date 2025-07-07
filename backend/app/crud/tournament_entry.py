from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.tournament_entry import TournamentEntry
from app.schemas.tournament_entry import TournamentEntryCreate
import uuid

class CRUDTournamentEntry(CRUDBase[TournamentEntry, TournamentEntryCreate, TournamentEntryCreate]):
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[TournamentEntry]:
        result = await db.execute(select(TournamentEntry).filter(TournamentEntry.tournament_entry_id == id))
        return result.scalars().first()

    async def create_tournament_entry(self, db: AsyncSession, *, obj_in: TournamentEntryCreate) -> TournamentEntry:
        db_obj = TournamentEntry(**obj_in.dict())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_entries_by_tournament(
        self, db: AsyncSession, *, tournament_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[TournamentEntry]:
        result = await db.execute(
            select(self.model)
            .where(self.model.tournament_id == tournament_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

tournament_entry = CRUDTournamentEntry(TournamentEntry) 