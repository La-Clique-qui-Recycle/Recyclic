from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
import logging
from ..services.user_service import user_service

logger = logging.getLogger(__name__)

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    telegram_id = str(user.id)
    
    # Vérifier si l'utilisateur existe déjà
    existing_user = await user_service.get_user_by_telegram_id(telegram_id)
    
    if existing_user and existing_user.get("is_active"):
        # Utilisateur inscrit et actif
        welcome_message = f"""
🤖 Bienvenue {user.first_name or 'utilisateur'} !

Vous êtes connecté à la plateforme Recyclic.

**Fonctionnalités disponibles :**
• 📸 Classification des déchets électroniques
• 📝 Enregistrement des dépôts
• 📊 Consultation des statistiques
• 🏪 Gestion des sessions de caisse

**Commandes :**
/help - Aide complète
/inscription - Gestion du compte
/depot - Nouveau dépôt

Envoyez-moi une photo d'un appareil électronique pour commencer la classification !
        """
        await update.message.reply_text(welcome_message)
        
    elif existing_user and not existing_user.get("is_active"):
        # Utilisateur inscrit mais pas encore validé
        await update.message.reply_text(
            f"⏳ Bonjour {user.first_name or 'utilisateur'} !\n\n"
            "Votre inscription est en cours de validation par un administrateur.\n\n"
            "Vous recevrez une notification dès que votre compte sera activé.\n\n"
            "En attendant, vous pouvez utiliser /help pour voir les fonctionnalités disponibles."
        )
        
    else:
        # Nouvel utilisateur - proposer l'inscription
        registration_link = await user_service.get_registration_link(telegram_id)
        
        keyboard = [
            [InlineKeyboardButton("📝 S'inscrire maintenant", url=registration_link)]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        welcome_message = f"""
🤖 Bienvenue sur le Bot Recyclic !

Bonjour {user.first_name or 'utilisateur'} !

Pour utiliser toutes les fonctionnalités du bot, vous devez d'abord vous inscrire.

**Après inscription, vous pourrez :**
• 📸 Classifier vos déchets électroniques
• 📝 Enregistrer vos dépôts
• 📊 Consulter vos statistiques
• 🏪 Gérer les sessions de caisse

**Inscription rapide :**
Cliquez sur le bouton ci-dessous pour accéder au formulaire d'inscription.

Utilisez /help pour voir toutes les commandes disponibles.
        """
        
        await update.message.reply_text(
            welcome_message,
            reply_markup=reply_markup
        )
