from telegram.ext import CommandHandler, MessageHandler, CallbackQueryHandler, filters
from .handlers.start import start_command
from .handlers.help import help_command
from .handlers.classify import classify_message
from .handlers.registration import registration_command, handle_registration_callback
from .handlers.depot import depot_conversation_handler
from .handlers.validation import validation_callback_handler, category_callback_handler

def setup_handlers(application):
    """Setup all bot handlers"""
    # Conversation handlers (must be added first for priority)
    application.add_handler(depot_conversation_handler)

    # Command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("inscription", registration_command))

    # Callback query handlers
    application.add_handler(CallbackQueryHandler(handle_registration_callback, pattern="^registration_"))
    application.add_handler(validation_callback_handler)
    application.add_handler(category_callback_handler)

    # Message handlers
    application.add_handler(MessageHandler(filters.PHOTO, classify_message))

    # Default message handler
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, help_command))
