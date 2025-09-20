"""
Depot command handler for Story 4.1 - Telegram voice deposit functionality.
Implements the /depot command and voice message handling for deposit creation.
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import httpx
from telegram import Update
from telegram.ext import (
    ContextTypes,
    ConversationHandler,
    CommandHandler,
    MessageHandler,
    filters
)
from ..config import settings
from ..services.user_service import user_service
from .validation import send_validation_message

logger = logging.getLogger(__name__)

# Conversation states
WAITING_FOR_AUDIO = 1

# Session timeout (5 minutes as per story requirements)
SESSION_TIMEOUT = 300  # 5 minutes in seconds

# Audio configuration
SUPPORTED_AUDIO_MIME_TYPES = {
    "audio/ogg": ".ogg",
    "audio/oga": ".ogg",
    "audio/webm": ".ogg",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
}
SUPPORTED_AUDIO_EXTENSIONS = {".ogg", ".oga", ".mp3", ".wav"}
MAX_AUDIO_FILE_SIZE_BYTES = settings.MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024

# In-memory storage for active sessions (in production, use Redis)
active_sessions: Dict[int, Dict[str, Any]] = {}

async def start_depot_session(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Start a deposit session when user sends /depot command.
    Creates a session and prompts user for audio file.
    """
    user_id = update.effective_user.id
    username = update.effective_user.username or update.effective_user.first_name

    logger.info(f"User {username} ({user_id}) requested depot session")

    # Validate user authorization via API
    try:
        user_record = await user_service.get_user_by_telegram_id(str(user_id))
    except Exception as exc:
        logger.error("Failed to verify Telegram user %s authorization: %s", user_id, exc)
        user_record = None

    if not user_record:
        await update.message.reply_text(
            "❌ Vous n'êtes pas autorisé à enregistrer un dépôt pour le moment.\n"
            "Utilisez /inscription pour demander l'accès ou contactez un administrateur."
        )
        return ConversationHandler.END

    status = (user_record.get("status") or "").lower()
    is_active = bool(user_record.get("is_active", False))
    allowed_statuses = {"approved", "active"}

    if not is_active or (status and status not in allowed_statuses):
        await update.message.reply_text(
            "⏳ Votre compte est en attente d'activation par un administrateur.\n"
            "Vous recevrez une notification dès qu'il sera validé."
        )
        return ConversationHandler.END

    # Check if user already has an active session
    if user_id in active_sessions:
        await update.message.reply_text(
            "🔄 Vous avez déjà une session de dépôt active. "
            "Envoyez votre message vocal ou utilisez /annuler pour arrêter."
        )
        return WAITING_FOR_AUDIO

    # Create new session
    session_start = datetime.now()
    active_sessions[user_id] = {
        'user_id': user_id,
        'username': username,
        'start_time': session_start,
        'timeout_task': None
    }

    # Set up timeout task
    timeout_task = asyncio.create_task(
        _handle_session_timeout(user_id, update, context)
    )
    active_sessions[user_id]['timeout_task'] = timeout_task

    # Send instructions to user
    await update.message.reply_text(
        "🎤 **Session de dépôt démarrée !**\n\n"
        "Envoyez-moi un message vocal décrivant l'objet que vous souhaitez déposer.\n\n"
        "📋 **Instructions :**\n"
        "• Décrivez clairement l'objet\n"
        "• Mentionnez le type (électroménager, informatique, etc.)\n"
        "• Formats supportés : OGG, MP3, WAV\n\n"
        "⏱️ Session expire dans 5 minutes\n"
        "❌ Tapez /annuler pour arrêter",
        parse_mode='Markdown'
    )

    return WAITING_FOR_AUDIO

