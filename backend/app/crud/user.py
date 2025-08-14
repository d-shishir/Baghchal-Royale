from typing import Any, Dict, Optional, Union
import uuid
from sqlalchemy import func, select, case, and_
from sqlalchemy import or_  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models import Game
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserWithStats
from app.models.game import GameStatus
from app.models.ai_game import AIGame, AIGameStatus


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_rank_by_rating(self, db: AsyncSession, *, user_id: uuid.UUID) -> Optional[int]:
        """
        Compute user's rank based on rating. Rank 1 is highest rating.
        """
        user = await self.get(db, id=user_id)
        if not user:
            return None
        # Count how many users have strictly higher rating
        higher_count = await db.execute(select(func.count(User.user_id)).where(User.rating > user.rating))
        higher = higher_count.scalar() or 0
        return higher + 1
    async def get_with_stats(self, db: AsyncSession, *, user_id: uuid.UUID) -> Optional[UserWithStats]:
        """
        Get a user by ID and calculate their game statistics.
        """
        user = await self.get(db, id=user_id)
        if not user:
            return None

        # PVP totals
        pvp_total_stmt = (
            select(func.count(Game.game_id))
            .where((Game.player_goat_id == user_id) | (Game.player_tiger_id == user_id))
        )
        pvp_finished_stmt = (
            select(func.count(Game.game_id))
            .where(
                (Game.player_goat_id == user_id) | (Game.player_tiger_id == user_id),
                Game.status.in_([GameStatus.COMPLETED, GameStatus.ABANDONED]),
            )
        )
        pvp_wins_stmt = (
            select(
                func.sum(
                    case(
                        (Game.winner_id == user_id, 1),
                        else_=0,
                    )
                )
            )
            .where(
                (Game.player_goat_id == user_id) | (Game.player_tiger_id == user_id),
                Game.status.in_([GameStatus.COMPLETED, GameStatus.ABANDONED]),
            )
        )

        # AI totals
        ai_total_stmt = select(func.count(AIGame.ai_game_id)).where(AIGame.user_id == user_id)
        ai_finished_stmt = select(func.count(AIGame.ai_game_id)).where(
            AIGame.user_id == user_id,
            AIGame.status == AIGameStatus.COMPLETED,
        )
        ai_wins_stmt = select(
            func.sum(
                case(
                    (
                        and_(
                            AIGame.status == AIGameStatus.COMPLETED,
                            AIGame.winner == 'TIGER',
                            AIGame.user_side == 'TIGER',
                        ),
                        1,
                    ),
                    (
                        and_(
                            AIGame.status == AIGameStatus.COMPLETED,
                            AIGame.winner == 'GOAT',
                            AIGame.user_side == 'GOAT',
                        ),
                        1,
                    ),
                    else_=0,
                )
            )
        ).where(AIGame.user_id == user_id)

        # Execute queries
        pvp_total = (await db.execute(pvp_total_stmt)).scalar() or 0
        pvp_finished = (await db.execute(pvp_finished_stmt)).scalar() or 0
        pvp_wins = (await db.execute(pvp_wins_stmt)).scalar() or 0

        ai_total = (await db.execute(ai_total_stmt)).scalar() or 0
        ai_finished = (await db.execute(ai_finished_stmt)).scalar() or 0
        ai_wins = (await db.execute(ai_wins_stmt)).scalar() or 0

        total_played = pvp_total + ai_total
        total_finished = pvp_finished + ai_finished
        total_wins = (pvp_wins or 0) + (ai_wins or 0)
        total_losses = max(total_finished - total_wins, 0)

        if total_finished > 0:
            win_rate = round((total_wins / total_finished) * 100, 2)
        else:
            win_rate = 0.0
            
        return UserWithStats(
            **user.__dict__,
            games_played=total_played,
            wins=total_wins,
            losses=total_losses,
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