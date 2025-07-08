from typing import Any, Dict, Optional, Union
import uuid
from sqlalchemy import func, select, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models import Game
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserWithStats
from app.schemas.game import GameStatus


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_with_stats(self, db: AsyncSession, *, user_id: uuid.UUID) -> Optional[UserWithStats]:
        """
        Get a user by ID and calculate their game statistics.
        """
        user = await self.get(db, id=user_id)
        if not user:
            return None

        stmt = (
            select(
                func.count(Game.game_id).label("games_played"),
                func.sum(
                    case(
                        (Game.winner_id == user_id, 1),
                        else_=0
                    )
                ).label("wins"),
            )
            .where(
                (Game.player_goat_id == user_id) | (Game.player_tiger_id == user_id),
                Game.status == GameStatus.COMPLETED,
            )
        )
        
        result = await db.execute(stmt)
        stats = result.first()
        
        games_played = stats.games_played or 0
        wins = stats.wins or 0
        losses = games_played - wins
        
        if games_played > 0:
            win_rate = round((wins / games_played) * 100, 2)
        else:
            win_rate = 0.0
            
        return UserWithStats(
            **user.__dict__,
            games_played=games_played,
            wins=wins,
            losses=losses,
            win_rate=win_rate
        )

    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[User]:
        result = await db.execute(select(User).filter(User.user_id == id))
        return result.scalars().first()

    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    async def get_by_username(self, db: AsyncSession, *, username: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.username == username))
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            username=obj_in.username,
            password=get_password_hash(obj_in.password),
            role=UserRole.ADMIN if obj_in.is_superuser else UserRole.USER,
            country=obj_in.country,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: User,
        obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
            
        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["password"] = hashed_password
            
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def authenticate(
        self, db: AsyncSession, *, email: str, password: str
    ) -> Optional[User]:
        user = await self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user


user = CRUDUser(User) 