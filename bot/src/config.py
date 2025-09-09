from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    REDIS_URL: str
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_WEBHOOK_URL: str = ""
    TELEGRAM_WEBHOOK_SECRET: str = ""
    
    # API
    API_BASE_URL: str = "http://api:8000"
    API_V1_STR: str = "/api/v1"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:4444"
    
    # Admin notifications
    ADMIN_TELEGRAM_IDS: str = ""  # Comma-separated list of admin Telegram IDs
    
    class Config:
        env_file = ".env"

settings = Settings()
