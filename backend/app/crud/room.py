from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
import uuid
from typing import List, Optional

from .base import CRUDBase
from app.models.room import Room, RoomStatus
from app.schemas.room import RoomCreate, RoomUpdate

class CRUDRoom(CRUDBase[Room, RoomCreate, RoomUpdate]):
    def create_with_host(self, db: Session, *, obj_in: RoomCreate, host_id: uuid.UUID) -> Room:
        db_obj = Room(
            name=obj_in.name,
            is_private=obj_in.is_private,
            host_id=host_id,
            status=RoomStatus.WAITING
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Reload with relationships
        stmt = select(Room).options(
            selectinload(Room.host),
            selectinload(Room.players)
        ).where(Room.id == db_obj.id)
        result = db.execute(stmt)
        return result.scalar_one()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Room]:
        stmt = select(Room).options(
            selectinload(Room.host),
            selectinload(Room.players)
        ).offset(skip).limit(limit)
        result = db.execute(stmt)
        return result.scalars().all()

    def get_by_host(self, db: Session, *, host_id: uuid.UUID) -> List[Room]:
        stmt = select(Room).options(
            selectinload(Room.host),
            selectinload(Room.players)
        ).where(Room.host_id == host_id)
        result = db.execute(stmt)
        return result.scalars().all()

    def get_waiting(self, db: Session) -> List[Room]:
        stmt = select(Room).options(
            selectinload(Room.host),
            selectinload(Room.players)
        ).where(Room.status == RoomStatus.WAITING)
        result = db.execute(stmt)
        return result.scalars().all()

room = CRUDRoom(Room) 