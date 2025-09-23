from contextlib import asynccontextmanager, suppress
from fastapi import FastAPI
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging
import time
import os

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from recyclic_api.core.config import settings
from recyclic_api.api.api_v1.api import api_router
from recyclic_api.services.sync_service import schedule_periodic_kdrive_sync
from recyclic_api.services.scheduler_service import get_scheduler_service
from recyclic_api.utils.rate_limit import limiter
from recyclic_api.core.database import engine
from recyclic_api.models import Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire de cycle de vie de l'application"""
    import os
    logger.info("Starting up Recyclic API...")
    is_test_env = (os.getenv("TESTING") == "true") or (settings.ENVIRONMENT == "test")

    # Démarrer le scheduler de tâches planifiées (désactivé en test)
    scheduler = None
    sync_task = None
    if not is_test_env:
        scheduler = get_scheduler_service()
        await scheduler.start()
        # Démarrer la synchronisation kDrive (si nécessaire)
        sync_task = schedule_periodic_kdrive_sync()

    logger.info("API ready - use migrations for database setup")
    
    # Générer openapi.json pour les tests
    if is_test_env:
        import json
        try:
            openapi_schema = app.openapi()
            # Créer le répertoire si nécessaire
            os.makedirs("/app", exist_ok=True)
            with open("/app/openapi.json", "w") as f:
                json.dump(openapi_schema, f, indent=2)
            logger.info("✅ openapi.json généré avec succès")
        except Exception as e:
            logger.warning(f"Could not generate openapi.json: {e}")

    try:
        yield
    finally:
        # Arrêter le scheduler si actif
        if scheduler is not None:
            await scheduler.stop()

        # Annuler la tâche de sync kDrive
        if sync_task:
            sync_task.cancel()
            with suppress(asyncio.CancelledError):
                await sync_task

        logger.info("Shutting down Recyclic API...")

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="API pour la plateforme Recyclic - Gestion de recyclage intelligente",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000", "http://localhost:4444"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "api", "127.0.0.1", "testserver"]
)

# Add request timing middleware
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Bienvenue sur l'API Recyclic",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        from recyclic_api.core.database import get_db
        db = next(get_db())
        
        # Test Redis connection
        from recyclic_api.core.redis import get_redis
        redis_client = get_redis()
        redis_client.ping()
        
        return {
            "status": "healthy",
            "database": "connected",
            "redis": "connected",
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

