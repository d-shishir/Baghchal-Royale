from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/me", response_model=schemas.User)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=schemas.User)
async def update_user_me(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update own user.
    """
    user = await crud.user.update(db, db_obj=current_user, obj_in=user_in)
    return user

@router.get("/search", response_model=List[schemas.User])
async def search_users(
    *,
    db: AsyncSession = Depends(deps.get_db),
    query: str,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Search users by username.
    """
    stmt = select(models.User).where(
        models.User.username.ilike(f"%{query}%")
    ).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users

@router.get("/leaderboard", response_model=List[schemas.User])
async def get_leaderboard(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get the top players leaderboard by rating.
    """
    stmt = select(models.User).order_by(desc(models.User.rating)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users

@router.get("/{user_id}", response_model=schemas.User)
async def read_user_by_id(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific user by id.
    """
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user 