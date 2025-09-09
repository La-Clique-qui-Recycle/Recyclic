from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from recyclic_api.core.database import get_db
from recyclic_api.core.redis import get_redis
import time

router = APIRouter()

@router.get("/")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for API v1"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        
        # Test Redis connection
        redis_client = get_redis()
        redis_client.ping()
        
        return {
            "status": "healthy",
            "version": "v1",
            "database": "connected",
            "redis": "connected",
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "version": "v1",
            "error": str(e),
            "timestamp": time.time()
        }
