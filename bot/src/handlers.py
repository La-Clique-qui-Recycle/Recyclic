from telegram.ext import CommandHandler, MessageHandler, filters
from .handlers.start import start_command
from .handlers.help import help_command
from .handlers.classify import classify_message

def setup_handlers(application):
    """Setup all bot handlers"""
    # Command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    
    # Message handlers
    application.add_handler(MessageHandler(filters.PHOTO, classify_message))
    
    # Default message handler
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, help_command))