async def handle_voice_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Handle voice messages during depot session.
    Downloads audio file and sends it to API for processing.
    """
    user_id = update.effective_user.id

    # Check if user has active session
    if user_id not in active_sessions:
        await update.message.reply_text(
            "❌ Aucune session de dépôt active. Utilisez /depot pour commencer."
        )
        return ConversationHandler.END

    session = active_sessions[user_id]
    logger.info(f"Processing voice message for user {session['username']} ({user_id})")

    telegram_audio, file_id, mime_type, file_size, original_file_name = _extract_audio_metadata(update)

    if not telegram_audio or not file_id:
        await update.message.reply_text(
            "❌ Impossible de lire ce message audio. Veuillez réessayer."
        )
        return WAITING_FOR_AUDIO

    file_extension = _resolve_audio_extension(mime_type, original_file_name)

    if not file_extension:
        await update.message.reply_text(
            "❌ Format audio non supporté. Formats acceptés : OGG, MP3, WAV."
        )
        return WAITING_FOR_AUDIO

    if file_size and file_size > MAX_AUDIO_FILE_SIZE_BYTES:
        max_size = settings.MAX_AUDIO_FILE_SIZE_MB
        await update.message.reply_text(
            "❌ Fichier trop volumineux.\n"
            f"La taille maximale autorisée est de {max_size} Mo."
        )
        return WAITING_FOR_AUDIO

    try:
        # Send processing message
        processing_msg = await update.message.reply_text(
            "🔄 Traitement de votre message vocal en cours...\n"
            "⏳ Téléchargement et analyse en cours..."
        )

        file = await context.bot.get_file(file_id)

        # Create audio directory if it doesn't exist
        audio_dir = settings.AUDIO_STORAGE_PATH
        os.makedirs(audio_dir, exist_ok=True)

        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"deposit_{user_id}_{timestamp}{file_extension}"
        file_path = os.path.join(audio_dir, filename)

        # Download file
        await file.download_to_drive(file_path)
        logger.info(f"Audio file saved: {file_path}")

        # Send to API for processing
        api_result = await _send_to_api(user_id, file_path)

        if api_result.get('success'):
            deposit_id = api_result.get('deposit_id')

            # Update processing message
            await processing_msg.edit_text(
                "✅ **Dépôt créé avec succès !**\n\n"
                f"🆔 ID de dépôt : `{deposit_id}`\n"
                "📁 Fichier audio enregistré\n"
                "⏳ Classification IA en cours...\n\n"
                "📋 Votre dépôt sera traité sous peu.",
                parse_mode='Markdown'
            )

            # Try to classify immediately
            classification_result = await _trigger_classification(deposit_id)

            if classification_result.get('success'):
                category = classification_result.get('category', 'Non déterminée')
                confidence = classification_result.get('confidence', 0)

                # Send validation message with inline keyboard (Story 4.3)
                await send_validation_message(
                    chat_id=user_id,
                    context=context,
                    deposit_id=deposit_id,
                    category=category,
                    confidence=confidence
                )
            else:
                await update.message.reply_text(
                    "⚠️ Dépôt créé mais classification automatique échouée.\n"
                    "Un responsable traitera votre dépôt manuellement."
                )
        else:
            error_msg = api_result.get('error', 'Erreur inconnue')
            await processing_msg.edit_text(
                f"❌ Erreur lors de la création du dépôt :\n{error_msg}\n\n"
                "Veuillez réessayer plus tard."
            )

    except Exception as e:
        logger.error(f"Error processing voice message: {str(e)}")
        await update.message.reply_text(
            "❌ Erreur lors du traitement de votre message vocal.\n"
            "Veuillez réessayer."
        )

    finally:
        # Clean up session
        await _cleanup_session(user_id)

    return ConversationHandler.END

async def cancel_depot_session(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel active depot session."""
    user_id = update.effective_user.id

    if user_id in active_sessions:
        await _cleanup_session(user_id)
        await update.message.reply_text(
            "❌ Session de dépôt annulée.\n"
            "Utilisez /depot pour redémarrer une nouvelle session."
        )
    else:
        await update.message.reply_text(
            "ℹ️ Aucune session de dépôt active à annuler."
        )

    return ConversationHandler.END

