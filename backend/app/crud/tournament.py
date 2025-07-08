from app.crud.base import CRUDBase
from app.models.tournament import Tournament
from app.schemas.tournament import TournamentCreate, TournamentUpdate
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from sqlalchemy.orm import selectinload

class CRUDTournament(CRUDBase[Tournament, TournamentCreate, TournamentUpdate]):
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Tournament]:
        result = await db.execute(
            select(Tournament).filter(Tournament.tournament_id == id).options(
                selectinload(Tournament.entries), selectinload(Tournament.matches)
            )
        )
        return result.scalars().first()
    
    async def create(self, db: AsyncSession, *, obj_in: TournamentCreate) -> Tournament:
        db_obj = Tournament(**obj_in.dict())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return await self.get(db, id=db_obj.tournament_id)

    async def update(
        self, db: AsyncSession, *, db_obj: Tournament, obj_in: TournamentUpdate
    ) -> Tournament:
        update_data = obj_in.dict(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return await self.get(db, id=db_obj.tournament_id)

tournament = CRUDTournament(Tournament) 