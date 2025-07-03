from typing import Any, List
from datetime import timedelta
import uuid
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app import crud, models, schemas
from app.api import deps
from app.core.config import settings
from app.core import security
from app.core.security import get_password_hash, verify_password

router = APIRouter()

@router.post("/register")
async def register_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Register new user - Using local database for consistency.
    """
    try:
        # Check if user exists
        existing_user = await crud.user.get_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists.",
            )
        
        # Create new user directly
        hashed_password = get_password_hash(user_in.password)
        
        new_user = models.User(
            username=user_in.username,
            email=user_in.email,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=False,
            rating=1200,
            games_played=0,
            games_won=0,
            tiger_wins=0,
            goat_wins=0
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        if not new_user:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            str(new_user.id), expires_delta=access_token_expires
        )
        
        return {
            "success": True,
            "message": "User created successfully",
            "data": {
                "access_token": access_token,
                "refresh_token": access_token,  # Using same token for simplicity
                "user_id": str(new_user.id),
                "username": new_user.username,
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login")
async def login_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_credentials: dict,
) -> Any:
    """
    Login user - Using local database for consistency.
    """
    try:
        email = user_credentials.get("email")
        password = user_credentials.get("password")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        # Get user by email
        user = await crud.user.get_by_email(db, email=email)
        
        if not user:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        # Verify password
        if not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            str(user.id), expires_delta=access_token_expires
        )
        
        return {
            "success": True,
            "message": "Login successful",
            "data": {
                "access_token": access_token,
                "refresh_token": access_token,  # Using same token for simplicity
                "user_id": str(user.id),
                "username": user.username,
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
    Get current user profile.
    """
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "created_at": current_user.created_at,
        "games_played": current_user.games_played,
        "games_won": current_user.games_won,
        "tiger_wins": current_user.tiger_wins,
        "goat_wins": current_user.goat_wins,
        "rating": current_user.rating,
        "bio": current_user.bio,
        "country": current_user.country,
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

@router.get("/leaderboard")
async def get_leaderboard(
    db: AsyncSession = Depends(deps.get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("rating", enum=["rating", "games_won", "games_played"]),
) -> Any:
    """
    Get the top players leaderboard.
    """
    try:
        # Determine sort order
        if sort_by == 'rating':
            order_by = desc(models.User.rating)
        elif sort_by == 'games_won':
            order_by = desc(models.User.games_won)
        else: # games_played
            order_by = desc(models.User.games_played)
            
        # Get top players by rating
        stmt = select(models.User).order_by(
            order_by
        ).limit(limit).offset(offset)
        
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        # Prepare leaderboard data
        leaderboard_data = []
        for i, user in enumerate(users):
            win_rate = (user.games_won / user.games_played) * 100 if user.games_played > 0 else 0
            leaderboard_data.append({
                "rank": offset + i + 1,
                "username": user.username,
                "rating": user.rating,
                "games_played": user.games_played,
                "games_won": user.games_won,
                "tiger_wins": user.tiger_wins,
                "goat_wins": user.goat_wins,
                "win_rate": round(win_rate, 1)
            })
        
        return {
            "success": True,
            "message": "Leaderboard fetched successfully",
            "data": leaderboard_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch leaderboard: {str(e)}")

@router.get("/leaderboard/test")
async def get_leaderboard_test(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("rating", enum=["rating", "games_won", "games_played"]),
) -> Any:
    """
    Test leaderboard endpoint with mock data (no database required).
    """
    # Mock data for testing
    mock_users = [
        {"username": "TigerMaster", "rating": 1450, "games_played": 25, "games_won": 18, "tiger_wins": 12, "goat_wins": 6},
        {"username": "GoatHerder", "rating": 1380, "games_played": 30, "games_won": 20, "tiger_wins": 8, "goat_wins": 12},
        {"username": "BaghchalPro", "rating": 1320, "games_played": 15, "games_won": 10, "tiger_wins": 6, "goat_wins": 4},
        {"username": "StrategyKing", "rating": 1280, "games_played": 20, "games_won": 12, "tiger_wins": 5, "goat_wins": 7},
        {"username": "NepaliGamer", "rating": 1250, "games_played": 12, "games_won": 7, "tiger_wins": 3, "goat_wins": 4},
    ]
    
    # Apply sorting
    if sort_by == 'rating':
        mock_users.sort(key=lambda x: x['rating'], reverse=True)
    elif sort_by == 'games_won':
        mock_users.sort(key=lambda x: x['games_won'], reverse=True)
    else:  # games_played
        mock_users.sort(key=lambda x: x['games_played'], reverse=True)
    
    # Apply pagination
    paginated_users = mock_users[offset:offset + limit]
    
    # Prepare leaderboard data
    leaderboard_data = []
    for i, user in enumerate(paginated_users):
        win_rate = (user['games_won'] / user['games_played']) * 100 if user['games_played'] > 0 else 0
        leaderboard_data.append({
            "rank": offset + i + 1,
            "username": user['username'],
            "rating": user['rating'],
            "games_played": user['games_played'],
            "games_won": user['games_won'],
            "tiger_wins": user['tiger_wins'],
            "goat_wins": user['goat_wins'],
            "win_rate": round(win_rate, 1)
        })
    
    return {
        "success": True,
        "message": "Test leaderboard fetched successfully",
        "data": leaderboard_data
    }

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