from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings

router = APIRouter()

# Neutral alias router to avoid ad blockers that target paths like "/auth/*"
alias_router = APIRouter()

@router.post("/register", response_model=schemas.User)
async def register(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Create new user.
    """
    user_by_email = await crud.user.get_by_email(db, email=user_in.email)
    if user_by_email:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user_by_username = await crud.user.get_by_username(db, username=user_in.username)
    if user_by_username:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = await crud.user.create(db, obj_in=user_in)
    return user

@router.post("/login")
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Try to authenticate with email first, then with username
    user = await crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    
    # If authentication by email failed, try by username
    if not user:
        user_by_username = await crud.user.get_by_username(db, username=form_data.username)
        if user_by_username:
            user = await crud.user.authenticate(
                db, email=user_by_username.email, password=form_data.password
            )
    
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.user_id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": {
            "user_id": str(user.user_id),
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "status": user.status
        }
    }

# Alternative login endpoints to bypass ad blockers
@router.post("/signin")
async def signin_access_token(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Alternative login endpoint (alias for /login)
    """
    return await login_access_token(db=db, form_data=form_data)

@router.post("/session/start")
async def session_start(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Alternative login endpoint (alias for /login)
    """
    return await login_access_token(db=db, form_data=form_data)

@router.post("/session/login")
async def session_login(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Alternative login endpoint (alias for /login)
    """
    return await login_access_token(db=db, form_data=form_data)

@router.post("/login/test-token", response_model=schemas.User)
def test_token(current_user: models.User = Depends(deps.get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user 

# Neutral paths (outside of "/auth" segment) that forward to the same login handler
@alias_router.post("/login")
async def neutral_login(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    return await login_access_token(db=db, form_data=form_data)

@alias_router.post("/start")
async def neutral_start(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    return await login_access_token(db=db, form_data=form_data)

@alias_router.post("/authenticate")
async def neutral_authenticate(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    return await login_access_token(db=db, form_data=form_data)

# Additional neutral aliases that avoid the words "auth" and "login"
@alias_router.post("/token")
async def neutral_token(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    return await login_access_token(db=db, form_data=form_data)

@alias_router.post("/access/token")
async def neutral_access_token(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    return await login_access_token(db=db, form_data=form_data)

# Avoid common ad-block keywords entirely
@alias_router.post("/grant")
async def neutral_grant(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    return await login_access_token(db=db, form_data=form_data)

@alias_router.post("/open")
async def neutral_open(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    return await login_access_token(db=db, form_data=form_data)