import asyncio
import logging
import uvicorn
from telegram.ext import Application
from .bot_handlers import setup_handlers
from .config import settings
from .services.redis_persistence import RedisPersistence

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def main_polling():
    """Main function to start the bot in polling mode"""
    # Initialize Redis persistence
    redis_persistence = RedisPersistence(
        redis_url=settings.REDIS_URL,
        key_prefix="telegram_bot:"
    )
    
    # Connect to Redis
    await redis_persistence.connect()
    
    # Create application with Redis persistence
    application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).persistence(redis_persistence).build()
    
    # Setup handlers
    setup_handlers(application)
    
    # Start the bot
    logger.info("Starting Recyclic Telegram Bot in polling mode...")
    
    # Initialize and start the application manually
    await application.initialize()
    await application.start()
    
    try:
        # Run the bot
        await application.updater.start_polling()
        # Keep the bot running
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    finally:
        # Stop the bot
        await application.updater.stop()
        await application.stop()
        await application.shutdown()
        # Disconnect from Redis
        await redis_persistence.disconnect()

def main_webhook():
    """Main function to start the bot in webhook mode"""
    logger.info("Starting Recyclic Bot Webhook Server...")
    uvicorn.run(
        "bot.src.webhook_server:app",
        host="0.0.0.0",
        port=8001,
        reload=False
    )

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "webhook":
        main_webhook()
    else:
        # Simple approach: just run the async function
        asyncio.run(main_polling())
