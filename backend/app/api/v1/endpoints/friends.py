from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/request", response_model=schemas.Friendship)
async def send_friend_request(
    *,
    db: AsyncSession = Depends(deps.get_db),
    friend_in: schemas.FriendshipCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Send a friend request to another user.
    """
    addressee = await crud.user.get(db, id=friend_in.addressee_id)
    if not addressee:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if current_user.id == addressee.id:
        raise HTTPException(status_code=400, detail="Cannot send a friend request to yourself.")

    existing_friendship = await crud.friendship.get_friendship_by_users(
        db, user1_id=current_user.id, user2_id=addressee.id
    )
    if existing_friendship:
        raise HTTPException(status_code=400, detail="A friendship or request already exists.")

    friendship = await crud.friendship.create_request(
        db, requester_id=current_user.id, addressee_id=addressee.id
    )
    return friendship

@router.get("/list", response_model=List[schemas.FriendshipInfo])
async def get_friends_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get the list of accepted friends.
    """
    friendships = await crud.friendship.get_friends(db, user_id=current_user.id)
    response = []
    for f in friendships:
        friend_user = f.addressee if f.requester_id == current_user.id else f.requester
        response.append({"id": f.id, "status": f.status, "friend": friend_user})
    return response

@router.get("/requests", response_model=List[schemas.FriendshipInfo])
async def get_pending_friend_requests(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get pending friend requests for the current user.
    """
    pending_requests = await crud.friendship.get_pending_requests(db, user_id=current_user.id)
    response = []
    for req in pending_requests:
        response.append({"id": req.id, "status": req.status, "friend": req.requester})
    return response

@router.put("/request/{friendship_id}", response_model=schemas.Friendship)
async def respond_to_friend_request(
    *,
    db: AsyncSession = Depends(deps.get_db),
    friendship_id: uuid.UUID,
    response: schemas.FriendshipUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Accept or decline a friend request.
    """
    friendship = await crud.friendship.get(db, id=friendship_id)
    if not friendship or friendship.addressee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Friendship request not found.")

    if friendship.status != models.FriendshipStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request has already been actioned.")

    updated_friendship = await crud.friendship.update(db, db_obj=friendship, obj_in=response)
    return updated_friendship

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
    if not friendship or (
        friendship.requester_id != current_user.id and friendship.addressee_id != current_user.id
    ):
        raise HTTPException(status_code=404, detail="Friendship not found.")

    if friendship.status != models.FriendshipStatus.ACCEPTED:
        raise HTTPException(status_code=400, detail="This is not an accepted friendship.")

    deleted_friendship = await crud.friendship.remove(db, id=friendship_id)
    return deleted_friendship 