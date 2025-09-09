import asyncio
import logging
from telegram.ext import Application
from .handlers import setup_handlers
from .config import settings

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def main():
    """Main function to start the bot"""
    # Create application
    application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
    
    # Setup handlers
    setup_handlers(application)
    
    # Start the bot
    logger.info("Starting Recyclic Telegram Bot...")
    await application.run_polling()

if __name__ == '__main__':
    asyncio.run(main())
