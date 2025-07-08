from typing import AsyncGenerator, Optional, Generator
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import create_engine, text
from sqlalchemy.future import select

from app import crud, models, schemas
from app.core import security
from app.core.config import settings
from app.db.session import AsyncSessionLocal

# Sync database session for games API
sync_engine = create_engine(
    settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://"),
    pool_pre_ping=True
)

def get_sync_session() -> Session:
    """Create sync database session."""
    return Session(bind=sync_engine)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/api/v1/auth/login"
)

# Async dependencies (existing)
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> models.User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    # Eagerly load necessary fields to prevent MissingGreenlet error
    stmt = (
        select(models.User)
        .where(models.User.user_id == token_data.sub)
        .options(selectinload('*'))
    )
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_user_ws(
    token: str = Query(..., alias="token"),
    db: AsyncSession = Depends(get_db)
) -> models.User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    stmt = (
        select(models.User)
        .where(models.User.user_id == token_data.sub)
    )
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    return current_user

async def get_current_active_superuser(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if current_user.role != models.user.UserRole.ADMIN:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user


# Sync dependencies for games API
def get_db_sync() -> Generator[Session, None, None]:
    """Get sync database session for games API."""
    db = get_sync_session()
    try:
        yield db
    finally:
        db.close()

def get_current_user_sync(
    db: Session = Depends(get_db_sync), 
    token: str = Depends(reusable_oauth2)
) -> models.User:
    """Get current user with sync database session."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    # Use raw SQL query for sync operation - UUID values should be passed directly
    result = db.execute(
        text("SELECT user_id, email, username, password, is_active, is_superuser FROM users WHERE user_id = :user_id"),
        {"user_id": token_data.sub}  # Don't convert UUID to string
    ).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create user model from result
    user = models.User(
        user_id=result.user_id,
        email=result.email,
        username=result.username,
        password=result.password,
        is_active=result.is_active,
        is_superuser=result.is_superuser
    )
    
    return user

def get_current_active_user_sync(
    current_user: models.User = Depends(get_current_user_sync),
) -> models.User:
    """Get current active user with sync database session."""
    return current_user

def get_current_active_superuser_sync(
    current_user: models.User = Depends(get_current_user_sync),
) -> models.User:
    """Get current active superuser with sync database session."""
    if current_user.role != models.user.UserRole.ADMIN:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user 