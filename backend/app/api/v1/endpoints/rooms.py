from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List
from datetime import datetime
import uuid
import random
from sqlalchemy import select

from app import crud, models, schemas
from app.api import deps
from app.models.room import RoomStatus, RoomSource

router = APIRouter()

@router.get("/friends-rooms", response_model=List[schemas.Room])
async def get_friends_rooms(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve rooms created by friends.
    """
    friendships = await crud.friendship.get_friends(db, user_id=current_user.id)
    friend_ids = [
        f.addressee_id if f.requester_id == current_user.id else f.requester_id
        for f in friendships
    ]

    if not friend_ids:
        return []

    stmt = (
        select(models.Room)
        .where(
            models.Room.host_id.in_(friend_ids),
            models.Room.status == RoomStatus.WAITING,
            models.Room.is_private == False,
            models.Room.source == RoomSource.PLAYER_CREATED,
        )
        .options(selectinload(models.Room.host))
    )
    result = await db.execute(stmt)
    rooms = result.scalars().all()
    return rooms

@router.get("/", response_model=List[schemas.Room])
def read_rooms(
    db: Session = Depends(deps.get_db_sync),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
):
    """
    Retrieve waiting rooms.
    """
    try:
        # Simple query without eager loading
        stmt = select(models.Room).where(
            models.Room.status == RoomStatus.WAITING,
            models.Room.source == RoomSource.PLAYER_CREATED
        )
        result = db.execute(stmt)
        rooms = result.scalars().all()
        
        # Manually construct the response for each room
        response_rooms = []
        for room in rooms:
            # Get host info separately
            host_stmt = select(models.User).where(models.User.id == room.host_id)
            host_result = db.execute(host_stmt)
            host = host_result.scalar_one()
            
            response_rooms.append({
                "id": str(room.id),
                "name": room.name,
                "is_private": room.is_private,
                "host_id": str(room.host_id),
                "created_at": room.created_at.isoformat() if room.created_at else datetime.now().isoformat(),
                "status": room.status,
                "host": {
                    "id": str(host.id),
                    "username": host.username,
                    "email": host.email,
                    "rating": host.rating,
                    "games_played": host.games_played,
                    "games_won": host.games_won,
                },
                "players_count": 0,  # TODO: Count players properly
                "max_players": 2,
            })
        
        return response_rooms
    except Exception as e:
        print(f"Error fetching rooms: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching rooms: {str(e)}")

@router.post("/", response_model=schemas.Room)
def create_room(
    *,
    db: Session = Depends(deps.get_db_sync),
    room_in: schemas.RoomCreate,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
):
    """
    Create new room.
    """
    try:
        # Manually generate UUID
        room_id = uuid.uuid4()
        
        # Create room with manual UUID
        db_obj = models.Room(
            id=room_id,
            name=room_in.name,
            is_private=room_in.is_private,
            host_id=current_user.id,
            status=RoomStatus.WAITING
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Handle None created_at
        created_at_str = db_obj.created_at.isoformat() if db_obj.created_at else datetime.now().isoformat()
        
        # Handle None id
        room_id_str = str(db_obj.id) if db_obj.id else str(room_id)
        
        # Manually construct the response
        return {
            "id": room_id_str,
            "name": db_obj.name,
            "is_private": db_obj.is_private,
            "host_id": str(db_obj.host_id),
            "created_at": created_at_str,
            "status": db_obj.status,
            "host": {
                "id": str(current_user.id),
                "username": current_user.username,
                "email": current_user.email,
                "rating": current_user.rating,
                "games_played": current_user.games_played,
                "games_won": current_user.games_won,
            },
            "players_count": 0,  # No players yet
            "max_players": 2,
        }
    except Exception as e:
        print(f"Error creating room: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating room: {str(e)}")

@router.post("/quick-match", response_model=schemas.Room)
def quick_match(
    *,
    db: Session = Depends(deps.get_db_sync),
    request: schemas.QuickMatchRequest,
    current_user: models.User = Depends(deps.get_current_active_user_sync),
):
    """
    Quick match: Join an existing waiting room with an opponent who chose the opposite side,
    or create a new room and wait for an opponent.
    """
    try:
        side = request.side
        if side not in ["tigers", "goats"]:
            raise HTTPException(status_code=400, detail="Invalid side selected. Choose 'tigers' or 'goats'.")

        opposite_side = "goats" if side == "tigers" else "tigers"

        # Find an available public room waiting for the opposite side
        stmt = select(models.Room).where(
            models.Room.status == RoomStatus.WAITING,
            models.Room.is_private == False,
            models.Room.host_id != current_user.id,
            models.Room.host_side == opposite_side,
            models.Room.source == RoomSource.QUICK_MATCH
        )
        result = db.execute(stmt)
        available_room = result.scalars().first()
        
        if available_room:
            with db.no_autoflush:
                # Found a match, join the room
                available_room.players.append(current_user)
                db.add(available_room)

            # Create a new game
            game = crud.game.create_game_from_room(db=db, room=available_room, player1=available_room.host, player2=current_user)
            
            # Update room with game_id and set to playing
            available_room.game_id = game.id
            available_room.status = RoomStatus.PLAYING
            db.commit()
            db.refresh(available_room)

            host = db.query(models.User).filter(models.User.id == available_room.host_id).one()

            return {
                "id": str(available_room.id),
                "game_id": str(game.id),
                "name": available_room.name,
                "is_private": available_room.is_private,
                "host_id": str(available_room.host_id),
                "created_at": available_room.created_at.isoformat(),
                "status": available_room.status,
                "host_side": available_room.host_side,
                "host": {
                    "id": str(host.id),
                    "username": host.username,
                    "email": host.email,
                    "rating": host.rating,
                    "games_played": host.games_played,
                    "games_won": host.games_won,
                },
                "players_count": 2,  # Matched
                "max_players": 2,
            }
        else:
            # No available rooms, create a new one and wait
            room_id = uuid.uuid4()
            db_obj = models.Room(
                id=room_id,
                name=f"Quick Match ({side})",
                is_private=False,
                host_id=current_user.id,
                host_side=side,
                status=RoomStatus.WAITING,
                source=RoomSource.QUICK_MATCH
            )
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            
            return {
                "id": str(db_obj.id),
                "name": db_obj.name,
                "is_private": db_obj.is_private,
                "host_id": str(db_obj.host_id),
                "created_at": db_obj.created_at.isoformat(),
                "status": db_obj.status,
                "host_side": db_obj.host_side,
                "host": {
                    "id": str(current_user.id),
                    "username": current_user.username,
                    "email": current_user.email,
                    "rating": current_user.rating,
                    "games_played": current_user.games_played,
                    "games_won": current_user.games_won,
                },
                "players_count": 1,  # Waiting for opponent
                "max_players": 2,
            }
            
    except Exception as e:
        print(f"Error in quick match: {e}")
        raise HTTPException(status_code=500, detail=f"Error in quick match: {str(e)}") 