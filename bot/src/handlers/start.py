from telegram import Update
from telegram.ext import ContextTypes

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    welcome_message = """
🤖 Bienvenue sur le Bot Recyclic !

Je peux vous aider à :
• Classifier vos déchets électroniques
• Enregistrer vos dépôts
• Consulter vos statistiques

Envoyez-moi une photo de votre appareil électronique pour commencer la classification !

Utilisez /help pour voir toutes les commandes disponibles.
    """
    await update.message.reply_text(welcome_message)
