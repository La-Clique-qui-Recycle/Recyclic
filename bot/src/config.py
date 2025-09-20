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

    # Storage
    AUDIO_STORAGE_PATH: str = "audio_files"
    MAX_AUDIO_FILE_SIZE_MB: int = 10

    # Frontend
    FRONTEND_URL: str = "http://localhost:4444"
    # Feature flag: activer les boutons inline (HTTPS requis). Si false, fallback texte cliquable
    ENABLE_INLINE_BUTTONS: bool = False
    
    # Admin notifications
    ADMIN_TELEGRAM_IDS: str = ""  # Comma-separated list of admin Telegram IDs
    
    class Config:
        env_file = ".env"

settings = Settings()
