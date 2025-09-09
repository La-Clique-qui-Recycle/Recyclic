from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    REDIS_URL: str
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str
    
    # API
    API_BASE_URL: str = "http://api:8000"
    
    class Config:
        env_file = ".env"

settings = Settings()
