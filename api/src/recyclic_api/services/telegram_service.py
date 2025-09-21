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
        """RÃ©cupÃ©rer la liste des IDs Telegram des admins"""
        if not settings.ADMIN_TELEGRAM_IDS:
            return []
        return [admin_id.strip() for admin_id in settings.ADMIN_TELEGRAM_IDS.split(",") if admin_id.strip()]
    
    async def send_user_approval_notification(self, telegram_id: str, user_name: str, message: Optional[str] = None) -> bool:
        """Envoyer une notification d'approbation Ã  un utilisateur"""
        try:
            notification_data = {
                "telegram_id": telegram_id,
                "user_name": user_name,
                "message": message or "Votre inscription a Ã©tÃ© approuvÃ©e ! Bienvenue !"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.bot_base_url}/api/notify/approval",
                    json=notification_data,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Notification d'approbation envoyÃ©e Ã  {telegram_id}")
                    return True
                else:
                    logger.error(f"Erreur lors de l'envoi de notification d'approbation: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification d'approbation Ã  {telegram_id}: {e}")
            return False
    
    async def send_user_rejection_notification(self, telegram_id: str, user_name: str, reason: Optional[str] = None) -> bool:
        """Envoyer une notification de rejet Ã  un utilisateur"""
        try:
            notification_data = {
                "telegram_id": telegram_id,
                "user_name": user_name,
                "reason": reason or "Aucune raison spÃ©cifiÃ©e"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.bot_base_url}/api/notify/rejection",
                    json=notification_data,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Notification de rejet envoyÃ©e Ã  {telegram_id}")
                    return True
                else:
                    logger.error(f"Erreur lors de l'envoi de notification de rejet: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification de rejet Ã  {telegram_id}: {e}")
            return False
    
    async def notify_admins_user_processed(self, admin_user_id: str, target_user_name: str, action: str) -> bool:
        """Notifier les autres admins qu'un utilisateur a Ã©tÃ© traitÃ©"""
        try:
            if not self.admin_ids:
                logger.warning("Aucun admin configurÃ© pour les notifications")
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
                    logger.info(f"Notification admin envoyÃ©e pour l'action {action}")
                    return True
                else:
                    logger.error(f"Erreur lors de l'envoi de notification admin: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification admin: {e}")
            return False

    async def notify_sync_failure(self, file_path: str, remote_path: str, error_message: str) -> bool:
        """Envoyer une notification aux administrateurs lorsqu'une synchro kDrive échoue."""
        if not self.admin_ids:
            logger.warning("Aucun admin configuré pour recevoir les notifications de synchronisation")
            return False

        payload = {
            "admin_ids": self.admin_ids,
            "file_path": file_path,
            "remote_path": remote_path,
            "message": (
                "[ALERTE] Synchronisation kDrive échouée\n"
                f"Fichier : {file_path}\n"
                f"Destination : {remote_path}\n"
                f"Erreur : {error_message}"
            ),
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.bot_base_url}/api/notify/admin/sync-failure",
                    json=payload,
                    timeout=10.0,
                )

            if response.status_code == 200:
                logger.info("Notification de synchronisation kDrive envoyée aux admins")
                return True

            logger.error(
                "Échec de la notification de synchronisation kDrive: status=%s body=%s",
                response.status_code,
                response.text,
            )
            return False
        except Exception as exc:
            logger.error("Erreur lors de l'envoi de notification de synchronisation: %s", exc)
            return False

# Instance globale du service
telegram_service = TelegramNotificationService()



