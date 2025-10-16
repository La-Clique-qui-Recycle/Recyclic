from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import os
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
    API_V1_STR: str = "/v1"
    ROOT_PATH: str = ""
    PROJECT_NAME: str = "Recyclic API"
    
    # Telegram
    TELEGRAM_BOT_URL: str | None = None
    TELEGRAM_BOT_TOKEN: str | None = None  # For validating bot requests
    ADMIN_TELEGRAM_IDS: str | None = None

    # Environment
    ENVIRONMENT: str = "development"
    ECOLOGIC_EXPORT_DIR: str = "/app/exports"

    # kDrive Sync
    KDRIVE_WEBDAV_URL: str | None = None
    KDRIVE_WEBDAV_USERNAME: str | None = None
    KDRIVE_WEBDAV_PASSWORD: str | None = None
    KDRIVE_REMOTE_BASE_PATH: str = '/Recyclic/exports'
    KDRIVE_SYNC_ENABLED: bool = False
    KDRIVE_SYNC_INTERVAL_SECONDS: int = 3600
    KDRIVE_RETRY_DELAY_SECONDS: float = 5.0
    KDRIVE_MAX_RETRIES: int = 3

    # Cash Session Reports
    CASH_SESSION_REPORT_DIR: str = '/app/reports/cash_sessions'
    CASH_SESSION_REPORT_RECIPIENT: str | None = None
    CASH_SESSION_REPORT_TOKEN_TTL_SECONDS: int = 900
    CASH_SESSION_REPORT_RETENTION_DAYS: int = 30

    # Email Service

    BREVO_API_KEY: str | None = None
    BREVO_WEBHOOK_SECRET: str | None = None
    EMAIL_FROM_NAME: str = "Recyclic"
    EMAIL_FROM_ADDRESS: str = "noreply@recyclic.fr"
    
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

# Test-mode overrides to satisfy tests expectations
if os.getenv("TESTING") == "true":
    settings.ENVIRONMENT = "test"
    if settings.TEST_DATABASE_URL:
        settings.DATABASE_URL = settings.TEST_DATABASE_URL
    # In tests, always use a fixed bot token to ensure deterministic behavior
    settings.TELEGRAM_BOT_TOKEN = "test_bot_token_123"






