import asyncio
import logging
import uvicorn
from telegram.ext import Application
from .handlers import setup_handlers
from .config import settings

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def main_polling():
    """Main function to start the bot in polling mode"""
    # Create application
    application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
    
    # Setup handlers
    setup_handlers(application)
    
    # Start the bot
    logger.info("Starting Recyclic Telegram Bot in polling mode...")
    await application.run_polling()

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
        asyncio.run(main_polling())
