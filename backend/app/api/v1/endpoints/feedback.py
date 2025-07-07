from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.Feedback)
async def create_feedback(
    *,
    db: AsyncSession = Depends(deps.get_db),
    feedback_in: schemas.FeedbackCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new feedback.
    """
    if current_user.user_id != feedback_in.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    feedback = await crud.feedback.create(db, obj_in=feedback_in)
    return feedback

@router.get("/", response_model=List[schemas.Feedback])
async def get_feedbacks(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Retrieve feedbacks.
    """
    feedbacks = await crud.feedback.get_multi(db, skip=skip, limit=limit)
    return feedbacks

@router.get("/{feedback_id}", response_model=schemas.Feedback)
async def get_feedback(
    *,
    feedback_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Get feedback by ID.
    """
    feedback = await crud.feedback.get(db, id=feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback 