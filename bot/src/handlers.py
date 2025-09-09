from telegram.ext import CommandHandler, MessageHandler, CallbackQueryHandler, filters
from .handlers.start import start_command
from .handlers.help import help_command
from .handlers.classify import classify_message
from .handlers.registration import registration_command, handle_registration_callback

def setup_handlers(application):
    """Setup all bot handlers"""
    # Command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("inscription", registration_command))
    
    # Callback query handlers
    application.add_handler(CallbackQueryHandler(handle_registration_callback, pattern="^registration_"))
    
    # Message handlers
    application.add_handler(MessageHandler(filters.PHOTO, classify_message))
    
    # Default message handler
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, help_command))
