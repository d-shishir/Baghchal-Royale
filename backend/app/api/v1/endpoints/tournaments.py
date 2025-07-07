from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.Tournament)
async def create_tournament(
    *,
    db: AsyncSession = Depends(deps.get_db),
    tournament_in: schemas.TournamentCreate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new tournament.
    """
    tournament = await crud.tournament.create(db, obj_in=tournament_in)
    return tournament

@router.get("/", response_model=List[schemas.Tournament])
async def get_tournaments(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve tournaments.
    """
    tournaments = await crud.tournament.get_multi(db, skip=skip, limit=limit)
    return tournaments

@router.get("/{tournament_id}", response_model=schemas.Tournament)
async def get_tournament(
    *,
    tournament_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get tournament by ID.
    """
    tournament = await crud.tournament.get(db, id=tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament

@router.put("/{tournament_id}", response_model=schemas.Tournament)
async def update_tournament(
    *,
    db: AsyncSession = Depends(deps.get_db),
    tournament_id: uuid.UUID,
    tournament_in: schemas.TournamentUpdate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Update a tournament.
    """
    tournament = await crud.tournament.get(db, id=tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    updated_tournament = await crud.tournament.update(db, db_obj=tournament, obj_in=tournament_in)
    return updated_tournament

@router.post("/{tournament_id}/entries", response_model=schemas.TournamentEntry)
async def create_tournament_entry(
    *,
    db: AsyncSession = Depends(deps.get_db),
    tournament_id: uuid.UUID,
    entry_in: schemas.TournamentEntryCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new tournament entry.
    """
    if current_user.user_id != entry_in.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    tournament = await crud.tournament.get(db, id=tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    entry = await crud.tournament_entry.create_tournament_entry(db, obj_in=entry_in)
    return entry

@router.get("/{tournament_id}/entries", response_model=List[schemas.TournamentEntry])
async def get_tournament_entries(
    *,
    db: AsyncSession = Depends(deps.get_db),
    tournament_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve entries for a tournament.
    """
    entries = await crud.tournament_entry.get_entries_by_tournament(db, tournament_id=tournament_id, skip=skip, limit=limit)
    return entries

@router.post("/{tournament_id}/matches", response_model=schemas.TournamentMatch)
async def create_tournament_match(
    *,
    db: AsyncSession = Depends(deps.get_db),
    tournament_id: uuid.UUID,
    match_in: schemas.TournamentMatchCreate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new tournament match.
    """
    tournament = await crud.tournament.get(db, id=tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    match = await crud.tournament_match.create_tournament_match(db, obj_in=match_in)
    return match

@router.get("/{tournament_id}/matches", response_model=List[schemas.TournamentMatch])
async def get_tournament_matches(
    *,
    db: AsyncSession = Depends(deps.get_db),
    tournament_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve matches for a tournament.
    """
    matches = await crud.tournament_match.get_matches_by_tournament(db, tournament_id=tournament_id, skip=skip, limit=limit)
    return matches 