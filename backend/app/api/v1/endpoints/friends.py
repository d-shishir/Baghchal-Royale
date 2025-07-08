from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models, schemas
from app.api import deps
from app.schemas.friendship import FriendshipStatus

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
        if existing_friendship.status == schemas.FriendshipStatus.ACCEPTED:
            raise HTTPException(status_code=400, detail="You are already friends.")
        
        # If request was declined or is pending with the other user, resend it.
        friendship_update = schemas.FriendshipUpdate(
            user_id_1=friend_in.user_id_1,
            user_id_2=friend_in.user_id_2,
            status=schemas.FriendshipStatus.PENDING
        )
        friendship = await crud.friendship.update(db, db_obj=existing_friendship, obj_in=friendship_update)
    else:
        friendship = await crud.friendship.create(db, obj_in=friend_in)

    # Eagerly load the relationships for the response
    return await crud.friendship.get(db, id=friendship.friendship_id)

@router.get("/", response_model=List[schemas.Friendship])
async def get_friends_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get the list of friends.
    """
    friendships_db = await crud.friendship.get_friends(db, user_id=current_user.user_id)
    
    response = []
    for f in friendships_db:
        user1_info = schemas.UserFriendInfo(
            user_id=f.user1.user_id,
            username=f.user1.username,
            status=f.user1.status,
            rating=f.user1.rating,
            level=f.user1.level
        )
        user2_info = schemas.UserFriendInfo(
            user_id=f.user2.user_id,
            username=f.user2.username,
            status=f.user2.status,
            rating=f.user2.rating,
            level=f.user2.level
        )
        friendship_schema = schemas.Friendship(
            friendship_id=f.friendship_id,
            user_id_1=f.user_id_1,
            user_id_2=f.user_id_2,
            created_at=f.created_at,
            status=f.status,
            user1=user1_info,
            user2=user2_info,
        )
        response.append(friendship_schema)
        
    return response

@router.put("/{friendship_id}", response_model=schemas.Friendship)
async def update_friendship_status(
    *,
    db: AsyncSession = Depends(deps.get_db),
    friendship_id: uuid.UUID,
    status_update: schemas.FriendshipUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update friendship status (accept, decline).
    """
    friendship = await crud.friendship.get(db, id=friendship_id)
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found.")

    # Check if the current user is the recipient of the friend request
    if friendship.user_id_2 != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this friendship status.")

    # Check if the status is being updated to a valid state
    if status_update.status not in [FriendshipStatus.ACCEPTED, FriendshipStatus.DECLINED]:
        raise HTTPException(status_code=400, detail="Invalid friendship status.")

    updated_friendship = await crud.friendship.update(
        db, db_obj=friendship, obj_in=status_update
    )
    return await crud.friendship.get(db, id=updated_friendship.friendship_id)

@router.delete("/{friendship_id}", response_model=schemas.Friendship)
async def unfriend(
    *,
    db: AsyncSession = Depends(deps.get_db),
    friendship_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Remove a friend.
    """
    friendship = await crud.friendship.get(db, id=friendship_id)
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found.")
    
    if current_user.user_id not in [friendship.user_id_1, friendship.user_id_2]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this friendship.")

    deleted_friendship = await crud.friendship.remove(db, id=friendship.friendship_id)
    return deleted_friendship 