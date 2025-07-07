from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.Friendship)
async def add_friend(
    *,
    db: AsyncSession = Depends(deps.get_db),
    friend_in: schemas.FriendshipCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Add a new friend.
    """
    if current_user.user_id not in [friend_in.user_id_1, friend_in.user_id_2]:
        raise HTTPException(status_code=403, detail="Cannot create friendship for other users.")

    user1 = await crud.user.get(db, id=friend_in.user_id_1)
    user2 = await crud.user.get(db, id=friend_in.user_id_2)

    if not user1 or not user2:
        raise HTTPException(status_code=404, detail="One or both users not found.")
    
    if user1.user_id == user2.user_id:
        raise HTTPException(status_code=400, detail="Cannot create a friendship with oneself.")

    existing_friendship = await crud.friendship.get_friendship_by_users(
        db, user1_id=user1.user_id, user2_id=user2.user_id
    )
    if existing_friendship:
        raise HTTPException(status_code=400, detail="Friendship already exists.")

    friendship = await crud.friendship.create(db, obj_in=friend_in)
    return friendship

@router.get("/", response_model=List[schemas.User])
async def get_friends_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get the list of friends.
    """
    friendships = await crud.friendship.get_friends(db, user_id=current_user.user_id)
    friends = []
    for f in friendships:
        if f.user_id_1 == current_user.user_id:
            friends.append(f.user2)
        else:
            friends.append(f.user1)
    return friends

@router.delete("/{friend_id}", response_model=schemas.Friendship)
async def unfriend(
    *,
    db: AsyncSession = Depends(deps.get_db),
    friend_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Remove a friend.
    """
    friendship = await crud.friendship.get_friendship_by_users(
        db, user1_id=current_user.user_id, user2_id=friend_id
    )
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found.")

    deleted_friendship = await crud.friendship.remove(db, id=friendship.friendship_id)
    return deleted_friendship 