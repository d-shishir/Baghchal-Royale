from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.AIGame)
async def create_ai_game(
    *,
    db: AsyncSession = Depends(deps.get_db),
    ai_game_in: schemas.AIGameCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new AI game.
    """
    if current_user.user_id != ai_game_in.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    ai_game = await crud.ai_game.create_ai_game(db, obj_in=ai_game_in)
    return ai_game

@router.get("/", response_model=List[schemas.AIGame])
async def get_ai_games(
    *,
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve user's AI games.
    """
    ai_games = await crud.ai_game.get_ai_games_by_user(db, user_id=current_user.user_id, skip=skip, limit=limit)
    return ai_games

@router.get("/{ai_game_id}", response_model=schemas.AIGame)
async def get_ai_game(
    *,
    db: AsyncSession = Depends(deps.get_db),
    ai_game_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get AI game by ID.
    """
    ai_game = await crud.ai_game.get(db, id=ai_game_id)
    if not ai_game:
        raise HTTPException(status_code=404, detail="AI Game not found")
    if current_user.user_id != ai_game.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return ai_game 