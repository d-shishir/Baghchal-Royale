from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.AIMove)
async def create_ai_move(
    *,
    db: AsyncSession = Depends(deps.get_db),
    ai_move_in: schemas.AIMoveCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new AI move.
    """
    ai_game = await crud.ai_game.get(db, id=ai_move_in.ai_game_id)
    if not ai_game:
        raise HTTPException(status_code=404, detail="AI Game not found")
    if current_user.user_id != ai_game.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    ai_move = await crud.ai_move.create_ai_move(db, obj_in=ai_move_in)
    return ai_move

@router.get("/{ai_game_id}", response_model=List[schemas.AIMove])
async def get_ai_moves(
    *,
    db: AsyncSession = Depends(deps.get_db),
    ai_game_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve moves for an AI game.
    """
    ai_game = await crud.ai_game.get(db, id=ai_game_id)
    if not ai_game:
        raise HTTPException(status_code=404, detail="AI Game not found")
    if current_user.user_id != ai_game.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    ai_moves = await crud.ai_move.get_ai_moves_by_game(db, ai_game_id=ai_game_id, skip=skip, limit=limit)
    return ai_moves 