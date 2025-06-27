from typing import Any, List
from datetime import timedelta
import uuid
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models, schemas
from app.api import deps
from app.core.config import settings
from app.core import security
from app.core.security import get_password_hash, verify_password

router = APIRouter()

@router.post("/register")
async def register_user(
    *,
    user_in: schemas.UserCreate,
) -> Any:
    """
    Register new user - Frontend compatible endpoint using Supabase API.
    """
    try:
        import os
        from supabase import create_client, Client
        
        # Use Supabase API instead of direct DB connection for now
        url = "https://jxkwrzrqqppbzoiohzqy.supabase.co"
        key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4a3dyenJxcXBwYnpvaW9oenF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTAyNDcsImV4cCI6MjA2NjUyNjI0N30.XpPjCP1V3KM1m77AZ0RDDkIPE3Ya5dvBd-VNHxprKvA"  # anon key
        supabase: Client = create_client(url, key)
        
        # Check if user exists
        existing_user = supabase.table('users').select('*').eq('email', user_in.email).execute()
        if existing_user.data:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists.",
            )
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_in.password)
        
        new_user_data = {
            "id": user_id,
            "username": user_in.username,
            "email": user_in.email,
            "hashed_password": hashed_password,
            "is_active": True,
            "is_superuser": False,
            "rating": 1200,
            "games_played": 0,
            "games_won": 0,
            "tiger_wins": 0,
            "goat_wins": 0
        }
        
        result = supabase.table('users').insert(new_user_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            user_id, expires_delta=access_token_expires
        )
        
        return {
            "success": True,
            "message": "User created successfully",
            "data": {
                "access_token": access_token,
                "refresh_token": access_token,  # Using same token for simplicity
                "user_id": user_id,
                "username": user_in.username,
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login")
async def login_user(
    *,
    user_credentials: dict,
) -> Any:
    """
    Login user - Frontend compatible endpoint using Supabase API.
    """
    try:
        from supabase import create_client, Client
        
        email = user_credentials.get("email")
        password = user_credentials.get("password")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        # Use Supabase API
        url = "https://jxkwrzrqqppbzoiohzqy.supabase.co"
        key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4a3dyenJxcXBwYnpvaW9oenF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTAyNDcsImV4cCI6MjA2NjUyNjI0N30.XpPjCP1V3KM1m77AZ0RDDkIPE3Ya5dvBd-VNHxprKvA"
        supabase: Client = create_client(url, key)
        
        # Get user by email
        user_result = supabase.table('users').select('*').eq('email', email).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        user_data = user_result.data[0]
        
        # Verify password
        if not verify_password(password, user_data['hashed_password']):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        if not user_data.get('is_active', True):
            raise HTTPException(status_code=400, detail="Inactive user")
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            user_data['id'], expires_delta=access_token_expires
        )
        
        return {
            "success": True,
            "message": "Login successful",
            "data": {
                "access_token": access_token,
                "refresh_token": access_token,  # Using same token for simplicity
                "user_id": user_data['id'],
                "username": user_data['username'],
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.get("/profile")
async def get_user_profile(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user profile - Frontend compatible endpoint.
    """
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "games_played": getattr(current_user, 'games_played', 0),
        "games_won": getattr(current_user, 'games_won', 0),
        "tiger_wins": getattr(current_user, 'tiger_wins', 0),
        "goat_wins": getattr(current_user, 'goat_wins', 0),
        "rating": getattr(current_user, 'rating', 1200),
    }

@router.post("/")
async def create_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new user.
    """
    user = await crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = await crud.user.create(db, obj_in=user_in)
    return user

@router.get("/me", response_model=schemas.User)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.get("/{user_id}", response_model=schemas.User)
async def read_user_by_id(
    user_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get a specific user by id.
    """
    user = await crud.user.get(db, id=user_id)
    if user == current_user:
        return user
    if not crud.user.is_superuser(current_user):
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return user 