from pydantic_settings import BaseSettings
from typing import List, Union
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "baghchal_royale"
    POSTGRES_PORT: int = 5433
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/baghchal_royale"

    SECRET_KEY: str = "your-secret-key-change-in-production-baghchal-royale-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    # Add this for CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = BASE_DIR / ".env"

settings = Settings() 