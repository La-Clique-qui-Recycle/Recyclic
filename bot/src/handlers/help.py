from telegram import Update
from telegram.ext import ContextTypes

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command and general messages"""
    help_message = """
📋 **Commandes disponibles :**

**Commandes de base :**
/start - Démarrer le bot et vérifier le statut
/help - Afficher cette aide
/inscription - Gestion de l'inscription

**Fonctionnalités principales :**
📸 **Classification :** Envoyez une photo d'un appareil électronique pour le classifier automatiquement
🎤 **Dépôts vocaux :** Utilisez /depot puis envoyez un message vocal pour enregistrer vos dépôts
📝 **Dépôts :** Enregistrer vos dépôts de déchets électroniques
📊 **Statistiques :** Consulter vos données personnelles
🏪 **Caisse :** Gérer les sessions de caisse

**Pour les utilisateurs non inscrits :**
• Utilisez /inscription pour accéder au formulaire d'inscription
• Une fois validé par un admin, toutes les fonctionnalités seront disponibles

**Support :**
Pour toute question, contactez l'équipe Recyclic.
    """
    await update.message.reply_text(help_message, parse_mode='Markdown')
