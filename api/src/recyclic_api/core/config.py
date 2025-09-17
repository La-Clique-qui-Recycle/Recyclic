from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    TEST_DATABASE_URL: str | None = None
    REDIS_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Recyclic API"
    
    # Telegram
    TELEGRAM_BOT_URL: str | None = None
    TELEGRAM_BOT_TOKEN: str | None = None  # For validating bot requests
    ADMIN_TELEGRAM_IDS: str | None = None
    
    # Environment
    ENVIRONMENT: str = "development"

    # Email Service
    BREVO_API_KEY: str | None = None
    
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
