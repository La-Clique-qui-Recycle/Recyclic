from telegram import Update
from telegram.ext import ContextTypes

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command and general messages"""
    help_message = """
📋 Commandes disponibles :

/start - Démarrer le bot
/help - Afficher cette aide

📸 Classification :
Envoyez une photo d'un appareil électronique pour le classifier automatiquement.

📊 Fonctionnalités :
• Classification IA des déchets électroniques
• Enregistrement des dépôts
• Suivi des statistiques personnelles
• Intégration avec l'interface caisse

Pour toute question, contactez l'équipe Recyclic.
    """
    await update.message.reply_text(help_message)
