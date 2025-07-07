from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.Move)
async def create_move(
    *,
    db: AsyncSession = Depends(deps.get_db),
    move_in: schemas.MoveCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new move.
    """
    game = await crud.game.get(db, id=move_in.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if current_user.user_id not in [game.player_goat_id, game.player_tiger_id]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    move = await crud.move.create_move(db, obj_in=move_in)
    return move

@router.get("/{game_id}", response_model=List[schemas.Move])
async def get_moves(
    *,
    db: AsyncSession = Depends(deps.get_db),
    game_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve moves for a game.
    """
    game = await crud.game.get(db, id=game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if current_user.user_id not in [game.player_goat_id, game.player_tiger_id]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    moves = await crud.move.get_moves_by_game(db, game_id=game_id, skip=skip, limit=limit)
    return moves 