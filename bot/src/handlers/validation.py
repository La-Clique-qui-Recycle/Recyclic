"""
Validation and correction handler for Story 4.3 - Human validation and correction of AI classification.
Handles validation and correction of AI-classified deposits via inline keyboards.
"""

import logging
import httpx
from typing import Dict, Any

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, CallbackQueryHandler

from ..config import settings
from ..services.session_service import session_service

logger = logging.getLogger(__name__)

# EEE Categories with friendly names for display
EEE_CATEGORY_LABELS = {
    "small_appliance": "🔌 Petit électroménager",
    "large_appliance": "🏠 Gros électroménager",
    "it_equipment": "💻 Informatique",
    "lighting": "💡 Éclairage",
    "tools": "🔧 Outillage",
    "toys": "🧸 Jouets électroniques",
    "medical_devices": "🏥 Appareils médicaux",
    "monitoring_control": "📊 Surveillance/Contrôle",
    "automatic_dispensers": "🚰 Distributeurs automatiques",
    "other": "❓ Autre"
}

async def send_validation_message(chat_id: int, context: ContextTypes.DEFAULT_TYPE,
                                deposit_id: str, category: str, confidence: float):
    """
    Send validation message with inline keyboard to user after AI classification.

    Args:
        chat_id: Telegram chat ID
        context: Bot context
        deposit_id: ID of the deposit to validate
        category: AI-suggested category
        confidence: AI confidence score (0-1)
    """
    try:
        # Get friendly category name
        category_label = EEE_CATEGORY_LABELS.get(category, category)
        confidence_percent = confidence * 100

        # Create validation message
        message_text = (
            "🤖 **Classification IA terminée !**\n\n"
            f"📦 Catégorie proposée : **{category_label}**\n"
            f"🎯 Confiance : {confidence_percent:.1f}%\n\n"
            "Confirmez-vous cette classification ?"
        )

        # Create inline keyboard with validate/correct buttons
        keyboard = [
            [
                InlineKeyboardButton("✅ Valider", callback_data=f"validate_{deposit_id}"),
                InlineKeyboardButton("✏️ Corriger", callback_data=f"correct_{deposit_id}")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        # Send message with inline keyboard
        await context.bot.send_message(
            chat_id=chat_id,
            text=message_text,
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )

        logger.info(f"Sent validation message for deposit {deposit_id} to chat {chat_id}")

    except Exception as e:
        logger.error(f"Error sending validation message: {str(e)}")
        # Send fallback message without keyboard
        try:
            await context.bot.send_message(
                chat_id=chat_id,
                text="🤖 Classification terminée. Veuillez contacter un responsable pour valider."
            )
        except Exception as fallback_error:
            logger.error(f"Error sending fallback message: {str(fallback_error)}")

async def handle_validation_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handle callback queries for validation (validate/correct buttons).
    """
    query = update.callback_query
    await query.answer()  # Acknowledge the callback

    try:
        # Parse callback data
        action, deposit_id = query.data.split("_", 1)

        if action == "validate":
            await _handle_validate(query, context, deposit_id)
        elif action == "correct":
            await _handle_correct(query, context, deposit_id)
        else:
            logger.warning(f"Unknown validation action: {action}")
            await query.edit_message_text("❌ Action inconnue.")

    except ValueError:
        logger.error(f"Invalid callback data format: {query.data}")
        await query.edit_message_text("❌ Données de callback invalides.")
    except Exception as e:
        logger.error(f"Error handling validation callback: {str(e)}")
        await query.edit_message_text("❌ Erreur lors du traitement.")

async def _handle_validate(query, context: ContextTypes.DEFAULT_TYPE, deposit_id: str):
    """
    Handle validation confirmation - finalize deposit with AI classification.
    """
    try:
        # Get user ID from query
        user_id = query.from_user.id
        
        # Call API to finalize deposit with current AI classification
        result = await _finalize_deposit(deposit_id, validated=True)

        if result.get("success"):
            final_category = result.get("category", "Non spécifiée")
            category_label = EEE_CATEGORY_LABELS.get(final_category, final_category)

            # Complete the validation session in Redis
            await session_service.complete_session(user_id, deposit_id, 'validated')

            # Update message to show validation confirmation
            await query.edit_message_text(
                "✅ **Classification validée !**\n\n"
                f"📦 Catégorie finale : **{category_label}**\n"
                f"🆔 ID de dépôt : `{deposit_id}`\n\n"
                "Votre dépôt est maintenant enregistré et prêt pour la vente.",
                parse_mode='Markdown'
            )

            logger.info(f"Deposit {deposit_id} validated successfully")

        else:
            error_msg = result.get("error", "Erreur inconnue")
            await query.edit_message_text(
                f"❌ Erreur lors de la validation :\n{error_msg}\n\n"
                "Veuillez contacter un responsable."
            )

    except Exception as e:
        logger.error(f"Error validating deposit {deposit_id}: {str(e)}")
        await query.edit_message_text(
            "❌ Erreur lors de la validation.\n"
            "Veuillez contacter un responsable."
        )

async def _handle_correct(query, context: ContextTypes.DEFAULT_TYPE, deposit_id: str):
    """
    Handle correction request - show category selection keyboard.
    """
    try:
        # Create category selection keyboard
        keyboard = []
        categories = list(EEE_CATEGORY_LABELS.items())

        # Create keyboard in rows of 2 buttons
        for i in range(0, len(categories), 2):
            row = []
            for j in range(2):
                if i + j < len(categories):
                    category_key, category_label = categories[i + j]
                    callback_data = f"category_{deposit_id}_{category_key}"
                    row.append(InlineKeyboardButton(category_label, callback_data=callback_data))
            keyboard.append(row)

        # Add cancel button
        keyboard.append([
            InlineKeyboardButton("❌ Annuler", callback_data=f"cancel_{deposit_id}")
        ])

        reply_markup = InlineKeyboardMarkup(keyboard)

        # Update message to show category selection
        await query.edit_message_text(
            "✏️ **Correction de la classification**\n\n"
            "Sélectionnez la catégorie correcte :",
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )

        logger.info(f"Showing category selection for deposit {deposit_id}")

    except Exception as e:
        logger.error(f"Error showing correction keyboard for deposit {deposit_id}: {str(e)}")
        await query.edit_message_text(
            "❌ Erreur lors de l'affichage des catégories.\n"
            "Veuillez contacter un responsable."
        )

async def handle_category_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handle callback queries for category selection.
    """
    query = update.callback_query
    await query.answer()  # Acknowledge the callback

    try:
        # Parse callback data
        parts = query.data.split("_")

        if len(parts) >= 3 and parts[0] == "category":
            action = parts[0]
            deposit_id = parts[1]
            selected_category = parts[2]

            await _handle_category_selection(query, context, deposit_id, selected_category)

        elif len(parts) >= 2 and parts[0] == "cancel":
            deposit_id = parts[1]
            await _handle_cancel_correction(query, context, deposit_id)

        else:
            logger.warning(f"Unknown category action: {query.data}")
            await query.edit_message_text("❌ Action inconnue.")

    except Exception as e:
        logger.error(f"Error handling category callback: {str(e)}")
        await query.edit_message_text("❌ Erreur lors du traitement.")

async def _handle_category_selection(query, context: ContextTypes.DEFAULT_TYPE,
                                   deposit_id: str, selected_category: str):
    """
    Handle user's category selection - finalize deposit with corrected category.
    """
    try:
        # Get user ID from query
        user_id = query.from_user.id
        
        # Call API to finalize deposit with corrected category
        result = await _finalize_deposit(deposit_id, corrected_category=selected_category)

        if result.get("success"):
            category_label = EEE_CATEGORY_LABELS.get(selected_category, selected_category)

            # Complete the validation session in Redis with correction
            await session_service.complete_session(user_id, deposit_id, 'corrected')

            # Update message to show correction confirmation
            await query.edit_message_text(
                "✏️ **Classification corrigée !**\n\n"
                f"📦 Catégorie finale : **{category_label}**\n"
                f"🆔 ID de dépôt : `{deposit_id}`\n\n"
                "Merci pour votre correction. Votre dépôt est maintenant enregistré.",
                parse_mode='Markdown'
            )

            logger.info(f"Deposit {deposit_id} corrected to category {selected_category}")

        else:
            error_msg = result.get("error", "Erreur inconnue")
            await query.edit_message_text(
                f"❌ Erreur lors de la correction :\n{error_msg}\n\n"
                "Veuillez contacter un responsable."
            )

    except Exception as e:
        logger.error(f"Error correcting deposit {deposit_id} to {selected_category}: {str(e)}")
        await query.edit_message_text(
            "❌ Erreur lors de la correction.\n"
            "Veuillez contacter un responsable."
        )

async def _handle_cancel_correction(query, context: ContextTypes.DEFAULT_TYPE, deposit_id: str):
    """
    Handle cancellation of correction - return to validation options.
    """
    try:
        # Get deposit info to recreate validation message
        deposit_info = await _get_deposit_info(deposit_id)

        if deposit_info.get("success"):
            category = deposit_info.get("category", "unknown")
            confidence = deposit_info.get("confidence", 0)

            category_label = EEE_CATEGORY_LABELS.get(category, category)
            confidence_percent = confidence * 100

            # Recreate validation keyboard
            keyboard = [
                [
                    InlineKeyboardButton("✅ Valider", callback_data=f"validate_{deposit_id}"),
                    InlineKeyboardButton("✏️ Corriger", callback_data=f"correct_{deposit_id}")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            # Update message back to validation
            await query.edit_message_text(
                "🤖 **Classification IA**\n\n"
                f"📦 Catégorie proposée : **{category_label}**\n"
                f"🎯 Confiance : {confidence_percent:.1f}%\n\n"
                "Confirmez-vous cette classification ?",
                reply_markup=reply_markup,
                parse_mode='Markdown'
            )

        else:
            await query.edit_message_text(
                "❌ Impossible de récupérer les informations du dépôt.\n"
                "Veuillez contacter un responsable."
            )

    except Exception as e:
        logger.error(f"Error cancelling correction for deposit {deposit_id}: {str(e)}")
        await query.edit_message_text(
            "❌ Erreur lors de l'annulation.\n"
            "Veuillez contacter un responsable."
        )

async def _finalize_deposit(deposit_id: str, validated: bool = False,
                          corrected_category: str = None) -> Dict[str, Any]:
    """
    Call API to finalize deposit with validation or correction.

    Args:
        deposit_id: ID of the deposit to finalize
        validated: True if user validated AI classification
        corrected_category: Category selected by user for correction

    Returns:
        API response dictionary
    """
    try:
        api_base_url = settings.API_BASE_URL
        bot_token = settings.TELEGRAM_BOT_TOKEN

        # Prepare payload
        payload = {}
        if corrected_category:
            payload["final_category"] = corrected_category
            payload["correction_applied"] = True
        else:
            payload["correction_applied"] = False

        payload["validated"] = validated

        headers = {
            "X-Bot-Token": bot_token,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.put(
                f"{api_base_url}/api/v1/deposits/{deposit_id}",
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "category": result.get("category"),
                    "data": result
                }
            else:
                logger.error(f"API error finalizing deposit: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}"
                }

    except Exception as e:
        logger.error(f"Error finalizing deposit {deposit_id}: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

async def _get_deposit_info(deposit_id: str) -> Dict[str, Any]:
    """
    Get deposit information from API.

    Args:
        deposit_id: ID of the deposit

    Returns:
        API response dictionary with deposit info
    """
    try:
        api_base_url = settings.API_BASE_URL
        bot_token = settings.TELEGRAM_BOT_TOKEN

        headers = {
            "X-Bot-Token": bot_token,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{api_base_url}/api/v1/deposits/{deposit_id}",
                headers=headers
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "category": result.get("eee_category") or result.get("category"),
                    "confidence": result.get("confidence_score") or result.get("ai_confidence", 0),
                    "data": result
                }
            else:
                logger.error(f"API error getting deposit info: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}"
                }

    except Exception as e:
        logger.error(f"Error getting deposit info {deposit_id}: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# Create callback query handlers
validation_callback_handler = CallbackQueryHandler(
    handle_validation_callback,
    pattern="^(validate|correct)_"
)

category_callback_handler = CallbackQueryHandler(
    handle_category_callback,
    pattern="^(category|cancel)_"
)