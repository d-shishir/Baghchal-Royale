from datetime import timedelta
from typing import Any
import uuid

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/register", response_model=dict)
async def register(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Create new user.
    """
    try:
        # Check if user exists
        result = await db.execute(
            text("SELECT id FROM public.users WHERE email = :email OR username = :username"),
            {"email": user_in.email, "username": user_in.username}
        )
        existing_user = result.fetchone()
        
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email or username already exists.",
            )
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_in.password)
        
        await db.execute(
            text("""
                INSERT INTO public.users (id, username, email, hashed_password, is_active, is_superuser, rating, games_played, games_won, tiger_wins, goat_wins)
                VALUES (:id, :username, :email, :hashed_password, :is_active, :is_superuser, :rating, :games_played, :games_won, :tiger_wins, :goat_wins)
            """),
            {
                "id": user_id,
                "username": user_in.username,
                "email": user_in.email,
                "hashed_password": hashed_password,
                "is_active": True,
                "is_superuser": False,
                "rating": 1200,  # Default rating
                "games_played": 0,
                "games_won": 0,
                "tiger_wins": 0,
                "goat_wins": 0
            }
        )
        await db.commit()
        
        return {
            "id": user_id,
            "username": user_in.username,
            "email": user_in.email,
            "message": "User created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=schemas.Token)
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/login/test-token", response_model=schemas.User)
def test_token(current_user: models.User = Depends(deps.get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user 