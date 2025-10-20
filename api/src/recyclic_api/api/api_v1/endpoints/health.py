from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from recyclic_api.core.database import get_db
from recyclic_api.core.redis import get_redis
import time
import os
import json

router = APIRouter()

@router.get("/")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for API v1"""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        
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

@router.get("/version")
async def get_version():
    """Version endpoint - returns build information"""
    
    # Lire la version depuis les variables d'environnement (passées via build args)
    version = os.getenv("APP_VERSION", "1.0.0")
    
    return {
        "version": version,
        "commitSha": os.getenv("COMMIT_SHA", "unknown"),
        "branch": os.getenv("BRANCH", "unknown"),
        "commitDate": os.getenv("COMMIT_DATE", "unknown"),
        "buildDate": os.getenv("BUILD_DATE", "unknown"),
        "environment": os.getenv("ENVIRONMENT", "development")
    }
