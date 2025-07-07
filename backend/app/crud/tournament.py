from app.crud.base import CRUDBase
from app.models.tournament import Tournament
from app.schemas.tournament import TournamentCreate, TournamentUpdate
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

class CRUDTournament(CRUDBase[Tournament, TournamentCreate, TournamentUpdate]):
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Tournament]:
        result = await db.execute(select(Tournament).filter(Tournament.tournament_id == id))
        return result.scalars().first()

tournament = CRUDTournament(Tournament) 