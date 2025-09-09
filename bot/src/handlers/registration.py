from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
import logging
from ..services.user_service import user_service

logger = logging.getLogger(__name__)

async def registration_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /inscription command"""
    user = update.effective_user
    telegram_id = str(user.id)
    
    # Vérifier si l'utilisateur existe déjà
    existing_user = await user_service.get_user_by_telegram_id(telegram_id)
    
    if existing_user:
        if existing_user.get("is_active"):
            await update.message.reply_text(
                "✅ Vous êtes déjà inscrit et actif sur la plateforme Recyclic !\n\n"
                "Vous pouvez utiliser toutes les fonctionnalités du bot."
            )
        else:
            await update.message.reply_text(
                "⏳ Votre inscription est en cours de validation par un administrateur.\n\n"
                "Vous recevrez une notification dès que votre compte sera activé."
            )
        return
    
    # Générer le lien d'inscription
    registration_link = await user_service.get_registration_link(telegram_id)
    
    # Créer le clavier avec le lien d'inscription
    keyboard = [
        [InlineKeyboardButton("📝 S'inscrire", url=registration_link)]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    message = f"""
🤖 **Inscription Recyclic**

Bonjour {user.first_name or 'utilisateur'} !

Pour utiliser le bot Recyclic, vous devez d'abord vous inscrire.

**Étapes d'inscription :**
1. Cliquez sur le bouton "S'inscrire" ci-dessous
2. Remplissez le formulaire avec vos informations
3. Attendez la validation d'un administrateur
4. Vous recevrez une notification une fois approuvé

**Informations requises :**
• Nom et prénom
• Coordonnées de contact
• Ressourcerie d'affectation

Une fois inscrit, vous pourrez :
• Classifier vos déchets électroniques
• Enregistrer vos dépôts
• Consulter vos statistiques
"""
    
    await update.message.reply_text(
        message,
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )

async def handle_registration_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle registration callback queries"""
    query = update.callback_query
    await query.answer()
    
    # Ici on pourrait gérer des callbacks spécifiques à l'inscription
    # Pour l'instant, on redirige vers le lien d'inscription
    pass
