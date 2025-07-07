from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.Game)
async def create_game(
    *,
    db: AsyncSession = Depends(deps.get_db),
    game_in: schemas.GameCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new game.
    """
    if current_user.user_id not in [game_in.player_goat_id, game_in.player_tiger_id]:
        raise HTTPException(status_code=403, detail="Cannot create game for other users.")

    game = await crud.game.create(db, obj_in=game_in)
    return game

@router.get("/", response_model=List[schemas.Game])
async def get_games(
    *,
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve user's games.
    """
    games = await crud.game.get_games_by_user(db, user_id=current_user.user_id, skip=skip, limit=limit)
    return games

@router.get("/{game_id}", response_model=schemas.Game)
async def get_game(
    *,
    db: AsyncSession = Depends(deps.get_db),
    game_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get game by ID.
    """
    game = await crud.game.get(db, id=game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if current_user.user_id not in [game.player_goat_id, game.player_tiger_id]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return game

@router.put("/{game_id}", response_model=schemas.Game)
async def update_game(
    *,
    db: AsyncSession = Depends(deps.get_db),
    game_id: uuid.UUID,
    game_in: schemas.GameUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a game.
    """
    game = await crud.game.get(db, id=game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if current_user.user_id not in [game.player_goat_id, game.player_tiger_id]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    updated_game = await crud.game.update(db, db_obj=game, obj_in=game_in)
    return updated_game

 