async def handle_invalid_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle non-voice messages during depot session."""
    await update.message.reply_text(
        "🎤 **Envoyez un message vocal**\n\n"
        "Cette session attend un message vocal décrivant votre objet.\n"
        "❌ Tapez /annuler pour arrêter la session."
    )
    return WAITING_FOR_AUDIO

def _extract_audio_metadata(update: Update) -> tuple[Optional[Any], Optional[str], str, int, Optional[str]]:
    """Extract audio metadata from update message."""
    message = update.message

    if message.voice:
        voice = message.voice
        mime_type = (voice.mime_type or "audio/ogg").lower()
        return voice, voice.file_id, mime_type, voice.file_size or 0, None

    if message.audio:
        audio = message.audio
        mime_type = (audio.mime_type or "").lower()
        return audio, audio.file_id, mime_type, audio.file_size or 0, audio.file_name

    return None, None, "", 0, None

def _resolve_audio_extension(mime_type: str, file_name: Optional[str]) -> Optional[str]:
    """Determine the appropriate file extension for the audio payload."""
    if file_name:
        _, ext = os.path.splitext(file_name)
        ext = ext.lower()
        if ext in SUPPORTED_AUDIO_EXTENSIONS:
            return ext

    normalized_mime = (mime_type or "").lower()
    if normalized_mime in SUPPORTED_AUDIO_MIME_TYPES:
        return SUPPORTED_AUDIO_MIME_TYPES[normalized_mime]

    return None

async def _handle_session_timeout(user_id: int, update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle session timeout after 5 minutes."""
    await asyncio.sleep(SESSION_TIMEOUT)

    if user_id in active_sessions:
        logger.info(f"Session timeout for user {user_id}")
        await _cleanup_session(user_id, cancel_timeout=False)

        # Try to send timeout message
        try:
            await context.bot.send_message(
                chat_id=user_id,
                text="⏰ **Session de dépôt expirée**\n\n"
                      "Votre session de dépôt a expiré après 5 minutes d'inactivité.\n"
                      "Utilisez /depot pour redémarrer une nouvelle session.",
                parse_mode='Markdown'
            )
        except Exception as e:
            logger.error(f"Could not send timeout message to user {user_id}: {e}")

async def _cleanup_session(user_id: int, *, cancel_timeout: bool = True):
    """Clean up user session and cancel timeout task."""
    if user_id in active_sessions:
        session = active_sessions[user_id]

        # Cancel timeout task if exists
        if cancel_timeout and session.get('timeout_task'):
            timeout_task = session['timeout_task']
            try:
                timeout_task.cancel()
            except Exception as exc:
                logger.debug(
                    "Could not cancel timeout task for user %s: %s",
                    user_id,
                    exc,
                )

        # Remove from active sessions
        del active_sessions[user_id]
        logger.info(f"Cleaned up session for user {user_id}")

async def _send_to_api(telegram_user_id: int, audio_file_path: str) -> Dict[str, Any]:
    """
    Send deposit data to API endpoint.

    Args:
        telegram_user_id: Telegram user ID
        audio_file_path: Path to downloaded audio file

    Returns:
        API response dictionary
    """
    try:
        # Get API base URL from config
        api_base_url = settings.API_BASE_URL

        # Get bot token from config for authentication
        bot_token = settings.TELEGRAM_BOT_TOKEN

        payload = {
            "telegram_user_id": str(telegram_user_id),
            "audio_file_path": audio_file_path,
            "status": "pending_audio"
        }

        headers = {
            "X-Bot-Token": bot_token,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{api_base_url}/api/v1/deposits/from-bot",
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "deposit_id": result.get("id"),
                    "data": result
                }
            else:
                logger.error(f"API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}"
                }

    except Exception as e:
        logger.error(f"Error sending to API: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

async def _trigger_classification(deposit_id: str) -> Dict[str, Any]:
    """
    Trigger AI classification for the deposit.

    Args:
        deposit_id: ID of the deposit to classify

    Returns:
        Classification result dictionary
    """
    try:
        # Get API base URL from config
        api_base_url = settings.API_BASE_URL

        # Get bot token from config for authentication
        bot_token = settings.TELEGRAM_BOT_TOKEN

        headers = {
            "X-Bot-Token": bot_token,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{api_base_url}/api/v1/deposits/{deposit_id}/classify",
                headers=headers
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "category": result.get("category"),
                    "confidence": result.get("ai_confidence", 0),
                    "data": result
                }
            else:
                logger.error(f"Classification API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"Classification error: {response.status_code}"
                }

    except Exception as e:
        logger.error(f"Error triggering classification: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# Create the conversation handler
depot_conversation_handler = ConversationHandler(
    entry_points=[CommandHandler("depot", start_depot_session)],
    states={
        WAITING_FOR_AUDIO: [
            MessageHandler(filters.VOICE | filters.AUDIO, handle_voice_message),
            MessageHandler(filters.TEXT & ~filters.COMMAND, handle_invalid_message),
            CommandHandler("annuler", cancel_depot_session),
        ],
    },
    fallbacks=[
        CommandHandler("annuler", cancel_depot_session),
        CommandHandler("depot", start_depot_session),  # Allow restarting
    ],
    per_user=True,
    per_chat=True,
)