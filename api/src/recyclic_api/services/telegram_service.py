"""
Service pour envoyer des notifications Telegram depuis l'API
"""

import httpx
import logging
from typing import Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

class TelegramNotificationService:
    """Service pour envoyer des notifications Telegram via le bot"""
    
    def __init__(self):
        self.bot_base_url = settings.TELEGRAM_BOT_URL or "http://bot:8001"
        self.admin_ids = self._get_admin_telegram_ids()
    
    def _get_admin_telegram_ids(self) -> list[str]:
        """Récupérer la liste des IDs Telegram des admins"""
        if not settings.ADMIN_TELEGRAM_IDS:
            return []
        return [admin_id.strip() for admin_id in settings.ADMIN_TELEGRAM_IDS.split(",") if admin_id.strip()]
    
    async def send_user_approval_notification(self, telegram_id: str, user_name: str, message: Optional[str] = None) -> bool:
        """Envoyer une notification d'approbation à un utilisateur"""
        try:
            notification_data = {
                "telegram_id": telegram_id,
                "user_name": user_name,
                "message": message or "Votre inscription a été approuvée ! Bienvenue !"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.bot_base_url}/api/notify/approval",
                    json=notification_data,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Notification d'approbation envoyée à {telegram_id}")
                    return True
                else:
                    logger.error(f"Erreur lors de l'envoi de notification d'approbation: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification d'approbation à {telegram_id}: {e}")
            return False
    
    async def send_user_rejection_notification(self, telegram_id: str, user_name: str, reason: Optional[str] = None) -> bool:
        """Envoyer une notification de rejet à un utilisateur"""
        try:
            notification_data = {
                "telegram_id": telegram_id,
                "user_name": user_name,
                "reason": reason or "Aucune raison spécifiée"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.bot_base_url}/api/notify/rejection",
                    json=notification_data,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Notification de rejet envoyée à {telegram_id}")
                    return True
                else:
                    logger.error(f"Erreur lors de l'envoi de notification de rejet: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification de rejet à {telegram_id}: {e}")
            return False
    
    async def notify_admins_user_processed(self, admin_user_id: str, target_user_name: str, action: str) -> bool:
        """Notifier les autres admins qu'un utilisateur a été traité"""
        try:
            if not self.admin_ids:
                logger.warning("Aucun admin configuré pour les notifications")
                return False
            
            notification_data = {
                "admin_user_id": admin_user_id,
                "target_user_name": target_user_name,
                "action": action
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.bot_base_url}/api/notify/admin",
                    json=notification_data,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Notification admin envoyée pour l'action {action}")
                    return True
                else:
                    logger.error(f"Erreur lors de l'envoi de notification admin: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification admin: {e}")
            return False

# Instance globale du service
telegram_service = TelegramNotificationService()
