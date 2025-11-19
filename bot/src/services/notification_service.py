import httpx
import logging
from typing import List, Dict, Any
from telegram import Bot
from ..config import settings

logger = logging.getLogger(__name__)

class NotificationService:
    """Service pour envoyer des notifications Telegram"""
    
    def __init__(self):
        self.bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
        self.admin_ids = self._get_admin_telegram_ids()
    
    def _get_admin_telegram_ids(self) -> List[str]:
        """Récupérer la liste des IDs Telegram des admins"""
        if not settings.ADMIN_TELEGRAM_IDS:
            return []
        return [admin_id.strip() for admin_id in settings.ADMIN_TELEGRAM_IDS.split(",") if admin_id.strip()]
    
    async def notify_new_registration_request(self, request_data: Dict[str, Any]) -> bool:
        """Notifier les admins d'une nouvelle demande d'inscription"""
        if not self.admin_ids:
            logger.warning("Aucun admin configuré pour les notifications")
            return False
        
        message = self._format_registration_notification(request_data)
        
        success_count = 0
        for admin_id in self.admin_ids:
            try:
                await self.bot.send_message(
                    chat_id=admin_id,
                    text=message,
                    parse_mode='Markdown'
                )
                success_count += 1
            except Exception as e:
                logger.error(f"Erreur lors de l'envoi de notification à l'admin {admin_id}: {e}")
        
        return success_count > 0
    
    async def notify_registration_approved(self, telegram_id: str, user_name: str) -> bool:
        """Notifier l'utilisateur que son inscription a été approuvée"""
        try:
            message = f"""
✅ **Inscription Approuvée !**

Bonjour {user_name} !

Votre inscription sur la plateforme RecyClique a été approuvée par un administrateur.

Vous pouvez maintenant utiliser toutes les fonctionnalités du bot :

**Commandes disponibles :**
/start - Démarrer le bot
/help - Aide complète
/depot - Nouveau dépôt
/classify - Classification d'appareils

Bienvenue dans l'équipe RecyClique ! 🌱
            """
            
            await self.bot.send_message(
                chat_id=telegram_id,
                text=message,
                parse_mode='Markdown'
            )
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la notification d'approbation à {telegram_id}: {e}")
            return False
    
    async def notify_registration_rejected(self, telegram_id: str, user_name: str, reason: str = None) -> bool:
        """Notifier l'utilisateur que son inscription a été rejetée"""
        try:
            message = f"""
❌ **Inscription Rejetée**

Bonjour {user_name},

Votre demande d'inscription sur la plateforme RecyClique a été rejetée.

{f"**Raison :** {reason}" if reason else ""}

Si vous pensez qu'il s'agit d'une erreur, vous pouvez contacter l'équipe RecyClique pour plus d'informations.

Merci de votre compréhension.
            """
            
            await self.bot.send_message(
                chat_id=telegram_id,
                text=message,
                parse_mode='Markdown'
            )
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la notification de rejet à {telegram_id}: {e}")
            return False
    
    def _format_registration_notification(self, request_data: Dict[str, Any]) -> str:
        """Formater le message de notification pour les admins"""
        return f"""
🔔 **Nouvelle Demande d'Inscription**

**Utilisateur :** {request_data.get('first_name', 'N/A')} {request_data.get('last_name', 'N/A')}
**Telegram ID :** `{request_data.get('telegram_id', 'N/A')}`
**Username :** @{request_data.get('username', 'N/A')}
**Email :** {request_data.get('email', 'N/A')}
**Téléphone :** {request_data.get('phone', 'N/A')}
**Site :** {request_data.get('site_name', 'N/A')}

**Notes :**
{request_data.get('notes', 'Aucune note')}

**Actions requises :**
• Examiner la demande sur l'interface admin
• Approuver ou rejeter l'inscription
• L'utilisateur sera automatiquement notifié

**ID de la demande :** `{request_data.get('id', 'N/A')}`
        """

notification_service = NotificationService()
