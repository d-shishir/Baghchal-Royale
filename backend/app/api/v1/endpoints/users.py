from typing import Any, List
from datetime import timedelta
import uuid
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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

@router.put("/profile")
async def update_user_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    profile_update: dict,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update current user profile.
    """
    try:
        # Update allowed fields
        update_data = {}
        if "username" in profile_update:
            update_data["username"] = profile_update["username"]
        if "bio" in profile_update:
            update_data["bio"] = profile_update["bio"]
        if "country" in profile_update:
            update_data["country"] = profile_update["country"]
        
        if update_data:
            updated_user = await crud.user.update(db, db_obj=current_user, obj_in=update_data)
            return {"success": True, "message": "Profile updated successfully"}
        else:
            return {"success": True, "message": "No changes made"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile update failed: {str(e)}")

@router.get("/stats")
async def get_user_stats(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user statistics.
    """
    win_rate = 0
    if current_user.games_played > 0:
        win_rate = (current_user.games_won / current_user.games_played) * 100
    
    return {
        "username": current_user.username,
        "games_played": current_user.games_played,
        "games_won": current_user.games_won,
        "tiger_wins": current_user.tiger_wins,
        "goat_wins": current_user.goat_wins,
        "rating": current_user.rating,
        "win_rate": round(win_rate, 1),
    }

@router.get("/search")
async def search_users(
    *,
    db: AsyncSession = Depends(deps.get_db),
    query: str,
    limit: int = 10,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Search users by username.
    """
    try:
        # Search users by username (case-insensitive)
        stmt = select(models.User).where(
            models.User.username.ilike(f"%{query}%")
        ).limit(limit)
        
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        return [
            {
                "id": str(user.id),
                "username": user.username,
                "rating": user.rating,
                "games_played": user.games_played,
            }
            for user in users
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"User search failed: {str(e)}")

@router.get("/{user_id}/profile")
async def get_user_profile_by_id(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific user's profile by ID.
    """
    try:
        user = await crud.user.get(db, id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": str(user.id),
            "username": user.username,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "games_played": user.games_played,
            "games_won": user.games_won,
            "tiger_wins": user.tiger_wins,
            "goat_wins": user.goat_wins,
            "rating": user.rating,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user profile: {str(e)}")

@router.post("/logout")
async def logout_user(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Logout user (token-based, so just return success).
    """
    return {"success": True, "message": "Logout successful"}

# Legacy endpoints for compatibility
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
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user 