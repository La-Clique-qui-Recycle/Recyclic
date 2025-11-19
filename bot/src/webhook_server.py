from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import asyncio
from telegram.ext import Application
from .config import settings
from .bot_handlers import setup_handlers
from .handlers.webhook import router as webhook_router
from .handlers.notification_api import router as notification_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="RecyClique Bot Webhook Server",
    version="1.0.0",
    description="Serveur webhook pour le bot Telegram RecyClique"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(webhook_router)
app.include_router(notification_router)

# Global application instance
telegram_app = None

@app.on_event("startup")
async def startup_event():
    """Initialize Telegram application on startup"""
    global telegram_app
    
    logger.info("Starting Recyclic Bot Webhook Server...")
    
    # Create Telegram application
    telegram_app = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
    
    # Setup handlers
    setup_handlers(telegram_app)
    
    # Initialize the application
    await telegram_app.initialize()
    await telegram_app.start()

    # Set the webhook
    if settings.TELEGRAM_WEBHOOK_URL:
        logger.info(f"Setting webhook to {settings.TELEGRAM_WEBHOOK_URL}...")
        await telegram_app.bot.set_webhook(
            url=settings.TELEGRAM_WEBHOOK_URL,
            secret_token=settings.TELEGRAM_WEBHOOK_SECRET
        )
        logger.info("Webhook set successfully")
    else:
        logger.warning("TELEGRAM_WEBHOOK_URL is not set. Skipping webhook setup.")
    
    logger.info("Telegram application initialized successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global telegram_app
    
    logger.info("Shutting down Recyclic Bot Webhook Server...")
    
    if telegram_app:
        logger.info("Deleting webhook...")
        await telegram_app.bot.delete_webhook()
        logger.info("Webhook deleted successfully.")
        await telegram_app.stop()
        await telegram_app.shutdown()
    
    logger.info("Shutdown complete")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "RecyClique Bot Webhook Server",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "telegram_app": "initialized" if telegram_app else "not_initialized"
    }

# Export the telegram app for use in webhook handlers
def get_telegram_app():
    return telegram_app
